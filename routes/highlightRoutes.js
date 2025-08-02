import express from 'express';
import {
  createHighlight,
  getAllHighlights,
  getHighlightById,
  updateHighlight,
  deleteHighlight,
} from '../controllers/highlightController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// Highlight routes
router.post('/highlights', restrictTo('admin', 'superadmin'), createHighlight);
router.get('/highlights', getAllHighlights);
router.get('/highlights/:id', getHighlightById);
router.put('/highlights/:id', restrictTo('admin', 'superadmin'), updateHighlight);
router.delete('/highlights/:id', restrictTo('admin', 'superadmin'), deleteHighlight);

export default router;