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
import chatRoutes from './routes/chatRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import cjob from './config/cron.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setPresence, removePresenceBySocket } from './services/presenceService.js';
import generalRoutes from './routes/generalRoutes.js';
import docsRoutes from './routes/docsRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import highlightRoutes from './routes/highlightRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notiChatRoutes from './routes/noti_chat_routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if(process.env.NODE_ENV !== 'production') cjob.start();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;


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

app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form-data

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
app.use('/api', chatRoutes);
app.use('/api', courseRoutes);
app.use('/api', generalRoutes);
app.use('/api', docsRoutes);
app.use('/api', linkRoutes);
app.use('/api', highlightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', notiChatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json  ({ message: 'API is running Healthily' });
});

// --- SOCKET.IO SETUP ---
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Presence map handled by presenceService (Redis or in-memory fallback)

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // client should emit 'identify' with their userId after connecting
  socket.on('identify', (userId) => {
    if (userId) {
      setPresence(String(userId), socket.id).catch(() => {});
      console.log(`Socket ${socket.id} identified as user ${userId}`);
      
      // Join user's personal room for targeted messages
      socket.join(`user_${userId}`);
    }
  });

  // Join a specific chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
    
    // Notify others in the chat that someone joined
    socket.to(`chat_${chatId}`).emit('user_joined', { chatId, socketId: socket.id });
  });

  // Leave a specific chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
    
    // Notify others in the chat that someone left
    socket.to(`chat_${chatId}`).emit('user_left', { chatId, socketId: socket.id });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`chat_${data.chatId}`).emit('user_typing', {
      chatId: data.chatId,
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Mark message as read
  socket.on('message_read', (data) => {
    socket.to(`chat_${data.chatId}`).emit('message_read_update', {
      chatId: data.chatId,
      messageId: data.messageId,
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // remove presence entries that match this socket id
    removePresenceBySocket(socket.id).catch(() => {});
  });
});

// --- END SOCKET.IO SETUP ---

// Start server
initDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Export supabase clients and socket presence for controllers
export { supabase, supabaseAdmin, io };