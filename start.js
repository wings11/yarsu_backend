import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve backend directory reliably and load .env from there so env is correct
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
console.log('start.js loading env from', envPath);
dotenv.config({ path: envPath });

// debug: ensure FIREBASE_SERVICE_ACCOUNT_PATH loaded
console.log('start.js - FIREBASE_SERVICE_ACCOUNT_PATH set?', !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'cwd=', process.cwd());

// Start the server
import './server.js';
