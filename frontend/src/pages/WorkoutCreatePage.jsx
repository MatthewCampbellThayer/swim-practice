import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { parseFullWorkout, formatLine, totalYards } from '../lib/workoutParser';

const DISTANCES = [25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500];
// label parts: pre = text before key letter, key = underlined letter, suf = after
const STROKES = [
  { pre: '',   key: 'F', suf: 'ree',          code: 'f' },
  { pre: 'f',  key: 'L', suf: 'y',            code: 'l' },  // fLy
  { pre: '',   key: 'B', suf: 'ack',          code: 'b' },
  { pre: 'b',  key: 'R', suf: 'east',         code: 'R' },  // bReast
  { pre: '',   key: 'C', suf: 'hoice',        code: 'c' },
  { pre: '',   key: 'P', suf: 'ull',          code: 'p' },
  { pre: '',   key: 'K', suf: 'ick',          code: 'k' },
  { pre: '',   key: 'Z', suf: 'ombie Kick',   code: 'z' },
];
const MODIFIERS = [
  { pre: '',   key: 'S', suf: 'print',  code: 's' },  // Sprint
  { pre: '',   key: 'D', suf: 'rill',   code: 'd' },  // Drill
  { pre: 'D',  key: 'e', suf: 'scend',  code: 'desc' },
  { pre: 'A',  key: 's', suf: 'cend',   code: 'asc'  },
  { pre: 'f',  key: 'A', suf: 'st',     code: 'a'    },  // fAst
  { pre: '',   key: 'E', suf: 'asy',    code: 'e'    },
];
const TIME_OPTIONS = ['AM', 'Noon', 'PM', 'Evening'];

// Renders a button label with one underlined key letter
function KeyLabel({ pre, keyChar, suf }) {
  return <span>{pre}<span className="underline font-bold">{keyChar}</span>{suf}</span>;
}

export default function WorkoutCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [clubId, setClubId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfDay, setTimeOfDay] = useState('AM');
  const [rawText, setRawText] = useState('*Warmup\n');
  const [parsed, setParsed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [showSectionInput, setShowSectionInput] = useState(false);

  // Builder state
  const [builderReps, setBuilderReps] = useState(4);
  const [builderDist, setBuilderDist] = useState(50);
  const [builderStroke, setBuilderStroke] = useState('');
  const [builderMod, setBuilderMod] = useState('');

  useEffect(() => {
    api.clubs.mine().then(data => {
      setClubs(data);
      if (data.length) setClubId(data[0].id);
    });
  }, []);

  useEffect(() => {
    setParsed(parseFullWorkout(rawText));
  }, [rawText]);

  const insertText = useCallback((text) => {
    setRawText(prev => {
      const lines = prev.split('\n');
      const last = lines[lines.length - 1];
      if (last === '') {
        return prev + text + '\n';
      }
      return prev + '\n' + text + '\n';
    });
  }, []);

  function buildLine() {
    const stroke = builderStroke;
    const mod = builderMod;
    return `${builderReps}x${builderDist}${stroke}${mod}`;
  }

  function addBuilderLine() {
    insertText(buildLine());
  }

  function addSection() {
    if (!sectionName.trim()) return;
    insertText(`*${sectionName.trim()}`);
    setSectionName('');
    setShowSectionInput(false);
  }

  async function save() {
    if (!clubId || !date) return;
    setSaving(true);
    try {
      const sections = parsed.map(s => ({
        name: s.name,
        raw_text: rawText,
        parsed_json: s.lines,
      }));
      if (id) {
        await api.workouts.update(id, { club_id: clubId, date, time_of_day: timeOfDay, sections });
      } else {
        await api.workouts.create({ club_id: clubId, date, time_of_day: timeOfDay, sections });
      }
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    } finally { setSaving(false); }
  }

  const yards = totalYards(parsed);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-blue-300 hover:text-white">← Back</button>
        <h1 className="text-xl font-bold flex-1">{id ? 'Edit Workout' : 'Create Workout'}</h1>
        <button
          onClick={save}
          disabled={saving}
          className="bg-green-500 hover:bg-green-400 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      {/* Workout metadata */}
      <div className="bg-white border-b px-6 py-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Club</label>
          <select value={clubId} onChange={e => setClubId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
          <div className="flex gap-2">
            {TIME_OPTIONS.map(t => (
              <button key={t} onClick={() => setTimeOfDay(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${timeOfDay === t ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {yards > 0 && (
          <div className="ml-auto flex items-end">
            <span className="text-2xl font-bold text-blue-800">{yards.toLocaleString()}</span>
            <span className="text-gray-500 ml-1 mb-0.5">yards total</span>
          </div>
        )}
      </div>

      {/* Main 3-column layout */}
      <div className="flex h-[calc(100vh-160px)]">

        {/* Left: Raw input */}
        <div className="flex-1 flex flex-col border-r">
          <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Shorthand Input</span>
            <span className="text-xs text-gray-400">4x50k · *Section · 8x25Rdesc</span>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder="*Warmup&#10;4x50&#10;4x100k&#10;*Main Set&#10;8x50c fast&#10;*Cooldown&#10;4x25 easy"
            spellCheck={false}
          />
        </div>

        {/* Middle: Parsed preview */}
        <div className="flex-1 flex flex-col border-r bg-white">
          <div className="px-4 py-2 bg-gray-100 border-b">
            <span className="text-sm font-semibold text-gray-600">Translated Workout</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {parsed.map((section, si) => (
              <div key={si}>
                <div className="font-bold text-blue-800 text-sm uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">
                  {section.name}
                  {section.totalYards > 0 && (
                    <span className="ml-2 text-blue-400 font-normal normal-case tracking-normal">
                      {section.totalYards} yds
                    </span>
                  )}
                </div>
                {section.lines.map((line, li) => (
                  <div key={li} className={`py-0.5 ${line.type === 'set' ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {line.type === 'spacer' ? <span>&nbsp;</span> : formatLine(line)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Builder */}
        <div className="w-56 flex flex-col bg-gray-50">
          <div className="px-4 py-2 bg-gray-100 border-b">
            <span className="text-sm font-semibold text-gray-600">Builder</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {/* Reps */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Reps</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setBuilderReps(r => Math.max(1, r - 1))} className="w-8 h-8 bg-gray-200 rounded font-bold">−</button>
                <span className="flex-1 text-center font-bold text-lg">{builderReps}</span>
                <button onClick={() => setBuilderReps(r => r + 1)} className="w-8 h-8 bg-gray-200 rounded font-bold">+</button>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Distance</label>
              <div className="flex flex-wrap gap-1">
                {DISTANCES.map(d => (
                  <button key={d} onClick={() => setBuilderDist(d)}
                    className={`px-2 py-1 text-xs rounded ${builderDist === d ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Stroke</label>
              <div className="flex flex-wrap gap-1">
                {STROKES.map(s => (
                  <button key={s.code} onClick={() => setBuilderStroke(s.code)}
                    className={`px-2 py-1 text-xs rounded ${builderStroke === s.code ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    <KeyLabel pre={s.pre} keyChar={s.key} suf={s.suf} />
                  </button>
                ))}
              </div>
            </div>

            {/* Modifier */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Modifier</label>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setBuilderMod('')}
                  className={`px-2 py-1 text-xs rounded ${builderMod === '' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  None
                </button>
                {MODIFIERS.map(m => (
                  <button key={m.code} onClick={() => setBuilderMod(m.code)}
                    className={`px-2 py-1 text-xs rounded ${builderMod === m.code ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    <KeyLabel pre={m.pre} keyChar={m.key} suf={m.suf} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview + Add */}
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-500 mb-1">Preview</div>
              <div className="font-mono text-sm text-blue-800 font-bold">{buildLine()}</div>
            </div>

            <button onClick={addBuilderLine}
              className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-800">
              + Add Line
            </button>

            {showSectionInput ? (
              <div className="space-y-1">
                <input
                  autoFocus
                  value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSection(); if (e.key === 'Escape') setShowSectionInput(false); }}
                  placeholder="Section name..."
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  <button onClick={addSection} className="flex-1 bg-blue-700 text-white py-1.5 rounded-lg text-xs font-semibold">Add</button>
                  <button onClick={() => setShowSectionInput(false)} className="px-3 text-gray-500 text-xs">✕</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowSectionInput(true)}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg text-sm font-semibold hover:bg-gray-400">
                + Add Section
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
