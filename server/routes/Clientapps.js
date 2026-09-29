const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Create a new client app + generate its API key (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'App name is required' });
    }

    // Generate a secure random API key
    // Example output: ffms_9f2a1c8e4b3d7a6f0e5c2b1a8d3f6e9c...
    const apiKey = 'ffms_' + crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO client_apps (name, api_key)
       VALUES ($1, $2) RETURNING id, name, api_key, created_at`,
      [name, apiKey]
    );

    res.status(201).json({
      message: 'Client app created. Copy this API key now — it will not be shown again in full.',
      app: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An app with this name already exists' });
    }
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

// List all client apps (admin only) — shows a masked key, not the full one
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, created_at,
        CONCAT(LEFT(api_key, 9), '...', RIGHT(api_key, 4)) AS masked_key
       FROM client_apps ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

// Revoke/delete a client app's access (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM client_apps WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'App not found' });
    }
    res.json({ message: 'App access revoked', app: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

module.exports = router;