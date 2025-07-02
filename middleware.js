import { supabase, supabaseAdmin } from './server.js';

export const restrictTo = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Debug: log all headers for troubleshooting
      console.log('restrictTo headers:', req.headers);
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        return res.status(500).json({ error: 'Failed to fetch user data', details: userError.message });
      }

      if (!allowedRoles.includes(userData.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = { id: user.id, role: userData.role };
      next();
    } catch (error) {
      console.error('Error in restrictTo middleware:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
};