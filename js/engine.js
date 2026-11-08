/* Arnold Fit v3 — workout planner data.
   Reads arnoldfit.v1 and arnoldfit.plan.v1, adds fields, never deletes existing ones. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AF = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STORE_KEY = 'arnoldfit.v1';
  const PLAN_KEY = 'arnoldfit.plan.v1';
  const CRUNCH_GOAL = 5;
  const RECOVERY_DAYS = 4;
  const RECOVERY_SKIP = { Cardio: 1, Mobility: 1, Other: 1, Power: 1 };
  const KNEE_BAN = { back_squat: 1, box_squat: 1, goblet_squat: 1, belt_squat: 1, split_squat: 1, reverse_lunge: 1, lunge: 1, rdl: 1, deadlift: 1, trap_rdl: 1 };

  const LIB = {
    flat_bench: { n: 'Barbell Bench Press', m: 'Chest', eq: 'Barbell', rest: 150, inc: 5, cue: 'Feet planted, bar to the lower chest, press back over the shoulders.', alts: ['incline_db', 'machine_chest', 'flat_db_press', 'pec_deck'] },
    incline_db: { n: 'Incline DB Press', m: 'Chest', eq: 'Dumbbells', rest: 150, inc: 5, cue: 'About 30 degrees. Deep stretch, then drive.', alts: ['flat_bench', 'machine_incline', 'pec_deck'] },
    machine_incline: { n: 'Machine Incline Press', m: 'Chest', eq: 'Machine', rest: 150, inc: 5, alts: ['incline_db', 'flat_bench'] },
    flat_db_press: { n: 'Flat DB Press', m: 'Chest', eq: 'Dumbbells', rest: 150, inc: 5, alts: ['flat_bench', 'machine_chest'] },
    machine_chest: { n: 'Machine Chest Press', m: 'Chest', eq: 'Machine', rest: 150, inc: 5, alts: ['flat_bench', 'incline_db'] },
    pec_deck: { n: 'Machine Chest Fly', m: 'Chest', eq: 'Machine', rest: 75, inc: 2.5, small: 1, cue: 'Soft elbows. Squeeze for a second.', alts: ['db_fly', 'incline_db'] },
    db_fly: { n: 'DB Fly', m: 'Chest', eq: 'Dumbbells', rest: 75, inc: 2.5, small: 1, alts: ['pec_deck'] },
    cs_row: { n: 'Chest-Supported Row', m: 'Back', eq: 'Machine', rest: 120, inc: 5, cue: 'Chest on the pad. Pull elbows toward your hips.', alts: ['cable_row', 'machine_row', 'db_row'] },
    cable_row: { n: 'Cable Row', m: 'Back', eq: 'Cable', rest: 120, inc: 5, cue: 'Tall chest. Pause at the squeeze.', alts: ['cs_row', 'machine_row', 'db_row'] },
    machine_row: { n: 'Machine Row', m: 'Back', eq: 'Machine', rest: 120, inc: 5, alts: ['cs_row', 'cable_row'] },
    db_row: { n: 'One-Arm DB Row', m: 'Back', eq: 'Dumbbells', rest: 120, inc: 5, alts: ['cs_row', 'cable_row'] },
    seal_row: { n: 'Seal Row', m: 'Back', eq: 'Barbell', rest: 120, inc: 5, alts: ['cs_row'] },
    lat_pulldown: { n: 'Lat Pulldown', m: 'Back', eq: 'Cable', rest: 120, inc: 5, cue: 'Chest up. Bar to the upper chest.', alts: ['pullup', 'neutral_pullup'] },
    pullup: { n: 'Pull-up or Assisted Pull-up', m: 'Back', eq: 'Bar', rest: 120, inc: 5, bw: 1, cue: '0 is bodyweight. Full hang, then chin over the bar.', alts: ['lat_pulldown', 'neutral_pullup', 'assisted_pullup'] },
    neutral_pullup: { n: 'Neutral-Grip Pull-up', m: 'Back', eq: 'Bar', rest: 120, inc: 5, bw: 1, alts: ['pullup', 'lat_pulldown'] },
    assisted_pullup: { n: 'Assisted Pull-up', m: 'Back', eq: 'Machine', rest: 120, inc: 5, cue: 'Log the assist if you want. Less assist is the win.', alts: ['pullup', 'lat_pulldown'] },
    single_pulldown: { n: 'Single-Arm Pulldown', m: 'Back', eq: 'Cable', rest: 90, inc: 5, alts: ['lat_pulldown'] },
    seated_db_press: { n: 'Seated DB Shoulder Press', m: 'Shoulders', eq: 'Dumbbells', rest: 120, inc: 5, cue: 'Back on the pad. Press slightly in front of your face.', alts: ['machine_press'] },
    machine_press: { n: 'Machine Shoulder Press', m: 'Shoulders', eq: 'Machine', rest: 120, inc: 5, alts: ['seated_db_press'] },
    lateral_raise: { n: 'Lateral Raise', m: 'Shoulders', eq: 'Dumbbells', rest: 60, inc: 2.5, small: 1, cue: 'Lead with the elbows. Stop at shoulder height.', alts: ['cable_lateral', 'machine_lateral'] },
    cable_lateral: { n: 'Cable Lateral Raise', m: 'Shoulders', eq: 'Cable', rest: 60, inc: 2.5, small: 1, alts: ['lateral_raise', 'machine_lateral'] },
    machine_lateral: { n: 'Machine Lateral Raise', m: 'Shoulders', eq: 'Machine', rest: 60, inc: 2.5, small: 1, alts: ['lateral_raise', 'cable_lateral'] },
    rear_delt_fly: { n: 'Rear Delt Fly', m: 'Rear delts', eq: 'Machine', rest: 60, inc: 2.5, small: 1, cue: 'Arms wide. Lead with the pinkies.', alts: ['face_pull', 'db_rear_fly'] },
    face_pull: { n: 'Face Pull', m: 'Rear delts', eq: 'Cable', rest: 60, inc: 2.5, small: 1, alts: ['rear_delt_fly', 'db_rear_fly'] },
    db_rear_fly: { n: 'DB Rear Delt Fly', m: 'Rear delts', eq: 'Dumbbells', rest: 60, inc: 2.5, small: 1, alts: ['rear_delt_fly', 'face_pull'] },
    db_curl: { n: 'Curl', m: 'Biceps', eq: 'Dumbbells', rest: 75, inc: 2.5, small: 1, cue: 'Supinate at the top. Lower slow.', alts: ['hammer_curl', 'ez_curl', 'cable_curl', 'incline_curl'] },
    hammer_curl: { n: 'Hammer Curl', m: 'Biceps', eq: 'Dumbbells', rest: 75, inc: 2.5, small: 1, cue: 'Neutral grip. No swing.', alts: ['db_curl', 'cable_curl'] },
    ez_curl: { n: 'EZ-Bar Curl', m: 'Biceps', eq: 'Barbell', rest: 75, inc: 5, alts: ['db_curl', 'cable_curl'] },
    cable_curl: { n: 'Cable Curl', m: 'Biceps', eq: 'Cable', rest: 75, inc: 2.5, small: 1, alts: ['db_curl', 'hammer_curl'] },
    incline_curl: { n: 'Incline Curl', m: 'Biceps', eq: 'Dumbbells', rest: 75, inc: 2.5, small: 1, alts: ['db_curl', 'hammer_curl'] },
    pushdown: { n: 'Triceps Pushdown', m: 'Triceps', eq: 'Cable', rest: 75, inc: 2.5, small: 1, cue: 'Elbows pinned. Full lockout.', alts: ['oh_triceps', 'oh_db_ext'] },
    oh_triceps: { n: 'Overhead Triceps', m: 'Triceps', eq: 'Cable', rest: 75, inc: 2.5, small: 1, cue: 'Stretch behind the head, then lock out.', alts: ['pushdown', 'oh_db_ext'] },
    oh_db_ext: { n: 'Overhead DB Triceps', m: 'Triceps', eq: 'Dumbbell', rest: 75, inc: 2.5, small: 1, alts: ['oh_triceps', 'pushdown'] },
    leg_press: { n: 'Leg Press', m: 'Quads', eq: 'Machine', rest: 150, inc: 5, cue: 'Comfortable range. Stop before the knee cares.', alts: ['leg_ext'] },
    leg_ext: { n: 'Leg Extension', m: 'Quads', eq: 'Machine', rest: 75, inc: 2.5, small: 1, cue: 'Light. Stop if the knee complains.', alts: ['leg_press'] },
    db_rdl: { n: 'DB RDL', m: 'Hamstrings', eq: 'Dumbbells', rest: 120, inc: 5, cue: 'Soft knees, hips back, dumbbells close to your legs.', alts: ['hip_hinge', 'ham_curl', 'seated_ham_curl'] },
    hip_hinge: { n: 'Hip Hinge Machine', m: 'Hamstrings', eq: 'Machine', rest: 120, inc: 5, cue: 'Soft knees, hips back.', alts: ['db_rdl', 'ham_curl'] },
    ham_curl: { n: 'Hamstring Curl', m: 'Hamstrings', eq: 'Machine', rest: 90, inc: 5, cue: 'Hips down. Slow on the way down.', alts: ['seated_ham_curl', 'db_rdl', 'hip_hinge'] },
    seated_ham_curl: { n: 'Seated Ham Curl', m: 'Hamstrings', eq: 'Machine', rest: 90, inc: 5, cue: 'Lean into the stretch.', alts: ['ham_curl', 'db_rdl'] },
    hip_thrust: { n: 'Hip Thrust', m: 'Glutes', eq: 'Machine', rest: 120, inc: 5, cue: 'Shins vertical at the top. Chin tucked.', alts: ['glute_bridge'] },
    glute_bridge: { n: 'Glute Bridge', m: 'Glutes', eq: 'Machine', rest: 90, inc: 5, alts: ['hip_thrust'] },
    calf_raise: { n: 'Calf Raise', m: 'Calves', eq: 'Machine', rest: 60, inc: 2.5, small: 1, cue: 'Pause in the stretch. Slow lower.', alts: ['seated_calf'] },
    seated_calf: { n: 'Seated Calf Raise', m: 'Calves', eq: 'Machine', rest: 60, inc: 2.5, small: 1, alts: ['calf_raise'] },
    back_ext: { n: 'Back Extension', m: 'Back', eq: 'Machine', rest: 75, inc: 5, cue: 'Hips on the pad. Don’t yank the top.', alts: ['hip_hinge'] },
    abs: { n: 'Abs', m: 'Abs', eq: 'Bodyweight', rest: 60, inc: 5, bw: 1, cue: 'Brace. Move slow.', alts: ['cable_crunch', 'knee_raise'] },
    cable_crunch: { n: 'Cable Crunch', m: 'Abs', eq: 'Cable', rest: 60, inc: 5, alts: ['abs', 'knee_raise'] },
    knee_raise: { n: 'Hanging Knee Raise', m: 'Abs', eq: 'Bar', rest: 60, inc: 5, bw: 1, alts: ['abs', 'cable_crunch'] },
    incline_walk: { n: 'Incline Walk or Bike', m: 'Cardio', eq: 'Cardio', mode: 'min', rest: 0, cue: 'Easy pace. You should be able to talk.', alts: ['bike'] },
    bike: { n: 'Bike', m: 'Cardio', eq: 'Cardio', mode: 'min', rest: 0, alts: ['incline_walk'] },
    mobility: { n: 'Mobility', m: 'Mobility', eq: 'Bodyweight', mode: 'check', rest: 0, cue: 'Hips, ankles, and upper back.', alts: [] },
  };

  /* Names for lifts already logged in older versions of the app. */
  const LEGACY = {
    incline_bench: ['Incline Barbell Bench', 'Chest'], weighted_pullup: ['Weighted Pull-up', 'Back'], landmine_press: ['Landmine Press', 'Shoulders'],
    skull_crusher: ['Skull Crusher', 'Triceps'], paused_bench: ['Paused Bench Press', 'Chest'], close_grip_bench: ['Close-Grip Bench', 'Chest'],
    jm_press: ['JM Press', 'Triceps'], dips: ['Dip', 'Triceps'], broad_jump: ['Broad Jump', 'Power'], medball_throw: ['Med-Ball Throw', 'Power'],
    kb_swing: ['Kettlebell Swing', 'Power'], rdl: ['Romanian Deadlift', 'Hamstrings'], trap_rdl: ['Trap-Bar RDL', 'Hamstrings'],
    box_squat: ['Box Squat', 'Quads'], belt_squat: ['Belt Squat', 'Quads'], split_squat: ['Split Squat', 'Quads'], step_up: ['Step-up', 'Quads'],
    reverse_lunge: ['Reverse Lunge', 'Quads'], single_leg_hip_thrust: ['Single-Leg Hip Thrust', 'Glutes'], ball_curl: ['Stability-Ball Curl', 'Hamstrings'],
    leg_press_calf: ['Leg-Press Calf Raise', 'Calves'], back_squat: ['Back Squat', 'Quads'], goblet_squat: ['Goblet Squat', 'Quads'],
    db_calf: ['Single-Leg Calf Raise', 'Calves'], copenhagen: ['Copenhagen Plank', 'Adductors'], side_plank: ['Side Plank', 'Core'],
    pushup: ['Push-up', 'Chest'], bayesian_curl: ['Bayesian Curl', 'Biceps'], band_pull: ['Band Pull-Apart', 'Rear delts'],
  };

  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DOWL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let todayOverride = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pkey(k) { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(k, n) { const d = pkey(k); d.setDate(d.getDate() + n); return dkey(d); }
  function dowMon(k) { return (pkey(k).getDay() + 6) % 7; }
  function weekStart(k) { return addDays(k, -dowMon(k)); }
  function today() { return todayOverride || dkey(new Date()); }
  function setToday(k) { todayOverride = /^\d{4}-\d{2}-\d{2}$/.test(k || '') ? k : null; }
  function isPreview() { return !!todayOverride; }
  function fmtMon(k) { const d = pkey(k); return MONS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtLong(k) { const d = pkey(k); return DOWL[dowMon(k)] + ', ' + MONS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtRange(ws) {
    const we = addDays(ws, 6), a = pkey(ws), b = pkey(we);
    if (a.getMonth() === b.getMonth()) return MONS[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate();
    return fmtMon(ws) + ' – ' + fmtMon(we);
  }
  function fmtTime(sec) { sec = Math.max(0, Math.round(+sec || 0)); return Math.floor(sec / 60) + ':' + pad(sec % 60); }
  function diffDays(a, b) { return Math.round((pkey(b) - pkey(a)) / 86400000); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function clamp(n, a, b) { n = Math.round(+n || 0); return Math.max(a, Math.min(b, n)); }
  function num(n) { if (n == null || n === '' || isNaN(+n)) return ''; const x = Math.round(+n * 100) / 100; return String(x); }
  function roundLb(lb) { return Math.round(+lb / 2.5) * 2.5; }

  function ex(id, sets, lo, hi, mode) { return { id: id, sets: sets, lo: lo, hi: hi, w: null, mode: mode || 'sets' }; }
  function defaultWeek() {
    return [
      { kind: 'lift', code: 'UA', title: 'Upper A', place: 'crunch', note: 'Hard sets. Leave 1–2 reps in the tank.', optional: [], items: [
        ex('flat_bench', 3, 5, 8), ex('cs_row', 3, 6, 10), ex('seated_db_press', 3, 6, 10), ex('lat_pulldown', 3, 8, 12),
        ex('lateral_raise', 2, 10, 15), ex('db_curl', 2, 8, 12), ex('pushdown', 2, 8, 12),
      ] },
      { kind: 'lift', code: 'LA', title: 'Lower A', place: 'crunch', note: 'Knee-friendly. Comfortable range. No squats, deadlifts, or lunges.', optional: [], items: [
        ex('leg_press', 3, 8, 12), ex('db_rdl', 3, 6, 10), ex('ham_curl', 3, 8, 12), ex('hip_thrust', 3, 6, 10),
        ex('calf_raise', 2, 10, 15), ex('abs', 2, 8, 15),
      ] },
      { kind: 'recovery', code: 'REC', title: 'Easy recovery', place: 'crunch', note: 'Keep it easy. Arms only if you want them.', items: [
        ex('incline_walk', 1, 20, 30, 'min'), ex('mobility', 1, 10, 10, 'check'), ex('abs', 2, 8, 15),
      ], optional: [ex('db_curl', 2, 8, 12), ex('pushdown', 2, 8, 12)] },
      { kind: 'lift', code: 'UB', title: 'Upper B', place: 'crunch', note: 'Hard sets. Leave 1–2 reps in the tank.', optional: [], items: [
        ex('incline_db', 3, 6, 10), ex('pullup', 3, 5, 8), ex('cable_row', 3, 8, 12), ex('pec_deck', 2, 10, 15),
        ex('rear_delt_fly', 2, 12, 15), ex('lateral_raise', 2, 10, 15), ex('hammer_curl', 2, 8, 12), ex('oh_triceps', 2, 8, 12),
      ] },
      { kind: 'lift', code: 'LB', title: 'Lower B', place: 'crunch', note: 'Shorter day. Same effort, fewer sets.', optional: [], items: [
        ex('hip_thrust', 2, 6, 10), ex('leg_ext', 2, 10, 15), ex('seated_ham_curl', 2, 8, 12), ex('back_ext', 2, 8, 12),
        ex('calf_raise', 2, 10, 15), ex('abs', 2, 8, 15),
      ] },
      { kind: 'rest', code: 'REST', title: 'Rest', place: null, note: 'Nothing to lift. Walk if you feel like it.', items: [], optional: [] },
      { kind: 'hockey', code: 'HK', title: 'Hockey', place: 'off', note: 'Skate. Log it when you are off the ice.', items: [], optional: [] },
    ];
  }

  function resolveEx(id, PE) {
    if (LIB[id]) return LIB[id];
    const custom = PE && PE.customEx && PE.customEx[id];
    if (custom) return { n: custom.n || id, m: custom.m || 'Other', eq: 'Yours', rest: 90, inc: 5, mode: 'sets', alts: [] };
    if (LEGACY[id]) return { n: LEGACY[id][0], m: LEGACY[id][1], eq: '', rest: 90, inc: LEGACY[id][1] === 'Shoulders' || LEGACY[id][1] === 'Biceps' || LEGACY[id][1] === 'Triceps' || LEGACY[id][1] === 'Calves' ? 2.5 : 5, small: LEGACY[id][1] === 'Biceps' || LEGACY[id][1] === 'Calves' ? 1 : 0, mode: 'sets', alts: [] };
    return { n: String(id || 'Exercise').replace(/_/g, ' '), m: 'Other', eq: '', rest: 90, inc: 5, mode: 'sets', alts: [] };
  }

  function freshStore() {
    return { v: 6, created: Date.now(), settings: { name: 'Christopher', units: { w: 'lb' }, haptics: true, sound: true }, workouts: [], fit3: { crunch: {} } };
  }
  function migrateStore(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return freshStore();
    if (!Array.isArray(s.workouts)) s.workouts = [];
    if (!s.settings || typeof s.settings !== 'object') s.settings = {};
    if (!s.fit3 || typeof s.fit3 !== 'object') s.fit3 = {};
    if (!s.fit3.crunch || typeof s.fit3.crunch !== 'object') s.fit3.crunch = {};
    if (!s.v || s.v < 6) s.v = 6;
    return s;
  }
  function migratePlan(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
    if (!Array.isArray(p.rules)) p.rules = [];
    if (!p.customSess || typeof p.customSess !== 'object') p.customSess = {};
    if (!p.customEx || typeof p.customEx !== 'object') p.customEx = {};
    const days = p.fit && Array.isArray(p.fit.template) ? p.fit.template : null;
    const ok = !!(days && days.length === 7 && days.every(d => d && typeof d === 'object' && Array.isArray(d.items)));
    if (!ok) p.fit = { v: 1, template: defaultWeek(), weeks: {} };
    else {
      if (!p.fit.weeks || typeof p.fit.weeks !== 'object') p.fit.weeks = {};
      if (!p.fit.v) p.fit.v = 1;
    }
    if (!p.v) p.v = 1;
    return p;
  }

  function load(storage) {
    let raw = null, praw = null;
    try { raw = storage.getItem(STORE_KEY); } catch (e) {}
    try { praw = storage.getItem(PLAN_KEY); } catch (e) {}
    let parsed = null, badStore = false;
    if (raw) {
      try { parsed = JSON.parse(raw); }
      catch (e) {
        badStore = true;
        try { storage.setItem(STORE_KEY + '.rescue-' + Date.now(), raw); } catch (e2) {}
      }
    }
    if (!badStore && raw) {
      try { if (!storage.getItem(STORE_KEY + '.backup-v2.9')) storage.setItem(STORE_KEY + '.backup-v2.9', raw); } catch (e) {}
    }
    let plan = null, badPlan = false;
    if (praw) {
      try { plan = JSON.parse(praw); }
      catch (e) {
        badPlan = true;
        try { storage.setItem(PLAN_KEY + '.rescue-' + Date.now(), praw); } catch (e2) {}
      }
    }
    const hadFit = !!(plan && plan.fit && Array.isArray(plan.fit.template) && plan.fit.template.length === 7);
    const S = migrateStore(badStore ? null : parsed);
    const PE = migratePlan(badPlan ? null : plan);
    if (!hadFit && !badPlan) {
      try { if (praw && !storage.getItem(PLAN_KEY + '.backup-pre-fit')) storage.setItem(PLAN_KEY + '.backup-pre-fit', praw); } catch (e) {}
      try { storage.setItem(PLAN_KEY, JSON.stringify(PE)); } catch (e) {}
    }
    return { S: S, PE: PE, badStore: badStore, badPlan: badPlan };
  }

  function normalizeItem(it, PE) {
    const lib = resolveEx(it.id, PE);
    const mode = it.mode || lib.mode || 'sets';
    let lo = clamp(it.lo != null ? it.lo : 8, 1, 100);
    let hi = clamp(it.hi != null ? it.hi : lo, 1, 100);
    if (hi < lo) hi = lo;
    const out = {
      id: it.id, mode: mode,
      sets: mode === 'sets' ? clamp(it.sets != null ? it.sets : (lib.small ? 2 : 3), 1, 10) : 1,
      lo: lo, hi: hi, w: it.w == null || it.w === '' ? null : +it.w,
    };
    if (it.wAt) out.wAt = it.wAt;
    return out;
  }
  function normalizeDay(d, PE) {
    const src = d || {};
    return {
      kind: src.kind || 'rest',
      code: src.code || 'REST',
      title: src.title || 'Rest',
      place: src.place == null ? null : src.place,
      note: src.note || '',
      items: (Array.isArray(src.items) ? src.items : []).filter(it => it && it.id).map(it => normalizeItem(it, PE)),
      optional: (Array.isArray(src.optional) ? src.optional : []).filter(it => it && it.id).map(it => normalizeItem(it, PE)),
    };
  }
  function dayFor(PE, k) {
    const i = dowMon(k), ws = weekStart(k);
    const bucket = PE.fit.weeks[ws];
    const ov = bucket && (bucket[i] || bucket[String(i)]);
    return normalizeDay(clone(ov || PE.fit.template[i]), PE);
  }
  function setDay(PE, k, day) {
    const i = String(dowMon(k)), ws = weekStart(k);
    if (!PE.fit.weeks[ws]) PE.fit.weeks[ws] = {};
    PE.fit.weeks[ws][i] = normalizeDay(clone(day), PE);
    return PE;
  }
  function setTemplateDay(PE, k, day) {
    PE.fit.template[dowMon(k)] = normalizeDay(clone(day), PE);
    return PE;
  }
  function swapDays(PE, k1, k2, every) {
    if (k1 === k2) return PE;
    if (every) {
      const i = dowMon(k1), j = dowMon(k2);
      const t = PE.fit.template;
      const tmp = t[i]; t[i] = t[j]; t[j] = tmp;
      Object.keys(PE.fit.weeks).forEach(ws => {
        const w = PE.fit.weeks[ws]; if (!w) return;
        const si = String(i), sj = String(j);
        const a = w[si], b = w[sj];
        if (a === undefined && b === undefined) return;
        if (a === undefined) delete w[sj]; else w[sj] = a;
        if (b === undefined) delete w[si]; else w[si] = b;
      });
    } else {
      const a = dayFor(PE, k1), b = dayFor(PE, k2);
      setDay(PE, k1, b);
      setDay(PE, k2, a);
    }
    return PE;
  }

  function alternatives(id, day, PE) {
    const lib = resolveEx(id, PE);
    const mode = lib.mode || 'sets';
    const explicit = (lib.alts || []).filter(k => LIB[k] && (LIB[k].mode || 'sets') === mode);
    const more = Object.keys(LIB).filter(k => k !== id && explicit.indexOf(k) < 0 && LIB[k].m === lib.m && (LIB[k].mode || 'sets') === mode);
    more.sort((a, b) => LIB[a].n.localeCompare(LIB[b].n));
    let list = explicit.concat(more);
    if (day && (day.code === 'LA' || day.code === 'LB')) list = list.filter(k => !KNEE_BAN[k]);
    return list;
  }
  function libraryGroups(day) {
    const order = ['Chest', 'Back', 'Shoulders', 'Rear delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Cardio', 'Mobility'];
    const lower = day && (day.code === 'LA' || day.code === 'LB');
    return order.map(m => ({
      m: m,
      ids: Object.keys(LIB).filter(id => LIB[id].m === m && !(lower && KNEE_BAN[id])),
    })).filter(g => g.ids.length);
  }

  function lastPerf(workouts, exId) {
    let best = null;
    (workouts || []).forEach(w => {
      if (!w || !w.endedAt) return;
      (w.exercises || []).forEach(e => {
        if ((e.ex || e.id) !== exId) return;
        const sets = (e.sets || []).filter(s => s && s.done && (s.r != null || s.w != null));
        if (!sets.length) return;
        const rec = { date: w.date, end: w.endedAt || 0, sets: sets };
        if (!best || rec.date > best.date || (rec.date === best.date && rec.end > best.end)) best = rec;
      });
    });
    return best;
  }
  function nextLoad(topLb, lib, unit) {
    const small = !!(lib && (lib.small || lib.inc === 2.5));
    if (unit === 'kg') {
      const step = small ? 1.25 : 2.5;
      const cur = topLb ? Math.round((topLb / 2.20462) * 4) / 4 : 0;
      return { w: (cur + step) * 2.20462, label: '+' + step + ' kg' };
    }
    const step = small ? 2.5 : 5;
    return { w: roundLb((+topLb || 0) + step), label: '+' + step + ' lb' };
  }
  function suggest(item, last, unit, PE) {
    if (!item || !last) return null;
    const lib = resolveEx(item.id, PE);
    if ((item.mode || lib.mode || 'sets') !== 'sets') return null;
    const hi = +item.hi, need = +item.sets || 1;
    const done = (last.sets || []).filter(s => s && s.done && s.r != null && +s.r > 0);
    if (done.length < need) return null;
    const use = done.slice(0, need);
    if (!use.every(s => +s.r >= hi)) return null;
    const topW = Math.max(0, ...use.map(s => +s.w || 0));
    const nxt = nextLoad(topW, lib, unit);
    return { w: nxt.w, text: 'All sets hit ' + hi + '. Try ' + nxt.label + '.' };
  }
  function planIsNewer(item, last) {
    return !!(item && item.w != null && item.wAt && last && item.wAt > (last.end || 0));
  }
  function prefill(item, last, unit, PE) {
    const lib = resolveEx(item.id, PE);
    const mode = item.mode || lib.mode || 'sets';
    const sug = mode === 'sets' && !planIsNewer(item, last) ? suggest(item, last, unit, PE) : null;
    const n = mode === 'sets' ? (item.sets || 1) : 1;
    const sets = [];
    for (let i = 0; i < n; i++) {
      if (mode === 'check') { sets.push({ w: null, r: null, done: false }); continue; }
      if (mode === 'min') { sets.push({ w: null, r: item.lo || 20, done: false }); continue; }
      let w = null, r = item.lo;
      if (planIsNewer(item, last)) { w = item.w; r = item.lo; }
      else if (sug) { w = sug.w; r = item.lo; }
      else if (last && last.sets[i]) { w = last.sets[i].w == null ? null : +last.sets[i].w; r = last.sets[i].r != null ? +last.sets[i].r : item.lo; }
      else if (last && last.sets.length) {
        const top = last.sets.reduce((a, s) => (+s.w || 0) >= (+a.w || 0) ? s : a, last.sets[0]);
        w = top.w == null ? null : +top.w; r = item.lo;
      } else if (item.w != null) w = item.w;
      sets.push({ w: w, r: r, done: false });
    }
    return { sets: sets, sug: sug };
  }

  function topSeries(workouts, exId) {
    const by = {};
    (workouts || []).forEach(w => {
      if (!w || !w.endedAt) return;
      (w.exercises || []).forEach(e => {
        if ((e.ex || e.id) !== exId) return;
        (e.sets || []).forEach(s => {
          if (!s || !s.done) return;
          const weight = s.w == null || s.w === '' ? null : +s.w;
          const reps = s.r == null || s.r === '' ? null : +s.r;
          if (weight == null && reps == null) return;
          const prev = by[w.date];
          const better = !prev || (weight || 0) > (prev.w || 0) || ((weight || 0) === (prev.w || 0) && (reps || 0) > (prev.r || 0));
          if (better) by[w.date] = { date: w.date, w: weight, r: reps };
        });
      });
    });
    return Object.values(by).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  }
  function chartValue(pts) {
    if (!pts.length) return null;
    return pts.some(p => p.w > 0) ? 'w' : 'r';
  }

  function countsAsCrunch(w) {
    if (!w || !w.endedAt) return false;
    if (w.place === 'crunch') return true;
    if (w.place === 'off' || w.kind === 'hockey' || w.kind === 'rest') return false;
    if (w.kind === 'recovery' || w.kind === 'lift') return true;
    if (w.kind === 'cardio') return false;
    const t = (w.title || '').toLowerCase();
    if (/hockey|run|mtb|swim|walk|bike|ride/.test(t)) return false;
    if (/upper|lower|push|pull|full|leg|chest|arm/.test(t)) return true;
    return false;
  }
  function crunchSet(S, ws) {
    const we = addDays(ws, 6), days = new Set();
    (S.workouts || []).forEach(w => { if (w.date >= ws && w.date <= we && countsAsCrunch(w)) days.add(w.date); });
    const flags = (S.fit3 && S.fit3.crunch) || {};
    Object.keys(flags).forEach(k => {
      if (k < ws || k > we) return;
      if (flags[k] === true) days.add(k);
      if (flags[k] === false) days.delete(k);
    });
    return days;
  }
  function recoveryMap(workouts, end, PE) {
    const from = addDays(end, -RECOVERY_DAYS);
    const map = {};
    (workouts || []).forEach(w => {
      if (!w || w.date < from || w.date > end) return;
      if (!w.endedAt && !w._live) return;
      (w.exercises || []).forEach(e => {
        if (!(e.sets || []).some(s => s && s.done)) return;
        const raw = e.muscle || resolveEx(e.ex || e.id, PE).m || '';
        String(raw).split('/').forEach(part => {
          const name = part.trim();
          if (!name || RECOVERY_SKIP[name]) return;
          if (!map[name] || map[name] < w.date) map[name] = w.date;
        });
      });
    });
    return Object.keys(map).map(m => ({ m: m, date: map[m], ago: diffDays(map[m], end) })).sort((a, b) => a.ago - b.ago || a.m.localeCompare(b.m));
  }

  function wOut(lb, unit) {
    if (lb == null || lb === '' || isNaN(+lb)) return '';
    if (unit === 'kg') return num(Math.round((+lb / 2.20462) * 4) / 4);
    return num(roundLb(lb));
  }
  function wIn(v, unit) {
    if (v == null || v === '' || isNaN(+v)) return null;
    return unit === 'kg' ? +v * 2.20462 : +v;
  }
  function unitOf(S) { return S && S.settings && S.settings.units && S.settings.units.w === 'kg' ? 'kg' : 'lb'; }
  function unitLabel(unit) { return unit === 'kg' ? 'kg' : 'lb'; }

  function prescript(item, unit, PE) {
    const lib = resolveEx(item.id, PE);
    const mode = item.mode || lib.mode || 'sets';
    if (mode === 'check') return 'Tap when done';
    if (mode === 'min') return item.lo + '–' + item.hi + ' min';
    let s = item.sets + '×' + item.lo + '–' + item.hi;
    if (item.w != null) s += ' · ' + wOut(item.w, unit) + ' ' + unitLabel(unit);
    return s;
  }
  function lastLine(last, mode, unit) {
    if (!last) return '';
    if (mode === 'check') return 'Last time · ' + fmtMon(last.date) + ' · done';
    if (mode === 'min') {
      const m = last.sets.find(s => s.r != null);
      return 'Last time · ' + fmtMon(last.date) + (m ? ' · ' + m.r + ' min' : '');
    }
    const bits = last.sets.filter(s => s.r != null).map(s => (s.w ? wOut(s.w, unit) : 'BW') + '×' + s.r);
    return 'Last time · ' + fmtMon(last.date) + ' · ' + bits.join(' · ');
  }
  function loggedLine(w, unit, PE) {
    const bits = [];
    (w.exercises || []).forEach(e => {
      const done = (e.sets || []).filter(s => s && s.done && s.r != null);
      if (!done.length) return;
      const lib = resolveEx(e.ex || e.id, PE);
      const mode = e.mode || lib.mode || 'sets';
      if (mode === 'min') bits.push(lib.n.split(' ')[0] + ' ' + done[0].r + 'm');
      else if (mode === 'check') bits.push(lib.n);
      else {
        const top = done.reduce((a, s) => ((+s.w || 0) > (+a.w || 0) || ((+s.w || 0) === (+a.w || 0) && (+s.r || 0) > (+a.r || 0))) ? s : a, done[0]);
        bits.push((e.name || lib.n).split(' ').slice(0, 2).join(' ') + ' ' + (top.w ? wOut(top.w, unit) : 'BW') + '×' + top.r);
      }
    });
    return bits.slice(0, 3).join(' · ');
  }

  return {
    STORE_KEY: STORE_KEY, PLAN_KEY: PLAN_KEY, CRUNCH_GOAL: CRUNCH_GOAL, LIB: LIB, LEGACY: LEGACY, KNEE_BAN: KNEE_BAN, DOW: DOW,
    dkey: dkey, pkey: pkey, addDays: addDays, dowMon: dowMon, weekStart: weekStart, today: today, setToday: setToday, isPreview: isPreview,
    fmtMon: fmtMon, fmtLong: fmtLong, fmtRange: fmtRange, fmtTime: fmtTime, diffDays: diffDays, clone: clone, uid: uid,
    defaultWeek: defaultWeek, resolveEx: resolveEx, migrateStore: migrateStore, migratePlan: migratePlan, load: load,
    normalizeDay: normalizeDay, dayFor: dayFor, setDay: setDay, setTemplateDay: setTemplateDay, swapDays: swapDays,
    alternatives: alternatives, libraryGroups: libraryGroups, lastPerf: lastPerf, suggest: suggest, prefill: prefill,
    topSeries: topSeries, chartValue: chartValue, countsAsCrunch: countsAsCrunch, crunchSet: crunchSet, recoveryMap: recoveryMap,
    wOut: wOut, wIn: wIn, unitOf: unitOf, unitLabel: unitLabel, prescript: prescript, lastLine: lastLine, loggedLine: loggedLine,
    nextLoad: nextLoad,
  };
});
