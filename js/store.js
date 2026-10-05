/* Arnold Fit — localStorage store, units, analytics */
'use strict';
const STORE_KEY = 'arnoldfit.v1';
const DEFAULT_HABITS = [
  { id: 'protein', label: 'Protein 190g', ic: '🥩' },
  { id: 'mobility', label: '10-min mobility', ic: '🧘' },
  { id: 'creatine', label: 'Creatine', ic: '💊' },
  { id: 'steps', label: '8k+ steps', ic: '👟' },
  { id: 'sleep', label: '8h sleep', ic: '😴' },
  { id: 'water', label: 'Water', ic: '💧' },
  { id: 'noalc', label: 'No alcohol', ic: '🚫' },
  { id: 'weigh', label: 'Weigh-in', ic: '⚖️' },
];
function defaultState() {
  return {
    v: 1, created: Date.now(),
    settings: {
      name: 'Christopher', kcal: 2450, protein: 190, startWeight: 210, goalWeight: 200, goalDate: PLAN_END,
      units: { w: 'lb', d: 'mi', s: 'yd', len: 'in' }, rest: { main: 180, acc: 90 }, haptics: true, sound: true,
      habits: DEFAULT_HABITS.map(h => ({ ...h })),
    },
    habitLog: {},   // date -> {habitId: true}
    body: {},       // date -> {weight(lb), protein(g), knee(0-10), waist(in)}
    workouts: [],   // completed sessions
    active: null,   // in-progress workout
    tests: { baseline: {}, nov1: {}, nov29: {}, dec31: {} },
    swapPrefs: {},  // slotId -> exId
    kcalLog: [],    // [{date, from, to}]
  };
}
function migrate(s) {
  const d = defaultState();
  const out = Object.assign(d, s || {});
  out.settings = Object.assign(defaultState().settings, (s || {}).settings || {});
  out.settings.units = Object.assign(defaultState().settings.units, out.settings.units || {});
  out.settings.rest = Object.assign(defaultState().settings.rest, out.settings.rest || {});
  out.tests = Object.assign(defaultState().tests, out.tests || {});
  if (!Array.isArray(out.settings.habits) || !out.settings.habits.length) out.settings.habits = DEFAULT_HABITS.map(h => ({ ...h }));
  return out;
}
let S;
try { S = migrate(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (e) { S = defaultState(); }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); } }

/* ---------- "today" (override with ?date=YYYY-MM-DD for previews) ---------- */
const _qd = new URLSearchParams(location.search).get('date');
function today() { return /^\d{4}-\d{2}-\d{2}$/.test(_qd || '') ? _qd : dkey(new Date()); }

/* ---------- units (everything stored as lb / mi / yd / in) ---------- */
const U = {
  w: () => S.settings.units.w, d: () => S.settings.units.d, s: () => S.settings.units.s, len: () => S.settings.units.len,
  wOut(lb, dp = 1) { if (lb == null || lb === '' || isNaN(lb)) return ''; const v = U.w() === 'kg' ? lb / 2.20462 : +lb; return +v.toFixed(dp); },
  wIn(v) { if (v === '' || v == null || isNaN(v)) return null; return U.w() === 'kg' ? +v * 2.20462 : +v; },
  dOut(mi, dp = 2) { if (mi == null || mi === '') return ''; return +(U.d() === 'km' ? mi * 1.60934 : +mi).toFixed(dp); },
  dIn(v) { if (v === '' || v == null || isNaN(v)) return null; return U.d() === 'km' ? +v / 1.60934 : +v; },
  sOut(yd) { if (yd == null || yd === '') return ''; return Math.round(U.s() === 'm' ? yd * 0.9144 : +yd); },
  sIn(v) { if (v === '' || v == null || isNaN(v)) return null; return U.s() === 'm' ? +v / 0.9144 : +v; },
  lOut(inch, dp = 1) { if (inch == null || inch === '') return ''; return +(U.len() === 'cm' ? inch * 2.54 : +inch).toFixed(dp); },
  lIn(v) { if (v === '' || v == null || isNaN(v)) return null; return U.len() === 'cm' ? +v / 2.54 : +v; },
  step() { return U.w() === 'kg' ? 2.5 : 5; },
};
function roundLoad(lb) { const st = U.step(); const disp = U.w() === 'kg' ? lb / 2.20462 : lb; return U.wIn(Math.round(disp / st) * st); }
const fmtTime = s => { if (s == null || s === '' || isNaN(s)) return '—'; s = Math.round(s); return Math.floor(s / 60) + ':' + pad(s % 60); };
const parseTime = t => { if (t == null || t === '') return null; t = String(t).trim(); if (/^\d+(\.\d+)?$/.test(t)) return +t * 60; const m = t.match(/^(\d+):(\d{1,2})$/); return m ? +m[1] * 60 + +m[2] : null; };
const fmtNum = n => Math.round(n).toLocaleString('en-US');
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const fmtDate = k => { const d = pkey(k); return MON[d.getMonth()] + ' ' + d.getDate(); };
const fmtLong = k => { const d = pkey(k); return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()] + ', ' + ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + ' ' + d.getDate(); };

/* ---------- analytics ---------- */
const e1rm = (w, r) => (!w || !r) ? 0 : w * (1 + r / 30);
function habitPct(k) { const hs = S.settings.habits; if (!hs.length) return 0; const l = S.habitLog[k] || {}; return hs.filter(h => l[h.id]).length / hs.length; }
function streak() {
  let k = today(), n = 0;
  if (habitPct(k) < 0.75) k = addDays(k, -1); // today still in progress
  while (habitPct(k) >= 0.75 && n < 999) { n++; k = addDays(k, -1); }
  return n;
}
function weights() { return Object.keys(S.body).filter(k => S.body[k].weight).sort().map(k => ({ k, v: S.body[k].weight })); }
function avgWeight(endK, days = 7) {
  const from = addDays(endK, -(days - 1)); const vs = weights().filter(p => p.k >= from && p.k <= endK).map(p => p.v);
  return vs.length ? { v: vs.reduce((a, b) => a + b, 0) / vs.length, n: vs.length } : null;
}
function rolling7() { return weights().map(p => ({ k: p.k, v: avgWeight(p.k).v })); }
function projection() {
  const pts = rolling7(); if (pts.length < 4) return null;
  const last = pts[pts.length - 1].k; const recent = pts.filter(p => diffDays(p.k, last) <= 21);
  if (recent.length < 4) return null;
  const xs = recent.map(p => diffDays(PLAN_START, p.k)), ys = recent.map(p => p.v);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  if (!den) return null;
  const slope = num / den, cur = pts[pts.length - 1].v, goal = S.settings.goalWeight;
  const res = { slope, perWeek: slope * 7, cur, last };
  if (cur <= goal) res.reached = true;
  else if (slope < -0.005) { res.days = Math.ceil((cur - goal) / -slope); res.date = addDays(last, res.days); }
  return res;
}
function calorieSuggestion() {
  const t = today();
  const cur = avgWeight(t), prev = avgWeight(addDays(t, -7));
  if (!cur || !prev || cur.n < 3 || prev.n < 3) return { status: 'need', cur, prev };
  const drop = prev.v - cur.v; const k = S.settings.kcal;
  if (drop < 0.5) return { status: 'down', drop, cur, prev, to: k - 150, msg: `Weekly avg dropped ${drop.toFixed(1)} lb (< 0.5). Cut 150 kcal → ${fmtNum(k - 150)}.` };
  if (drop > 1.5) return { status: 'up', drop, cur, prev, to: k + 150, msg: `Weekly avg dropped ${drop.toFixed(1)} lb (> 1.5). Add 150 kcal → ${fmtNum(k + 150)} to protect muscle.` };
  return { status: 'hold', drop, cur, prev, to: k, msg: `Weekly avg dropped ${drop.toFixed(1)} lb — right in the 0.5–1.5 lb sweet spot. Hold ${fmtNum(k)} kcal.` };
}
function sessionDone(key) { return S.workouts.find(w => w.sessionKey === key); }
function exHistory(exId) {
  const out = [];
  S.workouts.forEach(w => (w.exercises || []).forEach(e => { if (e.ex === exId) { const d = e.sets.filter(s => s.done && s.r); if (d.length) out.push({ date: w.date, sets: d, best: Math.max(...d.map(s => e1rm(s.w, s.r))) }); } }));
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}
