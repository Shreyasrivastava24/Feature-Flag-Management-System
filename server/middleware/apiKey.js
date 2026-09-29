const pool = require("../config/db");

async function apiKeyMiddleware(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        error: "API key required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM client_apps WHERE api_key = $1",
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid API key",
      });
    }

    req.clientApp = result.rows[0];

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "API key validation failed",
    });
  }
}

module.exports = { apiKeyMiddleware };