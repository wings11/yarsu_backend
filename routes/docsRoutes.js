import express from 'express';
import {
  createDocsPost,
  getAllDocsPosts,
  getDocsPostById,
  updateDocsPost,
  deleteDocsPost,
} from '../controllers/docController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// Docs post routes
router.post('/docs',  createDocsPost);
router.get('/docs', getAllDocsPosts);
router.get('/docs/:id', getDocsPostById);
router.put('/docs/:id', updateDocsPost);
router.delete('/docs/:id', deleteDocsPost);

export default router;