import { supabase } from '../server.js';

export const createJob = async (req, res) => {
  const { title, pinkcard, thai, payment_type, stay, location, job_location, notes, job_num, media } = req.body;
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([{ title, pinkcard, thai, payment_type, stay, location, job_location, notes, job_num, media: media || [] }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Job not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, pinkcard, thai, payment_type, stay, location, job_location, notes, job_num, media } = req.body;
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ title, pinkcard, thai, payment_type, stay, location, job_location, notes, job_num, media: media || [] })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};