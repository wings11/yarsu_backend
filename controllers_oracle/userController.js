/**
 * User Controller - Oracle Version
 * Uses Supabase for AUTH only, Oracle for user data
 */

import { createClient } from '@supabase/supabase-js';
import { usersRepo } from '../config/repository.js';

// Initialize Supabase client for AUTH ONLY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

export const promoteUserToAdmin = async (req, res) => {
  const { user_id } = req.params;
  try {
    const data = await usersRepo.update(user_id, { role: 'admin' });
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User promoted to admin', user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
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

    // Get user profile from Oracle
    const userData = await usersRepo.findById(user.id);

    if (!userData) {
      return res.status(500).json({ 
        error: 'Failed to fetch user profile'
      });
    }

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name
      }
    });

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Update user name
export const updateUserName = async (req, res) => {
  try {
    const { name } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header' 
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Name is required' 
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

    // Update user name in Oracle
    const userData = await usersRepo.update(user.id, { name: name.trim() });

    if (!userData) {
      return res.status(500).json({ 
        error: 'Failed to update user name'
      });
    }

    res.json({
      message: 'Name updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Error in updateUserName:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};
