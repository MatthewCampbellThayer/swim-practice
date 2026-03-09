import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AttendancePage() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [swimmers, setSwimmers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guest, setGuest] = useState({ first_name: '', last_name: '' });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.workouts.list({ date: today }).then(setWorkouts);
  }, []);

  useEffect(() => {
    if (!selectedWorkout) return;
    setLoading(true);
    api.attendance.list(selectedWorkout.id)
      .then(setSwimmers)
      .finally(() => setLoading(false));
  }, [selectedWorkout]);

  async function toggle(swimmer) {
    const newVal = !swimmer.attended;
    setSwimmers(prev => prev.map(s => s.id === swimmer.id ? { ...s, attended: newVal } : s));
    await api.attendance.toggle(selectedWorkout.id, swimmer.id, newVal);
  }

  async function addGuest() {
    if (!guest.first_name || !guest.last_name) return;
    const s = await api.swimmers.addGuest({ ...guest, club_id: selectedWorkout.club_id });
    await api.attendance.toggle(selectedWorkout.id, s.id, true);
    setSwimmers(prev => [...prev, { ...s, attended: true }].sort((a, b) =>
      a.last_name.localeCompare(b.last_name)));
    setGuest({ first_name: '', last_name: '' });
    setShowAddGuest(false);
  }

  // Letters that have swimmers
  const activeLetters = useMemo(() =>
    new Set(swimmers.map(s => s.last_name[0]?.toUpperCase())), [swimmers]);

  const filtered = useMemo(() => {
    let list = swimmers;
    if (filter) list = list.filter(s => s.last_name[0]?.toUpperCase() === filter);
    return list;
  }, [swimmers, filter]);

  const attended = swimmers.filter(s => s.attended).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-300 hover:text-white">← Back</button>
        <h1 className="text-xl font-bold flex-1">Attendance</h1>
        {selectedWorkout && (
          <span className="text-blue-300 text-sm">{attended} / {swimmers.length} present</span>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Workout selector */}
        {!selectedWorkout ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Select today's workout:</h2>
            {workouts.length === 0 ? (
              <p className="text-gray-500">No workouts found for today.</p>
            ) : (
              workouts.map(w => (
                <button key={w.id} onClick={() => setSelectedWorkout(w)}
                  className="w-full bg-white border rounded-xl p-4 text-left mb-2 hover:bg-blue-50 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-semibold text-gray-800">{w.club?.name}</div>
                    <div className="text-gray-500 text-sm">{w.time_of_day} Practice</div>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Workout header */}
            <div className="bg-blue-900 text-white rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="font-bold">{selectedWorkout.club?.name} — {selectedWorkout.time_of_day}</div>
                <div className="text-blue-300 text-sm">{today}</div>
              </div>
              <button onClick={() => setSelectedWorkout(null)} className="text-blue-300 text-sm hover:text-white">Change</button>
            </div>

            {/* Alphabet jump */}
            <div className="flex flex-wrap gap-1 justify-center">
              <button onClick={() => setFilter('')}
                className={`w-8 h-8 text-xs rounded font-semibold ${filter === '' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
                All
              </button>
              {ALPHABET.map(l => (
                <button key={l} onClick={() => setFilter(filter === l ? '' : l)}
                  disabled={!activeLetters.has(l)}
                  className={`w-8 h-8 text-xs rounded font-semibold ${
                    filter === l ? 'bg-blue-700 text-white' :
                    activeLetters.has(l) ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-100 text-gray-300'
                  }`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Attendance stats */}
            <div className="flex gap-2">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{attended}</div>
                <div className="text-xs text-green-600">Present</div>
              </div>
              <div className="flex-1 bg-gray-50 border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-500">{swimmers.length - attended}</div>
                <div className="text-xs text-gray-400">Absent</div>
              </div>
            </div>

            {/* Swimmer list */}
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading swimmers...</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {filtered.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => toggle(s)}
                    className={`w-full flex items-center px-4 py-3 border-b last:border-0 transition-colors ${
                      s.attended ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                      s.attended ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {s.attended ? '✓' : i + 1}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-800">{s.last_name}, {s.first_name}</div>
                    </div>
                    {s.attended && <span className="text-green-600 text-sm font-medium">Present</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Add guest */}
            {showAddGuest ? (
              <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                <h3 className="font-semibold text-gray-700">Add Guest / New Swimmer</h3>
                <div className="flex gap-2">
                  <input value={guest.first_name} onChange={e => setGuest(g => ({ ...g, first_name: e.target.value }))}
                    placeholder="First name" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={guest.last_name} onChange={e => setGuest(g => ({ ...g, last_name: e.target.value }))}
                    placeholder="Last name" className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addGuest} className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold">Add & Mark Present</button>
                  <button onClick={() => setShowAddGuest(false)} className="px-4 text-gray-500 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddGuest(true)}
                className="w-full border-2 border-dashed border-gray-300 text-gray-500 rounded-xl py-3 text-sm hover:border-blue-400 hover:text-blue-500">
                + Add Guest / New Swimmer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
