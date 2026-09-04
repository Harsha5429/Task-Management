const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all workspaces for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching workspaces' });
  }
});

// Create workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const result = await pool.query(
      'INSERT INTO workspaces (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating workspace' });
  }
});

module.exports = router;