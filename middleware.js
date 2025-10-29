import { supabase, supabaseAdmin } from './server.js';

export const restrictTo = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Debug: log all headers for troubleshooting
      console.log('restrictTo - Headers:', req.headers);
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('restrictTo - Missing or invalid authorization header');
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      console.log('restrictTo - Token:', token);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.log('restrictTo - Auth error:', authError?.message);
        return res.status(401).json({ error: 'Invalid or expired token', details: authError?.message });
      }

      console.log('restrictTo - User ID:', user.id);
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        console.log('restrictTo - User data error:', userError?.message);
        // Check if user exists in auth.users but not in public.users
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (authUserError || !authUser.user) {
          return res.status(401).json({ error: 'User not found in auth.users', details: authUserError?.message });
        }
        // Auto-create user in public.users if missing
        const { data: newUserData, error: insertError } = await supabaseAdmin
          .from('users')
          .insert([{ id: user.id, email: authUser.user.email, role: 'user', name: null }])
          .select()
          .single();
        if (insertError || !newUserData) {
          console.log('restrictTo - Failed to auto-create user:', insertError?.message);
          return res.status(500).json({ error: 'Failed to auto-create user', details: insertError?.message });
        }
        console.log('restrictTo - Auto-created user:', newUserData);
        req.user = { id: user.id, role: newUserData.role };
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