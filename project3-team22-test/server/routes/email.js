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

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('[Email] Gmail credentials not configured — email skipped.');
    return res.json({ success: true, warning: 'Email not configured, skipped.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // Wait 5 seconds (simulate preparation time — change to 300000 for 5 real minutes)
  const DELAY_MS = 5000;

  console.log(`[Email] Scheduled order-ready notification for order #${orderId} → ${email} in ${DELAY_MS / 1000}s`);

  // Respond immediately so the customer doesn't wait
  res.json({ success: true, message: 'Email notification scheduled' });

  setTimeout(async () => {
    try {
      await transporter.sendMail({
        from: `"Dragon Boba 🐉" <${gmailUser}>`,
        to: email,
        subject: `Your Dragon Boba order #${orderId} is ready! 🐉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #FFF8F0; border-radius: 16px;">
            <h1 style="color: #4A154B; font-size: 28px; margin-bottom: 8px;">🐉 Dragon Boba</h1>
            <hr style="border: none; border-top: 2px solid #D4A847; margin-bottom: 24px;" />

            <div style="background: #fff; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
              <h2 style="color: #27AE60; font-size: 24px; margin-bottom: 8px;">Your order is ready!</h2>
              <p style="color: #444; font-size: 18px; margin-bottom: 4px;">Order <strong style="color: #4A154B;">#${orderId}</strong></p>
              ${total ? `<p style="color: #888; font-size: 16px;">Total: <strong>$${total}</strong></p>` : ''}
            </div>

            <p style="color: #888; font-size: 14px; text-align: center; margin-top: 24px;">
              Please proceed to the counter to pick up your order. Thank you for choosing Dragon Boba! 🧋
            </p>
          </div>
        `,
      });
      console.log(`[Email] Successfully sent order-ready email to ${email} for order #${orderId}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send to ${email}:`, err.message);
    }
  }, DELAY_MS);
});

module.exports = router;
