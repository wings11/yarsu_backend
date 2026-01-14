/**
 * Condo Controller - Oracle Version
 */

import { condosRepo } from '../config/repository.js';

export const createCondo = async (req, res) => {
  const { name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space, notes } = req.body;
  
  if (!Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (typeof rent_fee !== 'number' || rent_fee <= 0) {
    return res.status(400).json({ error: 'rent_fee must be a positive number' });
  }
  
  try {
    const data = await condosRepo.insert({
      name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space, notes
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCondos = async (req, res) => {
  try {
    const data = await condosRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCondoById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await condosRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Condo not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCondo = async (req, res) => {
  const { id } = req.params;
  const { name, address, rent_fee, images, swimming_pool, free_wifi, gym, garden, co_working_space, notes } = req.body;
  
  if (images && !Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' });
  }
  if (rent_fee && (typeof rent_fee !== 'number' || rent_fee <= 0)) {
    return res.status(400).json({ error: 'rent_fee must be a positive number' });
  }
  
  try {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (address !== undefined) updatePayload.address = address;
    if (rent_fee !== undefined) updatePayload.rent_fee = rent_fee;
    if (images !== undefined) updatePayload.images = images;
    if (swimming_pool !== undefined) updatePayload.swimming_pool = swimming_pool;
    if (free_wifi !== undefined) updatePayload.free_wifi = free_wifi;
    if (gym !== undefined) updatePayload.gym = gym;
    if (garden !== undefined) updatePayload.garden = garden;
    if (co_working_space !== undefined) updatePayload.co_working_space = co_working_space;
    if (notes !== undefined) updatePayload.notes = notes;

    const data = await condosRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Condo not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCondo = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await condosRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Condo not found' });
    res.json({ message: 'Condo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
