import express from 'express';
import {
  createDocPost,
  getAllDocPosts,
  getDocPostById,
  updateDocPost,
  deleteDocPost,
} from '../controllers/docController.js';
import { restrictTo } from '../middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Doc post routes
router.post('/docs', restrictTo('admin', 'superadmin'), upload.array('media', 10), createDocPost);
router.get('/docs', getAllDocPosts);
router.get('/docs/:id', getDocPostById);
router.put('/docs/:id', restrictTo('admin', 'superadmin'), upload.array('media', 10), updateDocPost);
router.delete('/docs/:id', restrictTo('admin', 'superadmin'), deleteDocPost);

export default router;