import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initTables } from './db.js';
import { addClient, getClientCount } from './sse.js';
import partnersRouter from './routes/partners.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5183;
const API_KEY = process.env.API_KEY || 'th-api-2026';

// CORS: allow all origins (API key protects the data)
app.use(cors());

// JSON body parser with 10MB limit
app.use(express.json({ limit: '10mb' }));

// Health endpoint — no auth
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    clients: getClientCount(),
    time: new Date().toISOString(),
  });
});

// SSE endpoint — no auth needed, just streams events
app.get('/api/events', (req, res) => {
  addClient(req, res);
});

// API key middleware for all other /api/* routes
app.use('/api', (req, res, next) => {
  // Skip SSE endpoint (already handled above)
  if (req.path === '/events') return next();

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
