import { Router } from 'express';
import { register, login, refresh, logout, getMe, changePassword } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.put('/password', authMiddleware, changePassword);

export default router;
