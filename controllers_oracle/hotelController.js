/**
 * Hotel Controller - Oracle Version
 */

import { hotelsRepo } from '../config/repository.js';

export const createHotel = async (req, res) => {
  const { name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating } = req.body;
  
  if (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (!Array.isArray(nearby_famous_places) || !Array.isArray(images)) {
    return res.status(400).json({ error: 'nearby_famous_places and images must be arrays' });
  }
  
  try {
    const data = await hotelsRepo.insert({
      name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const data = await hotelsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHotelById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await hotelsRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Hotel not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHotel = async (req, res) => {
  const { id } = req.params;
  const { name, address, price, nearby_famous_places, breakfast, free_wifi, swimming_pool, images, notes, admin_rating } = req.body;
  
  if (admin_rating && (!Number.isInteger(admin_rating) || admin_rating < 1 || admin_rating > 5)) {
    return res.status(400).json({ error: 'admin_rating must be an integer between 1 and 5' });
  }
  if (price && (typeof price !== 'number' || price <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (nearby_famous_places && !Array.isArray(nearby_famous_places)) {
    return res.status(400).json({ error: 'nearby_famous_places must be an array' });
  }
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  
  try {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (address !== undefined) updatePayload.address = address;
    if (price !== undefined) updatePayload.price = price;
    if (nearby_famous_places !== undefined) updatePayload.nearby_famous_places = nearby_famous_places;
    if (breakfast !== undefined) updatePayload.breakfast = breakfast;
    if (free_wifi !== undefined) updatePayload.free_wifi = free_wifi;
    if (swimming_pool !== undefined) updatePayload.swimming_pool = swimming_pool;
    if (images !== undefined) updatePayload.images = images;
    if (notes !== undefined) updatePayload.notes = notes;
    if (admin_rating !== undefined) updatePayload.admin_rating = admin_rating;

    const data = await hotelsRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Hotel not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHotel = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await hotelsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Hotel not found' });
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
