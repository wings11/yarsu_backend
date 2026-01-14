/**
 * Job Controller - Oracle Version
 * Uses the repository pattern for Oracle database operations
 */

import { jobsRepo } from '../config/repository.js';

export const createJob = async (req, res) => {
  const {
    title,
    pinkcard,
    thai,
    payment_type = null,
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
    treat = false
  } = req.body;

  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }

  try {
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

    const data = await jobsRepo.insert(insertPayload);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const data = await jobsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await jobsRepo.findById(id);
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
    const updatableFields = [
      'title', 'pinkcard', 'thai', 'payment_type', 'stay', 'location', 'job_location', 'notes',
      'job_num', 'media', 'job_date', 'payment', 'pay_amount', 'accept_amount', 'accept', 'treat'
    ];

    const updatePayload = {};
    for (const key of updatableFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updatePayload[key] = key === 'media' ? (body.media || []) : body[key];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const data = await jobsRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Job not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await jobsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
