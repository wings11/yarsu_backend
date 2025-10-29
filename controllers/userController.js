import { supabase, supabaseAdmin } from '../server.js';

export const promoteUserToAdmin = async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user_id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User promoted to admin', user: data[0] });
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

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Get user profile using admin client (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(500).json({ 
        error: 'Failed to fetch user profile',
        details: userError.message 
      });
    }

    res.json({
      user: userData
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

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Update user name using admin client (bypasses RLS)
    const { data: userData, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update user name',
        details: updateError.message 
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