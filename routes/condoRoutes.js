import express from 'express';
import {
  createCondo,
  getAllCondos,
  getCondoById,
  updateCondo,
  deleteCondo,
} from '../controllers/condoController.js';

const router = express.Router();

// Condo routes
router.post('/condos', createCondo);
router.get('/condos', getAllCondos);
router.get('/condos/:id', getCondoById);
router.put('/condos/:id', updateCondo);
router.delete('/condos/:id', deleteCondo);

export default router;