import { supabase } from '../server.js';

export const createLink = async (req, res) => {
  const { platform, url } = req.body;
  if (!platform || !url) {
    return res.status(400).json({ error: 'platform and url are required' });
  }
  try {
    const { data, error } = await supabase
      .from('links')
      .insert([{ platform, url }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllLinks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLinkById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Link not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLink = async (req, res) => {
  const { id } = req.params;
  const { platform, url } = req.body;
  if (!platform || !url) {
    return res.status(400).json({ error: 'platform and url are required' });
  }
  try {
    const { data, error } = await supabase
      .from('links')
      .update({ platform, url })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Link not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};