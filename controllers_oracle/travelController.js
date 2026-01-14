/**
 * Travel Controller - Oracle Version
 */

import { travelPostsRepo } from '../config/repository.js';

export const createTravelPost = async (req, res) => {
  const { name, place, highlights, images, admin_rating, notes } = req.body;
  
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (!Array.isArray(highlights) || !Array.isArray(images)) {
    return res.status(400).json({ error: 'highlights and images must be arrays' });
  }
  
  try {
    const data = await travelPostsRepo.insert({ name, place, highlights, images, admin_rating, notes });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTravelPosts = async (req, res) => {
  try {
    const data = await travelPostsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTravelPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await travelPostsRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Travel post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTravelPost = async (req, res) => {
  const { id } = req.params;
  const { name, place, highlights, images, admin_rating, notes } = req.body;
  
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (highlights && !Array.isArray(highlights)) {
    return res.status(400).json({ error: 'highlights must be an array' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  
  try {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (place !== undefined) updatePayload.place = place;
    if (highlights !== undefined) updatePayload.highlights = highlights;
    if (images !== undefined) updatePayload.images = images;
    if (admin_rating !== undefined) updatePayload.admin_rating = admin_rating;
    if (notes !== undefined) updatePayload.notes = notes;

    const data = await travelPostsRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Travel post not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTravelPost = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await travelPostsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Travel post not found' });
    res.json({ message: 'Travel post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
