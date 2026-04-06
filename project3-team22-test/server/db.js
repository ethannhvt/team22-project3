const { Pool } = require('pg');
require('dotenv').config();

// Force Node.js to accept the AWS RDS self-signed certificate in production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
