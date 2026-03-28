const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT employee_id, name, role, username_email, status FROM employee ORDER BY employee_id'
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees
router.post('/', async (req, res) => {
  const { name, role, email, status } = req.body;
  try {
    const idRes = await pool.query("SELECT COALESCE(MAX(employee_id),0)+1 AS next_id FROM employee");
    const nextId = idRes.rows[0].next_id;
    await pool.query(
      'INSERT INTO employee (employee_id, name, role, username_email, status) VALUES ($1,$2,$3,$4,$5)',
      [nextId, name, role, email, status || 'Active']
    );
    res.json({ success: true, employeeId: nextId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employee WHERE employee_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
