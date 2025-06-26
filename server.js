import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jobRoutes from './routes/jobRoutes.js';
import travelRoutes from './routes/travelRoutes.js';
import condoRoutes from './routes/condoRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import cjob from './config/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if(process.env.NODE_ENV !== 'production') cjob.start();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDB() {
  try {
    await supabase.from('jobs').select('*').limit(1);
  } catch (error) {
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_jobs_table');
      console.log('Jobs table created');
    }
  }

  try {
    await supabase.from('user_inquiries').select('*').limit(1);
  } catch (error) {
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_user_inquiries_table');
      console.log('User inquiries table created');
    }
  }

  try {
    await supabase.from('travel_posts').select('*').limit(1);
  } catch (error) {
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_travel_posts_table');
      console.log('Travel posts table created');
    }
  }

  try {
    await supabase.from('condos').select('*').limit(1);
  } catch (error) {
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_condos_table');
      console.log('Condos table created');
    }
  }

  try {
    await supabase.from('restaurants').select('*').limit(1);
  } catch (error) {
    if (error.code === 'PGRST301') {
      await supabase.rpc('create_restaurants_table');
      console.log('Restaurants table created');
    }
  }

  try {
    await supabase.from('hotels').select('*').limit(1);
  } catch (error) {
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

app.get('/api/health', (req, res) => {
  res.status(200).json  ({ message: 'API is running' });
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

// Export supabase client for controllers
export { supabase };