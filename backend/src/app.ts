import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

const app = express();

app.disable('x-powered-by');

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list or vercel preview deploys
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limiting
app.use('/api', apiRateLimiter);

// Mount API routes
app.use('/api', apiRouter);

// Root health probe for Render / Cloud monitors
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'CipherChat Secure E2EE Dumb-Pipe Relay',
    version: '1.0.0',
    documentation: 'See README.md for protocol specification.',
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
