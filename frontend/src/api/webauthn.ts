import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from './client';
import type { AuthResponse } from './auth';

export interface WebAuthnCredentialSummary {
  id: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
}

/** Check if the current device supports biometric authentication (Face ID, Touch ID, etc.) */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export const webAuthnApi = {
  getCredentials: (): Promise<{ credentials: WebAuthnCredentialSummary[] }> =>
    api.get('/auth/webauthn/credentials').then((r) => r.data),

  deleteCredential: (): Promise<void> =>
    api.delete('/auth/webauthn/credential').then(() => undefined),

  /** Full registration flow: ask backend for options, trigger Face ID, send result back */
  async register(): Promise<{ verified: boolean }> {
    const options = await api
      .post('/auth/webauthn/register/start')
      .then((r) => r.data);

    const response = await startRegistration({ optionsJSON: options });

    return api
      .post('/auth/webauthn/register/finish', response)
      .then((r) => r.data);
  },

  /** Full authentication flow: ask backend for challenge, trigger Face ID, get JWT back */
  async authenticate(): Promise<AuthResponse> {
    const { challengeKey, ...options } = await api
      .post('/auth/webauthn/login/start')
      .then((r) => r.data);

    const response = await startAuthentication({ optionsJSON: options });

    return api
      .post<AuthResponse>('/auth/webauthn/login/finish', { challengeKey, ...response })
      .then((r) => r.data);
  },
};
