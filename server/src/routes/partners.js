import { Router } from 'express';
import { getAllPartners, getPartner, upsertPartner, deletePartner as dbDeletePartner, bulkUpsertPartners } from '../db.js';
import { broadcast } from '../sse.js';

const router = Router();

// GET /api/partners — list all
router.get('/', (req, res) => {
  try {
    const partners = getAllPartners();
    res.json(partners);
  } catch (e) {
    console.error('GET /api/partners error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/partners/:id — get one
router.get('/:id', (req, res) => {
  try {
    const partner = getPartner(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    res.json(partner);
  } catch (e) {
    console.error('GET /api/partners/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/partners/:id — update (merge)
router.put('/:id', (req, res) => {
  try {
    const merged = upsertPartner(req.params.id, req.body);
    broadcast('partner-updated', merged);
    res.json(merged);
  } catch (e) {
    console.error('PUT /api/partners/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/partners — create new
router.post('/', (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = `p-${Date.now()}`;
    }
    const partner = upsertPartner(data.id, data);
    broadcast('partner-updated', partner);
    res.status(201).json(partner);
  } catch (e) {
    console.error('POST /api/partners error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/partners/:id — delete
router.delete('/:id', (req, res) => {
  try {
    dbDeletePartner(req.params.id);
    broadcast('partner-updated', { id: req.params.id, deleted: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/partners/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/partners/bulk — bulk upsert
router.post('/bulk', (req, res) => {
  try {
    const partners = req.body;
    if (!Array.isArray(partners)) {
      return res.status(400).json({ error: 'Body must be an array of partners' });
    }
    bulkUpsertPartners(partners);
    broadcast('bulk-sync', { count: partners.length });
    res.json({ ok: true, count: partners.length });
  } catch (e) {
    console.error('POST /api/partners/bulk error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
