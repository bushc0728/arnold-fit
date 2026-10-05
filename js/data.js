/* Arnold Fit — exercise library + Oct 5 → Dec 31 2026 plan */
'use strict';

const PLAN_START = '2026-10-05';
const PLAN_END = '2026-12-31';

/* kind: w = weight x reps, power = explosive reps (load optional), hold = seconds
   lw = lower body (+10 lb), db = dumbbell (+2.5–5 lb), kf = knee-friendly option */
const EX = {
  // ---- Upper A
  incline_bench:   { n: 'Incline Barbell Bench', m: 'Chest', eq: 'Barbell', cue: 'Blades pinned, bar to upper chest, drive up and back.', alts: ['incline_db', 'machine_incline'] },
  incline_db:      { n: 'Incline DB Press', m: 'Chest', eq: 'Dumbbells', db: 1, cue: '30° bench, elbows ~45°, deep stretch.' },
  machine_incline: { n: 'Machine Incline Press', m: 'Chest', eq: 'Machine', cue: 'Seat so handles line up mid-chest.' },
  weighted_pullup: { n: 'Weighted Pull-up', m: 'Back', eq: 'Dip belt', added: 1, cue: 'Dead hang → chin over bar. Log ADDED load (0 = bodyweight).', alts: ['neutral_pullup', 'lat_pulldown'] },
  neutral_pullup:  { n: 'Neutral-Grip Pull-up', m: 'Back', eq: 'Bar', added: 1, cue: 'Palms facing, full hang each rep. Log added load.' },
  seated_db_press: { n: 'Seated DB Shoulder Press', m: 'Shoulders', eq: 'Dumbbells', db: 1, cue: 'Back on pad, press slightly in front of face.', alts: ['machine_press', 'landmine_press'] },
  machine_press:   { n: 'Machine Shoulder Press', m: 'Shoulders', eq: 'Machine', cue: 'Controlled lowering, no lockout slam.' },
  landmine_press:  { n: 'Half-Kneeling Landmine Press', m: 'Shoulders', eq: 'Landmine', cue: 'Glute squeezed, press up & forward.' },
  cs_row:          { n: 'Chest-Supported Row', m: 'Back', eq: 'Machine/DB', cue: 'Chest glued to pad, pull elbows to hips.', alts: ['seal_row', 'machine_row'] },
  seal_row:        { n: 'Seal Row', m: 'Back', eq: 'Barbell', cue: 'Lying prone, row to lower chest.' },
  machine_row:     { n: 'Machine Row', m: 'Back', eq: 'Machine', cue: 'Pause 1s at the squeeze.' },
  lateral_raise:   { n: 'DB Lateral Raise', m: 'Shoulders', eq: 'Dumbbells', db: 1, cue: 'Lead with elbows, stop at shoulder height.', alts: ['cable_lateral', 'machine_lateral'] },
  cable_lateral:   { n: 'Cable Lateral Raise', m: 'Shoulders', eq: 'Cable', cue: 'Cable behind body, sweep out wide.' },
  machine_lateral: { n: 'Machine Lateral Raise', m: 'Shoulders', eq: 'Machine', cue: 'Smooth, no momentum.' },
  db_curl:         { n: 'DB Curl', m: 'Biceps', eq: 'Dumbbells', db: 1, cue: 'Supinate hard at top, 2s lower.', alts: ['ez_curl', 'cable_curl', 'hammer_curl'] },
  ez_curl:         { n: 'EZ-Bar Curl', m: 'Biceps', eq: 'EZ bar', cue: 'Elbows pinned, no swing.' },
  cable_curl:      { n: 'Cable Curl', m: 'Biceps', eq: 'Cable', cue: 'Constant tension, squeeze top.' },
  hammer_curl:     { n: 'Hammer Curl', m: 'Biceps', eq: 'Dumbbells', db: 1, cue: 'Neutral grip, control down.' },
  oh_triceps:      { n: 'Overhead Cable Triceps Ext', m: 'Triceps', eq: 'Cable', cue: 'Deep stretch behind head, lock out.', alts: ['pushdown', 'skull_crusher'] },
  skull_crusher:   { n: 'EZ-Bar Skull Crusher', m: 'Triceps', eq: 'EZ bar', cue: 'Bar to forehead/behind head, elbows in.' },
  // ---- Upper B
  flat_db_press:   { n: 'Flat DB Press', m: 'Chest', eq: 'Dumbbells', db: 1, cue: 'Big arch, DBs to chest line, press together.', alts: ['flat_bench', 'machine_chest'] },
  flat_bench:      { n: 'Barbell Bench Press', m: 'Chest', eq: 'Barbell', cue: 'Leg drive, touch sternum, press back.' },
  machine_chest:   { n: 'Machine Chest Press', m: 'Chest', eq: 'Machine', cue: 'Handles at mid-chest.' },
  lat_pulldown:    { n: 'Lat Pulldown', m: 'Back', eq: 'Cable', cue: 'Chest up, bar to upper chest, full stretch.', alts: ['single_pulldown', 'neutral_pullup'] },
  single_pulldown: { n: 'Single-Arm Pulldown', m: 'Back', eq: 'Cable', cue: 'Elbow to back pocket.' },
  cable_fly:       { n: 'Cable Fly', m: 'Chest', eq: 'Cable', cue: 'Soft elbows, hug a tree, squeeze.', alts: ['pec_deck', 'db_fly'] },
  pec_deck:        { n: 'Pec Deck', m: 'Chest', eq: 'Machine', cue: 'Stretch wide, squeeze 1s.' },
  db_fly:          { n: 'DB Fly', m: 'Chest', eq: 'Dumbbells', db: 1, cue: 'Stretch, don’t over-lower.' },
  cable_row:       { n: 'Seated Cable Row', m: 'Back', eq: 'Cable', cue: 'Tall chest, elbows back, pause.', alts: ['db_row', 'machine_row'] },
  db_row:          { n: 'One-Arm DB Row', m: 'Back', eq: 'Dumbbells', db: 1, cue: 'Hand on bench, row to hip.' },
  rear_delt_fly:   { n: 'Reverse Pec Deck', m: 'Rear delts', eq: 'Machine', cue: 'Arms wide, pinkies lead.', alts: ['face_pull', 'db_rear_fly'] },
  face_pull:       { n: 'Face Pull', m: 'Rear delts', eq: 'Cable', cue: 'Rope to eyes, thumbs back.' },
  db_rear_fly:     { n: 'DB Rear Delt Fly', m: 'Rear delts', eq: 'Dumbbells', db: 1, cue: 'Chest on incline bench.' },
  pushdown:        { n: 'Cable Pushdown', m: 'Triceps', eq: 'Cable', cue: 'Elbows pinned, full lockout.', alts: ['oh_triceps', 'skull_crusher'] },
  // ---- Lower + Power (knee-aware)
  broad_jump:      { n: 'Broad Jump', m: 'Power', eq: 'None', kind: 'power', lw: 1, cue: 'Max intent, soft quiet landing, stick it, walk back. Log best distance (in) as load.', alts: ['medball_throw', 'kb_swing'] },
  medball_throw:   { n: 'Med-Ball Scoop Throw', m: 'Power', eq: 'Med ball', kind: 'power', kf: 1, cue: 'Hip hinge → explode, zero knee impact. Log ball weight.' },
  kb_swing:        { n: 'Kettlebell Swing', m: 'Power', eq: 'Kettlebell', kind: 'power', kf: 1, lw: 1, cue: 'Hinge snap, knees soft.' },
  rdl:             { n: 'Romanian Deadlift', m: 'Hamstrings', eq: 'Barbell', lw: 1, cue: 'Hips back, bar on thighs, shins vertical.', alts: ['db_rdl', 'trap_rdl'] },
  db_rdl:          { n: 'DB Romanian Deadlift', m: 'Hamstrings', eq: 'Dumbbells', db: 1, lw: 1, cue: 'Long hinge, neutral back.' },
  trap_rdl:        { n: 'Trap-Bar RDL', m: 'Hamstrings', eq: 'Trap bar', lw: 1, cue: 'Hinge, minimal knee bend.' },
  leg_press:       { n: 'Leg Press (pain-free range)', m: 'Quads/Glutes', eq: 'Machine', lw: 1, cue: 'Feet high & wide; stop depth before any knee pain.', alts: ['hip_thrust', 'box_squat', 'belt_squat'] },
  hip_thrust:      { n: 'Barbell Hip Thrust', m: 'Glutes', eq: 'Barbell', lw: 1, kf: 1, cue: 'Shins vertical at top, chin tucked. Patella-friendly.' },
  box_squat:       { n: 'High Box Squat', m: 'Quads/Glutes', eq: 'Barbell', lw: 1, kf: 1, cue: 'Sit back to a box above parallel.' },
  belt_squat:      { n: 'Belt Squat (partial)', m: 'Quads/Glutes', eq: 'Machine', lw: 1, kf: 1, cue: 'Upright torso, pain-free depth only.' },
  split_squat:     { n: 'Split Squat (per leg)', m: 'Quads/Glutes', eq: 'Dumbbells', db: 1, lw: 1, cue: 'Long stance, torso slight lean, knee tracks toes.', alts: ['step_up', 'reverse_lunge', 'single_leg_hip_thrust'] },
  step_up:         { n: 'Low-Box Step-up (per leg)', m: 'Quads/Glutes', eq: 'Dumbbells', db: 1, lw: 1, kf: 1, cue: '12–16" box, drive through whole foot.' },
  reverse_lunge:   { n: 'Reverse Lunge (per leg)', m: 'Quads/Glutes', eq: 'Dumbbells', db: 1, lw: 1, kf: 1, cue: 'Step back = less patellar shear than forward lunge.' },
  single_leg_hip_thrust: { n: 'Single-Leg Hip Thrust', m: 'Glutes', eq: 'Bodyweight/DB', db: 1, lw: 1, kf: 1, cue: 'Zero knee load, pause at top.' },
  ham_curl:        { n: 'Hamstring Curl', m: 'Hamstrings', eq: 'Machine', lw: 1, cue: 'Hips down, 3s lowering.', alts: ['seated_ham_curl', 'ball_curl'] },
  seated_ham_curl: { n: 'Seated Hamstring Curl', m: 'Hamstrings', eq: 'Machine', lw: 1, cue: 'Lean forward for more stretch.' },
  ball_curl:       { n: 'Stability-Ball Curl', m: 'Hamstrings', eq: 'Ball', kf: 1, cue: 'Hips high, slow roll out.' },
  calf_raise:      { n: 'Standing Calf Raise (3s eccentric)', m: 'Calves', eq: 'Machine', lw: 1, cue: 'Pause at bottom stretch, 3s lowering.', alts: ['seated_calf', 'leg_press_calf'] },
  seated_calf:     { n: 'Seated Calf Raise', m: 'Calves', eq: 'Machine', lw: 1, kf: 1, cue: 'Full stretch, 3s down.' },
  leg_press_calf:  { n: 'Leg-Press Calf Raise', m: 'Calves', eq: 'Machine', lw: 1, kf: 1, cue: 'Knees soft-locked, 3s down.' },
  copenhagen:      { n: 'Copenhagen Plank (per side)', m: 'Adductors', eq: 'Bench', kind: 'hold', cue: 'Short lever (knee on bench) if needed. Log seconds.', alts: ['side_plank'] },
  side_plank:      { n: 'Side Plank (per side)', m: 'Core', eq: 'None', kind: 'hold', kf: 1, cue: 'Straight line, ribs down. Log seconds.' },
};
for (const id in EX) { EX[id].id = id; EX[id].kind = EX[id].kind || 'w'; }
// knee-friendly alternatives for upper lifts = equipment swaps (no knee load anyway)
['incline_db','machine_incline','neutral_pullup','machine_press','landmine_press','seal_row','machine_row','cable_lateral','machine_lateral','ez_curl','cable_curl','hammer_curl','skull_crusher','flat_bench','machine_chest','single_pulldown','pec_deck','db_fly','db_row','face_pull','db_rear_fly','pushdown','oh_triceps','lat_pulldown'].forEach(id => EX[id].kf = 1);

function altsFor(exId) {
  // find the "family" — original whose alts include exId, or exId itself
  let root = EX[exId].alts ? exId : Object.keys(EX).find(k => (EX[k].alts || []).includes(exId)) || exId;
  return [root, ...(EX[root].alts || [])];
}

/* roles: main = 1 top set @RPE9 + back-offs ~10% lighter; acc = 2 hard sets @RPE9–10 */
const TEMPLATES = {
  upperA: {
    title: 'Upper A', icon: 'U', color: 'lift', focus: 'Chest · Back · Shoulders · Arms', est: 60,
    slots: [
      { id: 'ua1', ex: 'incline_bench', role: 'main', reps: [4, 6] },
      { id: 'ua2', ex: 'weighted_pullup', role: 'main', reps: [4, 6] },
      { id: 'ua3', ex: 'seated_db_press', role: 'acc', reps: [6, 8] },
      { id: 'ua4', ex: 'cs_row', role: 'acc', reps: [6, 8] },
      { id: 'ua5', ex: 'lateral_raise', role: 'acc', reps: [8, 12] },
      { id: 'ua6', ex: 'db_curl', role: 'acc', reps: [6, 10], ss: 'Superset' },
      { id: 'ua7', ex: 'oh_triceps', role: 'acc', reps: [6, 10], ss: 'Superset' },
    ],
  },
  upperB: {
    title: 'Upper B', icon: 'U', color: 'lift', focus: 'Chest · Back · Delts · Arms + 15′ easy bike', est: 60,
    slots: [
      { id: 'ub1', ex: 'flat_db_press', role: 'main', reps: [6, 8] },
      { id: 'ub2', ex: 'lat_pulldown', role: 'main', reps: [6, 10] },
      { id: 'ub3', ex: 'cable_fly', role: 'acc', reps: [8, 12] },
      { id: 'ub4', ex: 'cable_row', role: 'acc', reps: [8, 10] },
      { id: 'ub5', ex: 'lateral_raise', role: 'acc', reps: [10, 15] },
      { id: 'ub6', ex: 'rear_delt_fly', role: 'acc', reps: [10, 15] },
      { id: 'ub7', ex: 'ez_curl', role: 'acc', reps: [8, 12], ss: 'Superset' },
      { id: 'ub8', ex: 'pushdown', role: 'acc', reps: [8, 12], ss: 'Superset' },
    ],
    finisher: { mode: 'bike', title: 'Easy bike finisher', min: 15, steps: [['15 min', 'Easy spin, RPE 3–4, flush the legs']] },
  },
  lower: {
    title: 'Lower + Power', icon: 'L', color: 'lower', focus: 'Power · Hinge · Legs (knee-smart)', est: 60,
    slots: [
      { id: 'lo1', ex: 'broad_jump', role: 'power', reps: [3, 3], sets: 3 },
      { id: 'lo2', ex: 'rdl', role: 'main', reps: [5, 7] },
      { id: 'lo3', ex: 'leg_press', role: 'main', reps: [6, 8] },
      { id: 'lo4', ex: 'split_squat', role: 'acc', reps: [6, 8] },
      { id: 'lo5', ex: 'ham_curl', role: 'acc', reps: [6, 10] },
      { id: 'lo6', ex: 'calf_raise', role: 'acc', reps: [8, 10] },
      { id: 'lo7', ex: 'copenhagen', role: 'hold', reps: [20, 30] },
    ],
  },
};

const CORE_CIRCUIT = ['Dead bug 2×8/side', 'Side plank 2×30s/side', 'Bird dog 2×8/side', 'Glute bridge 2×12', 'Pallof press 2×10/side', 'Couch stretch 60s/side (gentle)'];
const MOBILITY = ['90/90 hip switches — 2 min', 'Ankle dorsiflexion rocks — 1 min/side', 'Spanish squat iso 3×30s (pain ≤3/10)', 'Terminal knee extensions (band) 2×15', 'Thoracic open books — 1 min/side', 'Hamstring floss + calf stretch — 2 min'];

const KNEE_RULES = [
  'Stop at 3/10 knee pain or more — swap the exercise for a knee-friendly option.',
  'No running the day before hockey.',
  'No hard lower-body work within 48 hours of hockey.',
  'Add only ONE new impact stressor per week.',
];

const NUTRITION = [
  '≈2,400–2,500 kcal · protein ≥190 g/day',
  '40–50 g protein per meal (4 meals)',
  'Half the plate plants',
  'Carbs around training (pre + post)',
  'Mostly zero-cal drinks',
  'Alcohol ≤1 night/week · 1 flexible meal/week',
  'Creatine 5 g/day, every day',
];

const SLIP_RULE = 'If things slip: protect Upper A, Upper B, Lower + Power and 1 cardio session.';

const BLOCKS = [
  { n: 1, name: 'Base', start: '2026-10-05', end: '2026-11-01', grad: 'b1', desc: 'Build the engine. Easy run 25→35′, swim 10×25 → 6×50, bike 45→60′. Week 5 deload.' },
  { n: 2, name: 'Build', start: '2026-11-02', end: '2026-11-29', grad: 'b2', desc: 'Strides + 2nd run, swim 4×100 → 2×200, bike 60–75′ with 3×5′ mod-hard. Thanksgiving deload.' },
  { n: 3, name: 'Sharpen', start: '2026-11-30', end: '2026-12-27', grad: 'b3', desc: 'Intervals 5×3′, long run 40–45′, swim 300→500 continuous, bike 75–90′. Finals week reduced.' },
  { n: 4, name: 'Test', start: '2026-12-28', end: '2026-12-31', grad: 'b4', desc: 'Sharp, fresh, and tested on Dec 31.' },
];

const TESTS = [
  { key: 'baseline', label: 'Baseline', date: '2026-10-05', short: 'Oct 5' },
  { key: 'nov1', label: 'Nov 1', date: '2026-11-01', short: 'Nov 1' },
  { key: 'nov29', label: 'Nov 29', date: '2026-11-29', short: 'Nov 29' },
  { key: 'dec31', label: 'Dec 31', date: '2026-12-31', short: 'Dec 31' },
];
const TEST_FIELDS = [
  { id: 'weight', label: 'Weekly avg weight', unit: 'w', better: 'down' },
  { id: 'waist', label: 'Waist', unit: 'len', better: 'down' },
  { id: 'mile', label: '1-mile run', unit: 'time', better: 'down' },
  { id: 'swim100', label: '100 yd swim', unit: 'time', better: 'down' },
  { id: 'pullups', label: 'Max strict pull-ups', unit: 'reps', better: 'up' },
  { id: 'broad', label: 'Broad jump', unit: 'len', better: 'up' },
];

/* ---------- date helpers (local time — device is America/Chicago) ---------- */
const pad = n => String(n).padStart(2, '0');
const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pkey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (k, n) => { const d = pkey(k); d.setDate(d.getDate() + n); return dkey(d); };
const diffDays = (a, b) => Math.round((pkey(b) - pkey(a)) / 864e5);
const dow = k => (pkey(k).getDay() + 6) % 7; // 0 = Mon

function weekNum(k) { return 2 + Math.floor(diffDays(PLAN_START, k) / 7); }
function weekStart(k) { return addDays(k, -dow(k)); }
function inPlan(k) { return k >= PLAN_START && k <= PLAN_END; }
function blockFor(k) { return BLOCKS.find(b => k >= b.start && k <= b.end) || null; }

function weekMeta(wk) {
  const start = addDays(PLAN_START, (wk - 2) * 7);
  const end = wk === 14 ? PLAN_END : addDays(start, 6);
  const block = blockFor(start);
  const deload = wk === 5 || wk === 9;
  const finals = wk === 11;
  const test = wk === 2 || wk === 5 || wk === 9 || wk === 14;
  const testKey = { 2: 'baseline', 5: 'nov1', 9: 'nov29', 14: 'dec31' }[wk] || null;
  let note = '';
  if (wk === 2) note = 'Baseline test week — log your tests this week.';
  if (wk === 5) note = 'Deload (−40% volume). Tests Nov 1.';
  if (wk === 9) note = 'Thanksgiving deload. Tests Nov 29.';
  if (wk === 11) note = 'Finals week — volume reduced, keep intensity.';
  if (wk === 14) note = 'Final week — tests on Dec 31.';
  return { wk, start, end, block, deload, finals, test, testKey, note };
}
const WEEKS = []; for (let w = 2; w <= 14; w++) WEEKS.push(weekMeta(w));

/* ---------- cardio prescriptions ---------- */
function runTue(wk) {
  const core = { checklist: CORE_CIRCUIT };
  if (wk <= 5) {
    const min = { 2: 25, 3: 30, 4: 35, 5: 25 }[wk];
    return { mode: 'run', title: `Easy Run ${min}′ + Core`, min, steps: [['Warm-up', '5 min brisk walk + leg swings'], [`${min} min`, 'Easy, conversational (RPE 4–5)'], ['Core + mobility', '10 min circuit below']], ...core };
  }
  if (wk <= 9) {
    if (wk === 9) return { mode: 'run', title: 'Easy Run 25′ + Core', min: 25, steps: [['25 min', 'Easy, conversational — deload, no strides'], ['Core + mobility', '10 min']], ...core };
    return { mode: 'run', title: 'Run 30′ + 6×20s Strides', min: 34, steps: [['30 min', 'Easy, conversational (RPE 4–5)'], ['6 × 20 s', 'Strides — fast & relaxed, ~85%, walk back between'], ['Core + mobility', '10 min']], ...core };
  }
  if (wk <= 13) {
    const reps = wk === 11 ? 4 : 5;
    return { mode: 'run', title: `Intervals ${reps}×3′`, min: 15 + reps * 5, steps: [['Warm-up', '10 min easy + 2 strides'], [`${reps} × 3 min`, 'Strong (RPE 7–8) / 2 min easy jog'], ['Cool-down', '5 min easy'], ['Core', '8 min circuit']], ...core };
  }
  return { mode: 'run', title: 'Shakeout 20′ + 4 Strides', min: 22, steps: [['20 min', 'Easy shakeout before test day'], ['4 × 20 s', 'Relaxed strides']], ...core };
}
function run2(wk) {
  // 2nd run (Build) and long easy run (Sharpen) — Mondays, far from hockey; one new stressor per week
  const m = { 7: 20, 8: 25, 9: 20, 10: 35, 11: 30, 12: 40, 13: 45 }[wk];
  if (!m) return null;
  const long = wk >= 10;
  return { mode: 'run', title: long ? `Long Easy Run ${m}′` : `Run 2 · Easy ${m}′`, min: m, steps: [[`${m} min`, long ? 'Long & easy (RPE 4) — separate from lift if possible' : 'Easy (RPE 4) after Upper A or later in the day']], tip: wk === 7 ? 'New impact stressor this week = 2nd run. Nothing else new.' : '' };
}
function swimThu(wk) {
  const S = {
    2: ['10×25 yd · 30″ rest', 350, [['Warm-up', '2×25 easy (any stroke) + 2×25 kick w/ board'], ['Main', '10 × 25 yd freestyle, 30 s rest'], ['Drill', '2 × 25 catch-up drill']]],
    3: ['12×25 yd · 25″ rest', 450, [['Warm-up', '4×25 easy/kick'], ['Main', '12 × 25 yd, 25 s rest'], ['Drill', '2 × 25 side-kick breathing']]],
    4: ['6×50 yd · 30″ rest', 550, [['Warm-up', '4×25 easy + 2×25 kick'], ['Main', '6 × 50 yd, 30 s rest'], ['Cool-down', '2×25 easy backstroke/breast']]],
    5: ['Deload 8×25', 300, [['Warm-up', '2×25 easy'], ['Main', '8 × 25 relaxed, 30 s rest'], ['Cool-down', '2×25 easy']]],
    6: ['4×100 yd · 45″ rest', 600, [['Warm-up', '4×25 easy + 2×25 kick'], ['Main', '4 × 100 yd, 45 s rest'], ['Cool-down', '2×25 easy']]],
    7: ['3×100 + 1×200', 650, [['Warm-up', '4×25'], ['Main', '3 × 100 (40 s rest) then 1 × 200'], ['Cool-down', '2×25']]],
    8: ['2×200 yd · 60″ rest', 600, [['Warm-up', '4×25 + 2×25 kick'], ['Main', '2 × 200 yd, 60 s rest'], ['Cool-down', '2×25']]],
    9: ['Deload 4×50', 350, [['Warm-up', '2×25'], ['Main', '4 × 50 easy, 30 s rest'], ['Drill', '4×25 technique']]],
    10: ['300 yd continuous', 450, [['Warm-up', '4×25'], ['Main', '300 yd continuous, steady'], ['Cool-down', '2×25']]],
    11: ['300 yd easy (finals)', 350, [['Warm-up', '2×25'], ['Main', '300 yd continuous, easy'], ['Cool-down', '1×25']]],
    12: ['400 yd continuous', 550, [['Warm-up', '4×25'], ['Main', '400 yd continuous'], ['Cool-down', '2×25']]],
    13: ['500 yd continuous', 650, [['Warm-up', '4×25'], ['Main', '500 yd continuous 🎯'], ['Cool-down', '2×25']]],
  }[wk];
  if (!S) return null;
  return { mode: 'swim', title: 'Swim · ' + S[0], dist: S[1], min: 30, steps: S[2] };
}
function bikeSat(wk) {
  const m = { 2: 45, 3: 50, 4: 60, 5: 40, 6: 60, 7: 65, 8: 75, 9: 50, 10: 75, 11: 60, 12: 85, 13: 90 }[wk];
  if (!m) return null;
  const build = wk >= 6 && wk <= 8;
  const steps = build
    ? [['Warm-up', '15 min easy'], ['3 × 5 min', 'Moderately hard (RPE 6–7), 5 min easy between'], ['Rest of ride', `Easy Z2 to ${m} min`]]
    : [[`${m} min`, 'Easy aerobic Z2 (RPE 3–5) — MTB or stationary'], ['Fuel', m >= 75 ? 'Bring carbs + water' : 'Water']];
  return { mode: 'bike', title: `Long Aerobic Bike ${m}′`, min: m, steps, tip: 'Day before hockey: no running, keep legs easy.' };
}

/* ---------- the day generator ---------- */
function liftMod(wk) { const m = weekMeta(wk); return m.deload ? 'deload' : m.finals ? 'reduced' : 'normal'; }

function dayPlan(k) {
  if (!inPlan(k)) return null;
  const wk = weekNum(k), meta = weekMeta(wk), d = dow(k), sessions = [];
  const mod = liftMod(wk);
  const lift = t => ({ kind: 'lift', tpl: t, mod, title: TEMPLATES[t].title, sub: TEMPLATES[t].focus, icon: TEMPLATES[t].icon, color: TEMPLATES[t].color, min: TEMPLATES[t].est });
  const cardio = c => c && ({ kind: 'cardio', cardio: c, title: c.title, sub: c.steps.map(s => s[0]).join(' · '), icon: c.mode[0].toUpperCase(), color: c.mode, min: c.min });
  if (wk === 14) {
    if (d === 0) sessions.push(lift('upperA'));
    if (d === 1) sessions.push(cardio(runTue(14)));
    if (d === 2) sessions.push(cardio({ mode: 'bike', title: 'Easy Spin 20′ + Mobility', min: 20, steps: [['20 min', 'Easy spin — fresh legs for tests'], ['Mobility', '10 min routine']], checklist: MOBILITY }));
    if (d === 3) sessions.push({ kind: 'test', testKey: 'dec31', title: 'Final Test Day 🏁', sub: 'Mile · 100 yd swim · Pull-ups · Broad jump · Waist', icon: 'T', color: 'test', min: 75 });
  } else {
    if (d === 0) { sessions.push(lift('upperA')); const r = run2(wk); if (r) sessions.push(cardio(r)); }
    if (d === 1) sessions.push(cardio(runTue(wk)));
    if (d === 2) sessions.push(lift('lower'));
    if (d === 3) sessions.push(cardio(swimThu(wk)));
    if (d === 4) sessions.push(lift('upperB'));
    if (d === 5) sessions.push(cardio(bikeSat(wk)));
    if (d === 6) {
      sessions.push({ kind: 'cardio', cardio: { mode: 'hockey', title: 'Hockey', min: 75, steps: [['Game / skate', 'Warm up hips + groin first. Log knee pain after.']] }, title: 'Hockey 🏒', sub: 'Sunday skate', icon: 'H', color: 'hockey', min: 75 });
      if (k === '2026-11-01' || k === '2026-11-29') sessions.push({ kind: 'test', testKey: k === '2026-11-01' ? 'nov1' : 'nov29', title: 'Test Day', sub: 'Avg weight · waist · pull-ups (+ mile/swim/jump done earlier this week)', icon: 'T', color: 'test', min: 20 });
    }
  }
  sessions.forEach((s, i) => s.key = k + ':' + i);
  return { k, wk, meta, block: blockFor(k), sessions, dow: d };
}

/* sets for a slot given week modifier */
function buildSets(slot, mod) {
  const sets = [];
  if (slot.role === 'main') {
    sets.push({ tag: 'Top', rpeT: mod === 'deload' ? '7' : '9' });
    const bo = mod === 'normal' ? 2 : 1;
    for (let i = 0; i < bo; i++) sets.push({ tag: 'Back-off', rpeT: mod === 'deload' ? '6–7' : '8–9', pct: 0.9 });
  } else if (slot.role === 'power') {
    const n = mod === 'normal' ? (slot.sets || 3) : 2;
    for (let i = 0; i < n; i++) sets.push({ tag: 'Set', rpeT: 'Max intent' });
  } else {
    const n = mod === 'normal' ? 2 : 1;
    for (let i = 0; i < n; i++) sets.push({ tag: 'Hard', rpeT: mod === 'deload' ? '8' : '9–10' });
  }
  return sets;
}
