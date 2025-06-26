import express from 'express';
import {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} from '../controllers/hotelController.js';

const router = express.Router();

// Hotel routes
router.post('/hotels', createHotel);
router.get('/hotels', getAllHotels);
router.get('/hotels/:id', getHotelById);
router.put('/hotels/:id', updateHotel);
router.delete('/hotels/:id', deleteHotel);

export default router;