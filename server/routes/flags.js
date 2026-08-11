const redisClient = require('../config/redis');
const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Create a new flag (admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { key, description, is_enabled, rollout_percentage } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Flag key is required' });
    }

    const result = await pool.query(
      `INSERT INTO flags (key, description, is_enabled, rollout_percentage, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [key, description || '', is_enabled || false, rollout_percentage || 0, req.user.id]
    );

    const newFlag = result.rows[0];

    // Log this action
    await pool.query(
      `INSERT INTO audit_logs (flag_id, action, changed_by, changes)
       VALUES ($1, $2, $3, $4)`,
      [newFlag.id, 'create', req.user.id, JSON.stringify(newFlag)]
    );

    res.status(201).json(newFlag);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A flag with this key already exists' });
    }
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

// List all flags (any logged-in user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flags ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

// Update a flag (admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, is_enabled, rollout_percentage } = req.body;

    const result = await pool.query(
      `UPDATE flags 
       SET description = $1, is_enabled = $2, rollout_percentage = $3, updated_at = NOW()
       WHERE id = $4 
       RETURNING *`,
      [description, is_enabled, rollout_percentage, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const updatedFlag = result.rows[0];

    // Clear all cached entries for this flag (across all users)
    const flagKey = updatedFlag.key;
    const keysToDelete = await redisClient.keys(`flag:${flagKey}:*`);
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }

    // Log this action
    await pool.query(
      `INSERT INTO audit_logs (flag_id, action, changed_by, changes)
       VALUES ($1, $2, $3, $4)`,
      [updatedFlag.id, 'update', req.user.id, JSON.stringify({ description, is_enabled, rollout_percentage })]
    );

    res.json(updatedFlag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

// Delete a flag (admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM flags WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const deletedFlag = result.rows[0];

    // Clear all cached entries for this flag
    const flagKey = deletedFlag.key;
    const keysToDelete = await redisClient.keys(`flag:${flagKey}:*`);
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
    }

    // Log this action
    await pool.query(
      `INSERT INTO audit_logs (flag_id, action, changed_by, changes)
       VALUES ($1, $2, $3, $4)`,
      [null, 'delete', req.user.id, JSON.stringify(deletedFlag)]
    );

    res.json({ message: 'Flag deleted successfully', flag: deletedFlag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

module.exports = router;