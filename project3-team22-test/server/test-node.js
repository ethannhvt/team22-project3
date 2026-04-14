require('dotenv').config();
const nodemailer = require('nodemailer');

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

console.log('User:', gmailUser);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  requireTLS: true,
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  connectionTimeout: 10000,
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: `"Dragon Boba 🐉" <${gmailUser}>`,
      to: 'ethanvu0512@gmail.com',
      subject: `Direct Test`,
      text: `Testing raw nodemailer`,
    });
    console.log('SUCCESS to GMAIL:', info.messageId);

    const info2 = await transporter.sendMail({
      from: `"Dragon Boba 🐉" <${gmailUser}>`,
      to: '2107308130@tmomail.net',
      subject: `Direct Test`,
      text: `Testing raw nodemailer to TMobile`,
    });
    console.log('SUCCESS to TMOBILE:', info2.messageId);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
run();
