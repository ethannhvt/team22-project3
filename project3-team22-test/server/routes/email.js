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
    service: 'gmail',
    auth: { user, pass }
  });

  // Wait 5 seconds before sending (change to 300000 for 5 real minutes in production)
  const DELAY_MS = 5000;

  console.log(`[Email] Scheduled order-ready notification for order #${orderId} → ${email} in ${DELAY_MS / 1000}s`);

  // Respond immediately so the customer isn't waiting
  res.json({ success: true, message: 'Email notification scheduled' });

  setTimeout(async () => {
    try {
      const mailOptions = {
        from: `"Dragon Boba" <${user}>`,
        to: email,
        subject: `Order #${orderId} is ready!`,
        // Plain text is best for routing into SMS gateways
        text: `Your Dragon Boba order #${orderId} is ready for pickup! Total: $${total}`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email-to-SMS] Successfully sent message to ${email} for order #${orderId}. ID: ${info.messageId}`);
    } catch (err) {
      console.error(`[Email Error] Unexpected error sending to ${email}:`, err.message);
    }
  }, DELAY_MS);
});

module.exports = router;
