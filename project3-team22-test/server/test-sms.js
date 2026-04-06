// Quick Twilio test — run with: node test-sms.js
require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = process.env.TWILIO_PHONE_NUMBER;
const toPhone    = '+12107308130'; // your personal number

console.log('--- Twilio Config Check ---');
console.log('Account SID:', accountSid ? accountSid.slice(0, 8) + '...' : '❌ MISSING');
console.log('Auth Token: ', authToken  ? authToken.slice(0, 6)  + '...' : '❌ MISSING');
console.log('From Phone: ', fromPhone  || '❌ MISSING');
console.log('To Phone:   ', toPhone);
console.log('---------------------------');

if (!accountSid || !authToken || !fromPhone) {
  console.error('❌ Missing Twilio credentials in .env — aborting.');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log('\nSending test SMS now...');
client.messages.create({
  body: '🐉 Dragon Boba test message — Twilio is working!',
  from: fromPhone.trim(),
  to: toPhone,
}).then(msg => {
  console.log('✅ Success! Message SID:', msg.sid);
  console.log('   Status:', msg.status);
}).catch(err => {
  console.error('❌ Twilio error:', err.message);
  console.error('   Code:', err.code);
  console.error('   More info:', err.moreInfo);
});
