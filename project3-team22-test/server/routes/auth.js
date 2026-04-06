const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/auth/login — validate employee ID and return role
router.post('/login', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });
  try {
    const result = await pool.query(
      'SELECT employee_id, name, role, username_email, status FROM employee WHERE employee_id = $1',
      [parseInt(employeeId)]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid Employee ID' });
    const emp = result.rows[0];
    res.json({ employeeId: emp.employee_id, name: emp.name, role: emp.role, email: emp.username_email, status: emp.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
