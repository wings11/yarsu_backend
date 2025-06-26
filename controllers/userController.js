import { supabase } from '../server.js';

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