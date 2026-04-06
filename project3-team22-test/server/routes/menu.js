const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/menu — all menu items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT menu_item_id, item_name, category, price FROM menu ORDER BY menu_item_id'
    );
    // pg returns DECIMAL as strings — convert to numbers for the frontend
    const items = result.rows.map(row => ({
      ...row,
      price: parseFloat(row.price),
    }));
    res.json(items);
  } catch (err) {
    console.error('Error fetching menu:', err.message);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// GET /api/menu/categories — distinct categories (excluding Add-ons)
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT category FROM menu WHERE category != 'Add-on' ORDER BY category"
    );
    const categories = result.rows.map(r => r.category);
    // Always include Seasonal
    if (!categories.includes('Seasonal')) {
      categories.push('Seasonal');
    }
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
