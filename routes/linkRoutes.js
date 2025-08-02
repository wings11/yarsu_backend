import express from 'express';
import {
  createLink,
  getAllLinks,
  getLinkById,
  updateLink,
  deleteLink,
} from '../controllers/linkController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// Link routes
router.post('/links',  createLink);
router.get('/links', getAllLinks);
router.get('/links/:id', getLinkById);
router.put('/links/:id',  updateLink);
router.delete('/links/:id',  deleteLink);

export default router;