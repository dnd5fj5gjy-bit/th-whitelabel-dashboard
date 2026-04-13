import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initTables, getAllPartners, getSettings } from './db.js';
import partnersRouter from './routes/partners.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5183;
const API_KEY = process.env.API_KEY || 'th-api-2026';

// Global version counter — increments on every data change
let dataVersion = Date.now();

export function bumpVersion() {
  dataVersion = Date.now();
}

// CORS: allow all origins (API key protects the data)
app.use(cors());

// JSON body parser with 10MB limit
app.use(express.json({ limit: '10mb' }));

// Health endpoint — no auth
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: dataVersion,
    time: new Date().toISOString(),
  });
});

// Sync polling endpoint — client sends its last known version,
// server returns current version + full data if changed
app.get('/api/sync', (req, res) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const clientVersion = parseInt(req.query.v) || 0;

  if (clientVersion >= dataVersion) {
    // No changes
    return res.json({ changed: false, version: dataVersion });
  }

  // Data has changed — return everything
  const partners = getAllPartners();
  const settings = getSettings();
  res.json({
    changed: true,
    version: dataVersion,
    partners,
    settings,
  });
});

// API key middleware for /api/* routes
app.use('/api', (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Mount routes
app.use('/api/partners', partnersRouter);
app.use('/api/settings', settingsRouter);

// Initialize database and start server
initTables();
console.log(`Database initialized.`);

app.listen(PORT, () => {
  console.log(`TH White-Label Server running on port ${PORT}`);
});
