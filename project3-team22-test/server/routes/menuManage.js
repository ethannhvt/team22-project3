const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/menu/items — full menu list for manager table
// (reuse existing GET /api/menu for the list)

// POST /api/menu — add new menu item + recipe + ingredients
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, category, price, ingredients } = req.body;
    await client.query('BEGIN');
    
    const idRes = await client.query("SELECT COALESCE(MAX(menu_item_id),0)+1 AS next_id FROM menu");
    const nextId = idRes.rows[0].next_id;
    
    await client.query(
      'INSERT INTO menu (menu_item_id, item_name, category, price, cost_basis, active_flag) VALUES ($1,$2,$3,$4,0,true)',
      [nextId, name, category, price]
    );

    const recIdRes = await client.query("SELECT COALESCE(MAX(recipe_id),0)+1 AS next_id FROM recipe");
    const recId = recIdRes.rows[0].next_id;
    
    await client.query('INSERT INTO recipe (recipe_id, menu_item_id, notes) VALUES ($1,$2,$3)', [recId, nextId, 'Standard prep']);

    // Handle Ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        let invId = ing.inventoryId;
        
        // If it's a completely new ingredient, create it in inventory first
        if (ing.isNew) {
          const invIdRes = await client.query("SELECT COALESCE(MAX(inventory_item_id),0)+1 AS next_id FROM inventory");
          invId = invIdRes.rows[0].next_id;
          
          await client.query(
            'INSERT INTO inventory (inventory_item_id, item_name, current_quantity, minimum_amount, unit, last_updated) VALUES ($1,$2,0,0,$3,NOW())',
            [invId, ing.name, ing.unit]
          );
        }

        // Link recipe to inventory
        await client.query(
          'INSERT INTO recipe_ingredient (recipe_id, inventory_item_id, amount_required, unit) VALUES ($1,$2,$3,$4)',
          [recId, invId, ing.amount, ing.unit]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, menuItemId: nextId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// PATCH /api/menu/:id — update price
router.patch('/:id', async (req, res) => {
  const { price } = req.body;
  try {
    await pool.query('UPDATE menu SET price = $1 WHERE menu_item_id = $2', [price, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/menu/:id — cascade delete recipe_ingredient, recipe, order_items, menu
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  const id = req.params.id;
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM recipe_ingredient WHERE recipe_id IN (SELECT recipe_id FROM recipe WHERE menu_item_id=$1)', [id]);
    await client.query('DELETE FROM recipe WHERE menu_item_id=$1', [id]);
    await client.query('DELETE FROM order_items WHERE menu_item_id=$1', [id]);
    await client.query('DELETE FROM menu WHERE menu_item_id=$1', [id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

module.exports = router;
