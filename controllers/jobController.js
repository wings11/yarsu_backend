import { supabase } from '../server.js';

export const createJob = async (req, res) => {
  // collect all possible fields from body; set sensible defaults for nullable fields
  const {
    title,
    pinkcard,
    thai,
    payment_type = null, // make nullable by default
    stay,
    location,
    job_location,
    notes,
    job_num,
    media,
    job_date,
    payment,
    pay_amount,
  accept_amount,
  accept,
    treat = false // default false on create
  } = req.body;

  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }

  try {
    // prepare insert payload with explicit defaults to avoid inserting undefined
    const insertPayload = {
      title,
      pinkcard,
      thai,
      payment_type: payment_type ?? null,
      stay,
      location,
      job_location,
      notes,
      job_num,
      media: media || [],
      job_date,
      payment,
      pay_amount,
  accept_amount,
  accept,
      treat: treat ?? false
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([insertPayload])
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
  const body = req.body || {};

  if (body.media && !Array.isArray(body.media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }

  try {
    // build an update payload only from provided properties to avoid overwriting with undefined
    const updatableFields = [
      'title', 'pinkcard', 'thai', 'payment_type', 'stay', 'location', 'job_location', 'notes',
  'job_num', 'media', 'job_date', 'payment', 'pay_amount', 'accept_amount', 'accept', 'treat'
    ];

    const updatePayload = {};
    for (const key of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        // coerce media to empty array if provided null/undefined explicitly? keep as provided
        updatePayload[key] = key === 'media' ? (body.media || []) : body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updatePayload)
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