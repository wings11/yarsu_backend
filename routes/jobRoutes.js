import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import {
  createInquiry,
  getUserInquiries,
} from '../controllers/inquiryController.js';
import { promoteUserToAdmin } from '../controllers/userController.js';

const router = express.Router();

// Job routes
router.post('/jobs', createJob);
router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Inquiry routes
router.post('/inquiries', createInquiry);
router.get('/inquiries/user/:user_id', getUserInquiries);

// User routes
router.post('/users/:user_id/promote', promoteUserToAdmin);

export default router;