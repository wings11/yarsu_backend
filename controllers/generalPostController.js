import { supabase } from '../server.js';

export const createGeneralPost = async (req, res) => {
  const { text, images, videos } = req.body;
  if (!text && (!images || images.length === 0) && (!videos || videos.length === 0)) {
    return res.status(400).json({ error: 'At least one of text, images, or videos must be provided' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (videos && !Array.isArray(videos)) {
    return res.status(400).json({ error: 'videos must be an array' });
  }
  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1]);
    const { data, error } = await supabase
      .from('general_posts')
      .insert([{ text, images: images || [], videos: videos || [], user_id: user.id }])
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
      .from('general_posts')
      .select('*, users(email)')
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
      .from('general_posts')
      .select('*, users(email)')
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
  const { text, images, videos } = req.body;
  if (!text && (!images || images.length === 0) && (!videos || videos.length === 0)) {
    return res.status(400).json({ error: 'At least one of text, images, or videos must be provided' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (videos && !Array.isArray(videos)) {
    return res.status(400).json({ error: 'videos must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('general_posts')
      .update({ text, images: images || [], videos: videos || [] })
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
      .from('general_posts')
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