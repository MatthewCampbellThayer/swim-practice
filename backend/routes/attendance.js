import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /attendance/:workout_id — get attendance for a workout
router.get('/:workout_id', requireAuth, async (req, res) => {
  // Get all swimmers for this workout's club
  const { data: workout } = await supabase
    .from('workouts').select('club_id').eq('id', req.params.workout_id).single();

  const { data: swimmers } = await supabase
    .from('swimmers').select('*').eq('club_id', workout.club_id).order('last_name').order('first_name');

  const { data: attendance } = await supabase
    .from('attendance').select('*').eq('workout_id', req.params.workout_id);

  const attendanceMap = Object.fromEntries((attendance || []).map(a => [a.swimmer_id, a.attended]));

  const result = swimmers.map(s => ({
    ...s,
    attended: attendanceMap[s.id] ?? false,
  }));

  res.json(result);
});

// POST /attendance/:workout_id/toggle — toggle a swimmer's attendance
router.post('/:workout_id/toggle', requireAuth, async (req, res) => {
  const { swimmer_id, attended } = req.body;
  const { workout_id } = req.params;

  await supabase.from('attendance').upsert(
    { workout_id, swimmer_id, attended },
    { onConflict: 'workout_id,swimmer_id' }
  );

  res.json({ ok: true });
});

// GET /attendance/swimmer/:swimmer_id/stats — cumulative stats
router.get('/swimmer/:swimmer_id/stats', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('attendance')
    .select('attended, workout:workouts(date, time_of_day, club:clubs(name))')
    .eq('swimmer_id', req.params.swimmer_id)
    .order('created_at', { ascending: false });

  const total = data?.length ?? 0;
  const attended = data?.filter(r => r.attended).length ?? 0;

  res.json({ total, attended, rate: total ? Math.round((attended / total) * 100) : 0, history: data });
});

export default router;
