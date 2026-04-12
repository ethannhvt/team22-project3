const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from the deployed frontend (set CLIENT_URL in Render env vars)
// Falls back to localhost for local development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost for local development
    if (origin.startsWith('http://localhost')) return callback(null, true);
    // Allow any Render.com subdomain (covers preview + production deployments)
    if (origin.endsWith('.onrender.com')) return callback(null, true);
    // Allow the explicitly configured CLIENT_URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    console.warn(`CORS blocked: ${origin}`);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/menu', require('./routes/menu'));
app.use('/api/menu', require('./routes/menuManage'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/translate', require('./routes/translate'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`🐉 Dragon Boba API running on http://localhost:${PORT}`));
