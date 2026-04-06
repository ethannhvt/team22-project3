const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// POST /api/sms/notify
// Body: { phone: string, orderId: number }
router.post('/notify', (req, res) => {
  const { phone, orderId } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.warn('[SMS] Twilio credentials not configured — SMS skipped.');
    // Return success so the frontend doesn't crash; we just skip sending
    return res.json({ success: true, warning: 'Twilio not configured, SMS skipped.' });
  }

  try {
    const client = twilio(accountSid, authToken);

    // Normalize to E.164 format (+1XXXXXXXXXX for US 10-digit numbers)
    let formatted = phone.replace(/\D/g, '');
    if (formatted.length === 10) {
      formatted = '+1' + formatted;
    } else if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }

    // Wait 5 minutes before texting (300,000 ms).
    // Lower to 5000 for quick testing while developing.
    const DELAY_MS = 5000;

    console.log(`[SMS] Scheduling order-ready notification for order #${orderId} → ${formatted} in 5 min.`);

    setTimeout(async () => {
      try {
        await client.messages.create({
          body: `🐉 Dragon Boba: Your order #${orderId} is ready for pickup! Thank you!`,
          from: fromPhone,
          to: formatted,
        });
        console.log(`[SMS] Sent order-ready message to ${formatted} for order #${orderId}`);
      } catch (err) {
        console.error(`[SMS Error] Failed to send to ${formatted}:`, err.message);
      }
    }, DELAY_MS);

    res.json({ success: true, message: 'SMS notification scheduled' });
  } catch (err) {
    console.error('[SMS] Twilio initialization error:', err.message);
    res.status(500).json({ error: 'Failed to setup SMS service' });
  }
});

module.exports = router;
