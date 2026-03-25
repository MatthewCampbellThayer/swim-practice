import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { sendSMS } from '../lib/twilio.js';

const router = Router();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/send-otp  { cell }
router.post('/send-otp', async (req, res) => {
  const { cell } = req.body;
  if (!cell) return res.status(400).json({ error: 'Cell number required' });

  const normalized = cell.replace(/\D/g, '');
  if (normalized.length < 10) return res.status(400).json({ error: 'Invalid cell number' });

  // Check coach exists
  const { data: coach } = await supabase
    .from('coaches')
    .select('id')
    .eq('cell', normalized)
    .single();

  if (!coach) return res.status(404).json({ error: 'No coach found with that number' });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await supabase.from('otp_codes').upsert({ cell: normalized, code, expires_at: expiresAt.toISOString() });

  const showCode = process.env.DEV_SHOW_OTP === 'true';
  if (!showCode) {
    await sendSMS(normalized, `Your SwimPractice code: ${code}`);
  } else {
    console.log(`[DEV] OTP for ${normalized}: ${code}`);
  }

  res.json({ ok: true, ...(showCode ? { devCode: code } : {}) });
});

// POST /auth/verify-otp  { cell, code }
router.post('/verify-otp', async (req, res) => {
  const { cell, code } = req.body;
  const normalized = cell.replace(/\D/g, '');

  const { data: otp } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('cell', normalized)
    .single();

  if (!otp || otp.code !== code) return res.status(401).json({ error: 'Invalid code' });
  if (new Date(otp.expires_at) < new Date()) return res.status(401).json({ error: 'Code expired' });

  // Delete used OTP
  await supabase.from('otp_codes').delete().eq('cell', normalized);

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, first_name, last_name, cell, is_superuser')
    .eq('cell', normalized)
    .single();

  const token = jwt.sign(
    { id: coach.id, cell: coach.cell, is_superuser: coach.is_superuser },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, coach });
});

export default router;
