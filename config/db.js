import {neon} from "@neondatabase/serverless";
import "dotenv/config";

export const sql=neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL UNIQUE,
      pinkcard BOOLEAN NOT NULL DEFAULT false,
      thai BOOLEAN NOT NULL DEFAULT false,
      payment_type BOOLEAN NOT NULL,
      stay BOOLEAN NOT NULL DEFAULT false,
      location VARCHAR(255),
      job_location VARCHAR(255) NOT NULL,
      notes VARCHAR(255),
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS user_details (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      phonenumber VARCHAR(20) NOT NULL,
      address VARCHAR(255) NOT NULL,
      birthday DATE NOT NULL,
      thailanguage BOOLEAN NOT NULL,
      gender BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS job_inquiries (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id),
      user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}