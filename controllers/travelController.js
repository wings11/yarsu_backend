import { supabase } from '../server.js';

export const createTravelPost = async (req, res) => {
  const { name, place, highlights, images, admin_rating, notes } = req.body;
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (!Array.isArray(highlights) || !Array.isArray(images)) {
    return res.status(400).json({ error: 'highlights and images must be arrays' });
  }
  try {
    const { data, error } = await supabase
      .from('travel_posts')
      .insert([{ name, place, highlights, images, admin_rating, notes }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTravelPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('travel_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTravelPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('travel_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Travel post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTravelPost = async (req, res) => {
  const { id } = req.params;
  const { name, place, highlights, images, admin_rating, notes } = req.body;
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (highlights && !Array.isArray(highlights)) {
    return res.status(400).json({ error: 'highlights must be an array' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('travel_posts')
      .update({ name, place, highlights, images, admin_rating, notes })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Travel post not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTravelPost = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('travel_posts')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Travel post not found' });
    res.json({ message: 'Travel post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};