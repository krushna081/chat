import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoConnect from './config/database.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import { authenticate } from './middleware/auth.js';
import setupSocketHandlers from './sockets/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'https://chat-khaki-two-48.vercel.app';
const LOCALHOST_ORIGINS = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5182',
  'http://localhost:5184',
  'http://localhost:5185',
  'https://chat-khaki-two-48.vercel.app',
];

const isLocalNetworkOrigin = (origin) => {
  if (!origin) return false;
  const localPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/;
  return localPattern.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (!origin || LOCALHOST_ORIGINS.includes(origin) || isLocalNetworkOrigin(origin) || (origin && origin.endsWith('.devtunnels.ms'))) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

const io = new SocketIOServer(server, {
  cors: corsOptions,
});

// Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// CORS
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/user', authenticate, userRoutes);

// Socket.io Setup
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Database connection (non-blocking)
mongoConnect();

const PORT = process.env.PORT || 5000;

// Only listen when run directly (not imported as module by Vercel)
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
  });
}

export { app, server, io };
