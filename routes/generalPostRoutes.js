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
router.post('/general-posts',  createGeneralPost);
router.get('/general-posts', getAllGeneralPosts);
router.get('/general-posts/:id', getGeneralPostById);
router.put('/general-posts/:id',  updateGeneralPost);
router.delete('/general-posts/:id', deleteGeneralPost);

export default router;