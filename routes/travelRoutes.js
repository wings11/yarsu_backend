import express from 'express';
import {
  createTravelPost,
  getAllTravelPosts,
  getTravelPostById,
  updateTravelPost,
  deleteTravelPost,
} from '../controllers/travelController.js';

const router = express.Router();

// Travel post routes
router.post('/travel-posts', createTravelPost);
router.get('/travel-posts', getAllTravelPosts);
router.get('/travel-posts/:id', getTravelPostById);
router.put('/travel-posts/:id', updateTravelPost);
router.delete('/travel-posts/:id', deleteTravelPost);

export default router;