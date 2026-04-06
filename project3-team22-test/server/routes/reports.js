const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT report_id, report_date, message FROM reports ORDER BY report_id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/reports
router.post('/', async (req, res) => {
  const { message } = req.body;
  try {
    const idRes = await pool.query("SELECT COALESCE(MAX(report_id),0)+1 AS next_id FROM reports");
    const nextId = idRes.rows[0].next_id;
    await pool.query('INSERT INTO reports (report_id, report_date, message) VALUES ($1, CURRENT_DATE, $2)', [nextId, message]);
    res.json({ success: true, reportId: nextId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
