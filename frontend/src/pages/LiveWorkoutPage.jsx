import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatLine } from '../lib/workoutParser';

function sectionYards(section) {
  return (section.parsed_json || [])
    .filter(l => l.type === 'set')
    .reduce((sum, l) => sum + l.totalYards, 0);
}

// Segmented distance bar — each section is a proportional block
function DistanceBar({ sections, activeIdx, t }) {
  const total = sections.reduce((s, sec) => s + sectionYards(sec), 0);
  if (!total) return null;
  return (
    <div className="flex gap-0.5 h-2 w-full rounded-full overflow-hidden">
      {sections.map((sec, i) => {
        const pct = (sectionYards(sec) / total) * 100;
        return (
          <div key={sec.id} style={{ width: `${pct}%` }}
            className={`h-full transition-all duration-500 ${
              i < activeIdx ? t.barDone : i === activeIdx ? t.barActive : t.barUpcoming
            }`}
          />
        );
      })}
    </div>
  );
}

function YardageStrip({ sections, activeIdx, t }) {
  const total = sections.reduce((s, sec) => s + sectionYards(sec), 0);
  const done = sections.slice(0, activeIdx).reduce((s, sec) => s + sectionYards(sec), 0);
  const current = activeIdx < sections.length ? sectionYards(sections[activeIdx]) : 0;
  const remaining = total - done - current;

  return (
    <div className={`flex items-stretch divide-x ${t.scoreWrap} text-center`}>
      <div className="flex-1 py-2 px-3">
        <div className={`${t.scoreDone.val} font-black text-2xl leading-none`}>{done.toLocaleString()}</div>
        <div className={`${t.scoreDone.label} text-xs mt-0.5 uppercase tracking-widest`}>Done</div>
      </div>
      <div className={`flex-1 py-2 px-3 ${t.scoreCurrent.bg}`}>
        <div className={`${t.scoreCurrent.val} font-black text-2xl leading-none`}>{current.toLocaleString()}</div>
        <div className={`${t.scoreCurrent.label} text-xs mt-0.5 uppercase tracking-widest`}>This Set</div>
      </div>
      <div className="flex-1 py-2 px-3">
        <div className={`${t.scoreLeft.val} font-black text-2xl leading-none`}>{remaining.toLocaleString()}</div>
        <div className={`${t.scoreLeft.label} text-xs mt-0.5 uppercase tracking-widest`}>Left</div>
      </div>
      <div className="flex-1 py-2 px-3">
        <div className={`${t.scoreTotal.val} font-black text-2xl leading-none`}>{total.toLocaleString()}</div>
        <div className={`${t.scoreTotal.label} text-xs mt-0.5 uppercase tracking-widest`}>Total</div>
      </div>
    </div>
  );
}

export default function LiveWorkoutPage() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');
  const [projector, setProjector] = useState(false);

  useEffect(() => {
    api.workouts.get(id)
      .then(w => {
        setWorkout(w);
        if (w.sections?.length) setSections(w.sections);
      })
      .catch(() => setError('Workout not found.'));
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center text-white text-3xl">{error}</div>
  );
  if (!workout) return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center text-white text-3xl animate-pulse">Loading…</div>
  );

  const section = sections[activeIdx];

  // Theme tokens — swap everything here
  const t = projector ? {
    page:        'bg-black',
    topBar:      'bg-black border-b border-yellow-900',
    meta:        'text-yellow-600',
    barDone:     'bg-yellow-400',
    barActive:   'bg-yellow-300',
    barUpcoming: 'bg-gray-800',
    scoreWrap:   'border-gray-800',
    scoreDone:   { val: 'text-yellow-300', label: 'text-yellow-700' },
    scoreCurrent:{ bg: 'bg-gray-900', val: 'text-yellow-200', label: 'text-yellow-600' },
    scoreLeft:   { val: 'text-gray-400', label: 'text-gray-700' },
    scoreTotal:  { val: 'text-gray-300', label: 'text-gray-700' },
    tabs:        'border-gray-900',
    tabActive:   'border-yellow-400 text-yellow-300',
    tabInactive: 'border-transparent text-gray-600 hover:text-gray-400',
    tabYards:    { active: 'text-yellow-700', inactive: 'text-gray-700' },
    lines:       '',
    rowBorder:   'border-gray-900',
    setNum:      'text-yellow-300',
    setMult:     'text-gray-600',
    setStroke:   'text-yellow-100',
    setMod:      'text-yellow-600',
    setYards:    'text-gray-700',
    textLine:    'text-gray-500 border-gray-900',
    nav:         'bg-black border-gray-900',
    navBtn:      'bg-gray-900 hover:bg-gray-800',
  } : {
    page:        'bg-blue-950',
    topBar:      'bg-blue-900',
    meta:        'text-blue-400',
    barDone:     'bg-green-400',
    barActive:   'bg-white',
    barUpcoming: 'bg-blue-600',
    scoreWrap:   'border-blue-700',
    scoreDone:   { val: 'text-green-400', label: 'text-blue-400' },
    scoreCurrent:{ bg: 'bg-blue-700', val: 'text-white', label: 'text-blue-300' },
    scoreLeft:   { val: 'text-blue-300', label: 'text-blue-500' },
    scoreTotal:  { val: 'text-blue-200', label: 'text-blue-500' },
    tabs:        'border-blue-800',
    tabActive:   'border-white text-white',
    tabInactive: 'border-transparent text-blue-500 hover:text-blue-300',
    tabYards:    { active: 'text-blue-300', inactive: 'text-blue-600' },
    lines:       '',
    rowBorder:   'border-blue-800/40',
    setNum:      'text-white',
    setMult:     'text-blue-500',
    setStroke:   'text-blue-200',
    setMod:      'text-blue-400',
    setYards:    'text-blue-600',
    textLine:    'text-blue-400 border-blue-800/40',
    nav:         'bg-blue-900 border-blue-800',
    navBtn:      'bg-blue-800 hover:bg-blue-700',
  };

  return (
    <div className={`h-screen ${t.page} text-white flex flex-col overflow-hidden select-none`}>

      {/* ── Top chrome ── */}
      <div className={`shrink-0 ${t.topBar}`}>
        {/* Club / date + projector toggle */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className={`${t.meta} text-sm font-medium tracking-wide`}>
            {workout.club?.name} · {workout.date} · {workout.time_of_day}
          </span>
          <div className="flex items-center gap-3">
            <span className={`${t.meta} text-sm`}>{activeIdx + 1} / {sections.length}</span>
            <button
              onClick={() => setProjector(p => !p)}
              title="Toggle projector mode"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                projector
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-transparent text-blue-400 border-blue-700 hover:border-blue-500'
              }`}
            >
              {projector ? '☀ PROJECTOR' : '☀'}
            </button>
          </div>
        </div>

        {/* Segmented distance bar */}
        <div className="px-5 pb-2">
          <DistanceBar sections={sections} activeIdx={activeIdx} t={t} />
        </div>

        {/* Yardage scoreboard */}
        <div className={`border-t ${t.scoreWrap}`}>
          <YardageStrip sections={sections} activeIdx={activeIdx} t={t} />
        </div>

        {/* Section tabs */}
        <div className={`flex overflow-x-auto border-t ${t.tabs}`} style={{ scrollbarWidth: 'none' }}>
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`px-5 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                i === activeIdx ? t.tabActive : t.tabInactive
              }`}
            >
              {s.name}
              {sectionYards(s) > 0 && (
                <span className={`ml-1.5 text-xs ${i === activeIdx ? t.tabYards.active : t.tabYards.inactive}`}>
                  {sectionYards(s)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Workout lines — the main event ── */}
      <div className="flex-1 overflow-y-auto px-6 py-1">
        {section && (section.parsed_json || []).map((line, i) => {
          if (line.type === 'spacer') return <div key={i} className="h-2" />;
          if (line.type === 'text') return (
            <div key={i} className={`${t.textLine} text-2xl italic py-1 border-b`}>{line.raw}</div>
          );
          return (
            <div key={i} className={`flex items-baseline gap-5 py-2 border-b ${t.rowBorder}`}>
              <div className={`font-black ${t.setNum} leading-none shrink-0`}
                style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}>
                {line.reps} <span className={t.setMult}>×</span> {line.distance}
              </div>
              <div className="flex items-baseline gap-3 min-w-0">
                <span className={`font-bold ${t.setStroke} leading-none`}
                  style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)' }}>
                  {line.stroke}
                </span>
                {line.modifier && (
                  <span className={`font-semibold ${t.setMod} leading-none`}
                    style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}>
                    {line.modifier}
                  </span>
                )}
              </div>
              <span className={`ml-auto ${t.setYards} font-semibold shrink-0`}
                style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)' }}>
                {line.totalYards}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Navigation ── */}
      <div className={`shrink-0 flex gap-2 px-4 py-3 border-t ${t.nav}`}>
        <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          className={`flex-1 py-4 ${t.navBtn} rounded-2xl font-black text-2xl disabled:opacity-20 active:scale-95 transition-all`}>
          ←
        </button>
        <button onClick={() => setActiveIdx(i => Math.min(sections.length - 1, i + 1))}
          disabled={activeIdx === sections.length - 1}
          className={`flex-1 py-4 ${t.navBtn} rounded-2xl font-black text-2xl disabled:opacity-20 active:scale-95 transition-all`}>
          →
        </button>
      </div>
    </div>
  );
}
