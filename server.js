// server.js — Yen Lee Fireweld backend.
// Serves the existing static website AND the Developer Project Management API
// from a single process, so you only need to deploy one thing.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectsPublicRoutes = require('./routes/projectsPublic');
const projectsAdminRoutes = require('./routes/projectsAdmin');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Security ----
app.use(
  helmet({
    contentSecurityPolicy: false, // the static site loads its own CDN scripts/styles
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / server-to-server requests (no Origin header),
      // and anything explicitly whitelisted in ALLOWED_ORIGINS.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '2mb' }));

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsPublicRoutes); // public, read-only
app.use('/api/admin/projects', projectsAdminRoutes); // developer-only, full CRUD
app.use('/api/upload', uploadRoutes); // developer-only

// ---- Uploaded files (images/videos/pdfs) ----
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- The existing static website (one directory up from /backend) ----
const SITE_ROOT = path.join(__dirname, '..');
app.use(express.static(SITE_ROOT));

// Fallback to the site's own 404 if present, else a plain message.
app.use((req, res) => {
  const notFoundPage = path.join(SITE_ROOT, '404.html');
  res.status(404).sendFile(notFoundPage, (err) => {
    if (err) res.status(404).send('Page not found.');
  });
});

app.listen(PORT, () => {
  console.log(`Yen Lee Fireweld server running on port ${PORT}`);
  console.log(`Public site:        http://localhost:${PORT}/`);
  console.log(`Developer dashboard http://localhost:${PORT}/admin/dashboard.html`);
});
