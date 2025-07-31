import { supabase } from '../server.js';
import path from 'path';

export const createDocPost = async (req, res) => {
  const { text } = req.body;
  const files = req.files;
  if (!text && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'At least one of text or media must be provided' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1]);
    let mediaUrls = [];

    // Upload files to Supabase Storage
    if (files && files.length > 0) {
      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
        const { data, error } = await supabase.storage
          .from('media')
          .upload(`docs/${fileName}`, file.buffer, {
            contentType: file.mimetype,
          });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(`docs/${fileName}`);
        mediaUrls.push(publicUrl);
      }
    }

    // Insert post into docs table
    const { data, error } = await supabase
      .from('docs')
      .insert([{ text, media: mediaUrls, user_id: user.id }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error in createDocPost:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllDocPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('docs')
      .select('*, users(email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error in getAllDocPosts:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDocPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('docs')
      .select('*, users(email)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Doc post not found' });
    res.json(data);
  } catch (error) {
    console.error('Error in getDocPostById:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateDocPost = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const files = req.files;
  if (!text && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'At least one of text or media must be provided' });
  }

  try {
    let mediaUrls = [];

    // Fetch existing post to retain media if no new files are uploaded
    const { data: existingPost, error: fetchError } = await supabase
      .from('docs')
      .select('media')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    if (!existingPost) return res.status(404).json({ error: 'Doc post not found' });

    // Upload new files to Supabase Storage
    if (files && files.length > 0) {
      mediaUrls = [];
      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
        const { data, error } = await supabase.storage
          .from('media')
          .upload(`docs/${fileName}`, file.buffer, {
            contentType: file.mimetype,
          });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(`docs/${fileName}`);
        mediaUrls.push(publicUrl);
      }
    } else {
      mediaUrls = existingPost.media;
    }

    // Update post in docs table
    const { data, error } = await supabase
      .from('docs')
      .update({ text, media: mediaUrls })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Doc post not found' });
    res.json(data[0]);
  } catch (error) {
    console.error('Error in updateDocPost:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocPost = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch existing post to get media URLs for deletion
    const { data: existingPost, error: fetchError } = await supabase
      .from('docs')
      .select('media')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    if (!existingPost) return res.status(404).json({ error: 'Doc post not found' });

    // Delete media files from Supabase Storage
    if (existingPost.media && existingPost.media.length > 0) {
      const filePaths = existingPost.media.map(url => {
        const path = url.split('/storage/v1/object/public/media/')[1];
        return path;
      });
      const { error: deleteError } = await supabase.storage
        .from('media')
        .remove(filePaths);
      if (deleteError) throw deleteError;
    }

    // Delete post from docs table
    const { data, error } = await supabase
      .from('docs')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Doc post not found' });
    res.json({ message: 'Doc post deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDocPost:', error);
    res.status(500).json({ error: error.message });
  }
};