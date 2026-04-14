require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        phone_number VARCHAR(20) PRIMARY KEY,
        points INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ customers table created!');

    await pool.query(`
      ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20)
    `);
    console.log('✅ Order.customer_phone column added!');

    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e.message);
    process.exit(1);
  }
}

migrate();
