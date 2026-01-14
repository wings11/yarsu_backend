/**
 * Inquiry Controller - Oracle Version
 */

import { userInquiriesRepo, jobsRepo } from '../config/repository.js';
import { executeQuery } from '../config/database.js';

export const createInquiry = async (req, res) => {
  const { job_id, user_id, name, phonenumber, address, birthday, thailanguage, gender } = req.body;
  
  try {
    const data = await userInquiriesRepo.insert({
      job_id, user_id, name, phonenumber, address, birthday, thailanguage, gender
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserInquiries = async (req, res) => {
  const { user_id } = req.params;
  
  try {
    // Join with jobs table to get job details
    const sql = `
      SELECT 
        ui.*,
        j.TITLE as job_title,
        j.JOB_LOCATION as job_job_location
      FROM user_inquiries ui
      LEFT JOIN jobs j ON ui.JOB_ID = j.ID
      WHERE ui.USER_ID = :user_id
      ORDER BY ui.CREATED_AT DESC
    `;
    
    const result = await executeQuery(sql, { user_id });
    
    // Transform to match Supabase nested format
    const data = (result.rows || []).map(row => ({
      id: row.ID,
      job_id: row.JOB_ID,
      user_id: row.USER_ID,
      name: row.NAME,
      phonenumber: row.PHONENUMBER,
      address: row.ADDRESS,
      birthday: row.BIRTHDAY,
      thailanguage: row.THAILANGUAGE === 1,
      gender: row.GENDER === 1,
      created_at: row.CREATED_AT,
      jobs: row.JOB_TITLE ? {
        title: row.JOB_TITLE,
        job_location: row.JOB_JOB_LOCATION
      } : null
    }));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
