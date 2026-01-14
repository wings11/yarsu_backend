/**
 * Link Controller - Oracle Version
 */

import { linksRepo } from '../config/repository.js';

export const createLink = async (req, res) => {
  const { platform, url } = req.body;
  
  if (!platform || !url) {
    return res.status(400).json({ error: 'platform and url are required' });
  }
  
  try {
    const data = await linksRepo.insert({ platform, url });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllLinks = async (req, res) => {
  try {
    const data = await linksRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLinkById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await linksRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Link not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLink = async (req, res) => {
  const { id } = req.params;
  const { platform, url } = req.body;
  
  if (!platform || !url) {
    return res.status(400).json({ error: 'platform and url are required' });
  }
  
  try {
    const data = await linksRepo.update(id, { platform, url });
    if (!data) return res.status(404).json({ error: 'Link not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await linksRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
