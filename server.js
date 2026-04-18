const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data and uploads directories exist
const dataDir = path.join(process.cwd(), 'data');
const uploadDir = path.join(process.cwd(), 'uploads');
[dataDir, uploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Import routes
const authRoutes = require('./src/routes/auth');
const pagesRoutes = require('./src/routes/pages');
const mediaRoutes = require('./src/routes/media');
const usersRoutes = require('./src/routes/users');

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Readiness endpoint
app.get('/ready', (req, res) => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BCS Content Management System',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'BCS Content Management System API',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      pages: '/api/pages',
      media: '/api/media',
      users: '/api/users',
      health: '/health',
      ready: '/ready'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

let server = null;

async function startServer() {
  // Initialize database and run migrations
  const { getDatabase, saveDatabase } = require('./src/db/database');
  const { runMigrations } = require('./scripts/migrate');

  await getDatabase();
  runMigrations();
  saveDatabase();

  server = app.listen(PORT, () => {
    console.log(`BCS CMS running on port ${PORT} in ${NODE_ENV} mode`);
  });

  return server;
}

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  if (server) {
    server.close(async () => {
      const { closeDatabase } = require('./src/db/database');
      await closeDatabase();
      console.log('Server closed');
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start if running directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
