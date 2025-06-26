import express from 'express';
import {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurantController.js';

const router = express.Router();

// Restaurant routes
router.post('/restaurants', createRestaurant);
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantById);
router.put('/restaurants/:id', updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

export default router;