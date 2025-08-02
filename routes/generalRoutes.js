import express from 'express';
import {
  createGeneralPost,
  getAllGeneralPosts,
  getGeneralPostById,
  updateGeneralPost,
  deleteGeneralPost,
} from '../controllers/generalPostController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// General post routes
router.post('/general', createGeneralPost);
router.get('/general', getAllGeneralPosts);
router.get('/general/:id', getGeneralPostById);
router.put('/general/:id', updateGeneralPost);
router.delete('/general/:id', deleteGeneralPost);

export default router;