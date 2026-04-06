const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/analytics/x-report — hourly breakdown for today (z_run=FALSE)
router.get('/x-report', async (req, res) => {
  try {
    const hourlySql = `
      SELECT hr, COUNT(*) AS num_orders,
        SUM(items) AS items_sold, SUM(sub) AS subtotal, SUM(tx) AS tax, SUM(rev) AS revenue
      FROM (
        SELECT EXTRACT(HOUR FROM o.created_at) AS hr,
          o.order_id, o.subtotal AS sub, o.tax AS tx, o.total AS rev,
          (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi WHERE oi.order_id = o.order_id) AS items
        FROM "Order" o
        WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE
      ) subq
      GROUP BY hr ORDER BY hr`;
    const paymentSql = `
      SELECT COALESCE(payment_method,'Cash') AS method,
        COUNT(order_id) AS num_orders, SUM(total) AS total
      FROM "Order"
      WHERE DATE(created_at) = CURRENT_DATE AND z_run = FALSE
      GROUP BY payment_method ORDER BY payment_method`;

    const [hourly, payment] = await Promise.all([
      pool.query(hourlySql).catch(() => ({ rows: [] })),
      pool.query(paymentSql).catch(() => ({ rows: [] })),
    ]);
    res.json({
      hourly: hourly.rows.map(r => ({ ...r, subtotal: parseFloat(r.subtotal), tax: parseFloat(r.tax), revenue: parseFloat(r.revenue) })),
      payment: payment.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/analytics/z-report — run end-of-day report and mark z_run=TRUE
router.post('/z-report', async (req, res) => {
  const client = await pool.connect();
  try {
    // Check if already run today
    const check = await client.query("SELECT COUNT(*) FROM \"Order\" WHERE DATE(created_at) = CURRENT_DATE AND z_run = TRUE");
    if (parseInt(check.rows[0].count) > 0) {
      return res.json({ alreadyRun: true });
    }

    const summarySql = `
      SELECT COUNT(o.order_id) AS total_orders,
        SUM(o.subtotal) AS sub, SUM(o.tax) AS t, SUM(o.total) AS rev,
        (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi
          JOIN "Order" o2 ON oi.order_id = o2.order_id
          WHERE DATE(o2.created_at) = CURRENT_DATE AND o2.z_run = FALSE) AS total_items
      FROM "Order" o WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE`;
    const paymentSql = `
      SELECT COALESCE(payment_method,'Cash') AS method, COUNT(order_id) AS num_orders, SUM(total) AS total
      FROM "Order" WHERE DATE(created_at) = CURRENT_DATE AND z_run = FALSE
      GROUP BY payment_method ORDER BY payment_method`;
    const empSql = `
      SELECT o.employee_id, COALESCE(e.name,'Unknown') AS emp_name,
        COUNT(o.order_id) AS num_orders, SUM(o.total) AS revenue
      FROM "Order" o
      LEFT JOIN employee e ON o.employee_id = e.employee_id
      WHERE DATE(o.created_at) = CURRENT_DATE AND o.z_run = FALSE
      GROUP BY o.employee_id, e.name ORDER BY o.employee_id`;

    const [summary, payment, employees] = await Promise.all([
      pool.query(summarySql),
      pool.query(paymentSql).catch(() => ({ rows: [] })),
      pool.query(empSql),
    ]);

    // Mark orders as z_run = TRUE
    await pool.query("UPDATE \"Order\" SET z_run = TRUE WHERE DATE(created_at) = CURRENT_DATE AND z_run = FALSE");

    const s = summary.rows[0];
    res.json({
      summary: {
        totalOrders: parseInt(s.total_orders),
        totalItems: parseInt(s.total_items),
        subtotal: parseFloat(s.sub),
        tax: parseFloat(s.t),
        revenue: parseFloat(s.rev),
      },
      payment: payment.rows.map(r => ({ ...r, total: parseFloat(r.total) })),
      employees: employees.rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// GET /api/analytics/sales?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/sales', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });
  try {
    const result = await pool.query(
      `SELECT m.item_name, SUM(oi.quantity) AS qty, SUM(oi.line_total) AS revenue
       FROM "Order" o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN menu m ON oi.menu_item_id = m.menu_item_id
       WHERE DATE(o.created_at) BETWEEN $1::DATE AND $2::DATE
       GROUP BY m.item_name ORDER BY revenue DESC`,
      [start, end]
    );
    res.json(result.rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/product-usage?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/product-usage', async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end dates required' });
  try {
    const result = await pool.query(
      `SELECT i.item_name, SUM(oi.quantity * ri.amount_required) AS amount_used, i.unit
       FROM "Order" o
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN recipe r ON oi.menu_item_id = r.menu_item_id
       JOIN recipe_ingredient ri ON r.recipe_id = ri.recipe_id
       JOIN inventory i ON ri.inventory_item_id = i.inventory_item_id
       WHERE DATE(o.created_at) BETWEEN $1::DATE AND $2::DATE
       GROUP BY i.item_name, i.unit ORDER BY i.item_name`,
      [start, end]
    );
    res.json(result.rows.map(r => ({ ...r, amount_used: parseFloat(r.amount_used) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/recent-orders — recent 50 transactions
router.get('/recent-orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.order_id, o.created_at, COALESCE(e.name,'Self-Service') AS employee_name,
        o.status, o.subtotal, o.tax, o.total, o.payment_method
       FROM "Order" o
       LEFT JOIN employee e ON o.employee_id = e.employee_id
       ORDER BY o.order_id DESC LIMIT 50`
    );
    res.json(result.rows.map(r => ({
      ...r, subtotal: parseFloat(r.subtotal), tax: parseFloat(r.tax), total: parseFloat(r.total),
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
