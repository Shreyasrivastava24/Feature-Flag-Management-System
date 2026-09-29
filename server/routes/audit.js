const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
  `SELECT audit_logs.*, users.name AS changed_by_name
   FROM audit_logs
   LEFT JOIN users ON audit_logs.changed_by = users.id
   WHERE audit_logs.changed_by = $1
   ORDER BY audit_logs.created_at DESC`,
  [req.user.id]
);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, try again later' });
  }
});

module.exports = router;