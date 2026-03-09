// Workout shorthand parser
// Format: [reps]x[distance][stroke][modifier]
// e.g. 4x50l = 4 x 50 Fly, 4x50k = 4 x 50 Kick, 8x25Rdesc = 8 x 25 bReast Descend
// *Section Name = new section
// Blank line = spacer
//
// Stroke codes (key letter underlined in UI):
//   (none) or f = Free    k = Kick     p = Pull    c = Choice
//   l = Fly               b = Back     R = bReast  s = Sprint
//   d = Drill             z = Zombie Kick
//
// Modifier codes:
//   desc/D = Descend   asc = Ascend   a/fast = Fast   e/easy = Easy

// Strokes: the 7 pure strokes
const STROKES = {
  f: 'Free',  F: 'Free',
  k: 'Kick',  K: 'Kick',
  p: 'Pull',  P: 'Pull',
  l: 'Fly',   L: 'Fly',         // fLy
  b: 'Back',  B: 'Back',
  R: 'bReast', r: 'bReast',
  c: 'Choice', C: 'Choice',
  z: 'Zombie Kick', Z: 'Zombie Kick',
};

// Modifiers: include Sprint + Drill (how you swim it) + descriptors
// Try longest word matches first to avoid prefix collisions
const MODIFIER_WORDS = [
  ['descend', 'Descend'],
  ['ascend',  'Ascend'],
  ['sprint',  'Sprint'],
  ['drill',   'Drill'],
  ['desc',    'Descend'],
  ['asc',     'Ascend'],
  ['fast',    'Fast'],
  ['easy',    'Easy'],
];
const MODIFIER_CHARS = {
  s: 'Sprint',  // Sprint
  d: 'Drill',   // Drill
  a: 'Fast',    // fAst
  e: 'Easy',    // Easy
};

function parseModifier(str) {
  const lower = str.toLowerCase().trim();
  if (!lower) return null;
  // Try word matches first (longest first)
  for (const [key, val] of MODIFIER_WORDS) {
    if (lower.startsWith(key)) return val;
  }
  // Single-char modifier
  return MODIFIER_CHARS[lower[0]] ?? null;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'spacer' };
  if (trimmed.startsWith('*')) return { type: 'section', name: trimmed.slice(1).trim() || 'Section' };

  // Match: [reps]x[distance][rest]
  const match = trimmed.match(/^(\d+)\s*[xX]\s*(\d+)\s*([a-zA-Z]*)(.*)$/);
  if (!match) return { type: 'text', raw: trimmed };

  const [, repsStr, distStr, strokeMod, rest] = match;
  const reps = parseInt(repsStr);
  const distance = parseInt(distStr);
  let remaining = (strokeMod + rest).trim();
  let stroke = 'Free';
  let modifier = null;

  if (remaining) {
    // 1. Try to match full remaining as a modifier FIRST (avoids d=Drill eating "desc")
    const fullMod = parseModifier(remaining);
    if (fullMod) {
      modifier = fullMod;
      // stroke stays Free
    } else {
      // 2. Try single-char stroke code
      const firstChar = remaining[0];
      if (STROKES[firstChar]) {
        stroke = STROKES[firstChar];
        remaining = remaining.slice(1).trim();
        if (remaining) modifier = parseModifier(remaining);
      } else {
        // 3. Try word-based stroke names
        const lowerRem = remaining.toLowerCase();
        const wordStrokes = [
          ['zombie kick', 'Zombie Kick'],
          ['zombie',  'Zombie Kick'],
          ['breast',  'bReast'],
          ['kick',    'Kick'],
          ['pull',    'Pull'],
          ['back',    'Back'],
          ['free',    'Free'],
          ['fly',     'Fly'],
        ];
        for (const [word, label] of wordStrokes) {
          if (lowerRem.startsWith(word)) {
            stroke = label;
            remaining = remaining.slice(word.length).trim();
            if (remaining) modifier = parseModifier(remaining);
            break;
          }
        }
      }
    }
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
