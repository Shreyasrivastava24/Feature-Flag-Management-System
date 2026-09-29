const redisClient = require('../config/redis');
const crypto = require('crypto');
const express = require('express');
const pool = require('../config/db');
const { apiKeyMiddleware } = require('../middleware/apiKey');

const router = express.Router();

function isUserInRollout(userId, flagKey, percentage) {
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${flagKey}`)
    .digest('hex');

  const num = parseInt(hash.substring(0, 8), 16);
  const bucket = num % 100;

  return bucket < percentage;
}

router.get('/:key', apiKeyMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.query.distinctId;

    if (!userId) {
      return res.status(400).json({
        error: 'distinctId is required',
      });
    }

    const cacheKey = `flag:${key}:user:${userId}`;

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return res.json({
        ...JSON.parse(cached),
        source: 'cache',
      });
    }

    const flagResult = await pool.query(
      'SELECT * FROM flags WHERE key = $1',
      [key]
    );

    const flag = flagResult.rows[0];

    if (!flag) {
      return res.status(404).json({
        error: 'Flag not found',
      });
    }

    let response;

    if (!flag.is_enabled) {
      response = {
        enabled: false,
        reason: 'flag disabled globally',
      };
    } else {
      const inRollout = isUserInRollout(
        userId,
        flag.key,
        flag.rollout_percentage
      );

      response = inRollout
        ? {
            enabled: true,
            reason: 'within rollout percentage (consistent)',
          }
        : {
            enabled: false,
            reason: 'outside rollout percentage (consistent)',
          };
    }

    await redisClient.setEx(
      cacheKey,
      300,
      JSON.stringify(response)
    );

    res.json({
      ...response,
      source: 'database',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Server error, try again later',
    });
  }
});

module.exports = router;