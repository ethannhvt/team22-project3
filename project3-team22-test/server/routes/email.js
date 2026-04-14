const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// POST /api/email/notify
// Body: { email: string, orderId: number, total: string }
router.post('/notify', (req, res) => {
  const { email, orderId, total } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  // Support both Resend and generic NodeMailer fallbacks
  const resendApiKey = process.env.RESEND_API_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  // Let React continue instantly so UI doesn't hang
  res.json({ success: true, message: 'Email notification scheduled' });

  // Delay for 5 seconds to simulate order preparation time before sending text
  const DELAY_MS = 5000;
  console.log(`[Email] Scheduled order-ready notification for order #${orderId} → ${email} in ${DELAY_MS / 1000}s`);

  setTimeout(async () => {
    // If RESEND is active via API Key
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      try {
        const { data, error } = await resend.emails.send({
          from: 'Dragon Boba <onboarding@resend.dev>',
          to: email,
          subject: `Your Dragon Boba order #${orderId} is ready! 🐉`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #FFF8F0; padding: 20px;">
              <h2>✅ Your Dragon Boba order #${orderId} is ready!</h2>
              <p>Total: $${total}</p>
            </div>
          `,
        });
        if (error) console.error(`[Resend Error] Failed to send to ${email}:`, error);
        else console.log(`[Resend] Successfully sent order-ready email to ${email}`);
      } catch (err) {
        console.error(`[Resend Catch] Unexpected error:`, err.message);
      }
      return;
    }

    // Fallback if NodeMailer GMAIL is configured instead
    if (gmailUser && gmailPass) {
      const transporter = require('nodemailer').createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        requireTLS: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        connectionTimeout: 30000,
      });

      try {
        await transporter.sendMail({
          from: `"Dragon Boba 🐉" <${gmailUser}>`,
          to: email,
          subject: `Your Dragon Boba order #${orderId} is ready! 🐉`,
          html: `
            <div style="font-family: Arial, sans-serif; background: #FFF8F0; padding: 20px;">
              <h2>✅ Your Dragon Boba order #${orderId} is ready!</h2>
              <p>Total: $${total}</p>
            </div>
          `,
        });
        console.log(`[Nodemailer] Successfully sent order-ready email to ${email}`);
      } catch (err) {
        console.error(`[Nodemailer Error] Failed to send to ${email}:`, err.message);
      }
      return;
    }

    console.warn('[Email] Neither GMAIL_USER nor RESEND_API_KEY is configured — email dropped.');
  }, DELAY_MS);
});

module.exports = router;
