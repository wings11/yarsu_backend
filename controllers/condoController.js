import { supabase } from '../server.js';

export const createCondo = async (req, res) => {
  const { name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space } = req.body;
  if (!Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (typeof rent_fee !== 'number' || rent_fee <= 0) {
    return res.status(400).json({ error: 'rent_fee must be a positive number' });
  }
  try {
    const { data, error } = await supabase
      .from('condos')
      .insert([
        { name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space }
      ])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCondos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('condos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCondoById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('condos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Condo not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCondo = async (req, res) => {
  const { id } = req.params;
  const { name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space } = req.body;
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (rent_fee && (typeof rent_fee !== 'number' || rent_fee <= 0)) {
    return res.status(400).json({ error: 'rent_fee must be a positive number' });
  }
  try {
    const { data, error } = await supabase
      .from('condos')
      .update({ name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Condo not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCondo = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('condos')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Condo not found' });
    res.json({ message: 'Condo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};