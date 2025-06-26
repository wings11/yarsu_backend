import { supabase } from '../server.js';

export const createRestaurant = async (req, res) => {
  const { name, location, images, popular_picks, admin_rating, notes } = req.body;
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (!Array.isArray(images) || !Array.isArray(popular_picks)) {
    return res.status(400).json({ error: 'images and popular_picks must be arrays' });
  }
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([{ name, location, images, popular_picks, admin_rating, notes }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllRestaurants = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRestaurant = async (req, res) => {
  const { id } = req.params;
  const { name, location, images, popular_picks, admin_rating, notes } = req.body;
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (popular_picks && !Array.isArray(popular_picks)) {
    return res.status(400).json({ error: 'popular_picks must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update({ name, location, images, popular_picks, admin_rating, notes })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};