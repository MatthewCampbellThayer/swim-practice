import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth, requireSuperuser } from '../middleware/auth.js';

const router = Router();

// GET /swimmers?club_id=... — swimmers for a club
router.get('/', requireAuth, async (req, res) => {
  const { club_id } = req.query;
  let query = supabase.from('swimmers').select('*').order('last_name').order('first_name');
  if (club_id) query = query.eq('club_id', club_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /swimmers (superuser)
router.post('/', requireAuth, requireSuperuser, async (req, res) => {
  const { first_name, last_name, email, cell, club_id } = req.body;
  const { data, error } = await supabase
    .from('swimmers')
    .insert({ first_name, last_name, email, cell, club_id })
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /swimmers/guest — coach can add guest/new swimmer for attendance
router.post('/guest', requireAuth, async (req, res) => {
  const { first_name, last_name, email, cell, club_id } = req.body;
  const { data, error } = await supabase
    .from('swimmers')
    .insert({ first_name, last_name, email, cell, club_id })
    .select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// PUT /swimmers/:id (superuser)
router.put('/:id', requireAuth, requireSuperuser, async (req, res) => {
  const { first_name, last_name, email, cell, club_id } = req.body;
  const { data, error } = await supabase
    .from('swimmers').update({ first_name, last_name, email, cell, club_id })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// DELETE /swimmers/:id (superuser)
router.delete('/:id', requireAuth, requireSuperuser, async (req, res) => {
  await supabase.from('swimmers').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

export default router;
