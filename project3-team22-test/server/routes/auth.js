const express = require('express');
const router = express.Router();
const pool = require('../db');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google — validate Google OAuth token
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'No credential provided' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Hardcoded master access for the assignment and testing
    const masterEmails = ['reveille.bubbletea@gmail.com', 'ethanvu0512@gmail.com'];
    if (masterEmails.includes(email)) {
      return res.json({
        employeeId: 999,
        name: email === 'ethanvu0512@gmail.com' ? 'Ethan (Admin)' : 'Master Admin',
        role: 'Manager',
        email: email,
        status: 'Active'
      });
    }

    // Lookup in database
    const result = await pool.query(
      "SELECT employee_id, name, role, username_email, status FROM employee WHERE username_email = $1 AND role = 'Manager'",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: No manager account found for this email.' });
    }

    const emp = result.rows[0];
    res.json({
      employeeId: emp.employee_id,
      name: emp.name,
      role: emp.role,
      email: emp.username_email,
      status: emp.status
    });

  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});


// POST /api/auth/login — validate employee ID and return role
router.post('/login', async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });
  try {
    const result = await pool.query(
      'SELECT employee_id, name, role, username_email, status FROM employee WHERE employee_id = $1',
      [parseInt(employeeId)]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid Employee ID' });
    const emp = result.rows[0];
    res.json({ employeeId: emp.employee_id, name: emp.name, role: emp.role, email: emp.username_email, status: emp.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
