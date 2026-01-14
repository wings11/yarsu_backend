/**
 * Restaurant Controller - Oracle Version
 */

import { restaurantsRepo } from '../config/repository.js';

export const createRestaurant = async (req, res) => {
  const { name, location, images, popular_picks, admin_rating, notes } = req.body;
  
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (!Array.isArray(images) || !Array.isArray(popular_picks)) {
    return res.status(400).json({ error: 'images and popular_picks must be arrays' });
  }
  
  try {
    const data = await restaurantsRepo.insert({ name, location, images, popular_picks, admin_rating, notes });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllRestaurants = async (req, res) => {
  try {
    const data = await restaurantsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await restaurantsRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRestaurant = async (req, res) => {
  const { id } = req.params;
  const { name, location, images, popular_picks, admin_rating, notes } = req.body;
  
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (popular_picks && !Array.isArray(popular_picks)) {
    return res.status(400).json({ error: 'popular_picks must be an array' });
  }
  
  try {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (location !== undefined) updatePayload.location = location;
    if (images !== undefined) updatePayload.images = images;
    if (popular_picks !== undefined) updatePayload.popular_picks = popular_picks;
    if (admin_rating !== undefined) updatePayload.admin_rating = admin_rating;
    if (notes !== undefined) updatePayload.notes = notes;

    const data = await restaurantsRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await restaurantsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
