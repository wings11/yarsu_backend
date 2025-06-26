import { supabase } from '../server.js';

export const createHotel = async (req, res) => {
  const { name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating } = req.body;
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (!Array.isArray(nearby_famous_places) || !Array.isArray(images)) {
    return res.status(400).json({ error: 'nearby_famous_places and images must be arrays' });
  }
  try {
    const { data, error } = await supabase
      .from('hotels')
      .insert([
        { name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating }
      ])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHotelById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Hotel not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHotel = async (req, res) => {
  const { id } = req.params;
  const { name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating } = req.body;
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (price && (typeof price !== 'number' || price <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (nearby_famous_places && !Array.isArray(nearby_famous_places)) {
    return res.status(400).json({ error: 'nearby_famous_places must be an array' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('hotels')
      .update({ name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Hotel not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHotel = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};