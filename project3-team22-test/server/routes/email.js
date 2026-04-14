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

  // Support both Resend and generic NodeMailer fallbacks
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  // Let React continue instantly so UI doesn't hang
  res.json({ success: true, message: 'Email notification scheduled' });

  // Delay for 5 seconds to simulate order preparation time before sending text
  const DELAY_MS = 5000;
  console.log(`[Email] Scheduled order-ready notification for order #${orderId} → ${email} in ${DELAY_MS / 1000}s`);

  setTimeout(async () => {
    if (!gmailUser || !gmailPass) {
      console.warn('[Email] GMAIL_USER or GMAIL_PASS not configured — email dropped.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS (STARTTLS)
      requireTLS: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    try {
      await transporter.sendMail({
        from: `"Dragon Boba 🐉" <${gmailUser}>`,
        to: email,
        subject: `Your Dragon Boba order #${orderId} is ready! 🐉`,
        text: `Your order #${orderId} is ready! Total: $${total}. Please come pick it up at the counter. Thank you for choosing Dragon Boba!`,
      });
      console.log(`[Nodemailer] Successfully sent order-ready text to ${email}`);
    } catch (err) {
      console.error(`[Nodemailer Error] Failed to send to ${email}:`, err.message);
    }
  }, DELAY_MS);
});

module.exports = router;
