/**
 * Highlight Controller - Oracle Version
 */

import { highlightsRepo } from '../config/repository.js';

export const createHighlight = async (req, res) => {
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  
  try {
    const data = await highlightsRepo.insert({ image });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHighlights = async (req, res) => {
  try {
    const data = await highlightsRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHighlightById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await highlightsRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Highlight not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHighlight = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: 'image is required' });
  }
  
  try {
    const data = await highlightsRepo.update(id, { image });
    if (!data) return res.status(404).json({ error: 'Highlight not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHighlight = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await highlightsRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Highlight not found' });
    res.json({ message: 'Highlight deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
