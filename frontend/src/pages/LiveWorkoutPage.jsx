import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatLine } from '../lib/workoutParser';

export default function LiveWorkoutPage() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api.workouts.get(id)
      .then(w => {
        setWorkout(w);
        // Parse sections from the stored raw_text of first section (all sections share raw)
        if (w.sections?.length) {
          // Sections are already split server-side via workout_sections table
          setSections(w.sections);
        }
      })
      .catch(() => setError('Workout not found.'));
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center text-white text-2xl">{error}</div>
  );
  if (!workout) return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center text-white text-2xl animate-pulse">Loading...</div>
  );

  const section = sections[activeIdx];

  return (
    <div className="min-h-screen bg-blue-900 text-white flex flex-col">
      {/* Section tabs */}
      <div className="flex overflow-x-auto bg-blue-800 border-b border-blue-700">
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-4 transition-colors ${
              i === activeIdx
                ? 'border-white text-white'
                : 'border-transparent text-blue-300 hover:text-white'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Club / workout info */}
      <div className="text-center py-4 text-blue-300 text-sm">
        {workout.club?.name} · {workout.date} · {workout.time_of_day}
      </div>

      {/* Main workout display */}
      <div className="flex-1 flex flex-col items-center justify-start p-8 max-w-3xl mx-auto w-full">
        {section && (
          <>
            <h2 className="text-3xl font-bold text-blue-200 mb-8 tracking-wide uppercase">
              {section.name}
            </h2>
            <div className="w-full space-y-2">
              {(section.parsed_json || []).map((line, i) => (
                <div
                  key={i}
                  className={`text-left py-2 border-b border-blue-800 ${
                    line.type === 'set'
                      ? 'text-4xl font-bold text-white'
                      : line.type === 'spacer'
                      ? 'py-4'
                      : 'text-2xl text-blue-200 italic'
                  }`}
                >
                  {line.type !== 'spacer' && formatLine(line)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 flex justify-between items-center bg-blue-800">
        <button
          onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          className="px-8 py-4 bg-blue-700 rounded-xl font-semibold text-lg disabled:opacity-30 hover:bg-blue-600"
        >
          ← Previous
        </button>
        <span className="text-blue-300">
          {activeIdx + 1} / {sections.length}
        </span>
        <button
          onClick={() => setActiveIdx(i => Math.min(sections.length - 1, i + 1))}
          disabled={activeIdx === sections.length - 1}
          className="px-8 py-4 bg-blue-700 rounded-xl font-semibold text-lg disabled:opacity-30 hover:bg-blue-600"
        >
          Next Section →
        </button>
      </div>
    </div>
  );
}
