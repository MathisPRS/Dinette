import { Router } from 'express';
import {
  searchExternal,
  getExternalDetail,
  getCategories,
  getAreas,
  getIngredients,
  translateTexts,
} from '../controllers/suggest.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/search', searchExternal);
router.get('/categories', getCategories);
router.get('/areas', getAreas);
router.get('/detail/:id', getExternalDetail);
router.get('/ingredients', getIngredients);
router.post('/translate', translateTexts);

export default router;
