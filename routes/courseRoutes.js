import express from 'express';
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// Course routes
router.post('/courses', createCourse);
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

export default router;