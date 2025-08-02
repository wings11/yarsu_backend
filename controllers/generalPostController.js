import { supabase } from '../server.js';

export const createGeneralPost = async (req, res) => {
  const { text, media } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('general')
      .insert([{ text, media: media || [] }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllGeneralPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('general')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGeneralPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('general')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'General post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGeneralPost = async (req, res) => {
  const { id } = req.params;
  const { text, media } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('general')
      .update({ text, media: media || [] })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'General post not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGeneralPost = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('general')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'General post not found' });
    res.json({ message: 'General post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};