import { Router } from 'express';
import { getSettings, updateSettings as dbUpdateSettings } from '../db.js';
import { broadcast } from '../sse.js';

const router = Router();

// GET /api/settings — get all
router.get('/', (req, res) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (e) {
    console.error('GET /api/settings error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/settings — update (merge)
router.put('/', (req, res) => {
  try {
    const updated = dbUpdateSettings(req.body);
    broadcast('settings-updated', updated);
    res.json(updated);
  } catch (e) {
    console.error('PUT /api/settings error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
