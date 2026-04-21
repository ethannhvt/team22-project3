const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id FROM inventory ORDER BY inventory_item_id'
    );
    const rows = result.rows.map(r => ({
      ...r,
      current_quantity: parseFloat(r.current_quantity),
      minimum_amount: parseFloat(r.minimum_amount),
    }));
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  const { name, qty, min, unit, supplierId } = req.body;
  try {
    const idRes = await pool.query("SELECT COALESCE(MAX(inventory_item_id),0)+1 AS next_id FROM inventory");
    const nextId = idRes.rows[0].next_id;
    await pool.query(
      'INSERT INTO inventory (inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated, supplier_id) VALUES ($1,$2,$3,$4,$5,NOW(),$6)',
      [nextId, name, qty, min, unit, supplierId || null]
    );
    res.json({ success: true, inventoryId: nextId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE inventory_item_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/inventory/:id (update stock quantity)
router.patch('/:id', async (req, res) => {
  const { qty } = req.body;
  try {
    if (qty < 0) return res.status(400).json({ error: 'Quantity cannot be negative' });
    await pool.query(
      'UPDATE inventory SET current_quantity = $1, last_updated = NOW() WHERE inventory_item_id = $2',
      [qty, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
