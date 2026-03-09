import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendSMS(to, body) {
  const formatted = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
  if (!client) {
    console.log(`[SMS] To: ${formatted} | ${body}`);
    return;
  }
  await client.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to: formatted, body });
}
