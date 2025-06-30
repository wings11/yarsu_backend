import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jobRoutes from './routes/jobRoutes.js';
import travelRoutes from './routes/travelRoutes.js';
import condoRoutes from './routes/condoRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cjob from './config/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if(process.env.NODE_ENV !== 'production') cjob.start();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);
console.log('Supabase Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Client for auth operations (with RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDB() {
  console.log('Initializing database tables...');
  
  try {
    await supabase.from('jobs').select('*').limit(1);
    console.log('Jobs table exists');
  } catch (error) {
    console.log('Jobs table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_jobs_table');
      console.log('Jobs table created');
    }
  }

  try {
    await supabase.from('user_inquiries').select('*').limit(1);
    console.log('User inquiries table exists');
  } catch (error) {
    console.log('User inquiries table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_user_inquiries_table');
      console.log('User inquiries table created');
    }
  }

  try {
    await supabase.from('travel_posts').select('*').limit(1);
    console.log('Travel posts table exists');
  } catch (error) {
    console.log('Travel posts table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_travel_posts_table');
      console.log('Travel posts table created');
    }
  }

  try {
    await supabase.from('condos').select('*').limit(1);
    console.log('Condos table exists');
  } catch (error) {
    console.log('Condos table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_condos_table');
      console.log('Condos table created');
    }
  }

  try {
    await supabase.from('restaurants').select('*').limit(1);
    console.log('Restaurants table exists');
  } catch (error) {
    console.log('Restaurants table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_restaurants_table');
      console.log('Restaurants table created');
    }
  }

  try {
    await supabase.from('hotels').select('*').limit(1);
    console.log('Hotels table exists');
  } catch (error) {
    console.log('Hotels table error:', error.message);
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_hotels_table');
      console.log('Hotels table created');
    }
  }
}

// Mount routes
app.use('/api', jobRoutes);
app.use('/api', travelRoutes);
app.use('/api', condoRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', hotelRoutes);
app.use('/api', authRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json  ({ message: 'API is running Healthily' });
});

// Start server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Export supabase clients for controllers
export { supabase, supabaseAdmin };