import express from 'express';
import { getUserRole, getAllUsers, updateUserRole } from '../controllers/authController.js';

const router = express.Router();

// Get current user's role
router.get('/auth/user', getUserRole);

// Get all users (admin only)
router.get('/auth/users', getAllUsers);

// Update user role (admin only)
router.put('/auth/users/role', updateUserRole);

export default router;
