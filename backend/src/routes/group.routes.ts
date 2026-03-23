import { Router } from 'express';
import {
  createGroup,
  getMyGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
} from '../controllers/group.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/mine', getMyGroups);
router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/:id', getGroup);
router.delete('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);

export default router;
