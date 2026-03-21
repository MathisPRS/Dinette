import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

router.post('/image', authMiddleware, uploadMiddleware.single('image'), uploadImage);

export default router;
