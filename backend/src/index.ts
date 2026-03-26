import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import recipeRoutes from './routes/recipe.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import tagRoutes from './routes/tag.routes.js';
import groupRoutes from './routes/group.routes.js';
import suggestRoutes from './routes/suggest.routes.js';

const app = express();

// Trust the first proxy (needed when running behind Nginx)
app.set('trust proxy', 1);

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load cross-origin
  })
);

// CORS
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/suggest', suggestRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[server] Dinette API running on port ${config.port} (${config.nodeEnv})`);
});

export default app;
