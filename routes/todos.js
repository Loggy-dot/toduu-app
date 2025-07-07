const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all todos for the authenticated user
router.get('/', (req, res) => {
  const db = getDB();
  const { filter } = req.query; // all, active, completed

  let query = 'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC';
  const params = [req.user.userId];

  if (filter === 'active') {
    query = 'SELECT * FROM todos WHERE user_id = ? AND completed = 0 ORDER BY created_at DESC';
  } else if (filter === 'completed') {
    query = 'SELECT * FROM todos WHERE user_id = ? AND completed = 1 ORDER BY created_at DESC';
  }

  db.all(query, params, (err, todos) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Convert completed from 0/1 to boolean
    const formattedTodos = todos.map(todo => ({
      ...todo,
      completed: Boolean(todo.completed)
    }));

    res.json(formattedTodos);
  });
});

// Create a new todo
router.post('/', [
  body('text').notEmpty().withMessage('Todo text is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('due_date').optional().isISO8601().withMessage('Due date must be a valid date')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { text, priority = 'Medium', due_date } = req.body;
  const db = getDB();

  db.run(
    'INSERT INTO todos (user_id, text, priority, due_date) VALUES (?, ?, ?, ?)',
    [req.user.userId, text, priority, due_date || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create todo' });
      }

      // Return the created todo
      db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, todo) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve created todo' });
        }

        res.status(201).json({
          ...todo,
          completed: Boolean(todo.completed)
        });
      });
    }
  );
});

// Update a todo
router.put('/:id', [
  body('text').optional().notEmpty().withMessage('Todo text cannot be empty'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('due_date').optional().isISO8601().withMessage('Due date must be a valid date')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { text, completed, priority, due_date } = req.body;
  const db = getDB();

  // First check if todo exists and belongs to user
  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [id, req.user.userId], (err, todo) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (text !== undefined) {
      updates.push('text = ?');
      params.push(text);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, req.user.userId);

    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update todo' });
      }

      // Return updated todo
      db.get('SELECT * FROM todos WHERE id = ?', [id], (err, updatedTodo) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve updated todo' });
        }

        res.json({
          ...updatedTodo,
          completed: Boolean(updatedTodo.completed)
        });
      });
    });
  });
});

// Delete a todo
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete todo' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  });
});

// Delete all completed todos
router.delete('/completed/all', (req, res) => {
  const db = getDB();

  db.run('DELETE FROM todos WHERE user_id = ? AND completed = 1', [req.user.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete completed todos' });
    }

    res.json({ 
      message: 'Completed todos deleted successfully',
      deletedCount: this.changes
    });
  });
});

// Get todo statistics
router.get('/stats', (req, res) => {
  const db = getDB();

  db.all(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN priority = 'High' AND completed = 0 THEN 1 ELSE 0 END) as high_priority,
      SUM(CASE WHEN due_date IS NOT NULL AND due_date <= date('now') AND completed = 0 THEN 1 ELSE 0 END) as overdue
    FROM todos 
    WHERE user_id = ?
  `, [req.user.userId], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(stats[0]);
  });
});

module.exports = router;