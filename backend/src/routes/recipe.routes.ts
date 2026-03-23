import { Router } from 'express';
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  suggestRecipe,
  updateCoverImage,
} from '../controllers/recipe.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, listRecipes);
router.get('/suggest', authMiddleware, suggestRecipe);
router.get('/:id', authMiddleware, getRecipe);
router.post('/', authMiddleware, createRecipe);
router.put('/:id', authMiddleware, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.post('/:id/image', authMiddleware, uploadMiddleware.single('image'), updateCoverImage);

export default router;
