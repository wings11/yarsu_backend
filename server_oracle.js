/**
 * Server Entry Point - Oracle Version
 * Uses Supabase for Auth and Storage only, Oracle for all data
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setPresence, removePresenceBySocket } from './services/presenceService.js';
import { initializePool, closePool } from './config/database.js';
import cjob from './config/cron.js';

// Import Oracle-based routes
import jobRoutes from './routes/jobRoutes.js';
import travelRoutes from './routes/travelRoutes.js';
import condoRoutes from './routes/condoRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import generalRoutes from './routes/generalRoutes.js';
import docsRoutes from './routes/docsRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import highlightRoutes from './routes/highlightRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notiChatRoutes from './routes/noti_chat_routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') cjob.start();

// Initialize Supabase client for AUTH and STORAGE only
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables (needed for Auth)');
  process.exit(1);
}

// Client for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also export supabaseAdmin for backward compatibility (uses same client for auth)
const supabaseAdmin = supabase;

app.use(cors({
  origin: '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Oracle database connection
async function initDB() {
  console.log('Initializing Oracle database connection...');
  
  try {
    await initializePool();
    console.log('Oracle database pool initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Oracle database:', error.message);
    throw error;
  }
}

// Mount routes
app.use('/api', jobRoutes);
app.use('/api', travelRoutes);
app.use('/api', condoRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', hotelRoutes);
app.use('/api', authRoutes);
app.use('/api', courseRoutes);
app.use('/api', generalRoutes);
app.use('/api', docsRoutes);
app.use('/api', linkRoutes);
app.use('/api', highlightRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', notiChatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running Healthily', database: 'Oracle' });
});

// --- SOCKET.IO SETUP ---
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('identify', (userId) => {
    if (userId) {
      setPresence(String(userId), socket.id).catch(() => {});
      console.log(`Socket ${socket.id} identified as user ${userId}`);
    }
  });

  socket.on('send_message', (data) => {
    io.to(data.chatId).emit('receive_message', data);
  });

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    removePresenceBySocket(socket.id).catch(() => {});
  });
});

// --- END SOCKET.IO SETUP ---

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start server
initDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Database: Oracle`);
      console.log(`Auth: Supabase`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Export for controllers
export { supabase, supabaseAdmin, io };
