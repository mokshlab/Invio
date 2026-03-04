/**
 * Middleware pipeline order matters: security headers & CORS first, then
 * rate-limiting, body parsing, NoSQL-injection sanitization, and finally
 * routes + error handlers — so every request is hardened before any
 * business logic runs.
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/index.js';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { startCronJobs } from './services/cronService.js';

const app = express();

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Global rate limit — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Stricter rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 login/signup attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

// Stricter rate limit for AI endpoints (expensive Gemini calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 AI requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI rate limit reached, please try again later.' },
});

// --------------- Body Parsing & Sanitization ---------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize request data against NoSQL injection (strips $ and . from keys)
app.use(mongoSanitize());

// --------------- Request Logging ---------------
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// --------------- API Routes ---------------
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Error Handling ---------------
app.use(notFound);
app.use(errorHandler);

// --------------- Start Server ---------------
const startServer = async () => {
  await connectDB();
  startCronJobs();
  const server = app.listen(config.port, () => {
    console.log(
      `\n🚀 Server running on port ${config.port} in ${config.nodeEnv} mode\n`
    );
  });

  // --------------- Graceful Shutdown ---------------
  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully…`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    // Force exit if connections don't drain within 10 s
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
