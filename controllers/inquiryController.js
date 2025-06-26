import { supabase } from '../server.js';

export const createInquiry = async (req, res) => {
  const { job_id, user_id, name, phonenumber, address, birthday, thailanguage, gender } = req.body;
  try {
    const { data, error } = await supabase
      .from('user_inquiries')
      .insert([{ job_id, user_id, name, phonenumber, address, birthday, thailanguage, gender }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserInquiries = async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('user_inquiries')
      .select('*, jobs(title, job_location)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  