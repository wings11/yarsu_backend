/**
 * Auth Controller - Oracle Version
 * Uses Supabase for AUTH only, Oracle for user data
 */

import { createClient } from '@supabase/supabase-js';
import { usersRepo } from '../config/repository.js';
import { executeQuery } from '../config/database.js';

// Initialize Supabase client for AUTH ONLY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Get user role from server side using Supabase token
export const getUserRole = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Get user role from Oracle users table
    const userData = await usersRepo.findById(user.id);

    if (!userData) {
      return res.status(500).json({ 
        error: 'User not found in database'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: userData.email,
        role: userData.role,
        name: userData.name
      }
    });

  } catch (error) {
    console.error('Error in getUserRole:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if current user is admin or superadmin
    const currentUser = await usersRepo.findById(user.id);

    if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ 
        error: 'Admin or Superadmin access required' 
      });
    }

    // Get all users from Oracle
    const result = await executeQuery(
      'SELECT id, email, role, name FROM users ORDER BY email'
    );
    
    const users = (result.rows || []).map(row => ({
      id: row.ID,
      email: row.EMAIL,
      role: row.ROLE,
      name: row.NAME
    }));

    res.json({ users });

  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header' 
      });
    }

    if (!userId || !newRole) {
      return res.status(400).json({ 
        error: 'userId and newRole are required' 
      });
    }

    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be "user", "admin", or "superadmin"' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase Auth
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if current user is admin or superadmin
    const currentUser = await usersRepo.findById(user.id);

    if (!currentUser || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ 
        error: 'Admin or Superadmin access required' 
      });
    }

    // Role hierarchy validation
    if (currentUser.role === 'admin') {
      if (newRole === 'admin' || newRole === 'superadmin') {
        return res.status(403).json({ 
          error: 'Admins cannot create or modify admin/superadmin roles' 
        });
      }
      
      const targetUser = await usersRepo.findById(userId);
      
      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }
      
      if (['admin', 'superadmin'].includes(targetUser.role)) {
        return res.status(403).json({ 
          error: 'Admins cannot modify admin or superadmin users' 
        });
      }
    }

    // Update user role in Oracle
    const updatedUser = await usersRepo.update(userId, { role: newRole });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
