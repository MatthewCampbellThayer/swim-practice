import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth, requireSuperuser } from '../middleware/auth.js';

const router = Router();

// GET /coaches (superuser)
router.get('/', requireAuth, requireSuperuser, async (req, res) => {
  const { data, error } = await supabase
    .from('coaches')
    .select('*, coach_clubs(club_id, club:clubs(id, name))')
    .order('last_name');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// POST /coaches (superuser)
router.post('/', requireAuth, requireSuperuser, async (req, res) => {
  const { first_name, last_name, email, cell, is_superuser, club_ids = [] } = req.body;
  const normalized = cell.replace(/\D/g, '');
  const { data: coach, error } = await supabase
    .from('coaches')
    .insert({ first_name, last_name, email, cell: normalized, is_superuser: !!is_superuser })
    .select().single();
  if (error) return res.status(500).json({ error });

  if (club_ids.length) {
    await supabase.from('coach_clubs').insert(club_ids.map(club_id => ({ coach_id: coach.id, club_id })));
  }
  res.json(coach);
});

// PUT /coaches/:id (superuser)
router.put('/:id', requireAuth, requireSuperuser, async (req, res) => {
  const { first_name, last_name, email, cell, is_superuser, club_ids } = req.body;
  const updates = { first_name, last_name, email, is_superuser: !!is_superuser };
  if (cell) updates.cell = cell.replace(/\D/g, '');

  const { data: coach, error } = await supabase
    .from('coaches').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error });

  if (club_ids !== undefined) {
    await supabase.from('coach_clubs').delete().eq('coach_id', req.params.id);
    if (club_ids.length) {
      await supabase.from('coach_clubs').insert(club_ids.map(club_id => ({ coach_id: req.params.id, club_id })));
    }
  }
  res.json(coach);
});

// DELETE /coaches/:id (superuser)
router.delete('/:id', requireAuth, requireSuperuser, async (req, res) => {
  await supabase.from('coaches').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

export default router;
