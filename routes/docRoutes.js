import express from 'express';
import {
  createDocPost,
  getAllDocPosts,
  getDocPostById,
  updateDocPost,
  deleteDocPost,
  uploadMedia,
} from '../controllers/docController.js';
import { restrictTo } from '../middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Doc post routes
router.post('/docs',  createDocPost);
router.get('/docs', getAllDocPosts);
router.get('/docs/:id', getDocPostById);
router.put('/docs/:id', updateDocPost);
router.delete('/docs/:id', deleteDocPost);
router.post('/docs/upload-media', upload.array('media', 10), uploadMedia);

export default router;