/**
 * Docs Controller - Oracle Version
 */

import { docsRepo } from '../config/repository.js';

export const createDocsPost = async (req, res) => {
  const { text, media } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  
  try {
    const data = await docsRepo.insert({ text, media: media || [] });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDocsPosts = async (req, res) => {
  try {
    const data = await docsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocsPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await docsRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Docs post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDocsPost = async (req, res) => {
  const { id } = req.params;
  const { text, media } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  
  try {
    const data = await docsRepo.update(id, { text, media: media || [] });
    if (!data) return res.status(404).json({ error: 'Docs post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocsPost = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await docsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Docs post not found' });
    res.json({ message: 'Docs post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
