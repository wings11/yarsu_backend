import { supabase } from '../server.js';
import path from 'path';

export const createDocPost = async (req, res) => {
  const { text, media } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'Media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('docs')
      .insert([{ text, media: media || null }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDocPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('docs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('docs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Doc post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDocPost = async (req, res) => {
  const { id } = req.params;
  const { text, media } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'Media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('docs')
      .update({ text, media: media || null })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Doc post not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocPost = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('docs')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Doc post not found' });
    res.json({ message: 'Doc post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadMedia = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  try {
    const mediaUrls = [];
    for (const file of req.files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);
      mediaUrls.push(publicUrl);
    }
    res.json({ mediaUrls });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload media', details: error.message });
  }
};