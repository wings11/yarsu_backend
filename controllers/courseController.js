import { supabase } from '../server.js';

export const createCourse = async (req, res) => {
  const { name, duration, price, centre_name, location } = req.body;
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{ name, duration, price, centre_name, location }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, centre_name, location } = req.body;
  if (price && (typeof price !== 'number' || price <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({ name, duration, price, centre_name, location })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};