const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');
const authRoutes = require('./modules/auth/auth.routes');
const recordsRoutes = require('./modules/records/records.routes');

const app = express();

// ── Global middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Health ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'CIMS API is running' });
});

// ── API routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/citizen', recordsRoutes);
// ── 404 + error handler (must be last) ────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;