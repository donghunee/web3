import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  browserPool: {
    size: parseInt(process.env.BROWSER_POOL_SIZE || '3', 10),
    maxConcurrentPages: parseInt(process.env.MAX_CONCURRENT_PAGES || '5', 10),
  },

  screenshot: {
    timeout: parseInt(process.env.SCREENSHOT_TIMEOUT || '30000', 10),
    defaultWidth: 1280,
    defaultHeight: 720,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10),
  },

  allowedDomains: process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [],
};
