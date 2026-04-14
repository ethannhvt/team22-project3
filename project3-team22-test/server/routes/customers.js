const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/customers/login
// Finds or creates a customer profile by phone number
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO customers (phone_number, points)
       VALUES ($1, 0)
       ON CONFLICT (phone_number) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [phone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Customers] Login error:', err.message);
    res.status(500).json({ error: 'Failed to log in customer.' });
  }
});

// GET /api/customers/:phone
// Returns current point balance for a customer
router.get('/:phone', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE phone_number = $1',
      [req.params.phone]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer.' });
  }
});

// PATCH /api/customers/:phone/points
// Body: { delta: number } — positive to add, negative to subtract
router.patch('/:phone/points', async (req, res) => {
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number.' });
  try {
    const result = await pool.query(
      `UPDATE customers
       SET points = GREATEST(0, points + $1), updated_at = NOW()
       WHERE phone_number = $2
       RETURNING points`,
      [delta, req.params.phone]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ points: result.rows[0].points });
  } catch (err) {
    console.error('[Customers] Points update error:', err.message);
    res.status(500).json({ error: 'Failed to update points.' });
  }
});

module.exports = router;
