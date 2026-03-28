const express = require('express');
const router = express.Router();
const pool = require('../db');

// Map addon display names to menu IDs (mirrors OrderDAO.getAddonMenuId)
function getAddonMenuId(toppingName) {
  if (!toppingName || toppingName === 'None') return -1;
  if (toppingName.includes('Boba')) return 100;
  if (toppingName.includes('Lychee Jelly')) return 101;
  if (toppingName.includes('Pudding')) return 102;
  if (toppingName.includes('Mango')) return 103;
  if (toppingName.includes('Strawberry')) return 104;
  if (toppingName.includes('Peach')) return 105;
  if (toppingName.includes('Taro')) return 106;
  return -1;
}

// POST /api/orders — submit a new order
// Body: { items: [{ menuItemId, finalPrice, sugarLevel, iceLevel, topping }], paymentMethod }
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, paymentMethod } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, i) => sum + i.finalPrice, 0);
    const tax = subtotal * 0.0825;
    const total = subtotal + tax;

    await client.query('BEGIN');

    // Get next order_id
    const orderIdResult = await client.query(
      'SELECT COALESCE(MAX(order_id), 0) + 1 AS next_id FROM "Order"'
    );
    const orderId = orderIdResult.rows[0].next_id;

    // For customer kiosk orders employee_id is NULL (self-service, no employee)
    // Using NULL instead of 0 to avoid FK violation on the Order table
    const employeeId = req.body.employeeId || null;

    // Insert into Order table
    await client.query(
      `INSERT INTO "Order" (order_id, created_at, employee_id, status, subtotal, tax, total, payment_method)
       VALUES ($1, NOW(), $2, 'Completed', $3, $4, $5, $6)`,
      [orderId, employeeId, subtotal, tax, total, paymentMethod || 'Credit']
    );

    // Get next order_item_id
    const itemIdResult = await client.query(
      'SELECT COALESCE(MAX(order_item_id), 0) + 1 AS next_id FROM order_items'
    );
    let nextItemId = itemIdResult.rows[0].next_id;

    // Insert each cart item
    for (const item of items) {
      const baseDrinkPrice = item.basePrice || item.finalPrice;

      await client.query(
        `INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, unit_price_at_sale, milk_mod, ice_mod, sweetness_mod, line_total)
         VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8)`,
        [nextItemId++, orderId, item.menuItemId, baseDrinkPrice, item.topping || 'None', item.iceLevel || 'Regular Ice', item.sugarLevel || '100%', baseDrinkPrice]
      );

      // Deduct inventory for the base drink
      await client.query(
        `UPDATE inventory SET current_quantity = current_quantity - ri.amount_required, last_updated = NOW()
         FROM recipe r
         JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id
         WHERE r.menu_item_id = $1 AND inventory.inventory_item_id = ri.inventory_item_id`,
        [item.menuItemId]
      );

      // Handle topping add-on
      if (item.topping && item.topping !== 'None') {
        const toppingMenuId = getAddonMenuId(item.topping);
        if (toppingMenuId > 0) {
          // Insert addon as separate order item
          await client.query(
            `INSERT INTO order_items (order_item_id, order_id, menu_item_id, quantity, unit_price_at_sale, line_total)
             VALUES ($1, $2, $3, 1, 0.50, 0.50)`,
            [nextItemId++, orderId, toppingMenuId]
          );
          // Deduct inventory for addon
          await client.query(
            `UPDATE inventory SET current_quantity = current_quantity - ri.amount_required, last_updated = NOW()
             FROM recipe r
             JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id
             WHERE r.menu_item_id = $1 AND inventory.inventory_item_id = ri.inventory_item_id`,
            [toppingMenuId]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, orderId, total: total.toFixed(2) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', err.message, err.detail || '');
    res.status(500).json({ error: 'Failed to submit order', detail: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
