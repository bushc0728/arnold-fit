/* Arnold Fit — exercise library + Oct 5 → Dec 31 2026 plan */
'use strict';


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
  oh_triceps:      { n: 'Overhead Cable Triceps Ext', m: 'Triceps', eq: 'Cable', cue: 'Deep stretch behind head, lock out.', alts: ['pushdown', 'skull_crusher', 'oh_db_ext'] },
  skull_crusher:   { n: 'EZ-Bar Skull Crusher', m: 'Triceps', eq: 'EZ bar', cue: 'Bar to forehead/behind head, elbows in.' },
  // ---- Upper B
  flat_db_press:   { n: 'Flat DB Press', m: 'Chest', eq: 'Dumbbells', db: 1, cue: 'Big arch, DBs to chest line, press together.', alts: ['flat_bench', 'machine_chest'] },
  flat_bench:      { n: 'Barbell Bench Press', m: 'Chest', eq: 'Barbell', cue: 'Blades pinned, feet planted, bar to lower chest, leg drive, press back over the shoulders.', alts: ['paused_bench', 'close_grip_bench', 'flat_db_press', 'machine_chest'] },
  paused_bench:    { n: 'Paused Bench Press (2-count)', m: 'Chest', eq: 'Barbell', cue: 'Full 2-count pause on the chest, stay tight, then drive. Technique over load.', alts: ['close_grip_bench', 'flat_db_press', 'machine_chest'] },
  close_grip_bench:{ n: 'Close-Grip Bench Press', m: 'Chest/Triceps', eq: 'Barbell', cue: 'Hands just inside shoulder width, elbows tucked, touch lower chest.' },
  jm_press:        { n: 'JM Press', m: 'Triceps', eq: 'Barbell/Smith', cue: 'Half skull-crusher, half close-grip: bar toward chin, elbows forward, press back. Lockout strength for bench.', alts: ['dips', 'pushdown', 'skull_crusher'] },
  dips:            { n: 'Weighted Dip', m: 'Triceps/Chest', eq: 'Dip bars', added: 1, cue: 'Slight lean, shoulders down, only to a shoulder-comfortable depth. Log ADDED load.' },
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
  pushdown:        { n: 'Cable Pushdown', m: 'Triceps', eq: 'Cable', cue: 'Elbows pinned, full lockout.', alts: ['oh_triceps', 'skull_crusher', 'oh_db_ext'] },
  // ---- Lower + Power (knee-aware)
  broad_jump:      { n: 'Broad Jump', m: 'Power', eq: 'None', kind: 'power', lw: 1, cue: 'Max intent, soft quiet landing, stick it, walk back. Log best distance (in) as load.', alts: ['medball_throw', 'kb_swing'] },
  medball_throw:   { n: 'Med-Ball Scoop Throw', m: 'Power', eq: 'Med ball', kind: 'power', kf: 1, cue: 'Hip hinge → explode, zero knee impact. Log ball weight.' },
  kb_swing:        { n: 'Kettlebell Swing', m: 'Power', eq: 'Kettlebell', kind: 'power', kf: 1, lw: 1, cue: 'Hinge snap, knees soft.' },
  rdl:             { n: 'Romanian Deadlift', m: 'Hamstrings', eq: 'Barbell', lw: 1, cue: 'Hips back, bar on thighs, shins vertical.', alts: ['db_rdl', 'trap_rdl'] },
  db_rdl:          { n: 'DB Romanian Deadlift', m: 'Hamstrings', eq: 'Dumbbells', db: 1, lw: 1, cue: 'Long hinge, neutral back.' },
  trap_rdl:        { n: 'Trap-Bar RDL', m: 'Hamstrings', eq: 'Trap bar', lw: 1, cue: 'Hinge, minimal knee bend.' },
  leg_press:       { n: 'Leg Press (pain-free range)', m: 'Quads/Glutes', eq: 'Machine', lw: 1, cue: 'Feet high & wide; stop depth before any knee pain.', alts: ['hip_thrust', 'box_squat', 'belt_squat', 'goblet_squat', 'back_squat'] },
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
  calf_raise:      { n: 'Standing Calf Raise (3s eccentric)', m: 'Calves', eq: 'Machine', lw: 1, cue: 'Pause at bottom stretch, 3s lowering.', alts: ['seated_calf', 'leg_press_calf', 'db_calf'] },
  seated_calf:     { n: 'Seated Calf Raise', m: 'Calves', eq: 'Machine', lw: 1, kf: 1, cue: 'Full stretch, 3s down.' },
  leg_press_calf:  { n: 'Leg-Press Calf Raise', m: 'Calves', eq: 'Machine', lw: 1, kf: 1, cue: 'Knees soft-locked, 3s down.' },
  back_squat:      { n: 'Back Squat', m: 'Quads/Glutes', eq: 'Barbell', lw: 1, cue: 'Brace, sit between the hips, drive up.' , alts: ['leg_press', 'box_squat', 'goblet_squat'] },
  goblet_squat:    { n: 'Goblet Squat (to box)', m: 'Quads/Glutes', eq: 'Dumbbell', db: 1, lw: 1, kf: 1, cue: 'DB at chest, sit to a box, pain-free depth.' },
  db_calf:         { n: 'Single-Leg DB Calf Raise', m: 'Calves', eq: 'Dumbbell', db: 1, lw: 1, kf: 1, cue: 'Hold a DB, 3s lowering, full stretch.' },
  oh_db_ext:       { n: 'Overhead DB Triceps Ext', m: 'Triceps', eq: 'Dumbbell', db: 1, kf: 1, cue: 'Both hands on one DB, deep stretch.' },
  copenhagen:      { n: 'Copenhagen Plank (per side)', m: 'Adductors', eq: 'Bench', kind: 'hold', cue: 'Short lever (knee on bench) if needed. Log seconds.', alts: ['side_plank'] },
  side_plank:      { n: 'Side Plank (per side)', m: 'Core', eq: 'None', kind: 'hold', kf: 1, cue: 'Straight line, ribs down. Log seconds.' },
  pushup:          { n: 'Push-up', m: 'Chest', eq: 'Bodyweight', added: 1, kf: 1, cue: 'Hands under shoulders, body in one line, chest to fist height.' },
  incline_curl:    { n: 'Incline DB Curl', m: 'Biceps', eq: 'Dumbbells', db: 1, cue: 'Bench at 45–60°, arms hang behind you — full stretch, no swing.', alts: ['bayesian_curl', 'ez_curl', 'hammer_curl'] },
  bayesian_curl:   { n: 'Bayesian Cable Curl', m: 'Biceps', eq: 'Cable', cue: 'Face away from the cable, arm behind the body — curl from the stretch.', alts: ['incline_curl', 'cable_curl', 'ez_curl'] },
  band_pull:       { n: 'Band Pull-Apart', m: 'Rear delts', eq: 'Band', kf: 1, cue: 'Straight arms, squeeze shoulder blades, slow return.' },
};
for (const id in EX) { EX[id].id = id; EX[id].kind = EX[id].kind || 'w'; }
// knee-friendly alternatives for upper lifts = equipment swaps (no knee load anyway)
['incline_db','machine_incline','neutral_pullup','machine_press','landmine_press','seal_row','machine_row','cable_lateral','machine_lateral','ez_curl','cable_curl','hammer_curl','skull_crusher','flat_bench','machine_chest','single_pulldown','pec_deck','db_fly','db_row','face_pull','db_rear_fly','pushdown','oh_triceps','lat_pulldown','paused_bench','close_grip_bench','jm_press','dips'].forEach(id => EX[id].kf = 1);

function altsFor(exId) {
  // find the "family" — original whose alts include exId, or exId itself
  let root = EX[exId].alts ? exId : Object.keys(EX).find(k => (EX[k].alts || []).includes(exId)) || exId;
  return [root, ...(EX[root].alts || [])];
}

/* ---------- aliases for the coach chat (word → exercise ids) ---------- */
const EX_ALIASES = {
  bench: ['flat_bench', 'paused_bench', 'close_grip_bench', 'flat_db_press', 'incline_bench', 'incline_db', 'machine_incline', 'machine_chest'], incline: ['incline_bench', 'incline_db', 'machine_incline'],
  paused: ['paused_bench'], pause: ['paused_bench'], closegrip: ['close_grip_bench'], cgbp: ['close_grip_bench'], jm: ['jm_press'], jmpress: ['jm_press'], dip: ['dips'], face: ['face_pull'],
  press: ['flat_bench', 'seated_db_press', 'flat_db_press', 'jm_press', 'incline_bench'], chest: ['flat_bench', 'paused_bench', 'incline_bench', 'flat_db_press', 'cable_fly'],
  pullup: ['weighted_pullup', 'neutral_pullup'], chin: ['weighted_pullup', 'neutral_pullup'], pulldown: ['lat_pulldown', 'single_pulldown'], lat: ['lat_pulldown'],
  shoulder: ['seated_db_press', 'machine_press', 'landmine_press'], ohp: ['seated_db_press', 'machine_press'],
  row: ['cs_row', 'cable_row', 'seal_row', 'machine_row', 'db_row'], lateral: ['lateral_raise', 'cable_lateral', 'machine_lateral'], raise: ['lateral_raise'],
  curl: ['db_curl', 'ez_curl', 'cable_curl', 'hammer_curl'], bicep: ['db_curl', 'ez_curl', 'cable_curl', 'hammer_curl'],
  tricep: ['oh_triceps', 'pushdown', 'skull_crusher', 'oh_db_ext', 'jm_press', 'dips'], pushdown: ['pushdown'], extension: ['oh_triceps', 'oh_db_ext'],
  fly: ['cable_fly', 'pec_deck', 'db_fly'], flye: ['cable_fly', 'pec_deck', 'db_fly'], rear: ['rear_delt_fly', 'face_pull', 'db_rear_fly'], facepull: ['face_pull'],
  jump: ['broad_jump'], broad: ['broad_jump'], medball: ['medball_throw'], throw: ['medball_throw'], swing: ['kb_swing'],
  rdl: ['rdl', 'db_rdl', 'trap_rdl'], deadlift: ['rdl', 'db_rdl', 'trap_rdl'], hinge: ['rdl'],
  legpress: ['leg_press'], squat: ['back_squat', 'box_squat', 'goblet_squat', 'belt_squat', 'split_squat'], thrust: ['hip_thrust', 'single_leg_hip_thrust'], hip: ['hip_thrust'],
  split: ['split_squat'], stepup: ['step_up'], step: ['step_up'], lunge: ['reverse_lunge'],
  hamstring: ['ham_curl', 'seated_ham_curl', 'ball_curl'], ham: ['ham_curl', 'seated_ham_curl', 'ball_curl'],
  calf: ['calf_raise', 'seated_calf', 'leg_press_calf', 'db_calf'], copenhagen: ['copenhagen'], adductor: ['copenhagen'], plank: ['copenhagen', 'side_plank'],
};

/* roles: main = 1 top set @RPE9 + back-offs ~10% lighter; acc = 2 hard sets @RPE9–10
   bench = heavy bench: (Sharpen: heavy single) + 1 top set by phase + 2–3 back-offs −10%; tech = 3 × 5–6 @RPE 8 technique sets (v2.6)
   pri: 1 = never trimmed, 2 = kept at ≥45 min, 3 = kept at ≥60 min. v2.2: bench is the first lift on both upper days. */
const BENCH_PHASE = {
  base:    { key: 'base', name: 'Base', reps: [5, 6], top: '8–9', bo: 3, desc: 'top set 5–6 @RPE 8–9 + 3 back-offs × 7–8 at −10%' },
  build:   { key: 'build', name: 'Build', reps: [4, 5], top: '8–9', bo: 3, desc: 'top set 4–5 @RPE 8–9 + 3 back-offs × 6–8 at −10%' }, // v2.6 hypertrophy audit: top sets stay in 4–6
  sharpen: { key: 'sharpen', name: 'Sharpen', reps: [4, 5], top: '9', bo: 2, single: true, desc: 'heavy single @RPE 8, top set 4–5 @RPE 9 + 2 back-offs × 6–7 at −10%' },
};
function benchPhase(k) { const b = blockFor(k || PLAN_START) || (k > PLAN_END ? BLOCKS[3] : BLOCKS[0]); return b.n === 1 ? BENCH_PHASE.base : b.n === 2 ? BENCH_PHASE.build : BENCH_PHASE.sharpen; }
function slotReps(slot, k) { return slot.role === 'bench' ? benchPhase(k).reps : slot.reps; }
const modFor = k => inPlan(k) ? liftMod(weekNum(k)) : 'normal';
const TEMPLATES = {
  upperA: {
    title: 'Upper A', icon: 'U', color: 'lift', focus: 'Heavy bench · Back · Triceps · Delts', est: 60,
    slots: [
      { id: 'uab', ex: 'flat_bench', role: 'bench', reps: [5, 6], pri: 1 },
      { id: 'ua2', ex: 'weighted_pullup', role: 'main', reps: [4, 6], pri: 1 },
      { id: 'ua4', ex: 'cs_row', role: 'acc', reps: [6, 8], pri: 2 },
      { id: 'uat', ex: 'jm_press', role: 'acc', reps: [6, 10], ss: 'Superset', pri: 2 },
      { id: 'uaf', ex: 'face_pull', role: 'acc', reps: [10, 15], ss: 'Superset', pri: 2 },
      { id: 'ua5', ex: 'lateral_raise', role: 'acc', reps: [8, 12], pri: 3 },
    ],
  },
  upperB: {
    title: 'Upper B', icon: 'U', color: 'lift', focus: 'Bench technique · Back · Delts · Arms + easy bike', est: 60,
    slots: [
      { id: 'ubp', ex: 'paused_bench', role: 'tech', reps: [5, 6], pri: 1 },
      { id: 'ub2', ex: 'lat_pulldown', role: 'main', reps: [6, 10], pri: 1 },
      { id: 'ub4', ex: 'cable_row', role: 'acc', reps: [8, 10], pri: 2 },
      { id: 'ub5', ex: 'lateral_raise', role: 'acc', reps: [10, 15], pri: 2 },
      { id: 'ub6', ex: 'rear_delt_fly', role: 'acc', reps: [10, 15], pri: 3 },
      { id: 'ub7', ex: 'ez_curl', role: 'acc', reps: [8, 12], ss: 'Superset', pri: 3 },
      { id: 'ub8', ex: 'pushdown', role: 'acc', reps: [8, 12], ss: 'Superset', pri: 3 },
    ],
    finisher: { mode: 'bike', title: 'Easy bike finisher', min: 15, steps: [['15 min', 'Easy spin, RPE 3–4, flush the legs']] },
  },
  lower: {
    title: 'Lower + Power', icon: 'L', color: 'lower', focus: 'Power · Hinge · Legs (knee-smart)', est: 60,
    slots: [
      { id: 'lo1', ex: 'broad_jump', role: 'power', reps: [3, 3], sets: 3, pri: 2 },
      { id: 'lo2', ex: 'rdl', role: 'main', reps: [5, 7], pri: 1 },
      { id: 'lo3', ex: 'leg_press', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'lo4', ex: 'split_squat', role: 'acc', reps: [6, 8], pri: 2 },
      { id: 'lo5', ex: 'ham_curl', role: 'acc', reps: [6, 10], pri: 3 },
      { id: 'lo6', ex: 'calf_raise', role: 'acc', reps: [8, 10], pri: 3 },
      { id: 'lo7', ex: 'copenhagen', role: 'hold', reps: [20, 30], pri: 3 },
    ],
  },
};
/* v2.5 — new plan from Mon Nov 2, 2026 (look better: chest/arms/shoulders + smaller waist, ~205 lb, bench 225 for reps).
   Old templates above stay untouched so past weeks still render exactly as logged. */
Object.assign(TEMPLATES, {
  /* v2.6 hypertrophy audit (Nov 2 plan + picks): ~10–12 hard sets/muscle/week, most muscles 2×/week, all working sets RPE 8–9,
     main lift = top set 4–6 + 2–3 back-offs 6–10 at −10%, accessories 2–3 × 8–15 near failure, lengthened-position picks,
     knee-safe for both ACLs (no high-rep knee loading). n = hard sets (accessories). Sessions ≤ 60 min incl. warm-up. */
  upperA2: {
    title: 'Upper A', icon: 'U', color: 'lift', focus: 'Heavy bench · Pull-ups · Incline · Arms + delts', est: 55,
    slots: [
      { id: 'a2b', ex: 'flat_bench', role: 'bench', reps: [5, 6], pri: 1 },
      { id: 'a2p', ex: 'weighted_pullup', role: 'main', reps: [4, 6], pri: 1 },
      { id: 'a2i', ex: 'incline_db', role: 'acc', reps: [8, 12], n: 2, pri: 1 },
      { id: 'a2r', ex: 'cs_row', role: 'acc', reps: [8, 12], n: 2, pri: 2 },
      { id: 'a2t', ex: 'oh_triceps', role: 'acc', reps: [10, 15], n: 2, ss: 'Superset', pri: 2 },
      { id: 'a2l', ex: 'cable_lateral', role: 'acc', reps: [12, 15], n: 3, ss: 'Superset', pri: 2 },
    ],
  },
  upperB2: {
    title: 'Upper B', icon: 'U', color: 'lift', focus: 'Shoulders · Arms · Upper chest · Lats', est: 55,
    slots: [
      { id: 'ub2a', ex: 'seated_db_press', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'ub2h', ex: 'lat_pulldown', role: 'acc', reps: [8, 12], n: 3, pri: 1 },
      { id: 'ub2b', ex: 'incline_db', role: 'acc', reps: [8, 12], n: 2, pri: 1 },
      { id: 'ub2c', ex: 'cable_lateral', role: 'acc', reps: [12, 15], n: 3, pri: 2 },
      { id: 'ub2d', ex: 'incline_curl', role: 'acc', reps: [8, 12], n: 3, ss: 'Superset', pri: 2 },
      { id: 'ub2e', ex: 'oh_triceps', role: 'acc', reps: [10, 15], n: 2, ss: 'Superset', pri: 2 },
      { id: 'ub2f', ex: 'rear_delt_fly', role: 'acc', reps: [12, 15], n: 2, pri: 3 },
    ],
  },
  upperC: {
    title: 'Upper C', icon: 'U', color: 'lift', focus: 'Paused bench volume · Rows · Dips · Rear delts · Calves', est: 55,
    slots: [
      { id: 'ucp', ex: 'paused_bench', role: 'tech', reps: [5, 6], pri: 1 },
      { id: 'uc2', ex: 'cs_row', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'uc3', ex: 'dips', role: 'acc', reps: [6, 10], n: 2, ss: 'Superset', pri: 2 },
      { id: 'uc4', ex: 'cable_lateral', role: 'acc', reps: [12, 15], n: 2, ss: 'Superset', pri: 2 },
      { id: 'uc5', ex: 'face_pull', role: 'acc', reps: [12, 15], n: 3, ss: 'Superset B', pri: 2 },
      { id: 'uc6', ex: 'bayesian_curl', role: 'acc', reps: [10, 12], n: 2, ss: 'Superset B', pri: 2 },
      { id: 'uc7', ex: 'seated_calf', role: 'acc', reps: [10, 15], n: 3, pri: 3 },
    ],
  },
  lowerS: {
    title: 'Lower · Strength (short)', icon: 'L', color: 'lower', focus: 'RDL · Leg press (pain-free) · Seated curl · Calves — knee-safe, low volume (hockey + MTB load the legs)', est: 45,
    slots: [
      { id: 'ls1', ex: 'rdl', role: 'main', reps: [5, 6], pri: 1 },
      { id: 'ls2', ex: 'leg_press', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'ls3', ex: 'seated_ham_curl', role: 'acc', reps: [8, 12], n: 3, pri: 1 },
      { id: 'ls5', ex: 'calf_raise', role: 'acc', reps: [8, 12], n: 3, pri: 2 },
      { id: 'ls4', ex: 'copenhagen', role: 'hold', reps: [20, 30], pri: 3 },
    ],
  },
  /* v2.6 — “Pick today’s workout” sessions + deload-week Push/Pull (Oct 28/29). Same standards as above. */
  pushP: {
    title: 'Push', icon: 'P', color: 'lift', focus: 'Bench top set · Incline · Shoulders · Triceps', est: 55,
    slots: [
      { id: 'pu1', ex: 'flat_bench', role: 'bench', reps: [5, 6], pri: 1 },
      { id: 'pu2', ex: 'incline_db', role: 'acc', reps: [8, 12], n: 3, pri: 1 },
      { id: 'pu3', ex: 'seated_db_press', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'pu4', ex: 'dips', role: 'acc', reps: [6, 10], n: 2, pri: 2 },
      { id: 'pu5', ex: 'cable_lateral', role: 'acc', reps: [12, 15], n: 3, ss: 'Superset', pri: 2 },
      { id: 'pu6', ex: 'oh_triceps', role: 'acc', reps: [10, 15], n: 2, ss: 'Superset', pri: 2 },
    ],
  },
  pullP: {
    title: 'Pull', icon: 'P', color: 'lift', focus: 'Pull-ups · Rows · Pulldown · Rear delts · Biceps', est: 55,
    slots: [
      { id: 'pl2', ex: 'weighted_pullup', role: 'main', reps: [4, 6], pri: 1 },
      { id: 'pl1', ex: 'cs_row', role: 'main', reps: [6, 8], pri: 1 },
      { id: 'pl7', ex: 'lat_pulldown', role: 'acc', reps: [8, 12], n: 2, pri: 2 },
      { id: 'pl3', ex: 'face_pull', role: 'acc', reps: [12, 15], n: 3, ss: 'Superset', pri: 2 },
      { id: 'pl5', ex: 'incline_curl', role: 'acc', reps: [8, 12], n: 3, ss: 'Superset', pri: 2 },
      { id: 'pl4', ex: 'rear_delt_fly', role: 'acc', reps: [12, 15], n: 2, ss: 'Superset B', pri: 3 },
      { id: 'pl6', ex: 'bayesian_curl', role: 'acc', reps: [10, 12], n: 2, ss: 'Superset B', pri: 3 },
    ],
  },
  fullP: {
    title: 'Full Body', icon: 'F', color: 'lift', focus: 'Bench · Trap-bar RDL · Row · Leg press · Delts', est: 55,
    slots: [
      { id: 'fb1', ex: 'flat_bench', role: 'bench', reps: [5, 6], pri: 1 },
      { id: 'fb2', ex: 'trap_rdl', role: 'main', reps: [5, 6], pri: 1 },
      { id: 'fb3', ex: 'cs_row', role: 'acc', reps: [8, 12], n: 3, pri: 1 },
      { id: 'fb4', ex: 'leg_press', role: 'acc', reps: [8, 10], n: 2, pri: 2 },
      { id: 'fb5', ex: 'cable_lateral', role: 'acc', reps: [12, 15], n: 2, ss: 'Superset', pri: 2 },
      { id: 'fb6', ex: 'oh_triceps', role: 'acc', reps: [10, 15], n: 2, ss: 'Superset', pri: 3 },
    ],
  },
});
const NEW_PLAN_START = '2026-11-02'; // v2.5 plan; the deload week (Oct 26 – Nov 1) and everything before stays as it was
const PLAN_GOALS = [ // shown on Settings → Goals, Progress and the coach (“my goals”)
  { ic: '📏', t: 'Look better — waist is the main metric', d: 'Chest, arms, shoulders up; waist down. Measure the waist at every Sunday check-in.' },
  { ic: '⚖️', t: 'Weight 210+ → ~205 lb while adding muscle', d: 'Slow recomp, ~0.5 lb/week. Calories 2,500–2,600 · protein ~190 g.' },
  { ic: '🏋️', t: 'Bench 225 for reps', d: 'Mon heavy top set + back-offs · Fri paused bench volume.' },
  { ic: '🏊', t: 'Triathlon — future goal', d: 'No swimming for now. MTB + short runs keep the engine; swim comes back later.' },
];
const FOOD_PLAN = ['3 home-cooked meals × 55–60 g protein + 1 high-protein snack ≈ 190 g/day — no shakes', 'Calories ≈ 2,500–2,600/day (copy the day’s totals from MyFitnessPal into the nightly log)', 'Weekends: keep the 3 protein meals', 'Drinking: max 1 night/week, 3–4 drinks, protein meal first'];
const ALL_SLOTS = Object.values(TEMPLATES).flatMap(t => t.slots);
const slotById = id => ALL_SLOTS.find(s => s.id === id);

const CORE_CIRCUIT = ['Dead bug 2×8/side', 'Side plank 2×30s/side', 'Bird dog 2×8/side', 'Glute bridge 2×12', 'Pallof press 2×10/side', 'Couch stretch 60s/side (gentle)'];
const MOBILITY = ['90/90 hip switches — 2 min', 'Ankle dorsiflexion rocks — 1 min/side', 'Spanish squat iso 3×30s (pain ≤3/10)', 'Terminal knee extensions (band) 2×15', 'Thoracic open books — 1 min/side', 'Hamstring floss + calf stretch — 2 min'];
const KNEE_RULES = [
  'Stop at 3/10 knee pain or more — swap the exercise for a knee-friendly option.',
  'No running the day before hockey.',
  'No hard lower-body work within 48 hours of hockey.',
  'Add only ONE new impact stressor per week.',
];
const SLIP_RULE = 'If things slip: protect Upper A (heavy bench) + one more lift — at least 2 lifts every week — and the 3 protein meals. Hockey or a ride can replace any other day.';

const WHY = {
  PUSHD: 'Deload-week push: bench top set at about RPE 7 (leave 3 in the tank), then incline DB, shoulder press, dips or push-ups, laterals and triceps. Moved here because Mon/Tue were hard MTB days — upper body only until Friday.',
  PULLD: 'Deload-week pull: rows, pull-ups or pulldowns, face pulls, rear delts and curls at about RPE 7. Keeps the legs fresh after back-to-back MTB days.',
  LOWD: 'Earliest lower day this week (two hard rides Mon/Tue). Deload: light and crisp, nothing grinding — hockey is Sunday.',
  PICK: 'You picked this session — it replaces the plan for the day and counts like any planned lift.',
  MIN: 'Minimum day: something beats nothing. 15–20 minutes keeps the streak alive without digging a recovery hole.',
  UA: 'Heavy bench goes first while you’re fresh — getting stronger is now an explicit goal. One heavy top set of 4–6 (Base 5–6, Build 4–5, Sharpen 4–5 plus a heavy single) is the biggest strength signal per minute; 2–3 back-offs of 6–8 at −10% add hypertrophy volume without junk sets. Every working set is RPE 8–9 (1–2 reps left). Pull-ups, rows and incline DB press (deep stretch) hit chest and back twice a week; overhead triceps and cable laterals train arms and delts in the lengthened position, which grows them fastest. On a cut, expect modest bench gains — protein ≥190 g protects them.',
  UB: 'Second bench day of the week: paused bench at RPE 8 grooves a tight, consistent bottom position and adds technique volume without beating you up before Monday’s heavy day. Back and delt work balances the pressing, and the easy spin adds calorie burn without leg fatigue.',
  LOW: 'Jumps come first because power needs fresh, fast muscle fibers. Then hinge and knee-friendly leg work in low reps with hard effort — strength without high-rep patellar stress.',
  RUN: 'Easy, conversational running builds the aerobic base (more mitochondria and capillaries) with low injury risk. Core work stabilizes hips and knees for hockey.',
  STRIDES: 'Strides teach fast, relaxed mechanics with almost no fatigue — the one new impact stressor this week.',
  INTERVALS: 'Intervals near threshold raise VO₂max and lactate threshold — Sharpen turns your base into speed.',
  RUN2: 'A second easy run adds aerobic volume. It sits on Monday, far from hockey, and is introduced alone to honor the one-new-stressor rule.',
  SWIM: 'Short repeats with rest let a beginner keep good form, so you practice good technique instead of struggle. Aerobic work with zero knee impact.',
  LONG: 'Long zone-2 work is the best tool for aerobic endurance and fat burning. Cycling is knee-friendly and keeps legs fresh for Sunday hockey.',
  UB2: 'Shoulders and arms are what make the upper body look bigger. Moderate loads, 8–15 reps taken close to failure build size with little joint stress — and nothing here competes with Monday’s heavy bench.',
  UC: 'Second bench day: paused bench 3×5–6 at RPE 8 adds quality bench volume (the fastest path to 225 for reps) and owns the bottom position. Back work keeps shoulders healthy and builds the V-taper.',
  LOW2: 'Short and strength-focused on purpose: hockey and MTB already load your legs. A heavy hinge and a knee-friendly press for low reps keep leg strength without adding fatigue or patellar stress.',
  MTB: 'Mountain biking is your knee-friendly engine work. Keep most of it zone 2 (RPE 4–6) so Wednesday’s lower day stays on — a very hard ride counts toward the 48-h rule.',
  SAT: 'A short 25–30′ run (or MTB) keeps running fitness for a future triathlon without beating up the knees before Sunday hockey.',
  HOCKEY: 'Hockey is high-intensity intervals plus impact. That’s why running and hard leg days are kept away from it.',
  TEST: 'Testing on fresh legs at the end of a block shows what’s working, so the plan adjusts to data, not feelings.',
  SPIN: 'Easy movement the day before testing primes the legs without fatigue.',
  REC: 'Low-intensity recovery work boosts blood flow and burns calories without adding fatigue.',
  deload: 'Deload week: planned lighter training lets fatigue drop so your fitness can show (supercompensation) and joints recover.',
  reduced: 'Finals week: same intensity, less volume. You keep strength with about a third of the work during a stressful week.',
};

const BLOCKS = [
  { n: 1, name: 'Base', start: '2026-10-05', end: '2026-11-01', grad: 'b1', desc: 'Build the engine. Easy run 25→35′, swim 10×25 → 6×50, bike 45→60′. Week 5 deload.' },
  { n: 2, name: 'Build', start: '2026-11-02', end: '2026-11-29', grad: 'b2', desc: 'New plan: Upper A/B/C + short Lower, Tue MTB, Sat 25–30′ run or MTB, Sun hockey. No swim for now. Thanksgiving deload.' },
  { n: 3, name: 'Sharpen', start: '2026-11-30', end: '2026-12-27', grad: 'b3', desc: 'Same week shape, heavier bench top sets (2–3 reps + a single). MTB up to 60′. Finals week reduced.' },
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
  { id: 'bench', label: 'Bench e1RM (AMRAP @ ~85%)', unit: 'w', better: 'up' },
  { id: 'broad', label: 'Broad jump', unit: 'len', better: 'up' },
];

/* ---------- profile (onboarding answers) ---------- */
const DEFAULT_PROFILE = {
  style: 'hybrid', goals: ['fatloss', 'strength', 'muscle', 'endurance', 'explosive', 'hockey'], primary: 'fatloss',
  heightIn: 74, weight: 210, goalWeight: 205, age: 21, sex: 'male', sleep: 8,
  gym: 'full', pool: true, poolName: 'UREC pool', bike: 'mix',
  days: 7, sessionMin: 60, time: 'midday', intensity: 'intensity',
  injuries: { aclL: true, aclR: true, patella: true, flare: false, other: '' },
  diet: { approach: 'rules', meals: 4, pref: 'omnivore', alcohol: 1, flex: 1 },
};
const GOAL_LABEL = { fatloss: 'Fat loss — smaller waist', strength: 'Get stronger — bench 225 for reps', muscle: 'Build muscle — chest, arms, shoulders', endurance: 'Endurance (triathlon later)', explosive: 'Explosiveness', hockey: 'Hockey' };
const hasKnee = P => !!(P.injuries && (P.injuries.aclL || P.injuries.aclR || P.injuries.patella));

function computeTargets(P) {
  const kg = P.weight / 2.20462, cm = P.heightIn * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * P.age + (P.sex === 'female' ? -161 : 5);
  const tdee = bmr * (1.2 + 0.05 * Math.min(7, Math.max(3, P.days)));
  const g = P.goals || [], prim = P.primary || g[0];
  let adj = 0;
  if (prim === 'fatloss' || (g.includes('fatloss') && prim !== 'muscle')) adj = -0.22;
  else if (prim === 'muscle') adj = g.includes('fatloss') ? -0.1 : 0.05;
  const kcal = Math.max(1600, Math.round(tdee * (1 + adj) / 50) * 50);
  const protein = Math.round((g.includes('muscle') || g.includes('fatloss') || g.includes('strength') ? P.goalWeight * 0.95 : P.goalWeight * 0.8) / 5) * 5;
  const meals = (P.diet && P.diet.meals) || 4;
  return { kcal, protein, tdee: Math.round(tdee), perMeal: Math.round(protein / meals) };
}

function nutritionRules(P, T) {
  const d = P.diet || {}, veg = d.pref === 'vegetarian' || d.pref === 'vegan';
  const r = [`≈${(T.kcal - 50).toLocaleString()}–${(T.kcal + 50).toLocaleString()} kcal · protein ≥${T.protein} g/day`,
    `${d.meals || 4} meals × ~${T.perMeal} g protein${veg ? ' (Greek yogurt, eggs, tofu, seitan, whey)' : ''}`,
    'Half the plate plants', 'Carbs around training (pre + post)', 'Mostly zero-cal drinks',
    `Alcohol ≤${d.alcohol ?? 1} night/week · ${d.flex ?? 1} flexible meal/week`, 'Creatine 5 g/day, every day'];
  if (d.approach === 'count') r.splice(1, 0, 'Log every meal in Food — calories and protein');
  if ((P.goals || []).includes('hockey')) return FOOD_PLAN.concat(['Half the plate plants', 'Carbs around training (pre + post)', 'Creatine 5 g/day, every day']); // v2.5 plan
  return r;
}

/* weekly template: 7 codes Mon..Sun (null = rest). Default (7 days, hockey) = his plan. */
function weeklyTemplate(P, k) {
  const hockey = (P.goals || []).includes('hockey'), d = Math.min(7, Math.max(3, P.days || 7));
  if (hockey && (k == null || k >= NEW_PLAN_START)) { // v2.5 plan: lifts midday · no swim for now
    const t = { 7: ['UA', 'MTB', 'LOW', 'UB', 'UC', 'SAT', 'HOCKEY'], 6: ['UA', 'MTB', 'LOW', 'UB', 'UC', null, 'HOCKEY'], 5: ['UA', null, 'LOW', 'UB', 'UC', null, 'HOCKEY'], 4: ['UA', null, 'LOW', null, 'UC', null, 'HOCKEY'], 3: ['UA', null, null, 'UB', 'UC', null, 'HOCKEY'] };
    return t[d];
  }
  if (hockey) {
    const t = { 7: ['UA', 'RUN', 'LOW', 'SWIM', 'UB', 'LONG', 'HOCKEY'], 6: ['UA', 'RUN', 'LOW', 'SWIM', 'UB', null, 'HOCKEY'], 5: ['UA', 'RUN', 'LOW', null, 'UB', null, 'HOCKEY'], 4: ['UA', null, 'LOW', null, 'UB', null, 'HOCKEY'], 3: ['UA', null, 'LOW', null, 'UB', null, 'HOCKEY'] };
    return t[d];
  }
  const t = { 7: ['UA', 'RUN', 'LOW', 'SWIM', 'UB', 'LONG', 'REC'], 6: ['UA', 'RUN', 'LOW', 'SWIM', 'UB', 'LONG', null], 5: ['UA', 'RUN', 'LOW', 'SWIM', 'UB', null, null], 4: ['UA', 'RUN', 'LOW', null, 'UB', null, null], 3: ['UA', null, 'LOW', null, 'UB', null, null] };
  return t[d];
}
const CODE_NAME = { UC: 'Upper C', MTB: 'MTB', SAT: 'Run or MTB', UA: 'Upper A', UB: 'Upper B', LOW: 'Lower', RUN: 'Run + core', SWIM: 'Swim', LONG: 'Long aerobic', HOCKEY: 'Hockey', REC: 'Recovery', RUN2: 'Run 2', TEST: 'Test day', SPIN: 'Easy spin' };

/* ---------- date helpers (local time — device is America/Chicago) ---------- */
const pad = n => String(n).padStart(2, '0');
const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const pkey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (k, n) => { const d = pkey(k); d.setDate(d.getDate() + n); return dkey(d); };
const diffDays = (a, b) => Math.round((pkey(b) - pkey(a)) / 864e5);
const dow = k => (pkey(k).getDay() + 6) % 7; // 0 = Mon
const PLAN_START = '2026-10-05', PLAN_END = '2026-12-31';
function weekNum(k) { return 2 + Math.floor(diffDays(PLAN_START, k) / 7); }
function weekStart(k) { return addDays(k, -dow(k)); }
function inPlan(k) { return k >= PLAN_START && k <= PLAN_END; }
function blockFor(k) { return BLOCKS.find(b => k >= b.start && k <= b.end) || null; }
function weekMeta(wk) {
  const start = addDays(PLAN_START, (wk - 2) * 7);
  const end = wk === 14 ? PLAN_END : addDays(start, 6);
  const deload = wk === 5 || wk === 9, finals = wk === 11, test = wk === 2 || wk === 5 || wk === 9 || wk === 14;
  const testKey = { 2: 'baseline', 5: 'nov1', 9: 'nov29', 14: 'dec31' }[wk] || null;
  const note = { 2: 'Baseline test week — log your tests this week.', 5: 'Deload (−40% volume). Tests Nov 1.', 9: 'Thanksgiving deload. Tests Nov 29.', 11: 'Finals week — volume reduced, keep intensity.', 14: 'Final week — tests on Dec 31.' }[wk] || '';
  return { wk, start, end, block: blockFor(start), deload, finals, test, testKey, note };
}
const WEEKS = []; for (let w = 2; w <= 14; w++) WEEKS.push(weekMeta(w));
const liftMod = wk => { const m = weekMeta(wk); return m.deload ? 'deload' : m.finals ? 'reduced' : 'normal'; };

/* ---------- cardio prescriptions (week-based progressions) ---------- */
function runTue(wk) {
  const core = { checklist: CORE_CIRCUIT };
  if (wk <= 5) { const min = { 2: 25, 3: 30, 4: 35, 5: 25 }[wk]; return { mode: 'run', title: `Easy Run ${min}′ + Core`, min, why: 'RUN', steps: [['Warm-up', '5 min brisk walk + leg swings'], [`${min} min`, 'Easy, conversational (RPE 4–5)'], ['Core + mobility', '10 min circuit']], ...core }; }
  if (wk <= 9) {
    if (wk === 9) return { mode: 'run', title: 'Easy Run 25′ + Core', min: 25, why: 'RUN', steps: [['25 min', 'Easy, conversational — deload, no strides'], ['Core + mobility', '10 min']], ...core };
    return { mode: 'run', title: 'Run 30′ + 6×20s Strides', min: 34, why: wk === 6 ? 'STRIDES' : 'RUN', steps: [['30 min', 'Easy, conversational (RPE 4–5)'], ['6 × 20 s', 'Strides — fast & relaxed, ~85%, walk back'], ['Core + mobility', '10 min']], ...core };
  }
  if (wk <= 13) { const reps = wk === 11 ? 4 : 5; return { mode: 'run', title: `Intervals ${reps}×3′`, min: 15 + reps * 5, why: 'INTERVALS', steps: [['Warm-up', '10 min easy + 2 strides'], [`${reps} × 3 min`, 'Strong (RPE 7–8) / 2 min easy jog'], ['Cool-down', '5 min easy'], ['Core', '8 min circuit']], ...core }; }
  return { mode: 'run', title: 'Shakeout 20′ + 4 Strides', min: 22, why: 'RUN', steps: [['20 min', 'Easy shakeout before test day'], ['4 × 20 s', 'Relaxed strides']], ...core };
}
function run2(wk) {
  const m = { 7: 20, 8: 25, 9: 20, 10: 35, 11: 30, 12: 40, 13: 45 }[wk];
  if (!m) return null;
  const long = wk >= 10;
  return { mode: 'run', title: long ? `Long Easy Run ${m}′` : `Run 2 · Easy ${m}′`, min: m, why: 'RUN2', steps: [[`${m} min`, long ? 'Long & easy (RPE 4) — separate from the lift if possible' : 'Easy (RPE 4) after Upper A or later in the day']], tip: wk === 7 ? 'New impact stressor this week = 2nd run. Nothing else new.' : '' };
}
function swimThu(wk) {
  const S = {
    2: ['10×25 yd · 30″ rest', 350, [['Warm-up', '2×25 easy + 2×25 kick w/ board'], ['Main', '10 × 25 yd freestyle, 30 s rest'], ['Drill', '2 × 25 catch-up drill']]],
    3: ['12×25 yd · 25″ rest', 450, [['Warm-up', '4×25 easy/kick'], ['Main', '12 × 25 yd, 25 s rest'], ['Drill', '2 × 25 side-kick breathing']]],
    4: ['6×50 yd · 30″ rest', 550, [['Warm-up', '4×25 easy + 2×25 kick'], ['Main', '6 × 50 yd, 30 s rest'], ['Cool-down', '2×25 easy']]],
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
  return { mode: 'swim', title: 'Swim · ' + S[0], dist: S[1], min: 30, why: 'SWIM', steps: S[2] };
}
function bikeSat(wk) {
  const m = { 2: 45, 3: 50, 4: 60, 5: 40, 6: 60, 7: 65, 8: 75, 9: 50, 10: 75, 11: 60, 12: 85, 13: 90 }[wk];
  if (!m) return null;
  const build = wk >= 6 && wk <= 8;
  const steps = build ? [['Warm-up', '15 min easy'], ['3 × 5 min', 'Moderately hard (RPE 6–7), 5 min easy between'], ['Rest of ride', `Easy Z2 to ${m} min`]]
    : [[`${m} min`, 'Easy aerobic Z2 (RPE 3–5) — MTB or stationary'], ['Fuel', m >= 75 ? 'Bring carbs + water' : 'Water']];
  return { mode: 'bike', title: `Long Aerobic Bike ${m}′`, min: m, why: 'LONG', steps, tip: 'Day before hockey: no running, keep legs easy.' };
}

function mtbTue(wk) {
  const m = wk === 9 || wk === 11 ? 40 : wk >= 12 ? 60 : 50;
  return { mode: 'bike', title: `MTB ${m}′`, min: m, why: 'MTB', steps: [[`${m} min`, 'Mountain bike, mostly zone 2 (RPE 4–6) — climbs are fine'], ['Effort', 'Log effort 1–10. Went hard (≥7)? Keep Wednesday’s lower day light or move it a day.']] };
}
function satCardio(wk) {
  const m = wk === 9 ? 25 : 30;
  return { mode: 'run', title: `Run ${m === 25 ? 25 : '25–30'}′ or MTB`, min: m, why: 'SAT', steps: [[`${m === 25 ? 25 : '25–30'} min`, 'Easy run (RPE 4–5) — or ride the MTB instead if knees or legs are cranky'], ['Tomorrow', 'Hockey — keep it easy today']] };
}

/* sets for a slot given week modifier and profile style */
function buildSets(slot, mod, P, k) {
  const sets = [], endu = P && P.style === 'endurance', vol = P && P.intensity === 'volume' && mod === 'normal' ? 1 : 0;
  if (slot.role === 'bench') { // intensity over volume: heavy top set + 2–3 back-offs at −10%
    const ph = benchPhase(k);
    if (ph.single && mod === 'normal') sets.push({ tag: 'Single', rpeT: '8' });
    sets.push({ tag: 'Top', rpeT: mod === 'deload' ? '7' : ph.top });
    const bo = mod === 'normal' ? (endu ? 2 : ph.bo) : 1;
    for (let i = 0; i < bo; i++) sets.push({ tag: 'Back-off', rpeT: mod === 'deload' ? '6–7' : '7–8', pct: 0.9 });
  } else if (slot.role === 'tech') {
    const n = mod === 'normal' ? 3 : 2; // v2.6: working sets RPE 8 (1–2 RIR)
    for (let i = 0; i < n; i++) sets.push({ tag: 'Set', rpeT: mod === 'deload' ? '7' : '8' });
  } else if (slot.role === 'main') { // v2.6: top set + 2 back-offs (6–10 reps) at −10%
    sets.push({ tag: 'Top', rpeT: mod === 'deload' ? '7' : '8–9' });
    const bo = (mod === 'normal' && !endu ? 2 : 1) + vol;
    for (let i = 0; i < bo; i++) sets.push({ tag: 'Back-off', rpeT: mod === 'deload' ? '7' : '8–9', pct: 0.9 });
  } else if (slot.role === 'power') {
    const n = mod === 'normal' ? (slot.sets || 3) : 2;
    for (let i = 0; i < n; i++) sets.push({ tag: 'Set', rpeT: 'Max intent' });
  } else {
    const base = slot.n || 2; // v2.6: 2–3 hard sets of 8–15 near failure (RPE 8–9); deload drops a set at RPE 7
    const n = (mod === 'normal' && !endu ? base : Math.max(1, base - 1)) + vol;
    for (let i = 0; i < n; i++) sets.push({ tag: 'Hard', rpeT: mod === 'deload' ? '7' : '8–9' });
  }
  return sets;
}

/* profile-driven automatic exercise choices */
const BASIC_GYM_SWAP = { cable_lateral: 'lateral_raise', bayesian_curl: 'incline_curl', seated_ham_curl: 'ball_curl', incline_bench: 'incline_db', cs_row: 'db_row', cable_fly: 'db_fly', lat_pulldown: 'neutral_pullup', cable_row: 'db_row', rear_delt_fly: 'db_rear_fly', pushdown: 'oh_db_ext', oh_triceps: 'oh_db_ext', ez_curl: 'hammer_curl', leg_press: 'goblet_squat', ham_curl: 'ball_curl', calf_raise: 'db_calf', machine_press: 'seated_db_press', lateral_raise: 'lateral_raise', rdl: 'db_rdl' };
const FLARE_SWAP = { broad_jump: 'medball_throw', leg_press: 'hip_thrust', split_squat: 'step_up', calf_raise: 'seated_calf', back_squat: 'hip_thrust', goblet_squat: 'single_leg_hip_thrust' };
function profileExercise(slot, P) {
  let id = slot.ex;
  if ((slot.id === 'lo3' || slot.id === 'ls2') && !hasKnee(P)) id = 'back_squat';
  if (slot.id === 'lo1' && !(P.goals || []).includes('explosive')) id = 'kb_swing';
  if (P.gym === 'basic' && BASIC_GYM_SWAP[id]) id = BASIC_GYM_SWAP[id];
  if (P.injuries && P.injuries.flare && FLARE_SWAP[id]) id = FLARE_SWAP[id];
  return id;
}
function slotsFor(tpl, P) {
  const maxPri = P.sessionMin >= 60 ? 3 : P.sessionMin >= 45 ? 2 : 1;
  return TEMPLATES[tpl].slots.filter(s => s.pri <= maxPri);
}
function scaleMin(m, P) { if (!m) return m; const f = P.style === 'strength' ? 0.75 : P.style === 'endurance' ? 1.15 : 1; return Math.round(m * f / 5) * 5; }

/* ---------- the base day generator (profile → sessions) ---------- */
/* v2.6: deload week (Oct 26 – Nov 1) after hard MTB Mon + Tue — Wed push, Thu pull, earliest lower day Fri. Sat/Sun and Nov 2+ unchanged. */
const DELOAD_W5 = { '2026-10-28': ['pushP', 'PUSH', 'PUSHD'], '2026-10-29': ['pullP', 'PULL', 'PULLD'], '2026-10-30': ['lowerS', 'LOW', 'LOWD'] };
function basePlan(k, P) {
  P = P || DEFAULT_PROFILE;
  if (!inPlan(k)) return null;
  const wk = weekNum(k), meta = weekMeta(wk), d = dow(k), sessions = [], mod = liftMod(wk);
  const flare = P.injuries && P.injuries.flare;
  const lift = (t, code, whyKey) => {
    const T = TEMPLATES[t], fin = t === 'upperB' && P.sessionMin >= 45 ? (P.bike === 'none' ? { mode: 'walk', title: 'Incline walk finisher', min: 15, steps: [['15 min', 'Incline treadmill walk, easy']] } : T.finisher) : null;
    return { kind: 'lift', tpl: t, code, mod, title: T.title, sub: T.focus.replace(' + easy bike', fin ? ' + easy ' + (fin.mode === 'walk' ? 'walk' : 'bike') : ''), icon: T.icon, color: T.color, min: Math.min(P.sessionMin, T.est), why: WHY[whyKey || code] + (mod !== 'normal' ? ' ' + WHY[mod] : ''), finisher: fin };
  };
  const cardio = (c, code) => {
    if (!c) return null;
    c = { ...c, min: scaleMin(c.min, P) };
    if (c.mode === 'run' && flare) c = { ...c, mode: 'bike', title: c.title.replace(/Run|Intervals|Shakeout/, 'Bike') + ' (knee flare)', steps: [[`${c.min} min`, 'Bike instead of run while the knee is flared'], ...c.steps.slice(-1)] };
    if (c.mode === 'swim' && !P.pool) c = P.bike === 'none' ? { mode: 'walk', title: 'Row/Elliptical Intervals 30′', min: 30, why: 'SWIM', steps: [['30 min', '10 × 1 min moderate / 1 min easy — no impact']] } : { mode: 'bike', title: 'Bike Intervals 30′ (no pool)', min: 30, why: 'SWIM', steps: [['30 min', '10 × 1 min moderate / 1 min easy']] };
    if (c.mode === 'bike' && P.bike === 'none') c = { ...c, mode: 'walk', title: c.title.replace('Bike', 'Hike/Walk'), steps: [[`${c.min} min`, 'Brisk walk or hike, zone 2']] };
    if (c.mode === 'bike' && P.bike === 'stationary') c = { ...c, steps: c.steps.map(s => [s[0], s[1].replace('MTB or stationary', 'stationary bike')]) };
    if (c.mode === 'bike' && P.bike === 'mtb') c = { ...c, steps: c.steps.map(s => [s[0], s[1].replace('MTB or stationary', 'mountain bike')]) };
    const icon = { run: 'R', swim: 'S', bike: 'B', walk: 'W', hockey: 'H' }[c.mode];
    return { kind: 'cardio', code, cardio: c, title: c.title, sub: c.steps.map(s => s[0]).join(' · '), icon, color: c.mode === 'walk' ? 'bike' : c.mode, min: c.min, why: WHY[c.why || code] + (mod === 'deload' && code !== 'HOCKEY' ? ' ' + WHY.deload : '') };
  };
  const hockeyS = () => ({ kind: 'cardio', code: 'HOCKEY', cardio: { mode: 'hockey', title: 'Hockey', min: 75, steps: [['Game / skate', 'Warm up hips + groin first. Log knee pain after.']] }, title: 'Hockey 🏒', sub: 'Sunday skate', icon: 'H', color: 'hockey', min: 75, why: WHY.HOCKEY });
  const testS = (key, big) => ({ kind: 'test', code: 'TEST', testKey: key, title: big ? 'Final Test Day 🏁' : 'Test Day', sub: big ? (k >= NEW_PLAN_START ? 'Waist · avg weight · Bench AMRAP · Pull-ups · Mile · Broad jump' : 'Mile · 100 yd swim · Pull-ups · Bench AMRAP · Broad jump · Waist') : k >= NEW_PLAN_START ? 'Waist · avg weight · pull-ups · bench AMRAP @ ~85% (no swim for now)' : 'Avg weight · waist · pull-ups · bench AMRAP @ ~85% (+ mile/swim/jump earlier this week)', icon: 'T', color: 'test', min: big ? 75 : 20, why: WHY.TEST });
  const tpl = weeklyTemplate(P, k), np = k >= NEW_PLAN_START;
  if (wk === 14) {
    if (d === 0) sessions.push(lift('upperA', 'UA'));
    if (d === 1 && tpl[1]) sessions.push(np ? cardio({ ...mtbTue(14), min: 30, title: 'Easy MTB 30′', steps: [['30 min', 'Easy spin on the MTB — fresh legs for tests']] }, 'MTB') : cardio(runTue(14), 'RUN'));
    if (d === 2) sessions.push(cardio({ mode: 'bike', title: 'Easy Spin 20′ + Mobility', min: 20, why: 'SPIN', steps: [['20 min', 'Easy spin — fresh legs for tests'], ['Mobility', '10 min routine']], checklist: MOBILITY }, 'SPIN'));
    if (d === 3) sessions.push(testS('dec31', true));
  } else {
    const code = tpl[d], w5 = DELOAD_W5[k];
    if (w5) { sessions.push(lift(w5[0], w5[1], w5[2])); } // v2.6: deload week reshuffle after the two MTB days
    else if (np) { // v2.5 plan
      if (code === 'UA') sessions.push(lift('upperA2', 'UA'));
      if (code === 'MTB') sessions.push(cardio(mtbTue(wk), 'MTB'));
      if (code === 'LOW') sessions.push(lift('lowerS', 'LOW', 'LOW2'));
      if (code === 'UB') sessions.push(lift('upperB2', 'UB', 'UB2'));
      if (code === 'UC') sessions.push(lift('upperC', 'UC'));
      if (code === 'SAT') sessions.push(cardio(satCardio(wk), 'SAT'));
      if (code === 'HOCKEY') sessions.push(hockeyS());
    } else {
    if (code === 'UA') { sessions.push(lift('upperA', 'UA')); if (P.days >= 6 && P.style !== 'strength') { const r = cardio(run2(wk), 'RUN2'); if (r) sessions.push(r); } }
    if (code === 'RUN') sessions.push(cardio(runTue(wk), 'RUN'));
    if (code === 'LOW') sessions.push(lift('lower', 'LOW'));
    if (code === 'SWIM') sessions.push(cardio(swimThu(wk), 'SWIM'));
    if (code === 'UB') sessions.push(lift('upperB', 'UB'));
    if (code === 'LONG') sessions.push(cardio(bikeSat(wk), 'LONG'));
    if (code === 'REC') sessions.push(cardio({ mode: 'swim', title: 'Recovery Swim/Walk 30′', min: 30, why: 'REC', steps: [['30 min', 'Very easy — swim, walk, or spin']] }, 'REC'));
    if (code === 'HOCKEY') sessions.push(hockeyS());
    }
    if (k === '2026-11-01' || k === '2026-11-29') sessions.push(testS(k === '2026-11-01' ? 'nov1' : 'nov29'));
  }
  const out = sessions.filter(Boolean);
  out.forEach(s => s.key = k + ':' + s.code);
  return { k, wk, meta, block: blockFor(k), sessions: out, dow: d };
}
const isRunS = s => s.cardio && s.cardio.mode === 'run';
const isLowerS = s => s.kind === 'lift' && (s.tpl === 'lower' || s.tpl === 'lowerS' || s.tpl === 'fullP'); // v2.6: full body has legs too (48-h rule)
const isHockeyS = s => s.cardio && s.cardio.mode === 'hockey';
const isImpactS = s => isRunS(s) || isLowerS(s) || isHockeyS(s);
const isUpperS = s => s.kind === 'lift' && ['upperA', 'upperA2', 'upperB', 'upperB2', 'upperC', 'pushP', 'pullP'].includes(s.tpl);

/* v2.6 hypertrophy audit helpers: muscles per exercise (1 = direct hard set, 0.5 = indirect), rest guidance, weekly sets */
const MUSCLES = {
  flat_bench: { chest: 1, triceps: 0.5 }, paused_bench: { chest: 1, triceps: 0.5 }, incline_db: { chest: 1, triceps: 0.5 }, incline_bench: { chest: 1, triceps: 0.5 },
  flat_db_press: { chest: 1, triceps: 0.5 }, machine_incline: { chest: 1, triceps: 0.5 }, machine_chest: { chest: 1, triceps: 0.5 }, close_grip_bench: { triceps: 1, chest: 0.5 },
  dips: { chest: 1, triceps: 0.5 }, pushup: { chest: 1, triceps: 0.5 }, cable_fly: { chest: 1 }, pec_deck: { chest: 1 }, db_fly: { chest: 1 },
  seated_db_press: { 'side delts': 0.5, triceps: 0.5 }, machine_press: { 'side delts': 0.5, triceps: 0.5 }, landmine_press: { 'side delts': 0.5, triceps: 0.5 },
  weighted_pullup: { back: 1, biceps: 0.5 }, neutral_pullup: { back: 1, biceps: 0.5 }, lat_pulldown: { back: 1, biceps: 0.5 }, single_pulldown: { back: 1, biceps: 0.5 },
  cs_row: { back: 1, 'rear delts': 0.5, biceps: 0.5 }, seal_row: { back: 1, 'rear delts': 0.5, biceps: 0.5 }, machine_row: { back: 1, 'rear delts': 0.5, biceps: 0.5 },
  cable_row: { back: 1, 'rear delts': 0.5, biceps: 0.5 }, db_row: { back: 1, 'rear delts': 0.5, biceps: 0.5 },
  lateral_raise: { 'side delts': 1 }, cable_lateral: { 'side delts': 1 }, machine_lateral: { 'side delts': 1 },
  rear_delt_fly: { 'rear delts': 1 }, db_rear_fly: { 'rear delts': 1 }, face_pull: { 'rear delts': 1 }, band_pull: { 'rear delts': 1 },
  db_curl: { biceps: 1 }, ez_curl: { biceps: 1 }, cable_curl: { biceps: 1 }, hammer_curl: { biceps: 1 }, incline_curl: { biceps: 1 }, bayesian_curl: { biceps: 1 },
  oh_triceps: { triceps: 1 }, oh_db_ext: { triceps: 1 }, skull_crusher: { triceps: 1 }, pushdown: { triceps: 1 }, jm_press: { triceps: 1 },
  rdl: { hams: 1, glutes: 1 }, db_rdl: { hams: 1, glutes: 1 }, trap_rdl: { hams: 0.5, glutes: 1, quads: 0.5 }, kb_swing: { hams: 0.5, glutes: 0.5 },
  leg_press: { quads: 1, glutes: 0.5 }, box_squat: { quads: 1, glutes: 0.5 }, belt_squat: { quads: 1, glutes: 0.5 }, back_squat: { quads: 1, glutes: 0.5 }, goblet_squat: { quads: 1, glutes: 0.5 },
  split_squat: { quads: 1, glutes: 0.5 }, step_up: { quads: 1, glutes: 0.5 }, reverse_lunge: { quads: 1, glutes: 0.5 },
  hip_thrust: { glutes: 1 }, single_leg_hip_thrust: { glutes: 1 }, ham_curl: { hams: 1 }, seated_ham_curl: { hams: 1 }, ball_curl: { hams: 1 },
  calf_raise: { calves: 1 }, seated_calf: { calves: 1 }, leg_press_calf: { calves: 1 }, db_calf: { calves: 1 },
};
const MUSCLE_ORDER = ['chest', 'back', 'side delts', 'rear delts', 'biceps', 'triceps', 'quads', 'hams', 'glutes', 'calves'];
const COMPOUND_ACC = new Set(['incline_db', 'incline_bench', 'flat_db_press', 'machine_incline', 'machine_chest', 'dips', 'pushup', 'cs_row', 'seal_row', 'machine_row', 'cable_row', 'db_row', 'lat_pulldown', 'single_pulldown', 'neutral_pullup', 'weighted_pullup', 'seated_db_press', 'machine_press', 'leg_press', 'goblet_squat', 'trap_rdl', 'rdl', 'db_rdl', 'hip_thrust', 'step_up', 'split_squat']);
function restLbl(role, exId) { // v2.6: 2–3 min on compounds, 60–90 s on isolations
  if (role === 'power') return '2 min'; if (role === 'hold') return '60 s';
  if (['main', 'bench', 'tech'].includes(role)) return '2–3 min';
  return COMPOUND_ACC.has(exId) ? '2 min' : '60–90 s';
}
const boReps = sl => [Math.max(6, sl.reps[0] + 2), 10]; // main-lift back-offs: 6–10 reps at −10%
function tplSets(tpl, mod, P, k) { // hard working sets per muscle for one session (warm-ups never counted)
  const out = {}; for (const sl of slotsFor(tpl, P)) { const id = profileExercise(sl, P), m = MUSCLES[id]; if (!m) continue; const n = buildSets(sl, mod || 'normal', P, k).length; for (const mu in m) out[mu] = (out[mu] || 0) + n * m[mu]; }
  return out;
}
function tplMinutes(tpl, mod, P, k) { // rough session length: 8′ warm-up + work + rest (supersets share rest)
  let sec = 480; const sl = slotsFor(tpl, P);
  sl.forEach((x, i) => { const id = profileExercise(x, P), n = buildSets(x, mod || 'normal', P, k).length, comp = ['main', 'bench', 'tech'].includes(x.role), rest = comp ? 165 : COMPOUND_ACC.has(id) ? 120 : 75, paired = x.ss && sl[i + 1] && sl[i + 1].ss === x.ss;
    sec += n * (45 + (paired ? 20 : rest)); });
  return Math.round(sec / 60);
}
