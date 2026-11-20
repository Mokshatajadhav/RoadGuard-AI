import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import complaintRoutes from './routes/complaintRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { autoSeedIfEmpty } from './seed/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (origin === FRONTEND_URL || origin === 'http://localhost:3000' || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded photos statically
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    service: 'RoadGuard AI Backend API',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

import authRoutes from './routes/authRoutes.js';

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Analytics summary route alias (for convenience)
import { getAnalyticsSummary } from './controllers/complaintController.js';
app.get('/api/analytics/summary', getAnalyticsSummary);

// AI Pothole Detection endpoint
import { detectPothole } from './controllers/detectionController.js';
import upload from './middleware/upload.js';
app.post('/api/detect', upload.single('image'), detectPothole);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

/**
 * Start Server:
 * Connects to MongoDB first, seeds initial data if empty, and only then starts listening.
 */
async function startServer() {
  try {
    console.log('[RoadGuard AI Backend] Connecting to MongoDB...');
    await connectDB();
    await autoSeedIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`[RoadGuard AI Backend] Server running on port ${PORT}`);
      console.log(`[RoadGuard AI Backend] Health check available at http://localhost:${PORT}/api/health`);
      console.log(`[RoadGuard AI Backend] CORS allowed for: ${FRONTEND_URL}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Closing HTTP server and database...');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server and database connection terminated cleanly.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[RoadGuard AI Backend] Fatal Error during server bootstrap:', error.message);
    process.exit(1);
  }
}

startServer();
