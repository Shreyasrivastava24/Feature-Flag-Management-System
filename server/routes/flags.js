const redisClient = require('../config/redis');
const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();
const crypto = require('crypto');

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
// List only flags created by the current admin
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM flags WHERE created_by = $1 ORDER BY id',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Server error, try again later',
    });
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

// Check if a feature is enabled for the current user
router.get('/check/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;

    // Redis cache key for this user + feature
    const cacheKey = `flag:${key}:${req.user.id}`;

    // 1. Check Redis cache first
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      console.log('Redis Cache HIT:', cacheKey);

      return res.json(JSON.parse(cachedResult));
    }

    console.log('Redis Cache MISS:', cacheKey);

    // 2. If not in cache, get flag from PostgreSQL
    const result = await pool.query(
      'SELECT * FROM flags WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Feature flag not found',
      });
    }

    const flag = result.rows[0];

    let response;

    // Feature is disabled
    if (!flag.is_enabled) {
      response = {
        enabled: false,
        reason: 'Feature is disabled',
      };
    }

    // 0% rollout
    else if (flag.rollout_percentage === 0) {
      response = {
        enabled: false,
        reason: 'Rollout percentage is 0%',
      };
    }

    // 100% rollout
    else if (flag.rollout_percentage === 100) {
      response = {
        enabled: true,
        reason: 'Feature enabled for all users',
      };
    }

    // Percentage rollout using stable user + feature hash
    else {
      const hash = crypto
        .createHash('sha256')
        .update(`${req.user.id}-${flag.key}`)
        .digest('hex');

      const userNumber =
        parseInt(hash.substring(0, 8), 16) % 100;

      const enabled =
        userNumber < flag.rollout_percentage;

      response = {
        enabled,
        reason: `Feature rollout is ${flag.rollout_percentage}%`,
      };
    }

    // 3. Store the evaluation result in Redis
    await redisClient.set(
      cacheKey,
      JSON.stringify(response),
      {
        EX: 60
      }
    );

    console.log('Stored in Redis:', cacheKey);

    // 4. Return result
    return res.json(response);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Server error, try again later',
    });
  }
});
module.exports = router;