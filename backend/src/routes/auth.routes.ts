import { Router } from 'express';
import { register, login, refresh, logout, getMe, changePassword } from '../controllers/auth.controller.js';
import {
  webAuthnRegisterStart,
  webAuthnRegisterFinish,
  webAuthnLoginStart,
  webAuthnLoginFinish,
  webAuthnGetCredentials,
  webAuthnDeleteCredential,
} from '../controllers/webauthn.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, changePassword);

// WebAuthn (passkey / Face ID / Touch ID)
router.post('/webauthn/register/start', authMiddleware, webAuthnRegisterStart);
router.post('/webauthn/register/finish', authMiddleware, webAuthnRegisterFinish);
router.post('/webauthn/login/start', webAuthnLoginStart);
router.post('/webauthn/login/finish', webAuthnLoginFinish);
router.get('/webauthn/credentials', authMiddleware, webAuthnGetCredentials);
router.delete('/webauthn/credential', authMiddleware, webAuthnDeleteCredential);

export default router;
