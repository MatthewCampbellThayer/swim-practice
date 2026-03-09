import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TIME_ORDER = ['AM', 'Noon', 'PM', 'Evening'];
const today = new Date().toISOString().split('T')[0];

export default function DashboardPage() {
  const { coach, logout, isSuper } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [qrImages, setQrImages] = useState({});
  const [activeQrIdx, setActiveQrIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.workouts.list({ date: today }).then(data => {
      const sorted = data.sort((a, b) =>
        TIME_ORDER.indexOf(a.time_of_day) - TIME_ORDER.indexOf(b.time_of_day));
      setWorkouts(sorted);
      setLoading(false);
      // Generate QR codes
      sorted.forEach(async (w) => {
        const url = `${window.location.origin}/live/${w.id}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
        setQrImages(prev => ({ ...prev, [w.id]: dataUrl }));
      });
    }).catch(() => setLoading(false));
  }, []);

  const activeWorkout = workouts[activeQrIdx];

  return (
    <div className="min-h-screen bg-blue-900 text-white">
      {/* Header */}
      <header className="bg-blue-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏊</span>
          <div>
            <h1 className="text-xl font-bold">SwimPractice</h1>
            <p className="text-blue-300 text-sm">Coach {coach?.first_name} {coach?.last_name}</p>
          </div>
        </div>
        <button onClick={logout} className="text-blue-300 hover:text-white text-sm">Sign Out</button>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-8">

        {/* Today's QR Codes */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Today's Workouts — {today}</h2>
          {loading ? (
            <p className="text-blue-300">Loading...</p>
          ) : workouts.length === 0 ? (
            <div className="bg-blue-800 rounded-xl p-6 text-center text-blue-300">
              <p>No workouts scheduled for today.</p>
              <Link to="/workouts/new" className="text-white underline mt-2 inline-block">Create one →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-gray-900">
              {/* Gallery nav */}
              {workouts.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {workouts.map((w, i) => (
                    <button
                      key={w.id}
                      onClick={() => setActiveQrIdx(i)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        i === activeQrIdx ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {w.club?.name} – {w.time_of_day}
                    </button>
                  ))}
                </div>
              )}
              {activeWorkout && (
                <div className="text-center">
                  <p className="font-semibold text-lg">{activeWorkout.club?.name}</p>
                  <p className="text-gray-500 text-sm mb-4">{activeWorkout.time_of_day} Practice</p>
                  {qrImages[activeWorkout.id] ? (
                    <img src={qrImages[activeWorkout.id]} alt="QR Code" className="mx-auto rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg animate-pulse" />
                  )}
                  <p className="text-gray-400 text-xs mt-3 break-all">
                    {window.location.origin}/live/{activeWorkout.id}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Nav Links */}
        <section className="grid grid-cols-2 gap-4">
          <Link to="/workouts/new" className="bg-blue-700 hover:bg-blue-600 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">✏️</div>
            <div className="font-semibold">Create Workout</div>
          </Link>
          <Link to="/attendance" className="bg-blue-700 hover:bg-blue-600 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold">Attendance</div>
          </Link>
          {isSuper && (
            <Link to="/manage" className="bg-indigo-700 hover:bg-indigo-600 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-semibold">Club Management</div>
            </Link>
          )}
          <Link to="/workouts" className="bg-blue-700 hover:bg-blue-600 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-semibold">Past Workouts</div>
          </Link>
        </section>
      </div>
    </div>
  );
}
