/**
 * General Post Controller - Oracle Version
 */

import { generalRepo } from '../config/repository.js';

export const createGeneralPost = async (req, res) => {
  const { text, media } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  
  try {
    const data = await generalRepo.insert({ text, media: media || [] });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllGeneralPosts = async (req, res) => {
  try {
    const data = await generalRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGeneralPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await generalRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'General post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGeneralPost = async (req, res) => {
  const { id } = req.params;
  const { text, media } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (media && !Array.isArray(media)) {
    return res.status(400).json({ error: 'media must be an array' });
  }
  
  try {
    const data = await generalRepo.update(id, { text, media: media || [] });
    if (!data) return res.status(404).json({ error: 'General post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGeneralPost = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await generalRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'General post not found' });
    res.json({ message: 'General post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
