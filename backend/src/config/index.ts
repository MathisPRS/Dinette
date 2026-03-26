import { z } from 'zod';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function extractHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return 'localhost'; }
}

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
  upload: {
    dir: process.env.UPLOAD_DIR ?? 'uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10),
  },
  frontendUrl,
  webAuthn: {
    rpID: process.env.WEBAUTHN_RP_ID ?? extractHostname(frontendUrl),
    origins: (process.env.WEBAUTHN_ORIGINS ?? frontendUrl)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
} as const;

// Validate JWT_SECRET length
z.string().min(32).parse(config.jwt.secret);
