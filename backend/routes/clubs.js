import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth, requireSuperuser } from '../middleware/auth.js';

const router = Router();

// GET /clubs — clubs for logged-in coach
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('coach_clubs')
    .select('club:clubs(*)')
    .eq('coach_id', req.coach.id);
  if (error) return res.status(500).json({ error });
  res.json(data.map(r => r.club));
});

// GET /clubs/all — all clubs (superuser)
router.get('/all', requireAuth, requireSuperuser, async (req, res) => {
  const { data, error } = await supabase.from('clubs').select('*').order('name');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /clubs (superuser)
router.post('/', requireAuth, requireSuperuser, async (req, res) => {
  const { name, zipcode } = req.body;
  const { data, error } = await supabase.from('clubs').insert({ name, zipcode }).select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// PUT /clubs/:id (superuser)
router.put('/:id', requireAuth, requireSuperuser, async (req, res) => {
  const { name, zipcode } = req.body;
  const { data, error } = await supabase.from('clubs').update({ name, zipcode }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// DELETE /clubs/:id (superuser)
router.delete('/:id', requireAuth, requireSuperuser, async (req, res) => {
  await supabase.from('clubs').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

export default router;
