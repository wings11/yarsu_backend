/**
 * Middleware - Oracle Version
 * Uses Supabase for AUTH only, Oracle for user data
 */

import { createClient } from '@supabase/supabase-js';
import { usersRepo } from './config/repository.js';
import { executeQuery } from './config/database.js';

// Initialize Supabase client for AUTH ONLY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

export const restrictTo = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      console.log('restrictTo - Headers:', req.headers);
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('restrictTo - Missing or invalid authorization header');
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      console.log('restrictTo - Token received');
      
      // Verify token with Supabase Auth
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

      if (authError || !user) {
        console.log('restrictTo - Auth error:', authError?.message);
        return res.status(401).json({ error: 'Invalid or expired token', details: authError?.message });
      }

      console.log('restrictTo - User ID:', user.id);
      
      // Get user data from Oracle
      const userData = await usersRepo.findById(user.id);

      if (!userData) {
        console.log('restrictTo - User not found in Oracle, checking if should auto-create');
        
        // Auto-create user in Oracle if missing (user exists in Supabase Auth but not in our DB)
        try {
          await executeQuery(
            `INSERT INTO users (id, email, role, name) VALUES (:id, :email, 'user', NULL)`,
            { id: user.id, email: user.email }
          );
          console.log('restrictTo - Auto-created user in Oracle');
          req.user = { id: user.id, role: 'user' };
        } catch (insertErr) {
          console.log('restrictTo - Failed to auto-create user:', insertErr?.message);
          return res.status(500).json({ error: 'Failed to auto-create user', details: insertErr?.message });
        }
      } else {
        req.user = { id: user.id, role: userData.role };
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log('restrictTo - Insufficient permissions for role:', req.user.role);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      console.log('restrictTo - User authorized:', req.user);
      next();
    } catch (error) {
      console.error('restrictTo - Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
};
