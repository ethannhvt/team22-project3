const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to AWS PostgreSQL database.'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = pool;
