import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS setup
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiter for general safety
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// API Routes
app.use('/api', apiLimiter, apiRouter);

// Serve static frontend files if production build exists
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root route fallback when dist is not built
  app.get('/', (req, res) => {
    res.json({
      app: 'HostGuard — Visitor Entry Management System',
      institution: 'The LNM Institute of Information Technology, Jaipur (LNMIIT)',
      course: 'CS314 Software Development Laboratory',
      team: 'T049',
      version: '1.0.0',
      documentation: '/docs/API.md',
      healthCheck: '/api/health'
    });
  });
}

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
