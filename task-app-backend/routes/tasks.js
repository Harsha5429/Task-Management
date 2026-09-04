const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a user/workspace
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    let query, params;

    if (workspaceId) {
      query = `
        SELECT t.* FROM tasks t
        JOIN workspaces w ON t.workspace_id = w.id
        WHERE w.user_id = $1 AND t.workspace_id = $2
        ORDER BY t.created_at DESC
      `;
      params = [req.user.userId, workspaceId];
    } else {
      query = `
        SELECT t.* FROM tasks t
        JOIN workspaces w ON t.workspace_id = w.id
        WHERE w.user_id = $1
        ORDER BY t.created_at DESC
      `;
      params = [req.user.userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, workspaceId } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Verify workspace belongs to user
    const workspaceCheck = await pool.query(
      'SELECT id FROM workspaces WHERE id = $1 AND user_id = $2',
      [workspaceId, req.user.userId]
    );

    if (workspaceCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Workspace not found' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (workspace_id, user_id, title) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, req.user.userId, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title } = req.body;

    // Verify task belongs to user
    const taskCheck = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Task not found' });
    }

    let query = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramCount = 1;

    if (completed !== undefined) {
      query += `, completed = $${paramCount++}`;
      params.push(completed);
    }

    if (title !== undefined) {
      query += `, title = $${paramCount++}`;
      params.push(title);
    }

    query += ` WHERE id = $${paramCount++} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify task belongs to user
    const taskCheck = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Task not found' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

module.exports = router;