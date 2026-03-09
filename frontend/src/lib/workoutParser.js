// Workout shorthand parser
// Format: [reps]x[distance][stroke][modifier]
// e.g. 4x50k = 4 x 50 Kick, 8x25Rdesc = 8 x 25 bReast Descend
// *Section Name = new section
// Blank line = spacer

const STROKES = {
  k: 'Kick', K: 'Kick',
  p: 'Pull', P: 'Pull',
  c: 'Choice', C: 'Choice',
  f: 'Fly', F: 'Fly',
  b: 'Back', B: 'Back',
  R: 'bReast',
  s: 'Sprint', S: 'Sprint',
  d: 'Drill', D: 'Drill',
  z: 'Zombie Kick', Z: 'Zombie Kick',
};

const MODIFIERS = {
  desc: 'Descend', descend: 'Descend',
  asc: 'Ascend', ascend: 'Ascend',
  fast: 'Fast',
  easy: 'Easy',
};

function parseModifier(str) {
  const lower = str.toLowerCase();
  for (const [key, val] of Object.entries(MODIFIERS)) {
    if (lower.startsWith(key)) return val;
  }
  return null;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'spacer' };
  if (trimmed.startsWith('*')) return { type: 'section', name: trimmed.slice(1).trim() || 'Section' };

  // Try to match [reps]x[distance][stroke?][modifier?]
  // e.g. 4x50k, 8x25Rdesc, 2x100, 10x25 fast, 4x50pull easy
  const match = trimmed.match(/^(\d+)\s*[xX]\s*(\d+)\s*([a-zA-Z]*)(.*)$/);
  if (!match) return { type: 'text', raw: trimmed };

  const [, repsStr, distStr, strokeMod, rest] = match;
  const reps = parseInt(repsStr);
  const distance = parseInt(distStr);
  let stroke = 'Free';
  let modifier = null;
  let remaining = (strokeMod + rest).trim();

  // Try single-char stroke code first
  if (remaining.length > 0) {
    const firstChar = remaining[0];
    if (STROKES[firstChar]) {
      stroke = STROKES[firstChar];
      remaining = remaining.slice(1).trim();
    } else {
      // Try word-based stroke
      const lowerRem = remaining.toLowerCase();
      const wordStrokes = {
        'kick': 'Kick', 'pull': 'Pull', 'choice': 'Choice', 'fly': 'Fly',
        'back': 'Back', 'breast': 'bReast', 'sprint': 'Sprint',
        'drill': 'Drill', 'zombie': 'Zombie Kick', 'free': 'Free',
      };
      for (const [word, label] of Object.entries(wordStrokes)) {
        if (lowerRem.startsWith(word)) {
          stroke = label;
          remaining = remaining.slice(word.length).trim();
          break;
        }
      }
    }
  }

  // Parse modifier
  if (remaining) {
    modifier = parseModifier(remaining);
  }

  const totalYards = reps * distance;
  return { type: 'set', reps, distance, stroke, modifier, totalYards, raw: trimmed };
}

export function parseWorkoutSection(rawText) {
  if (!rawText) return [];
  return rawText.split('\n').map(parseLine);
}

export function formatLine(parsed) {
  if (parsed.type === 'spacer') return '';
  if (parsed.type === 'section') return `— ${parsed.name} —`;
  if (parsed.type === 'text') return parsed.raw;
  const { reps, distance, stroke, modifier } = parsed;
  let str = `${reps} x ${distance} ${stroke}`;
  if (modifier) str += ` ${modifier}`;
  return str;
}

export function parseFullWorkout(rawText) {
  // Split into sections by * markers, return array of {name, lines}
  const lines = rawText.split('\n');
  const sections = [];
  let currentSection = { name: 'Warmup', lines: [] };

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed.type === 'section') {
      if (currentSection.lines.length > 0 || sections.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { name: parsed.name, lines: [] };
    } else {
      currentSection.lines.push(parsed);
    }
  }
  if (currentSection.lines.some(l => l.type !== 'spacer') || sections.length === 0) {
    sections.push(currentSection);
  }

  return sections.map(s => ({
    name: s.name,
    lines: s.lines,
    totalYards: s.lines.filter(l => l.type === 'set').reduce((sum, l) => sum + l.totalYards, 0),
  }));
}

export function totalYards(sections) {
  return sections.reduce((sum, s) => sum + s.totalYards, 0);
}
