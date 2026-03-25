import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function PastWorkoutsPage() {
  const { coach } = useAuth();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Load clubs on mount
  useEffect(() => {
    api.clubs.mine().then(data => {
      setClubs(data);
      if (data.length) setSelectedClub(data[0].id);
    });
  }, []);

  // Load workouts when club changes
  useEffect(() => {
    if (!selectedClub) return;
    setLoading(true);
    api.workouts.list({ club_id: selectedClub }).then(data => {
      const today = new Date().toISOString().split('T')[0];
      const past = data
        .filter(w => w.date <= today)
        .sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          const TIME_ORDER = ['AM', 'Noon', 'PM', 'Evening'];
          return TIME_ORDER.indexOf(b.time_of_day) - TIME_ORDER.indexOf(a.time_of_day);
        });
      setWorkouts(past);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedClub]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this workout?')) return;
    setDeletingId(id);
    try {
      await api.workouts.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-blue-900 text-white">
      {/* Header */}
      <header className="bg-blue-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-blue-300 hover:text-white">← Back</button>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">📅</span>
          <div>
            <h1 className="text-xl font-bold">Past Workouts</h1>
            <p className="text-blue-300 text-sm">Coach {coach?.first_name} {coach?.last_name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Club selector */}
        {clubs.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {clubs.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClub(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedClub === c.id
                    ? 'bg-white text-blue-900 font-semibold'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Workout list */}
        {loading ? (
          <p className="text-blue-300">Loading...</p>
        ) : workouts.length === 0 ? (
          <div className="bg-blue-800 rounded-xl p-6 text-center text-blue-300">
            <p>No past workouts for this club.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map(w => (
              <div key={w.id} className="bg-blue-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{formatDate(w.date)}</p>
                  <p className="text-blue-300 text-sm">{w.time_of_day} Practice</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Live screen — new tab */}
                  <a
                    href={`${window.location.origin}/live/${w.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium"
                    title="Open Live Screen"
                  >
                    📺 Live
                  </a>
                  {/* Edit */}
                  <button
                    onClick={() => navigate(`/workouts/${w.id}/edit`)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium"
                  >
                    ✏️ Edit
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(w.id)}
                    disabled={deletingId === w.id}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {deletingId === w.id ? '…' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
