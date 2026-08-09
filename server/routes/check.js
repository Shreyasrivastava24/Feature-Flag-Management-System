const crypto = require('crypto');
const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function isUserInRollout(userId, flagKey, percentage) {
  const hash = crypto.createHash('md5').update(`${userId}-${flagKey}`).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  const bucket = num % 100;
  return bucket < percentage;
}

router.get('/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Find the flag by its key
    const flagResult = await pool.query('SELECT * FROM flags WHERE key = $1', [key]);
    const flag = flagResult.rows[0];

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    // 2. If flag is globally off, no one gets it
    if (!flag.is_enabled) {
      return res.json({ enabled: false, reason: 'flag disabled globally' });
    }

    // 3. Check if this specific user has a targeting override
    const targetResult = await pool.query(
      'SELECT * FROM flag_targets WHERE flag_id = $1 AND user_id = $2',
      [flag.id, userId]
    );

    if (targetResult.rows.length > 0) {
      return res.json({
        enabled: targetResult.rows[0].is_enabled,
        reason: 'user-specific override'
      });
    }

    // 4. Check role-based rules
    const rulesResult = await pool.query(
      'SELECT * FROM flag_rules WHERE flag_id = $1',
      [flag.id]
    );

    if (rulesResult.rows.length > 0) {
      const allowedRoles = rulesResult.rows.map(rule => rule.allowed_role);
      if (!allowedRoles.includes(userRole)) {
        return res.json({ enabled: false, reason: 'role not allowed' });
      }
    }

   // 5. Percentage rollout check
   // 5. Percentage rollout check (consistent per user via hashing)
    const inRollout = isUserInRollout(userId, flag.key, flag.rollout_percentage);
    if (inRollout) {
      return res.json({ enabled: true, reason: 'within rollout percentage (consistent)' });
    }

    return res.json({ enabled: false, reason: 'outside rollout percentage (consistent)' });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

module.exports = router;