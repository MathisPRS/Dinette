import { Router } from 'express';
import { addFavorite, removeFavorite, listFavorites } from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listFavorites);
router.post('/:id', addFavorite);
router.delete('/:id', removeFavorite);

export default router;
