import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import clubRoutes from './routes/clubs.js';
import coachRoutes from './routes/coaches.js';
import swimmerRoutes from './routes/swimmers.js';
import workoutRoutes from './routes/workouts.js';
import attendanceRoutes from './routes/attendance.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/swimmers', swimmerRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SwimPractice backend running on port ${PORT}`));
