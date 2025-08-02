import { supabase } from '../server.js';

export const createHighlight = async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  try {
    const { data, error } = await supabase
      .from('highlights')
      .insert([{ image }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHighlights = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHighlightById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Highlight not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHighlight = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  try {
    const { data, error } = await supabase
      .from('highlights')
      .update({ image })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Highlight not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHighlight = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Highlight not found' });
    res.json({ message: 'Highlight deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};