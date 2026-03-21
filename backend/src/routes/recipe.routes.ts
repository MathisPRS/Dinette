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

// Public (but auth optional for isFavorite info)
router.get('/', (req, res, next) => {
  // Optionally attach user if token present
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    authMiddleware(req, res, () => next());
  } else {
    next();
  }
}, listRecipes);

router.get('/suggest', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    authMiddleware(req, res, () => next());
  } else {
    next();
  }
}, suggestRecipe);

router.get('/:id', (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    authMiddleware(req, res, () => next());
  } else {
    next();
  }
}, getRecipe);

// Protected
router.post('/', authMiddleware, createRecipe);
router.put('/:id', authMiddleware, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.post('/:id/image', authMiddleware, uploadMiddleware.single('image'), updateCoverImage);

export default router;
