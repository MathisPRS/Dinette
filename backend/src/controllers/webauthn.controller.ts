import { Request, Response } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';

const RP_NAME = 'Dinette';

// In-memory challenge store with TTL (5 minutes)
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

function pruneExpiredChallenges() {
  const now = Date.now();
  for (const [key, val] of challengeStore.entries()) {
    if (val.expiresAt < now) challengeStore.delete(key);
  }
}

function signAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

// POST /api/auth/webauthn/register/start  (auth required)
export async function webAuthnRegisterStart(req: Request, res: Response): Promise<void> {
  pruneExpiredChallenges();

  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { webAuthnCredentials: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const excludeCredentials = user.webAuthnCredentials.map((c) => ({
    id: c.credentialId,
    transports: c.transports as AuthenticatorTransportFuture[],
  }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: config.webAuthn.rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: Buffer.from(user.id, 'utf-8'),
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
  });

  challengeStore.set(`reg:${userId}`, {
    challenge: options.challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  res.json(options);
}

// POST /api/auth/webauthn/register/finish  (auth required)
export async function webAuthnRegisterFinish(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const stored = challengeStore.get(`reg:${userId}`);

  if (!stored || stored.expiresAt < Date.now()) {
    challengeStore.delete(`reg:${userId}`);
    res.status(400).json({ error: 'Challenge expired, please try again' });
    return;
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: stored.challenge,
      expectedOrigin: config.webAuthn.origins,
      expectedRPID: config.webAuthn.rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Biometric verification failed' });
      return;
    }

    challengeStore.delete(`reg:${userId}`);

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Replace any existing credential for this user (one passkey per user for simplicity)
    await prisma.webAuthnCredential.deleteMany({ where: { userId } });

    await prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? [],
      },
    });

    res.json({ verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    res.status(400).json({ error: message });
  }
}

// POST /api/auth/webauthn/login/start  (public)
export async function webAuthnLoginStart(req: Request, res: Response): Promise<void> {
  pruneExpiredChallenges();

  const options = await generateAuthenticationOptions({
    rpID: config.webAuthn.rpID,
    userVerification: 'required',
    allowCredentials: [], // Passkey: browser picks the right credential
  });

  const challengeKey = randomBytes(16).toString('hex');
  challengeStore.set(`auth:${challengeKey}`, {
    challenge: options.challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  res.json({ ...options, challengeKey });
}

// POST /api/auth/webauthn/login/finish  (public)
export async function webAuthnLoginFinish(req: Request, res: Response): Promise<void> {
  const { challengeKey, ...response } = req.body as {
    challengeKey: string;
    [key: string]: unknown;
  };
  const authenticationResponse = response as unknown as AuthenticationResponseJSON;

  if (!challengeKey) {
    res.status(400).json({ error: 'Missing challengeKey' });
    return;
  }

  const stored = challengeStore.get(`auth:${challengeKey}`);
  if (!stored || stored.expiresAt < Date.now()) {
    challengeStore.delete(`auth:${challengeKey}`);
    res.status(400).json({ error: 'Challenge expired, please try again' });
    return;
  }

  const credentialId = authenticationResponse.id;
  const dbCredential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });

  if (!dbCredential) {
    res.status(401).json({ error: 'Unknown credential' });
    return;
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: stored.challenge,
      expectedOrigin: config.webAuthn.origins,
      expectedRPID: config.webAuthn.rpID,
      requireUserVerification: true,
      credential: {
        id: dbCredential.credentialId,
        publicKey: new Uint8Array(dbCredential.publicKey),
        counter: dbCredential.counter,
        transports: dbCredential.transports as AuthenticatorTransportFuture[],
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      res.status(401).json({ error: 'Biometric verification failed' });
      return;
    }

    challengeStore.delete(`auth:${challengeKey}`);

    // Update counter
    await prisma.webAuthnCredential.update({
      where: { id: dbCredential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    const token = signAccessToken(dbCredential.user.id, dbCredential.user.email);
    const refreshToken = await createRefreshToken(dbCredential.user.id);

    res.json({ token, refreshToken, user: dbCredential.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ error: message });
  }
}

// GET /api/auth/webauthn/credentials  (auth required)
export async function webAuthnGetCredentials(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: { id: true, deviceType: true, backedUp: true, createdAt: true },
  });
  res.json({ credentials });
}

// DELETE /api/auth/webauthn/credential  (auth required)
export async function webAuthnDeleteCredential(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  await prisma.webAuthnCredential.deleteMany({ where: { userId } });
  res.status(204).send();
}
