/**
 * Course Controller - Oracle Version
 */

import { coursesRepo } from '../config/repository.js';

export const createCourse = async (req, res) => {
  const { name, duration, price, centre_name, location, notes } = req.body;
  
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }
  
  try {
    const data = await coursesRepo.insert({ name, duration, price, centre_name, location, notes });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const data = await coursesRepo.findAll({ orderBy: 'created_at DESC' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await coursesRepo.findById(id);
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, centre_name, location, notes } = req.body;
  
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }
  
  try {
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (duration !== undefined) updatePayload.duration = duration;
    if (price !== undefined) updatePayload.price = price;
    if (centre_name !== undefined) updatePayload.centre_name = centre_name;
    if (location !== undefined) updatePayload.location = location;
    if (notes !== undefined) updatePayload.notes = notes;

    const data = await coursesRepo.update(id, updatePayload);
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await coursesRepo.delete(id);
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
