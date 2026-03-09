import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /workouts?club_id=...&date=... — workouts for coach's clubs
router.get('/', requireAuth, async (req, res) => {
  const { club_id, date } = req.query;

  // Get coach's clubs
  const { data: coachClubs } = await supabase
    .from('coach_clubs').select('club_id').eq('coach_id', req.coach.id);
  const clubIds = coachClubs.map(r => r.club_id);

  let query = supabase
    .from('workouts')
    .select('*, club:clubs(id,name), sections:workout_sections(*)')
    .in('club_id', club_ids ?? clubIds)
    .order('created_at');

  if (club_id) query = query.eq('club_id', club_id);
  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// GET /workouts/:id — public (for QR code live page)
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, club:clubs(id,name), sections:workout_sections(*)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Workout not found' });
  // Sort sections by order_index
  data.sections = data.sections.sort((a, b) => a.order_index - b.order_index);
  res.json(data);
});

// POST /workouts
router.post('/', requireAuth, async (req, res) => {
  const { club_id, date, time_of_day, sections } = req.body;
  const { data: workout, error } = await supabase
    .from('workouts')
    .insert({ club_id, date, time_of_day, coach_id: req.coach.id })
    .select().single();
  if (error) return res.status(500).json({ error });

  if (sections?.length) {
    const sectionRows = sections.map((s, i) => ({
      workout_id: workout.id,
      name: s.name,
      order_index: i,
      raw_text: s.raw_text,
      parsed_json: s.parsed_json,
    }));
    await supabase.from('workout_sections').insert(sectionRows);
  }

  res.json(workout);
});

// PUT /workouts/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { club_id, date, time_of_day, sections } = req.body;
  const { data: workout, error } = await supabase
    .from('workouts')
    .update({ club_id, date, time_of_day })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error });

  // Replace sections
  await supabase.from('workout_sections').delete().eq('workout_id', req.params.id);
  if (sections?.length) {
    const sectionRows = sections.map((s, i) => ({
      workout_id: workout.id,
      name: s.name,
      order_index: i,
      raw_text: s.raw_text,
      parsed_json: s.parsed_json,
    }));
    await supabase.from('workout_sections').insert(sectionRows);
  }

  res.json(workout);
});

// DELETE /workouts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await supabase.from('workouts').delete().eq('id', req.params.id);
  res.json({ ok: true });
});

export default router;
