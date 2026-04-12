const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/email/notify
// Body: { email: string, orderId: number, total: string }
router.post('/notify', (req, res) => {
  const { email, orderId, total } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.warn('[Email] GMAIL_USER or GMAIL_PASS not configured — email/sms skipped.');
    return res.json({ success: true, warning: 'Email not configured, skipped.' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });

  try {
    const mailOptions = {
      from: `"Dragon Boba" <${user}>`,
      to: email,
      subject: `Order #${orderId} is ready!`,
      text: `Your Dragon Boba order #${orderId} is ready for pickup! Total: $${total}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email-to-SMS] Successfully sent message to ${email} for order #${orderId}. ID: ${info.messageId}`);
    res.json({ success: true, message: 'SMS notification sent successfully' });
  } catch (err) {
    console.error(`[Email Error] Unexpected error sending to ${email}:`, err.message);
    res.status(500).json({ success: false, error: 'Failed to send SMS notification', details: err.message });
  }
});

module.exports = router;
