import { supabase, supabaseAdmin } from '../server.js';

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

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Get user role from users table using admin client (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(500).json({ 
        error: 'Failed to fetch user data',
        details: userError.message 
      });
    }

    res.json({
      user: {
        id: user.id,
        email: userData.email,
        role: userData.role
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

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if current user is admin or superadmin using admin client
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ 
        error: 'Admin or Superadmin access required' 
      });
    }

    // Get all users using admin client (bypasses RLS)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .order('email');

    if (usersError) {
      return res.status(500).json({ 
        error: 'Failed to fetch users',
        details: usersError.message 
      });
    }

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

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if current user is admin or superadmin using admin client
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ 
        error: 'Admin or Superadmin access required' 
      });
    }

    // Role hierarchy validation
    if (currentUser.role === 'admin') {
      // Admins can only manage users, not other admins or superadmins
      if (newRole === 'admin' || newRole === 'superadmin') {
        return res.status(403).json({ 
          error: 'Admins cannot create or modify admin/superadmin roles' 
        });
      }
      
      // Check if target user is admin or superadmin using admin client
      const { data: targetUser, error: targetError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (targetError) {
        return res.status(500).json({ 
          error: 'Failed to fetch target user data',
          details: targetError.message 
        });
      }
      
      if (['admin', 'superadmin'].includes(targetUser.role)) {
        return res.status(403).json({ 
          error: 'Admins cannot modify admin or superadmin users' 
        });
      }
    }
    // Superadmins can modify any role

    // Update user role using admin client (bypasses RLS)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update user role',
        details: updateError.message 
      });
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
