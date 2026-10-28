/* Arnold Fit v2.9 — plan it yourself: quick day picker, Plan my week, session/exercise editor (all local),
   Christmas goals, My maxes. Plan edits live in their OWN localStorage key (arnoldfit.plan.v1) so code updates never touch them. */
'use strict';
const PLAN_KEY = 'arnoldfit.plan.v1', PE_VER = 1;
let PE = null;
(function loadPE29() {
  try { if (!localStorage.getItem(STORE_KEY + '.backup-v2.8')) { const raw0 = localStorage.getItem(STORE_KEY); if (raw0) localStorage.setItem(STORE_KEY + '.backup-v2.8', raw0); } } catch (e) {} // one-time safety copy before v2.9
  let raw = null; try { raw = localStorage.getItem(PLAN_KEY); } catch (e) {}
  let p = null;
  try { p = raw ? JSON.parse(raw) : null; } catch (e) { try { localStorage.setItem(PLAN_KEY + '.rescue-' + Date.now(), raw); } catch (e2) {} p = null; }
  if (p && p.v && p.v < PE_VER) { try { localStorage.setItem(PLAN_KEY + '.backup-v' + p.v, raw); } catch (e) {} } // future migrations: copy first
  PE = Object.assign({ v: PE_VER, rules: [], customSess: {}, customEx: {} }, p && typeof p === 'object' ? p : {});
  if (!Array.isArray(PE.rules)) PE.rules = [];
  if (!PE.customSess || typeof PE.customSess !== 'object') PE.customSess = {};
  if (!PE.customEx || typeof PE.customEx !== 'object') PE.customEx = {};
  PE.v = PE_VER;
  if (!Array.isArray(S.maxes)) S.maxes = []; // My maxes (main store, additive)
})();
function savePE29() { PE.updated = Date.now(); try { localStorage.setItem(PLAN_KEY, JSON.stringify(PE)); } catch (e) { toast('Could not save plan edits'); } register29(); invalidatePlan(); }

/* ---------- built-in quick picks ---------- */
TEMPLATES.pullArms = {
  title: 'Pull + Arms', icon: 'P', color: 'lift', focus: 'Pull-ups · Rows · Biceps · Triceps', est: 55,
  slots: [
    { id: 'pa1', ex: 'weighted_pullup', role: 'main', reps: [4, 6], pri: 1 },
    { id: 'pa2', ex: 'cs_row', role: 'main', reps: [6, 8], pri: 1 },
    { id: 'pa3', ex: 'incline_curl', role: 'acc', reps: [8, 12], n: 3, ss: 'Superset', pri: 1 },
    { id: 'pa4', ex: 'oh_triceps', role: 'acc', reps: [10, 15], n: 3, ss: 'Superset', pri: 1 },
    { id: 'pa5', ex: 'hammer_curl', role: 'acc', reps: [8, 12], n: 2, ss: 'Superset B', pri: 2 },
    { id: 'pa6', ex: 'pushdown', role: 'acc', reps: [10, 15], n: 2, ss: 'Superset B', pri: 2 },
  ],
};
TEMPLATES.pullArms.slots.forEach(s => ALL_SLOTS.push(s));
const LIB29 = [['pushP', 'Push', '💪'], ['pullP', 'Pull', '🧗'], ['pullArms', 'Pull + Arms', '💪'], ['lowerS', 'Legs', '🦵'], ['upperA2', 'Upper A', '🏋️'], ['upperB2', 'Upper B', '🏋️'], ['upperC', 'Upper C', '🏋️'], ['fullP', 'Full Body', '🔥']];
const CARD29 = [['HOCKEY', 'Hockey', '🏒'], ['MTB', 'MTB', '🚵'], ['RUN', 'Run', '🏃'], ['RESET', 'Reset · 10k steps', '👟'], ['REST', 'Rest', '😴']];
const CODE29 = { upperA2: 'UA', upperB2: 'UB', upperC: 'UC', lowerS: 'LOW', pushP: 'PUSH', pullP: 'PULL', pullArms: 'PULLA', fullP: 'FULL', upperA: 'UA', upperB: 'UB', lower: 'LOW' };
Object.assign(SHORT28, { PULLA: 'Pull + Arms', FULL: 'Full Body', RESET: 'Reset · 10k', LOW: 'Legs' });
const optName29 = v => { const l = LIB29.find(x => x[0] === v); if (l) return l[1]; const c = CARD29.find(x => x[0] === v); if (c) return c[1]; if (String(v).startsWith('cs~')) { const cs = PE.customSess[v.slice(3)]; return cs ? cs.title : 'My session'; } return SHORT28[v] || CODE_NAME[v] || v; };

/* ---------- registry: edited + custom sessions become real templates ---------- */
const REST29 = {};
const CUSTOM_MUSCLE = { Chest: { chest: 1 }, Back: { back: 1 }, Shoulders: { 'side delts': 1 }, 'Rear delts': { 'rear delts': 1 }, Biceps: { biceps: 1 }, Triceps: { triceps: 1 }, Quads: { quads: 1, glutes: 0.5 }, Hamstrings: { hams: 1 }, Glutes: { glutes: 1 }, Calves: { calves: 1 }, Core: {}, Other: {} };
function autoFocus29(slots) { return [...new Set(slots.map(s => EX[s.ex] ? EX[s.ex].m.split('/')[0] : '').filter(Boolean))].slice(0, 4).join(' · ') || 'Your session'; }
function mkTpl29(id, data, base) {
  const slots = (data.slots || []).filter(s => EX[s.ex]).map(s => ({ ...s, pri: 1, pe: 1 }));
  TEMPLATES[id] = { title: data.title || (base ? base.title : 'My session'), icon: base ? base.icon : 'U', color: base ? base.color : 'lift', focus: autoFocus29(slots), est: 55, slots, edited: 1 };
  slots.forEach(s => { if (!ALL_SLOTS.some(x => x.id === s.id)) ALL_SLOTS.push(s); if (s.rest) REST29[s.ex] = +s.rest; });
  try { TEMPLATES[id].est = Math.max(20, Math.min(90, tplMinutes(id, 'normal', S.profile, today()))); } catch (e) {}
}
function register29() {
  for (const id in PE.customEx) { const c = PE.customEx[id]; EX[id] = { n: c.n, m: c.m || 'Other', eq: 'Your exercise', cue: 'Your own exercise — log weight × reps.', id, kind: 'w', custom: 1 }; MUSCLES[id] = CUSTOM_MUSCLE[c.m] || {}; }
  for (const k in REST29) delete REST29[k];
  for (const id in PE.customSess) mkTpl29('cs~' + id, PE.customSess[id], null);
  PE.rules.filter(r => r.type === 'sess').forEach(r => mkTpl29('pe~' + r.id, r.data, TEMPLATES[r.tpl]));
}

/* ---------- rules: date-ranged, last one wins; never before today so logged days never change ---------- */
function daySpec29(k) { const d = dow(k); let sp = null; for (const r of PE.rules) if (r.type === 'day' && r.d === d && k >= r.from && (r.to == null || k <= r.to)) sp = r.spec; return sp; }
function effTpl29(tpl, k) { let id = tpl; for (const r of PE.rules) if (r.type === 'sess' && r.tpl === tpl && k >= r.from && (r.to == null || k <= r.to)) id = 'pe~' + r.id; return TEMPLATES[id] ? id : tpl; }
function cardioFor29(c, wk) {
  const m = { HOCKEY: () => ({ mode: 'hockey', title: 'Hockey', min: 75, why: 'HOCKEY', steps: [['Game / skate', 'Warm up hips + groin first. Log knee pain after.']] }),
    MTB: () => mtbTue(wk), SAT: () => satCardio(wk),
    RUN: () => ({ mode: 'run', title: 'Easy run 25–30′', min: 30, why: 'RUN', steps: [['25–30 min', 'Easy, conversational (RPE 4–5)'], ['Knees', 'Cranky? Ride the MTB instead']] }),
    RESET: () => ({ mode: 'walk', title: 'Reset day · 10k steps', min: 30, why: 'REC', steps: [['10k steps', 'Easy walking through the day'], ['Mobility', '10-min routine — hips, ankles, T-spine']], checklist: MOBILITY }) }[c];
  return m ? m() : null;
}
function specSessions29(spec, k, b, P) {
  if (spec.t === 'rest') return [];
  const ws = weekStart(k), mod = liftMod(b.wk);
  const same = s => spec.t === 'lift' ? s.kind === 'lift' && s.tpl === spec.tpl : s.kind === 'cardio' && s.code === spec.c;
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i), o = d === k ? b : _basePlan28(d, P); const f = o && o.sessions.find(same); if (f) return [{ ...f }]; } // Arnold's own version from this week
  if (spec.t === 'lift') {
    const T = TEMPLATES[spec.tpl]; if (!T) return [];
    const code = CODE29[spec.tpl] || 'C' + spec.tpl.replace(/[^A-Za-z0-9]/g, '');
    return [{ kind: 'lift', tpl: spec.tpl, code, mod, title: T.title, sub: T.focus, icon: T.icon || 'U', color: T.color || 'lift', min: Math.min(P.sessionMin || 60, T.est || 55), why: (WHY[code] || WHY.PICK) + (mod !== 'normal' ? ' ' + WHY[mod] : ''), finisher: null }];
  }
  const c = cardioFor29(spec.c, b.wk); if (!c) return [];
  return [{ kind: 'cardio', code: spec.c, cardio: c, title: spec.c === 'HOCKEY' ? 'Hockey 🏒' : c.title, sub: c.steps.map(s => s[0]).join(' · '), icon: { run: 'R', bike: 'B', walk: 'W', hockey: 'H' }[c.mode] || 'C', color: c.mode === 'walk' ? 'bike' : c.mode, min: c.min, why: WHY[c.why] || '' }];
}
const _basePlan28 = basePlan;
basePlan = function (k, P) {
  const b = _basePlan28(k, P); if (!b || !PE) return b;
  P = P || DEFAULT_PROFILE;
  const spec = daySpec29(k);
  let ss = b.sessions;
  if (spec && spec.t !== 'base') ss = specSessions29(spec, k, b, P).concat(ss.filter(s => s.kind === 'test'));
  ss = ss.map(s => {
    if (s.kind !== 'lift') return s;
    const base = s.tpl, et = effTpl29(base, k);
    if (et === base) return { ...s, baseTpl: base };
    const T = TEMPLATES[et];
    return { ...s, tpl: et, baseTpl: base, title: T.title, sub: T.focus, min: Math.min(P.sessionMin || 60, T.est), finisher: null, edited: true };
  });
  const seen = {}; ss.forEach(s => { let c = s.code; while (seen[c]) c += '2'; seen[c] = 1; s.code = c; s.key = k + ':' + c; });
  return { ...b, sessions: ss, edited: !!spec };
};

/* ---------- edited slots: explicit sets / reps / RPE / target weight / rest; deload + lighter weeks still scale ---------- */
const _buildSets28 = buildSets;
buildSets = function (slot, mod, P, k) {
  if (!slot || !slot.pe) return _buildSets28(slot, mod, P, k);
  const n0 = Math.max(1, Math.min(10, +slot.n || 2)), n = mod === 'normal' ? n0 : Math.max(1, n0 - 1);
  const rpe = mod === 'deload' ? '7' : slot.role === 'power' ? 'Max intent' : String(slot.rpe || '8–9');
  const out = [];
  for (let i = 0; i < n; i++) out.push(slot.role === 'main' ? (i === 0 ? { tag: 'Top', rpeT: rpe } : { tag: 'Back-off', rpeT: rpe, pct: 0.9 }) : { tag: slot.role === 'power' ? 'Set' : 'Hard', rpeT: rpe });
  return out;
};
const _profileEx28 = profileExercise;
profileExercise = function (slot, P) { return slot && slot.pe ? slot.ex : _profileEx28(slot, P); };
const _makeEx28 = makeEx;
makeEx = function (slot, mod, k) {
  const e = _makeEx28(slot, mod, k);
  if (slot && slot.pe) {
    if (slot.rest) e.restS = +slot.rest;
    if (slot.w && !e.skipped && EX[e.ex] && EX[e.ex].kind === 'w') {
      const w0 = mod === 'deload' ? roundLoad(+slot.w * 0.9) : +slot.w;
      e.sets.forEach(s => { if (s.done) return; s.w = s.tag === 'Back-off' ? roundLoad(w0 * 0.9) : w0; if (s.r == null) s.r = e.reps[0]; });
      e.note = `Your target: ${U.wOut(+slot.w)} ${U.w()} × ${e.reps[0]}–${e.reps[1]}` + (mod === 'deload' ? ' · deload: ~10% lighter' : mod === 'reduced' ? ' · lighter week: one set less' : '');
    }
  }
  return e;
};
const _restFor28 = restFor;
restFor = function (w, ei) { const r = _restFor28(w, ei), e = w.exercises[ei]; if (e && e.restS && !r.nextSS) r.sec = e.restS; return r; };
const fmtRest29 = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)}:${pad(s % 60)} min` : `${s / 60} min`) : `${s} s`;
const _restLbl28 = restLbl;
restLbl = function (role, exId) { return REST29[exId] ? fmtRest29(REST29[exId]) : _restLbl28(role, exId); };
register29(); invalidatePlan();

/* ---------- set a day ---------- */
const specKey29 = sp => !sp ? '' : sp.t === 'lift' ? sp.tpl : sp.t === 'c' ? sp.c : sp.t === 'rest' ? 'REST' : 'base';
function specFromVal29(v) { if (v === 'REST') return { t: 'rest' }; if (v === 'base') return { t: 'base' }; if (CARD29.some(c => c[0] === v) || /^[A-Z0-9]+$/.test(v)) return { t: 'c', c: v }; return { t: 'lift', tpl: v }; }
function curVal29(k) { const dp = dayPlan(k); const s = dp && dp.sessions.find(x => x.kind !== 'test'); return !s ? 'REST' : s.kind === 'lift' ? s.baseTpl || s.tpl : s.code.replace(/2+$/, ''); }
function arnoldVal29(k) { const b = _basePlan28(k, S.profile); const s = b && b.sessions.find(x => x.kind !== 'test'); return !s ? 'REST' : s.kind === 'lift' ? s.tpl : s.code; }
function setDay29(k, v, every) {
  if (k < today() || !inPlan(k)) return false;
  const d = dow(k), spec = specFromVal29(v);
  if (every) PE.rules = PE.rules.filter(r => !(r.type === 'day' && r.d === d && r.from >= k));
  else PE.rules = PE.rules.filter(r => !(r.type === 'day' && r.from === k && r.to === k));
  PE.rules.push({ id: uid(), type: 'day', d, from: k, to: every ? null : k, spec });
  savePE29(); return true;
}
function quickOpts29(k, cur) {
  const o = [...LIB29.map(x => [x[0], x[1], x[2]]), ...Object.keys(PE.customSess).map(id => ['cs~' + id, PE.customSess[id].title, '⭐']), ...CARD29];
  return `<div class="qp29">${o.map(([v, n, ic]) => `<button class="qp29b tap ${v === cur ? 'on' : ''}" data-a="qpSet" data-date="${k}" data-v="${esc(v)}"><span>${ic}</span><b>${esc(n)}</b></button>`).join('')}</div>`;
}
UI.every29 = false;
function scopeSeg29(act, every, a, b) { return `<div class="seg29"><button class="tap ${every ? '' : 'on'}" data-a="${act}" data-v="0">${a}</button><button class="tap ${every ? 'on' : ''}" data-a="${act}" data-v="1">${b}</button></div>`; }

/* ---------- Plan tab ---------- */
const firstName29 = () => (S.settings.name || 'Your').split(' ')[0];
const _dayStatus28 = dayStatus28;
dayStatus28 = function (k, dp) { const r = _dayStatus28(k, dp), ss = dp && !dp.off ? dp.sessions : []; if (ss.length && ss.every(s => s.code === 'RESET') && !ss.some(s => sessStatus(s) === 'done')) return k === today() ? { cls: 'today', lbl: 'Today' } : k < today() ? { cls: 'rest', lbl: 'Reset' } : { cls: '', lbl: '' }; return r; };
function daySub29(k, ss) {
  if (!ss.length) return '';
  if (PLAN_NOTE28[k] && !daySpec29(k)) return PLAN_NOTE28[k];
  const s = ss[0], bits = [];
  if (s.movedFrom) bits.push(`moved from ${DOW[dow(s.movedFrom)]}`);
  else if (sessStatus(s) === 'swapped') bits.push(`instead of ${SHORT28[s.code] || s.title}`);
  else bits.push(s.code === 'RESET' ? '10k steps + mobility' : s.kind === 'lift' ? `~${s.min} min` : s.kind === 'test' ? 'tests' : `${s.min}′`);
  if (daySpec29(k) || ss.some(x => x.edited)) bits.push('✎ yours');
  return bits.join(' · ');
}
VIEWS.plan = function () {
  const t = today();
  if (t > PLAN_END) return hdr('Program complete', 'Plan') + `<div class="card"><b>The Oct 5 → Dec 31 plan is done.</b></div>`;
  const cur = weekStart(t < PLAN_START ? PLAN_START : t), m = weekMeta(weekNum(cur));
  let h = hdr(`${esc(firstName29())}’s plan · ${weekRange28(cur)}`, 'This week', `<button class="icon-btn round tap" data-a="goTab" data-tab="train" aria-label="Move or skip sessions">${CAL_ICON}</button>`);
  h += `<div class="pa29"><button class="btn big tap" data-a="pmwOpen" data-ws="${cur}">🗓 Plan my week</button><button class="btn sec tap" data-a="e29list">✎ Edit sessions</button></div>`;
  if (m.deload || m.finals || m.wk === 14) h += `<div class="pl28note">${weekLabel28(m)} <span class="small muted">${esc(m.note || '')}</span></div>`;
  h += `<div class="card pl28wk" id="planWeek">`;
  for (let i = 0; i < 7; i++) {
    const k = addDays(cur, i), dp = dayPlan(k), st = dayStatus28(k, dp), ss = dp && !dp.off ? dp.sessions : [];
    const name = !dp ? '—' : dp.off ? esc(dp.off) : ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : 'Rest', sub = daySub29(k, ss);
    h += `<button class="pl28d tap ${k === t ? 'now' : ''} ${k < t ? 'past' : ''} ${ss.length ? '' : 'restd'}" data-a="planDay" data-date="${k}"><span class="pl28dw"><b>${DOW[i]}</b><span>${pkey(k).getDate()}</span></span><span class="grow"><b class="pl28n">${name}</b>${sub ? `<span class="xs dim">${esc(sub)}</span>` : ''}</span>${st.lbl ? `<span class="pl28s ${st.cls}">${st.lbl}</span>` : ''}<span class="chev27">›</span></button>`;
  }
  h += `</div><h2 class="sec">Weeks ahead <small>to Dec 31</small></h2>`;
  for (let w0 = addDays(cur, 7); w0 <= PLAN_END; w0 = addDays(w0, 7)) {
    const mm = weekMeta(weekNum(w0)), blk = mm.block || blockFor(w0);
    let days = '';
    for (let i = 0; i < 7; i++) { const k = addDays(w0, i); if (k > PLAN_END) break; const dp = dayPlan(k), ss = dp && !dp.off ? dp.sessions : [], mine = daySpec29(k) || ss.some(x => x.edited); days += `<button class="pl28c tap ${ss.length ? '' : 'restd'} ${mine ? 'mine' : ''}" data-a="planDay" data-date="${k}"><span class="xs dim">${DOW[i]}</span><b>${dp && dp.off ? 'Off' : ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : 'Rest'}</b></button>`; }
    h += `<div class="card pl28ahead ${mm.deload ? 'isdl' : mm.finals ? 'islt' : ''}"><div class="row between pl28ah"><b>${weekRange28(w0)}</b><span class="row" style="gap:6px">${weekLabel28(mm)}<button class="linkbtn tap pl29e" data-a="pmwOpen" data-ws="${w0}">Plan</button></span></div><div class="pl28grid">${days}</div></div>`;
  }
  h += `<div class="xs dim" style="margin:14px 4px 0">Your changes are saved on this phone and stay when the app updates. ${PE.rules.length || Object.keys(PE.customSess).length ? `<button class="linkbtn tap" data-a="resetAll29">↺ Reset everything to Arnold’s plan</button>` : ''}</div>`;
  return h;
};

/* ---------- day sheet: quick picker on top, preview below ---------- */
function planDaySheet29(k) {
  const t = today(), dp = dayPlan(k), ss = dp && !dp.off ? dp.sessions : [], m = inPlan(k) ? weekMeta(weekNum(k)) : null, st = dayStatus28(k, dp);
  const editable = k >= t && inPlan(k) && !(dp && dp.off) && !ss.some(s => sessStatus(s) === 'done' || sessStatus(s) === 'swapped');
  let h = `<div class="pl28sh" id="pd29" data-date="${k}"><div class="row between"><div><div class="eyebrow">${k === t ? 'Today · ' : ''}${fmtLong(k)}</div><h3 style="margin:2px 0 0">${ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : dp && dp.off ? esc(dp.off) : 'Rest day'}</h3></div>${st.lbl ? `<span class="pl28s ${st.cls}">${st.lbl}</span>` : ''}</div>`;
  if (m && (m.deload || m.finals)) h += `<div class="xs dim" style="margin-top:4px">${m.deload ? 'Deload week — your picks are scaled lighter automatically.' : 'Lighter week — your picks get one set less automatically.'}</div>`;
  if (PLAN_NOTE28[k] && !daySpec29(k)) h += `<div class="xs" style="color:var(--warn);margin-top:4px">${esc(PLAN_NOTE28[k])}</div>`;
  if (editable) {
    const cur = curVal29(k), arn = arnoldVal29(k);
    h += `<div class="qp29h"><b>What are you doing ${k === t ? 'today' : DOW[dow(k)]}?</b><span class="xs dim">one tap sets it</span></div>${quickOpts29(k, cur)}`;
    h += scopeSeg29('every29', UI.every29, `Just this ${DOW[dow(k)]}`, `Every ${DOW[dow(k)]} from now`);
    if (cur !== arn || daySpec29(k)) h += `<button class="linkbtn tap qp29r" data-a="qpSet" data-date="${k}" data-v="base">↺ Arnold’s plan: ${esc(optName29(arn))}</button>`;
  }
  ss.forEach(s => {
    const status = sessStatus(s), done = S.workouts.find(w => w.sessionKey === s.key) || (status === 'swapped' ? replacedBy(s.key) : null);
    h += `<div class="pl28sess"><div class="row between"><b>${esc(s.title)}</b><span class="small muted">${s.code === 'RESET' ? '10k steps' : '~' + s.min + ' min'}</span></div>${s.sub ? `<div class="xs dim">${esc(s.sub)}</div>` : ''}${exRows27(s, k)}`;
    if (done) h += `<button class="btn sec tap" data-a="viewSummary" data-id="${done.id}">${status === 'swapped' ? '↪ ' + esc(done.title) + ' · view' : 'View workout'}</button>`;
    else if (k === t && status !== 'done') h += s.kind === 'cardio' && ['hockey', 'walk'].includes(s.cardio.mode) ? `<button class="btn big tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">✓ Mark done</button>` : s.kind === 'test' ? `<button class="btn big tap" data-a="testSheet" data-key="${s.testKey}">Enter test results</button>` : `<button class="btn big tap" data-a="planStart" data-day="${k}" data-key="${s.key}">▶ Start workout</button>`;
    else if (k < t && status !== 'done' && canBackdate(k)) h += `<button class="btn sec tap" data-a="planLog" data-date="${k}">Log it for ${DOW[dow(k)]}</button>`;
    if (s.kind === 'lift' && k >= t && !done) h += `<button class="btn sec tap ed29open" data-a="e29open" data-tpl="${esc(s.baseTpl || s.tpl)}" data-date="${k}">✎ Edit exercises</button>`;
    h += `</div>`;
  });
  const extra = S.workouts.filter(w => w.date === k && !ss.some(s => s.key === w.sessionKey) && !Object.values(S.schedule.replaced || {}).includes(w.id));
  extra.forEach(w => { h += `<button class="done27 tap" data-a="viewSummary" data-id="${w.id}"><div class="grow"><b>${esc(w.title)}</b><div class="xs dim">logged</div></div><span class="chev27">›</span></button>`; });
  if (!ss.length && !extra.length) h += `<div class="small muted" style="margin-top:8px">Recover: sleep, 10-min mobility. Hockey or a ride is fine if you feel good.</div>`;
  if (k > t && ss.some(s => s.kind === 'lift')) h += `<div class="xs dim" style="margin-top:10px">Targets update after each workout you log.</div>`;
  return h + `</div>`;
}
function refreshDay29(k) { const sh = $('.sheet'), y = sh ? sh.scrollTop : 0; openSheet(planDaySheet29(k), 'tall noanim29'); const s2 = $('.sheet'); if (s2) s2.scrollTop = y; rerenderKeep(); }
ACT.planDay = (el, d) => { haptic(); openSheet(planDaySheet29(d.date), 'tall'); };
ACT.every29 = (el, d) => { UI.every29 = d.v === '1'; haptic(); const pd = $('#pd29'); if (pd) refreshDay29(pd.dataset.date); else if ($('#pmw29')) pmwRender29(); };
ACT.qpSet = (el, d) => {
  const k = d.date; if (!setDay29(k, d.v, UI.every29)) return toast('Past days can’t be changed');
  haptic(12); toast(`${DOW[dow(k)]}${UI.every29 ? 's' : ''} → ${d.v === 'base' ? 'Arnold’s plan' : optName29(d.v)} ✓`);
  refreshDay29(k);
};

/* ---------- Plan my week: Mon → Sun on one screen ---------- */
UI.pmwWs = null;
function pmwHtml29() {
  const t = today(), ws = UI.pmwWs, cw = weekStart(t), lastWs = weekStart(PLAN_END);
  let h = `<div id="pmw29"><div class="eyebrow">${esc(firstName29())}’s week</div><h3>Plan my week</h3><div class="row between pmw29nav"><button class="icon-btn tap" data-a="pmwNav" data-n="-7" ${ws <= cw ? 'disabled' : ''} aria-label="Previous week">‹</button><b>${weekRange28(ws)}${ws === cw ? ' · this week' : ''}</b><button class="icon-btn tap" data-a="pmwNav" data-n="7" ${ws >= lastWs ? 'disabled' : ''} aria-label="Next week">›</button></div>`;
  h += scopeSeg29('every29', UI.every29, 'Just this week', 'Every week from now');
  const opts = [...LIB29.map(x => [x[0], x[1]]), ...Object.keys(PE.customSess).map(id => ['cs~' + id, PE.customSess[id].title]), ...CARD29.map(x => [x[0], x[1]])];
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i); if (!inPlan(k)) continue;
    const cur = curVal29(k), dp = dayPlan(k), done = dp && dp.sessions.some(s => sessStatus(s) === 'done' || sessStatus(s) === 'swapped'), lock = k < t || done || (dp && dp.off);
    h += `<div class="pmw29d ${lock ? 'lock' : ''} ${k === t ? 'now' : ''}" data-row="${k}"><div class="row between"><b>${DOW[i]} ${pkey(k).getDate()}${k === t ? ' · today' : ''}</b><span class="small muted">${lock ? (k < t ? 'past · ' : done ? 'done · ' : '') : ''}${esc(dp && dp.off ? dp.off : dp && dp.sessions.length ? dp.sessions.map(sName28).join(' + ') : 'Rest')}</span></div>`;
    if (!lock) h += `<div class="pmw29c">${opts.map(([v, n]) => `<button class="pmw29o tap ${v === cur ? 'on' : ''}" data-a="pmwSet" data-date="${k}" data-v="${esc(v)}">${esc(n)}</button>`).join('')}</div>`;
    h += `</div>`;
  }
  const free = [...Array(7)].map((_, i) => addDays(ws, i)).filter(k => k >= t && inPlan(k));
  if (free.length >= 2) h += `<div class="card pmw29sw"><b>Swap two days</b><div class="row" style="gap:8px;margin-top:8px"><select class="inp" id="swA">${free.map((k, i) => `<option value="${k}" ${i === 0 ? 'selected' : ''}>${DOW[dow(k)]} ${pkey(k).getDate()}</option>`).join('')}</select><span>⇄</span><select class="inp" id="swB">${free.map((k, i) => `<option value="${k}" ${i === 1 ? 'selected' : ''}>${DOW[dow(k)]} ${pkey(k).getDate()}</option>`).join('')}</select><button class="btn sm tap" data-a="pmwSwap">Swap</button></div></div>`;
  h += `<div class="pa29"><button class="btn sec tap" data-a="e29new">+ New session</button><button class="btn sec tap" data-a="e29list">✎ Edit sessions</button></div>`;
  h += `<button class="btn big tap" data-a="closeSheet" style="margin-top:10px">Done</button>`;
  if (PE.rules.some(r => r.type === 'day')) h += `<div style="margin-top:12px" id="rsW">${confirmBtn29('resetDays29', '↺ Reset all days to Arnold’s plan')}</div>`;
  return h + `</div>`;
}
function pmwRender29() { const box = $('#pmw29'); if (!box) return openSheet(pmwHtml29(), 'tall'); const sh = $('.sheet'), y = sh.scrollTop, xs = {}; $$('.pmw29c', box).forEach(c => xs[c.parentNode.dataset.row] = c.scrollLeft); box.outerHTML = pmwHtml29(); $$('.pmw29c').forEach(c => { const v = xs[c.parentNode.dataset.row]; if (v) c.scrollLeft = v; }); sh.scrollTop = y; }
ACT.pmwOpen = (el, d) => { haptic(); UI.pmwWs = d.ws || weekStart(today()); closeSheet(); openSheet(pmwHtml29(), 'tall'); };
ACT.pmwNav = (el, d) => { UI.pmwWs = addDays(UI.pmwWs, +d.n); haptic(); pmwRender29(); };
ACT.pmwSet = (el, d) => { if (!setDay29(d.date, d.v, UI.every29)) return; haptic(12); pmwRender29(); rerenderKeep(); };
ACT.pmwSwap = () => {
  const a = $('#swA').value, b = $('#swB').value; if (a === b) return toast('Pick two different days');
  const va = curVal29(a), vb = curVal29(b); setDay29(a, vb, UI.every29); setDay29(b, va, UI.every29);
  haptic(15); toast(`${DOW[dow(a)]} ⇄ ${DOW[dow(b)]} ✓`); pmwRender29(); rerenderKeep();
};

/* two-step confirm for resets */
function confirmBtn29(act, label) { return `<button class="btn sec tap rs29" data-a="ask29" data-do="${act}" data-label="${esc(label)}">${esc(label)}</button>`; }
ACT.ask29 = (el, d) => { haptic(); el.outerHTML = `<div class="cf29"><div class="small">Reset to Arnold’s plan? Your logged workouts don’t change.</div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm tap cf29y" data-a="${d.do}">Yes, reset</button><button class="btn sm sec tap" data-a="ask29no" data-do="${d.do}" data-label="${esc(d.label)}">Cancel</button></div></div>`; };
ACT.ask29no = (el, d) => { el.closest('.cf29').outerHTML = confirmBtn29(d.do, d.label); };
ACT.resetDays29 = () => { PE.rules = PE.rules.filter(r => r.type !== 'day'); savePE29(); toast('Days reset to Arnold’s plan'); pmwRender29(); rerenderKeep(); };
ACT.resetAll29 = (el) => { openSheet(`<div><h3>Reset everything?</h3><div class="small muted" style="margin:6px 0 12px">Puts every day and session back to Arnold’s plan and removes your own sessions. Logged workouts, history and maxes don’t change.</div>${confirmBtn29('resetAllDo29', '↺ Reset everything to Arnold’s plan')}</div>`); };
ACT.resetAllDo29 = () => { PE.rules = []; PE.customSess = {}; savePE29(); closeSheet(); toast('Back to Arnold’s plan'); rerenderKeep(); };

/* ---------- session list + editor ---------- */
ACT.e29list = () => {
  haptic(); const k = today();
  const row = (tpl, name, ic) => { const et = effTpl29(tpl, k), T = TEMPLATES[et] || TEMPLATES[tpl], mine = et !== tpl || tpl.startsWith('cs~'); return `<button class="done27 tap" data-a="e29open" data-tpl="${esc(tpl)}" data-date="${k}"><span style="font-size:20px">${ic}</span><div class="grow"><b>${esc(name)}</b><div class="xs dim">${esc(T.focus)}${mine ? ' · ✎ yours' : ''}</div></div><span class="chev27">›</span></button>`; };
  openSheet(`<div><div class="eyebrow">${esc(firstName29())}’s sessions</div><h3>Edit sessions</h3><div class="small muted" style="margin-bottom:8px">Tap one to change its exercises, sets, reps, weight, RPE and rest.</div>${LIB29.map(x => row(x[0], x[1], x[2])).join('')}${Object.keys(PE.customSess).map(id => row('cs~' + id, PE.customSess[id].title, '⭐')).join('')}<button class="btn sec tap" data-a="e29new" style="margin-top:10px">+ New session</button></div>`, 'tall');
};
let ED29 = null;
function draftSlot29(sl, k) {
  if (sl.pe) return { ...sl, ex0: sl.ex };
  const ex = S.swapPrefs[sl.id] || _profileEx28(sl, S.profile), sets = _buildSets28(sl, 'normal', S.profile, k);
  const role = sl.role === 'bench' ? 'main' : sl.role === 'tech' ? 'acc' : sl.role;
  return { id: sl.id, ex, ex0: ex, role, reps: slotReps(sl, k).slice(), n: sets.length, rpe: sets[0] && sets[0].rpeT !== 'Max intent' ? sets[0].rpeT : '', rest: '', w: '', ss: sl.ss || null };
}
ACT.e29open = (el, d) => {
  haptic(); const k = d.date && d.date >= today() ? d.date : today(), tpl = d.tpl, custom = tpl.startsWith('cs~');
  const et = custom ? tpl : effTpl29(tpl, k), T = TEMPLATES[et]; if (!T) return toast('Session not found');
  ED29 = { tpl, k, custom, title: custom ? PE.customSess[tpl.slice(3)].title : T.title, slots: slotsFor(et, S.profile).map(sl => draftSlot29(sl, k)), mode: 'edit', future: false, pickI: null, fromDay: !!$('#pd29') };
  ed29Render(true);
};
ACT.e29new = () => { haptic(); ED29 = { tpl: 'cs~' + uid(), k: today(), custom: true, isNew: true, title: 'My session', slots: [], mode: 'edit', pickI: null }; ed29Render(true); };
const MGROUP29 = m => /^Chest(\/|$)/.test(m) ? 'Chest' : /^Triceps/.test(m) ? 'Triceps' : /Back/.test(m) ? 'Back' : /Shoulders/.test(m) ? 'Shoulders' : /Rear/.test(m) ? 'Rear delts' : /Biceps/.test(m) ? 'Biceps' : /Hamstrings|Quads|Glutes|Calves|Adductors/.test(m) ? 'Legs' : /Power|Core/.test(m) ? 'Power & core' : 'Your exercises';
const GROUPS29 = ['Chest', 'Back', 'Shoulders', 'Rear delts', 'Biceps', 'Triceps', 'Legs', 'Power & core', 'Your exercises'];
function ed29Html() {
  const E = ED29;
  if (E.mode === 'pick') {
    const by = {}; Object.keys(EX).forEach(id => { const g = EX[id].custom ? 'Your exercises' : MGROUP29(EX[id].m); (by[g] = by[g] || []).push(id); });
    return `<div id="ed29"><button class="btn sm sec tap" data-a="e29back">‹ Back</button><h3 style="margin-top:10px">${E.pickI === -1 ? 'Add an exercise' : 'Swap ' + esc(EX[E.slots[E.pickI].ex].n)}</h3>
      <div class="card ed29cu"><b>Custom exercise</b><div class="row" style="gap:8px;margin-top:8px"><input class="inp" id="e29cn" placeholder="Name, e.g. Cable crunch" maxlength="40"><select class="inp" id="e29cm">${Object.keys(CUSTOM_MUSCLE).map(m => `<option>${m}</option>`).join('')}</select></div><button class="btn sm tap" style="margin-top:8px" data-a="e29custom">Use this exercise</button></div>
      <input class="inp" id="e29q" placeholder="Search exercises" autocomplete="off">
      ${GROUPS29.filter(g => by[g]).map(g => `<div class="pk29g"><div class="pk29h">${g}</div>${by[g].map(id => `<button class="pk29 tap" data-a="e29pick" data-id="${id}" data-n="${esc((EX[id].n + ' ' + EX[id].m).toLowerCase())}"><b>${esc(EX[id].n)}</b><span class="xs dim">${esc(EX[id].eq || '')}</span></button>`).join('')}</div>`).join('')}</div>`;
  }
  let h = `<div id="ed29"><div class="eyebrow">${E.custom ? (E.isNew ? 'New session' : 'Your session') : 'Edit session · ' + fmtDate(E.k)}</div><input class="inp ed29t" data-e29="title" value="${esc(E.title)}" aria-label="Session name" maxlength="30">`;
  if (!E.slots.length) h += `<div class="small muted" style="margin:10px 2px">No exercises yet — add one below.</div>`;
  E.slots.forEach((s, i) => {
    const ex = EX[s.ex], hold = ex.kind === 'hold', def = s.role === 'main' ? 'top set + back-offs' : '';
    h += `<div class="card ed29x"><div class="row ed29xh"><span class="ed29n">${i + 1}</span><div class="grow"><b>${esc(ex.n)}</b><div class="xs dim">${esc(ex.m)}${def ? ' · ' + def : ''}</div></div><button class="icon-btn tap" data-a="e29mv" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button class="icon-btn tap" data-a="e29mv" data-i="${i}" data-d="1" ${i === E.slots.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button><button class="icon-btn tap" data-a="e29rm" data-i="${i}" aria-label="Remove">✕</button></div>
      <button class="btn sm sec tap ed29sw" data-a="e29swap" data-i="${i}">⇄ Swap exercise</button>
      <div class="ed29g"><label>Sets<input class="inp" type="number" inputmode="numeric" min="1" max="10" data-e29="n" data-i="${i}" value="${s.n}"></label><label>${hold ? 'Sec' : 'Reps'} min<input class="inp" type="number" inputmode="numeric" min="1" data-e29="lo" data-i="${i}" value="${s.reps[0]}"></label><label>${hold ? 'Sec' : 'Reps'} max<input class="inp" type="number" inputmode="numeric" min="1" data-e29="hi" data-i="${i}" value="${s.reps[1]}"></label>
      <label>Weight ${wu()}<input class="inp" type="number" inputmode="decimal" step="any" data-e29="w" data-i="${i}" value="${s.w ? U.wOut(+s.w) : ''}" placeholder="auto" ${ex.kind !== 'w' ? 'disabled' : ''}></label><label>RPE<input class="inp" type="text" inputmode="decimal" data-e29="rpe" data-i="${i}" value="${esc(s.rpe || '')}" placeholder="8–9"></label><label>Rest sec<input class="inp" type="number" inputmode="numeric" step="15" data-e29="rest" data-i="${i}" value="${s.rest || ''}" placeholder="auto"></label></div></div>`;
  });
  h += `<button class="btn sec tap" data-a="e29add">+ Add exercise</button>`;
  if (!E.custom) h += `<div class="xs dim" style="margin:14px 2px 6px">Apply to</div>` + scopeSeg29('e29scope', E.future, 'Just this week', 'This week + all future weeks');
  h += `<div class="xs dim" style="margin:8px 2px">Deload and lighter weeks scale your sets automatically. “auto” = Arnold’s progression picks the weight.</div><button class="btn big tap" data-a="e29save">Save</button>`;
  if (!E.custom && PE.rules.some(r => r.type === 'sess' && r.tpl === E.tpl)) h += `<div style="margin-top:10px">${confirmBtn29('e29reset', '↺ Reset ' + E.title + ' to Arnold’s plan')}</div>`;
  if (E.custom && !E.isNew) h += `<div style="margin-top:10px">${confirmBtn29('e29del', 'Delete this session')}</div>`;
  return h + `</div>`;
}
function ed29Render(fresh) { const box = $('#ed29'); if (!box || fresh) { openSheet(ed29Html(), 'tall'); return; } box.outerHTML = ed29Html(); }
document.addEventListener('input', ev => {
  const el = ev.target;
  if (el.id === 'e29q') { const q = el.value.trim().toLowerCase(); $$('.pk29').forEach(b => b.style.display = !q || b.dataset.n.includes(q) ? '' : 'none'); $$('.pk29g').forEach(g => g.style.display = $$('.pk29', g).some(b => b.style.display !== 'none') ? '' : 'none'); return; }
  const f = el.dataset && el.dataset.e29; if (!f || !ED29) return;
  if (f === 'title') { ED29.title = el.value; return; }
  const s = ED29.slots[+el.dataset.i]; if (!s) return; const v = el.value.trim();
  if (f === 'n') s.n = Math.max(1, Math.min(10, parseInt(v) || 1));
  else if (f === 'lo') s.reps = [Math.max(1, parseInt(v) || 1), s.reps[1]];
  else if (f === 'hi') s.reps = [s.reps[0], Math.max(1, parseInt(v) || 1)];
  else if (f === 'w') s.w = v === '' ? '' : U.wIn(+v);
  else if (f === 'rpe') s.rpe = v.replace(/-/g, '–').slice(0, 7);
  else if (f === 'rest') s.rest = v === '' ? '' : Math.max(10, Math.min(600, parseInt(v) || 0));
});
ACT.e29scope = (el, d) => { ED29.future = d.v === '1'; haptic(); ed29Render(); };
ACT.e29mv = (el, d) => { const i = +d.i, j = i + +d.d, a = ED29.slots; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; haptic(); ed29Render(); };
ACT.e29rm = (el, d) => { ED29.slots.splice(+d.i, 1); haptic(); ed29Render(); };
ACT.e29swap = (el, d) => { ED29.mode = 'pick'; ED29.pickI = +d.i; haptic(); ed29Render(); const sh = $('.sheet'); if (sh) sh.scrollTop = 0; };
ACT.e29add = () => { ED29.mode = 'pick'; ED29.pickI = -1; haptic(); ed29Render(); const sh = $('.sheet'); if (sh) sh.scrollTop = 0; };
ACT.e29back = () => { ED29.mode = 'edit'; ed29Render(); };
function e29use(id) {
  const ex = EX[id], E = ED29;
  if (E.pickI === -1) E.slots.push({ id: 'x' + uid(), ex: id, ex0: null, role: ex.kind === 'power' ? 'power' : ex.kind === 'hold' ? 'hold' : 'acc', reps: ex.kind === 'hold' ? [20, 30] : ex.kind === 'power' ? [3, 3] : [8, 12], n: ex.kind === 'power' ? 3 : 2, rpe: '', rest: '', w: '', ss: null });
  else { const s = E.slots[E.pickI]; s.ex = id; s.w = ''; if (ex.kind === 'hold') { s.role = 'hold'; s.reps = [20, 30]; } else if (s.role === 'hold' || s.role === 'power') { s.role = ex.kind === 'power' ? 'power' : 'acc'; s.reps = ex.kind === 'power' ? [3, 3] : [8, 12]; } }
  E.mode = 'edit'; haptic(12); ed29Render(); toast(`${ex.n} ✓`);
}
ACT.e29pick = (el, d) => e29use(d.id);
ACT.e29custom = () => {
  const n = ($('#e29cn').value || '').trim(), m = $('#e29cm').value; if (!n) return toast('Type a name first');
  const same = Object.keys(PE.customEx).find(id => PE.customEx[id].n.toLowerCase() === n.toLowerCase());
  const id = same || 'cx_' + uid(); if (!same) { PE.customEx[id] = { n, m }; savePE29(); }
  e29use(id);
};
ACT.e29save = () => {
  const E = ED29; if (!E) return;
  if (!E.slots.length) return toast('Add at least one exercise');
  const slots = E.slots.map(s => { const o = { ...s }; if (o.ex0 !== undefined && o.ex0 !== null && o.ex !== o.ex0) o.id = 'x' + uid(); delete o.ex0; if (o.reps[1] < o.reps[0]) o.reps = [o.reps[1], o.reps[0]]; return o; });
  const data = { title: (E.title || '').trim().slice(0, 30) || 'My session', slots };
  if (E.custom) { PE.customSess[E.tpl.slice(3)] = data; savePE29(); toast(`${data.title} saved ✓`); }
  else {
    const t = today(), ws = weekStart(E.k), from = ws < t ? t : ws, to = E.future ? null : addDays(ws, 6);
    PE.rules = PE.rules.filter(r => !(r.type === 'sess' && r.tpl === E.tpl && r.from >= from && (E.future || r.to === to)));
    PE.rules.push({ id: uid(), type: 'sess', tpl: E.tpl, from, to, data });
    savePE29(); toast(`${data.title} saved · ${E.future ? 'this week + future' : 'this week'} ✓`);
  }
  const k = E.k; ED29 = null; closeSheet(); rerenderKeep(); if (E.fromDay) openSheet(planDaySheet29(k), 'tall');
};
ACT.e29reset = () => { const E = ED29; PE.rules = PE.rules.filter(r => !(r.type === 'sess' && r.tpl === E.tpl)); savePE29(); toast(`${optName29(E.tpl)} reset to Arnold’s plan`); ED29 = null; closeSheet(); rerenderKeep(); };
ACT.e29del = () => { const E = ED29, id = E.tpl.slice(3); delete PE.customSess[id]; PE.rules = PE.rules.filter(r => !(r.type === 'day' && r.spec && r.spec.tpl === E.tpl)); savePE29(); toast('Session deleted'); ED29 = null; closeSheet(); rerenderKeep(); };

/* ---------- Christmas goals ---------- */
const XMAS29 = '2026-12-25', XFROM29 = '2026-10-28', XLIFTS29 = 30, XW29 = 205;
const XMAIN29 = [['flat_bench', 'Bench'], ['cs_row', 'Row'], ['seated_db_press', 'Shoulder press'], ['leg_press', 'Leg press'], ['rdl', 'RDL']];
function topSet29(h) { const ss = h.sets.filter(s => s.done && s.r); return ss.find(s => s.tag === 'Top') || ss.reduce((a, s) => (s.w || 0) > (a.w || 0) ? s : a, ss[0]); }
function xmas29() {
  const t = today(), left = Math.max(0, diffDays(t, XMAS29));
  const av = avgWeight(t), cur = av ? av.v : lastWeight(), st0 = avgWeight(XFROM29), start = Math.max(st0 ? st0.v : (S.settings.startWeight || 210), XW29 + 0.1);
  const wPct = cur == null ? 0 : Math.max(0, Math.min(1, (start - cur) / (start - XW29)));
  const lifts = S.workouts.filter(w => w.kind === 'lift' && w.date >= XFROM29 && w.date <= XMAS29).length, need = Math.max(0, XLIFTS29 - lifts), wks = Math.max(1, left / 7);
  const main = XMAIN29.map(([id, n]) => {
    const h = exHistory(id), pre = h.filter(x => x.date < XFROM29).pop(), base = pre ? topSet29(pre) : null;
    if (!base) return { id, n, st: 'none' };
    const be = e1rm(base.w || 0, base.r), beat = h.filter(x => x.date >= XFROM29).some(x => x.sets.some(s => s.done && s.r && e1rm(s.w || 0, s.r) > be + 0.01));
    return { id, n, st: beat ? 'beat' : 'not', base };
  });
  return { left, cur, start, wPct, lifts, need, pace: need / wks, main, tracked: main.filter(m => m.st !== 'none').length, beaten: main.filter(m => m.st === 'beat').length };
}
function xmasCard29() {
  const X = xmas29(), f1 = v => (Math.round(v * 10) / 10).toString(), togo = X.cur != null ? Math.max(0, X.cur - XW29) : null;
  return `<div class="card xm29" id="xmas"><div class="row between"><b>🎄 ${esc(firstName29())}’s Christmas goals</b><span class="xm29d">${X.left} day${X.left === 1 ? '' : 's'}</span></div>
    <div class="xm29r"><div class="row between"><span>Weigh ~${XW29} lb</span><b>${X.cur != null ? `${U.wOut(X.cur)} ${wu()} · ${togo > 0 ? f1(U.wOut(togo)) + ' to go' : 'there ✓'}` : 'log a weigh-in'}</b></div><div class="bar29"><i style="width:${Math.round(X.wPct * 100)}%"></i></div><div class="xs dim">7-day average</div></div>
    <div class="xm29r"><div class="row between"><span>${XLIFTS29}+ lifts</span><b>${X.lifts}/${XLIFTS29}${X.need ? ` · ~${f1(X.pace)}/week` : ' ✓'}</b></div><div class="bar29"><i style="width:${Math.min(100, Math.round(X.lifts / XLIFTS29 * 100))}%"></i></div><div class="xs dim">lift sessions since Oct 28${X.need ? ` · ${X.need} to go` : ''}</div></div>
    <div class="xm29r"><div class="row between"><span>Beat last time</span><b>${X.beaten}/${X.tracked || XMAIN29.length}</b></div><div class="xm29cs">${X.main.map(m => `<span class="xm29c ${m.st}">${esc(m.n)} ${m.st === 'beat' ? '✓' : m.st === 'not' ? `<i>${ex29fmt(m.id, m.base)}</i>` : '<i>no log yet</i>'}</span>`).join('')}</div></div></div>`;
}
function ex29fmt(id, s) { const ex = EX[id]; return `${ex.added && !s.w ? 'BW' : U.wOut(s.w || 0)}×${s.r}`; }
function xmasLine29() { const X = xmas29(); return `<button class="xm29s tap" data-a="goTab" data-tab="progress">🎄 <b>${X.left} days</b> to Christmas · ${X.cur != null ? U.wOut(X.cur) + '→' + XW29 : '→' + XW29} · ${X.lifts}/${XLIFTS29} lifts · ${X.beaten}/${X.tracked || XMAIN29.length} beat<span class="chev27">›</span></button>`; }
const _growStrip28 = growStrip27;
growStrip27 = function (k) { return xmasLine29() + _growStrip28(k); };

/* ---------- My maxes (he fills these in himself) ---------- */
const MAX_DEFAULT29 = ['Bench press', 'Row', 'Shoulder press', 'Leg press', 'RDL'];
function maxesHtml29() {
  const M = S.maxes || [];
  return `<h2 class="sec">My maxes <button class="btn sm sec tap" data-a="mx29">${M.length ? 'Edit' : '+ Add'}</button></h2><div class="card" id="maxes">${M.length ? M.map(m => `<div class="mx29r"><div class="grow"><b>${esc(m.lift)}</b><div class="xs dim">${m.date ? fmtDate(m.date) : ''}${m.r > 1 ? ` · e1RM ~${Math.round(U.wOut(e1rm(m.w, m.r)))} ${wu()}` : ''}</div></div><b class="mx29v">${U.wOut(m.w)} ${wu()} × ${m.r || 1}</b></div>`).join('') : '<div class="small muted">Add your best lifts (weight × reps) — they stay on this phone.</div>'}</div>`;
}
function mxRow29(m) { return `<div class="mx29e"><input class="inp" data-mx="lift" value="${esc(m.lift || '')}" placeholder="Lift" maxlength="30"><div class="row" style="gap:6px"><input class="inp" type="number" inputmode="decimal" step="any" data-mx="w" value="${m.w ? U.wOut(m.w) : ''}" placeholder="${wu()}"><span>×</span><input class="inp" type="number" inputmode="numeric" data-mx="r" value="${m.r || ''}" placeholder="reps"><input class="inp" type="date" data-mx="date" value="${esc(m.date || '')}"><button class="icon-btn tap" data-a="mxDel" aria-label="Remove">✕</button></div></div>`; }
ACT.mx29 = () => { haptic(); const M = S.maxes.length ? S.maxes : MAX_DEFAULT29.map(l => ({ lift: l })); openSheet(`<div id="mx29"><div class="eyebrow">${esc(firstName29())}’s numbers</div><h3>My maxes</h3><div class="small muted" style="margin-bottom:8px">Lift, weight, reps and the date you did it. Leave a row blank to skip it.</div><div id="mxRows">${M.map(mxRow29).join('')}</div><button class="btn sec tap" data-a="mxAdd">+ Add lift</button><button class="btn big tap" data-a="mxSave" style="margin-top:10px">Save maxes</button></div>`, 'tall'); };
ACT.mxAdd = () => { $('#mxRows').insertAdjacentHTML('beforeend', mxRow29({ date: today() })); };
ACT.mxDel = (el) => { el.closest('.mx29e').remove(); };
ACT.mxSave = () => {
  const rows = $$('.mx29e').map(r => { const g = f => r.querySelector(`[data-mx="${f}"]`).value.trim(); return { lift: g('lift'), w: U.wIn(g('w') === '' ? null : +g('w')), r: parseInt(g('r')) || 1, date: g('date') || null }; }).filter(m => m.lift && m.w);
  S.maxes = rows.map(m => ({ id: uid(), ...m })); save(); closeSheet(); haptic(15); toast(`${rows.length} max${rows.length === 1 ? '' : 'es'} saved ✓`); rerenderKeep();
};

/* ---------- Progress / More wiring ---------- */
const _progress28 = VIEWS.progress;
VIEWS.progress = function () {
  let h = _progress28();
  h = h.replace('<h2 class="sec first">Workout history', xmasCard29() + '<h2 class="sec">Workout history');
  const i = h.indexOf('<h2 class="sec">Lift trends'); h = i >= 0 ? h.slice(0, i) + maxesHtml29() + h.slice(i) : h + maxesHtml29();
  return h;
};
const _more28 = VIEWS.more;
VIEWS.more = function () { return _more28().replace(/Arnold Fit v2\.8/g, 'Arnold Fit v2.9').replace(/(<button class="more27 tap" data-a="goTab" data-tab="plan">[\s\S]*?<\/button>)/, '$1' + `<button class="more27 tap" data-a="mx29"><span class="grow">My maxes</span><span class="small dim">${S.maxes.length || 'add'}</span><span class="chev27">›</span></button><button class="more27 tap" data-a="e29list"><span class="grow">Edit sessions</span><span class="small dim">exercises, sets, reps</span><span class="chev27">›</span></button>`); };
const _settings28 = VIEWS.settings;
VIEWS.settings = function () { return _settings28().replace(/Arnold Fit v2\.\d/g, 'Arnold Fit v2.9'); };
