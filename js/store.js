/* Arnold Fit v2 — localStorage store (schema v2, migrates v1), units, analytics, schedule, targets */
'use strict';
const STORE_KEY = 'arnoldfit.v1'; // same key as v1 so existing data is read & migrated in place
const DEFAULT_HABITS = [
  { id: 'protein', label: 'Protein 190g', ic: '🥩' }, { id: 'mobility', label: '10-min mobility', ic: '🧘' },
  { id: 'creatine', label: 'Creatine', ic: '💊' }, { id: 'steps', label: '8k+ steps', ic: '👟' },
  { id: 'sleep', label: '8h sleep', ic: '😴' }, { id: 'water', label: 'Water', ic: '💧' },
  { id: 'noalc', label: 'No alcohol', ic: '🚫' }, { id: 'weigh', label: 'Weigh-in', ic: '⚖️' },
  { id: 'bible', label: 'Daily devotional', ic: '📖' },
];
const STARTER_VIDEOS = [ // verified via YouTube oEmbed (200) — titles are the real oEmbed titles
  { vid: 'IdTMDpizis8', title: 'Jocko Willink "GOOD" (Official)', cat: 'Discipline', tags: 'jocko discipline motivation' },
  { vid: 'tdmyoMe4iHM', title: 'Miracle Speech - You were born for this - Herb Brooks, Movie: Miracle', cat: 'Hockey', tags: 'hockey motivation speech' },
  { vid: 'ZyHY57snyNU', title: '2025 IRONMAN World Championship Documentary', cat: 'Triathlon/Ironman', tags: 'ironman triathlon kona' },
];
function defaultState() {
  return {
    v: 3, created: Date.now(), onboarded: false, profile: JSON.parse(JSON.stringify(DEFAULT_PROFILE)),
    settings: {
      name: 'Christopher', kcal: 2450, protein: 190, startWeight: 210, goalWeight: 200, goalDate: PLAN_END,
      units: { w: 'lb', d: 'mi', s: 'yd', len: 'in' }, rest: { main: 180, acc: 90 }, haptics: true, sound: true,
      habits: DEFAULT_HABITS.map(h => ({ ...h })),
      nn: ['train', 'protein', 'mobility', 'devo', 'sleep'], reminder: { on: true, time: '20:00' }, // v2.4
    },
    habitLog: {}, body: {}, workouts: [], active: null,
    tests: { baseline: {}, nov1: {}, nov29: {}, dec31: {} },
    swapPrefs: {}, kcalLog: [],
    // v2
    food: { log: {}, custom: [], meals: {} },
    verse: { seen: [], favs: [], byDate: {}, order: null },
    devo: { seen: [], byDate: {}, journal: {}, talk: {}, done: {}, time: {}, started: {}, favs: [], cycle: 1 },
    videos: STARTER_VIDEOS.map((v, i) => ({ id: 'sv' + i, ...v, added: Date.now() })),
    videoCats: ['Discipline', 'Hockey', 'Triathlon/Ironman', 'Faith'],
    schedule: { moves: {}, skips: {}, off: {} },
    planEdits: {}, // date -> { slotId: {ex?, skip?} }
    chat: [], seeds: {},
    disc: { commit: {}, checkin: {} }, // v2.3/2.4 discipline layer
  };
}
function migrateKey(key) { // v1 "date:idx" → v2 "date:CODE"
  if (!key || !/:\d+$/.test(key)) return key;
  const [d, i] = key.split(':'); const p = basePlan(d, DEFAULT_PROFILE); const s = p && p.sessions[+i];
  return s ? s.key : key;
}
function migrate(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const d = defaultState(), out = Object.assign(d, s);
  out.settings = Object.assign(defaultState().settings, s.settings || {});
  out.settings.units = Object.assign(defaultState().settings.units, out.settings.units || {});
  out.settings.rest = Object.assign(defaultState().settings.rest, out.settings.rest || {});
  if (!Array.isArray(out.settings.habits) || !out.settings.habits.length) out.settings.habits = DEFAULT_HABITS.map(h => ({ ...h }));
  out.tests = Object.assign(defaultState().tests, s.tests || {});
  out.profile = Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROFILE)), s.profile || {});
  out.profile.injuries = Object.assign({}, DEFAULT_PROFILE.injuries, (s.profile || {}).injuries || {});
  out.profile.diet = Object.assign({}, DEFAULT_PROFILE.diet, (s.profile || {}).diet || {});
  out.food = Object.assign({ log: {}, custom: [], meals: {} }, s.food || {});
  out.verse = Object.assign({ seen: [], favs: [], byDate: {}, order: null }, s.verse || {});
  out.devo = Object.assign(defaultState().devo, s.devo || {});
  { const hb = out.settings.habits.find(h => h.id === 'bible'); if (hb && hb.label === 'Read today’s verse') hb.label = 'Daily devotional'; }
  out.schedule = Object.assign({ moves: {}, skips: {}, off: {} }, s.schedule || {});
  out.disc = Object.assign({ commit: {}, checkin: {} }, s.disc || {});
  if (!Array.isArray(out.settings.nn) || !out.settings.nn.length) out.settings.nn = defaultState().settings.nn.slice();
  out.settings.reminder = Object.assign({ on: true, time: '20:00' }, out.settings.reminder || {});
  if (!Array.isArray(out.videos)) out.videos = defaultState().videos;
  if (!Array.isArray(out.videoCats)) out.videoCats = defaultState().videoCats;
  if (!s.v || s.v < 2) { // ---- v1 → v2
    (out.workouts || []).forEach(w => { w.sessionKey = migrateKey(w.sessionKey); (w.exercises || []).forEach(e => { if (e.planned == null) e.planned = e.sets.length; }); });
    if (out.active) out.active.sessionKey = migrateKey(out.active.sessionKey);
    if (!out.settings.habits.find(h => h.id === 'bible')) out.settings.habits.push({ id: 'bible', label: 'Daily devotional', ic: '📖' });
    out.migratedFrom = 1;
  }
  if (!s.v || s.v < 3) { // ---- v2 → v3 (v2.2): strength/bench goal + bench-first Upper A/B
    const g = out.profile.goals = Array.isArray(out.profile.goals) ? out.profile.goals : ['fatloss'];
    if (!g.includes('strength')) g.splice(g.includes('fatloss') ? g.indexOf('fatloss') + 1 : 0, 0, 'strength');
    if (!out.profile.primary || !g.includes(out.profile.primary)) out.profile.primary = g.includes('fatloss') ? 'fatloss' : g[0];
    const dropped = ['ua1', 'ua3', 'ua6', 'ua7', 'ub1', 'ub3'], arch = {};
    dropped.forEach(id => { if (out.swapPrefs && out.swapPrefs[id]) { arch[id] = out.swapPrefs[id]; delete out.swapPrefs[id]; } });
    if (Object.keys(arch).length) out.archive = Object.assign({}, out.archive, { swapPrefsV2: arch });
    if (s.v === 2) out.migratedV3 = Date.now();
  }
  out.v = 3;
  return out;
}
let S;
try { S = migrate(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (e) { S = defaultState(); }
let planCache = {};
function invalidatePlan() { planCache = {}; }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); } }

/* ---------- "today" (override with ?date=YYYY-MM-DD for previews/tests) ---------- */
const _qd = new URLSearchParams(location.search).get('date');
function today() { return /^\d{4}-\d{2}-\d{2}$/.test(_qd || '') ? _qd : dkey(new Date()); }

/* one-time seed: this week he skipped Mon Oct 5 and has Sat Oct 10 off for an event */
(function seedWeek() {
  if (S.seeds.oct2026wk2) return;
  S.seeds.oct2026wk2 = true;
  if (dkey(new Date()) <= '2026-10-11') {
    if (!S.workouts.some(w => w.sessionKey === '2026-10-05:UA') && !S.schedule.moves['2026-10-05:UA']) S.schedule.skips['2026-10-05:UA'] = { reason: 'Skipped Monday', needsMove: true, t: Date.now() };
    if (!S.schedule.off['2026-10-10']) S.schedule.off['2026-10-10'] = 'Event';
  }
  save();
})();

/* ---------- units (stored as lb / mi / yd / in) ---------- */
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
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtDate = k => { const d = pkey(k); return MON[d.getMonth()] + ' ' + d.getDate(); };
const fmtDow = k => DOW[dow(k)] + ' ' + fmtDate(k);
const fmtLong = k => { const d = pkey(k); return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ', ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate(); };

/* ---------- effective plan (profile + moves/skips/days off) ---------- */
function base(k) { if (!(k in planCache)) planCache[k] = basePlan(k, S.profile); return planCache[k]; }
function sessionByKey(key) { const d = key.split(':')[0]; const p = base(d); return p ? p.sessions.find(s => s.key === key) || null : null; }
function dayPlan(k) {
  const b = base(k); if (!b) return null;
  const mv = S.schedule.moves;
  const own = b.sessions.filter(s => !mv[s.key] || mv[s.key] === k);
  const incoming = Object.keys(mv).filter(key => mv[key] === k && key.split(':')[0] !== k).map(key => { const s = sessionByKey(key); return s ? { ...s, movedFrom: key.split(':')[0] } : null; }).filter(Boolean);
  const sessions = own.concat(incoming).map(s => ({ ...s, skipped: !!S.schedule.skips[s.key], date: k }));
  return { ...b, sessions, off: S.schedule.off[k] || null };
}
function sessionDone(key) { return S.workouts.find(w => w.sessionKey === key); }
const testDone = key => Object.keys(S.tests[key] || {}).length > 0;
function sessStatus(s) { if (s.kind === 'test') return testDone(s.testKey) ? 'done' : 'todo'; if (sessionDone(s.key)) return 'done'; if (s.skipped) return 'skipped'; return 'todo'; }

/* knee-rule check for moving a session to another day */
function checkMove(key, toK) {
  const s = sessionByKey(key), out = { conflicts: [], warnings: [], ok: true, blocked: null };
  if (!s) return out;
  const t = today();
  if (!inPlan(toK)) out.blocked = 'Outside the plan';
  else if (toK < t) out.blocked = 'In the past';
  else if (S.schedule.off[toK]) out.blocked = 'Day off (' + S.schedule.off[toK] + ')';
  const day = k => { const p = dayPlan(k); return p ? p.sessions.filter(x => x.key !== key && !x.skipped) : []; };
  const hasHockey = k => day(k).some(isHockeyS);
  const knee = hasKnee(S.profile);
  const target = day(toK);
  if (knee) {
    if (isRunS(s) && hasHockey(addDays(toK, 1))) out.conflicts.push('No running the day before hockey.');
    if (isHockeyS(s) && day(addDays(toK, -1)).some(isRunS)) out.conflicts.push('A run is scheduled the day before — no running the day before hockey.');
    if (isLowerS(s)) {
      if ([-1, 0, 1].some(o => hasHockey(addDays(toK, o)))) out.conflicts.push('Hard lower body within 48 h of hockey.');
      else if ([-2, 2].some(o => hasHockey(addDays(toK, o)))) out.warnings.push('Right at the 48-h hockey buffer — keep lower work crisp, not grinding.');
    }
    if (isHockeyS(s) && [-1, 0, 1].some(o => day(addDays(toK, o)).some(isLowerS))) out.conflicts.push('Hockey within 48 h of the hard lower day.');
    if (isImpactS(s)) {
      if (target.some(isImpactS)) out.warnings.push('Two impact sessions on one day — that stacks impact (one new impact stressor per week).');
      else if ([-1, 1].some(o => day(addDays(toK, o)).some(isImpactS)) && !isHockeyS(s)) out.warnings.push('Back-to-back impact days — knee rule: only one new impact stressor per week.');
    }
  }
  if (isUpperS(s) && [-1, 1].some(o => day(addDays(toK, o)).some(isUpperS))) out.warnings.push('Upper days back-to-back — less recovery between upper sessions.');
  if (target.some(x => x.kind === 'lift') && s.kind === 'lift') out.warnings.push('Two lifts in one day — long session for a 60-min window.');
  else if (target.length >= 2) out.warnings.push(`Already ${target.length} sessions that day.`);
  else if (target.length === 1) out.warnings.push(`Doubles up with ${target[0].title}.`);
  out.ok = !out.blocked && !out.conflicts.length;
  out.score = out.blocked ? -99 : -10 * out.conflicts.length - 2 * out.warnings.length - (target.length ? 1 : 0);
  return out;
}

/* ---------- analytics ---------- */
const e1rm = (w, r) => (!w || !r) ? 0 : w * (1 + r / 30);
function habitPct(k) { const hs = S.settings.habits; if (!hs.length) return 0; const l = S.habitLog[k] || {}; return hs.filter(h => l[h.id]).length / hs.length; }
function streak() { let k = today(), n = 0; if (habitPct(k) < 0.75) k = addDays(k, -1); while (habitPct(k) >= 0.75 && n < 999) { n++; k = addDays(k, -1); } return n; }
function habitStreak(id) { let k = today(), n = 0; if (!(S.habitLog[k] || {})[id]) k = addDays(k, -1); while ((S.habitLog[k] || {})[id] && n < 999) { n++; k = addDays(k, -1); } return n; }
function weights() { return Object.keys(S.body).filter(k => S.body[k].weight).sort().map(k => ({ k, v: S.body[k].weight })); }
function avgWeight(endK, days = 7) { const from = addDays(endK, -(days - 1)); const vs = weights().filter(p => p.k >= from && p.k <= endK).map(p => p.v); return vs.length ? { v: vs.reduce((a, b) => a + b, 0) / vs.length, n: vs.length } : null; }
function rolling7() { return weights().map(p => ({ k: p.k, v: avgWeight(p.k).v })); }
function projection() {
  const pts = rolling7(); if (pts.length < 4) return null;
  const last = pts[pts.length - 1].k; const recent = pts.filter(p => diffDays(p.k, last) <= 21); if (recent.length < 4) return null;
  const xs = recent.map(p => diffDays(PLAN_START, p.k)), ys = recent.map(p => p.v);
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; }); if (!den) return null;
  const slope = num / den, cur = pts[pts.length - 1].v, goal = S.settings.goalWeight, res = { slope, perWeek: slope * 7, cur, last };
  if (cur <= goal) res.reached = true; else if (slope < -0.005) { res.days = Math.ceil((cur - goal) / -slope); res.date = addDays(last, res.days); }
  return res;
}
function calorieSuggestion() {
  const t = today(), cur = avgWeight(t), prev = avgWeight(addDays(t, -7));
  if (!cur || !prev || cur.n < 3 || prev.n < 3) return { status: 'need', cur, prev };
  const drop = prev.v - cur.v, k = S.settings.kcal;
  if (drop < 0.5) return { status: 'down', drop, cur, prev, to: k - 150, msg: `Weekly avg dropped ${drop.toFixed(1)} lb (< 0.5). Cut 150 kcal → ${fmtNum(k - 150)}.` };
  if (drop > 1.5) return { status: 'up', drop, cur, prev, to: k + 150, msg: `Weekly avg dropped ${drop.toFixed(1)} lb (> 1.5). Add 150 kcal → ${fmtNum(k + 150)} to protect muscle.` };
  return { status: 'hold', drop, cur, prev, to: k, msg: `Weekly avg dropped ${drop.toFixed(1)} lb — right in the 0.5–1.5 lb sweet spot. Hold ${fmtNum(k)} kcal.` };
}
function exHistory(exId) {
  const out = [];
  S.workouts.forEach(w => (w.exercises || []).forEach(e => { if (e.ex === exId && !e.skipped) { const d = e.sets.filter(s => s.done && s.r); if (d.length) out.push({ date: w.date, end: w.endedAt || 0, sets: d, e, mod: w.mod || 'normal', best: Math.max(...d.map(s => e1rm(s.w, s.r))) }); } }));
  return out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.end - b.end);
}

/* ---------- next-session targets (double progression, computed from the latest log) ----------
   all planned sets at top of range → +weight (upper +5, lower +10, DB +2.5–5)
   all planned sets in range → +1 rep;  missed bottom or fewer sets than planned → hold */
function incFor(ex) { const kg = U.w() === 'kg'; if (ex.db) return { lb: kg ? 2.5 * 2.20462 : 5, label: kg ? '+2.5 kg (DB jump)' : '+5 lb (next DB pair; +2.5 if available)' }; if (ex.lw) return { lb: kg ? 5 * 2.20462 : 10, label: kg ? '+5 kg' : '+10 lb' }; return { lb: kg ? 2.5 * 2.20462 : 5, label: kg ? '+2.5 kg' : '+5 lb' }; }
function nextTarget(exId, o = {}) {
  const h = exHistory(exId), last = h[h.length - 1];
  if (exId === 'flat_bench' && (o.role === 'bench' || (!o.role && (!last || last.e.role === 'bench')))) return benchTarget(o.k);
  if (!last) return null;
  const e = last.e, ex = EX[exId], [lo, hi] = e.reps, planned = Math.max(1, e.planned || e.sets.length);
  const done = e.sets.filter(s => s.done && s.r != null), pd = done.slice(0, planned);
  const ref = e.role === 'main' || e.role === 'bench' ? (done.find(s => s.tag === 'Top') || done[0]) : done.reduce((a, s) => (s.w || 0) >= (a.w || 0) ? s : a, done[0]);
  const w = ref.w || 0, base = { from: last.date, planned, did: done.length };
  if (ex.kind === 'hold') { const best = Math.max(...done.map(s => s.r || 0)); const t = Math.min(hi, best + 5); return { ...base, rule: best >= hi ? 'hold' : 'add_rep', w: null, reps: Array(planned).fill(t), note: best >= hi ? `Maxed ${hi}s — hold, or use the long-lever version` : `Last best ${best}s → aim ${t}s per side` }; }
  if (ex.kind === 'power') return { ...base, rule: 'hold', w: ref.w, reps: Array(planned).fill(lo), note: 'Power work: same reps, max intent, full rest' };
  const wl = ex.added && !w ? 'BW' : U.wOut(w) + ' ' + U.w();
  if (done.length < planned) return { ...base, rule: 'hold', w, reps: Array(planned).fill(lo).map((r, i) => pd[i] ? Math.max(lo, Math.min(hi, pd[i].r)) : lo), note: `Did ${done.length}/${planned} sets last time → hold ${wl}, complete all ${planned}` };
  if (pd.some(s => s.r < lo)) return { ...base, rule: 'hold', w, reps: pd.map(s => Math.max(lo, Math.min(hi, s.r))), note: `Missed the bottom of ${lo}–${hi} → hold ${wl}` };
  if (pd.every(s => s.r >= hi)) { const inc = incFor(ex); return { ...base, rule: 'add_weight', w: roundLoad(w + inc.lb), reps: Array(planned).fill(lo), inc: inc.label, note: `Hit ${hi} on all ${planned} sets → ${inc.label}` }; }
  return { ...base, rule: 'add_rep', w, reps: pd.map(s => Math.min(hi, s.r + 1)), note: `In range → +1 rep per set at ${wl}` };
}
function targetText(exId, o) {
  const t = nextTarget(exId, o); if (!t) return '';
  if (t.bench) { const f = v => U.wOut(v); return `${t.single ? `1 @ ${f(t.single)} · ` : ''}${f(t.w)} × ${t.top}${t.rule === 'add_weight' ? ' ↑' : t.rule === 'add_rep' ? ' +1' : ''} · back-offs ${f(t.bo.w)} × ${t.bo.r}`; }
  if (EX[exId].kind === 'hold') return `${t.reps[0]}s/side`;
  const wl = EX[exId].added && !t.w ? 'BW' : t.w == null ? '' : (EX[exId].added ? '+' : '') + U.wOut(t.w);
  return `${wl}${wl ? ' × ' : ''}${t.reps.join('/')}${t.rule === 'add_weight' ? ' ↑' : t.rule === 'add_rep' ? ' +1' : ''}`;
}

/* ---------- bench press (v2.2): e1RM, autoregulated top-set progression, tests, goal ----------
   Top set drives everything. Same phase rep range: hit top of range → +5 lb (+10 if RPE ≤7.5);
   in range → +1 rep (hold if RPE ≥9.5); 1 short → hold; further short → −5% reset; fewer sets → hold.
   New phase (Base 5–6 → Build 3–4 → Sharpen 2–3): load re-derived from e1RM at ~RPE 8.5. */
const BENCH_ID = 'flat_bench';
function benchSetE1(s) { if (!s || !s.w || !s.r) return 0; const rir = s.rpe ? Math.max(0, 10 - s.rpe) : 0; return s.w * (1 + (s.r + rir) / 30); }
function benchTopSet(e) { const d = e.sets.filter(s => s.done && s.r && s.w); return d.find(s => s.tag === 'Top') || d.reduce((a, s) => !a || s.w > a.w ? s : a, null); }
const loadFor = (e1, reps, rir = 1.5) => roundLoad(e1 / (1 + (reps + rir) / 30));
function benchSessions() { return exHistory(BENCH_ID).map(x => { const t = benchTopSet(x.e); return t ? { k: x.date, e1: benchSetE1(t), top: t, mod: x.mod, e: x.e, heavy: x.e.role === 'bench' } : null; }).filter(Boolean); }
function benchTestE1(key) { // entered AMRAP result, else best top-set e1RM logged in that test week
  const v = (S.tests[key] || {}).bench; if (v != null && v !== '') return +v;
  const ts = TESTS.find(x => x.key === key); if (!ts) return null; const w0 = weekStart(ts.date), w1 = addDays(w0, 6);
  const xs = benchSessions().filter(x => x.k >= w0 && x.k <= w1 && x.k <= today()); return xs.length ? Math.max(...xs.map(x => x.e1)) : null;
}
function benchTests() { return TESTS.map(t => ({ key: t.key, k: t.date, label: t.label, v: benchTestE1(t.key), entered: (S.tests[t.key] || {}).bench != null })).filter(t => t.v); }
function benchBaseline() { const t = benchTests()[0]; if (t) return { v: t.v, src: t.label + ' test', k: t.k }; const s = benchSessions()[0]; return s ? { v: s.e1, src: 'first logged top set', k: s.k } : null; }
function benchNow() { const pts = benchSessions().filter(x => x.mod !== 'deload').map(x => ({ k: x.k, v: x.e1 })).concat(benchTests().filter(t => t.entered).map(t => ({ k: t.k, v: t.v }))).sort((a, b) => a.k < b.k ? -1 : a.k > b.k ? 1 : 0); return pts.length ? pts[pts.length - 1] : null; }
function benchGoal() { const b = benchBaseline(); if (!b) return null; const now = benchNow(); return { base: b.v, src: b.src, lo: b.v * 1.05, hi: b.v * 1.10, now: now ? now.v : b.v, pct: now ? (now.v / b.v - 1) * 100 : 0 }; }
function benchTarget(k) {
  k = k || today(); const ph = benchPhase(k), [lo, hi] = ph.reps, mod = modFor(k);
  const layout = buildSets({ role: 'bench' }, mod, S.profile, k), ss = benchSessions();
  const real = ss.filter(x => x.mod !== 'deload'), last = real[real.length - 1] || ss[ss.length - 1];
  const lt = benchTests().filter(t => t.entered).pop(), kg = U.w() === 'kg';
  let w, top, rule, note, from, did = 0;
  if (lt && (!last || lt.k > last.k)) { w = loadFor(lt.v, lo); top = lo; rule = 'phase'; from = lt.k; note = `From your ${lt.label} bench test (e1RM ${U.wOut(lt.v, 0)} ${U.w()}) → ${ph.name}: ${lo}–${hi} reps @RPE ${ph.top}`; }
  else if (last) {
    const tp = last.top, e = last.e, planned = Math.max(1, e.planned || e.sets.length), rpe = tp.rpe; from = last.k; did = e.sets.filter(s => s.done && s.r != null).length;
    const same = last.heavy && e.reps && e.reps[0] === lo && e.reps[1] === hi, wl = U.wOut(tp.w) + ' ' + U.w();
    if (!same) { w = loadFor(last.e1, lo); top = lo; rule = 'phase'; note = `${ph.name} phase: top set ${lo}–${hi} @RPE ${ph.top} — load from your e1RM ${U.wOut(last.e1, 0)} ${U.w()}`; }
    else if (did < planned) { w = tp.w; top = Math.max(lo, Math.min(hi, tp.r)); rule = 'hold'; note = `Did ${did}/${planned} sets last time → hold ${wl}, complete all ${planned}`; }
    else if (tp.r >= hi) { const big = rpe != null && rpe <= 7.5, inc = kg ? (big ? 5 : 2.5) * 2.20462 : big ? 10 : 5; w = roundLoad(tp.w + inc); top = lo; rule = 'add_weight'; note = `Top set ${wl} × ${tp.r}${rpe ? ' @' + rpe : ''} hit the top of ${lo}–${hi} → ${kg ? (big ? '+5 kg' : '+2.5 kg') : big ? '+10 lb' : '+5 lb'}`; }
    else if (tp.r >= lo) { if (rpe != null && rpe >= 9.5) { w = tp.w; top = tp.r; rule = 'hold'; note = `${tp.r} reps but RPE ${rpe} — own ${wl} × ${tp.r} before adding reps`; } else { w = tp.w; top = tp.r + 1; rule = 'add_rep'; note = `Top set in range → +1 rep at ${wl}`; } }
    else if (tp.r >= lo - 1) { w = tp.w; top = lo; rule = 'hold'; note = `1 rep short of ${lo} → hold ${wl}`; }
    else { w = roundLoad(tp.w * 0.95); top = lo; rule = 'reset'; note = `Top set fell short (${tp.r} < ${lo}) → reset −5% to ${U.wOut(roundLoad(tp.w * 0.95))} ${U.w()} and rebuild`; }
  } else return null;
  const bo = { w: roundLoad(w * 0.9), r: top + 1 }, single = ph.single ? loadFor(w * (1 + (top + 1.5) / 30), 1, 2) : null;
  const sets = layout.map(s => s.tag === 'Single' ? { w: single, r: 1 } : s.tag === 'Top' ? { w, r: top } : { w: bo.w, r: bo.r });
  return { bench: true, phase: ph.name, from, planned: layout.length, did, rule, w, top, bo, single, sets, reps: sets.map(s => s.r), note };
}

/* ---------- food ---------- */
function foodDay(k) { return S.food.log[k] || []; }
function foodTotals(k) { return foodDay(k).reduce((a, f) => ({ kcal: a.kcal + f.kcal * (f.qty || 1), p: a.p + f.p * (f.qty || 1) }), { kcal: 0, p: 0 }); }
function proteinFor(k) { const f = foodDay(k); return f.length ? Math.round(foodTotals(k).p) : ((S.body[k] || {}).protein || 0); }
function allFoods() { const veg = ['vegetarian', 'vegan'].includes(S.profile.diet.pref), pesc = S.profile.diet.pref === 'pescatarian'; return S.food.custom.map(f => ({ ...f, cat: 'My foods', custom: true })).concat(FOODS.filter(f => !(veg && f.diet !== 'veg') && !(pesc && f.diet === 'meat'))); }
function syncProteinHabit(k) { const l = S.habitLog[k] = S.habitLog[k] || {}; if (S.settings.habits.find(h => h.id === 'protein')) { if (proteinFor(k) >= S.settings.protein) l.protein = true; } }

/* ---------- daily verse: rotate with no repeats until all have been shown ---------- */
function verseOrder() {
  const ids = VERSES.map(v => v.id);
  if (!Array.isArray(S.verse.order) || S.verse.order.length !== ids.length || ids.some(i => !S.verse.order.includes(i))) {
    let seed = 20261005; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    S.verse.order = ids;
  }
  return S.verse.order;
}
function verseFor(k) {
  const v = S.verse; let id = v.byDate[k];
  if (!id || !VERSES.find(x => x.id === id)) {
    const order = verseOrder(); let next = order.find(i => !v.seen.includes(i));
    if (next == null) { const lastId = v.seen[v.seen.length - 1]; v.seen = []; next = order.find(i => i !== lastId); }
    v.seen.push(next); v.byDate[k] = next; id = next; save();
  }
  return VERSES.find(x => x.id === id);
}
const bibleGatewayUrl = ref => 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ref) + '&version=KJV';

/* ---------- YouTube helpers ---------- */
function parseYouTube(url) {
  if (!url) return null; url = url.trim();
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{11})/i);
  return m ? m[1] : null;
}
const ytThumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const ytWatch = id => `https://www.youtube.com/watch?v=${id}`;
function ytSimilarUrl(v) {
  const stop = new Set(['official', 'video', 'the', 'a', 'an', 'of', 'and', 'hd', '4k', 'full', 'movie', 'ft', 'feat', 'with', 'for', 'to', 'in', 'on']);
  const words = (v.title || '').replace(/["“”'’()\[\]|:\-–—!?.,#]/g, ' ').split(/\s+/).filter(w => w && !stop.has(w.toLowerCase()) && !/^\d+$/.test(w)).slice(0, 6);
  const extra = (v.tags || v.cat || '').split(/[,\s]+/).filter(Boolean).slice(0, 3);
  const q = [...new Set([...words, ...extra, 'motivation'].map(x => x.toLowerCase()))].join(' ');
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
