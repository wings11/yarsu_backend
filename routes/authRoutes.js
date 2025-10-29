import express from 'express';
import { getUserRole, getAllUsers, updateUserRole } from '../controllers/authController.js';
import { getUserProfile, updateUserName } from '../controllers/userController.js';
import { restrictTo } from '../middleware.js';

const router = express.Router();

// Get current user's role
router.get('/auth/user', getUserRole);

// Get all users (admin only)
router.get('/auth/users', getAllUsers);

// Update user role (admin only)
router.put('/auth/users/role', updateUserRole);

// Get user profile (authenticated users)
router.get('/auth/profile', restrictTo('user', 'admin', 'superadmin'), getUserProfile);

// Update user name (authenticated users)
router.put('/auth/profile/name', restrictTo('user', 'admin', 'superadmin'), updateUserName);

export default router;
