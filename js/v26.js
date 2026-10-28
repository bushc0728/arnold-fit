/* Arnold Fit v2.6 — "Pick today's workout" (plan first, but something beats nothing), Minimum day, week balance,
   one-time import of this week's activities, food log → nightly log, calendar → Food day.
   Loads after v25.js. Additive only: picks live in S.schedule.pick[k] = { type, rep:[replaced keys], at }; nothing old is rewritten. */
'use strict';
const PICKS = {
  push: { ic: '🫸', label: 'Push', tpl: 'pushP', title: 'Push · your pick', cats: ['push'] },
  pull: { ic: '🧗', label: 'Pull', tpl: 'pullP', title: 'Pull · your pick', cats: ['pull'] },
  legs: { ic: '🦵', label: 'Legs', sub: 'knee-friendly', tpl: 'lowerS', title: 'Legs (knee-friendly) · your pick', cats: ['legs'] },
  upper: { ic: '💪', label: 'Upper', sub: 'heavy bench', tpl: 'upperA', title: 'Upper · your pick', cats: ['push', 'pull'] },
  full: { ic: '🏋️', label: 'Full Body', tpl: 'fullP', title: 'Full Body · your pick', cats: ['push', 'pull', 'legs'] },
  arms: { ic: '🦾', label: 'Arms + Shoulders', tpl: 'upperB2', title: 'Arms + Shoulders · your pick', cats: ['push'] },
  hockey: { ic: '🏒', label: 'Hockey', qa: ['hockey', null, 75, 8], cats: ['cardio'] },
  mtb: { ic: '🚵', label: 'MTB', qa: ['bike', 'mtb', 60, 6], cats: ['cardio'] },
  run: { ic: '🏃', label: 'Run', qa: ['run', null, 30, 5], cats: ['cardio'] },
  rest: { ic: '💤', label: 'Rest', cats: [] },
};
const TPL_CATS = { upperA: ['push', 'pull'], upperB: ['push', 'pull'], upperC: ['push', 'pull'], upperB2: ['push'], pushP: ['push'], pullP: ['pull'], lower: ['legs'], lowerS: ['legs'], fullP: ['push', 'pull', 'legs'] };
const MIN_STEPS = [['Push-ups 3 × 8–15', 'Easy reps, stop 2–3 short of failure (knees or incline is fine)'], ['DB rows or band pull-aparts 3 × 12–15', 'Squeeze the shoulder blades'], ['10 min easy walk or spin', 'Conversational — just move'], ['5 min mobility', '90/90 hips · open books · ankle rocks']];

/* ---------- plan overrides: the pick joins the day, the sessions it replaces drop out ---------- */
function pickSession(k, pk, b) {
  if (!pk || !b) return null;
  const mod = b.meta.deload ? 'deload' : b.meta.finals ? 'reduced' : 'normal';
  if (pk.type === 'min') return { kind: 'cardio', code: 'MIN', key: k + ':MIN', minDay: true, cardio: { mode: 'walk', title: 'Minimum day', min: 20, steps: MIN_STEPS, checklist: MIN_STEPS.map(s => s[0]) }, title: 'Minimum day · 15–20′', sub: 'Push-ups · rows · walk/spin · mobility', icon: 'M', color: 'bike', min: 20, why: WHY.MIN };
  const P = PICKS[pk.type]; if (!P || !P.tpl) return null; const T = TEMPLATES[P.tpl];
  return { kind: 'lift', tpl: P.tpl, code: 'PK-' + pk.type, key: k + ':PK-' + pk.type, mod, title: P.title, sub: T.focus, icon: T.icon, color: T.color, min: Math.min(S.profile.sessionMin || 60, T.est), why: WHY.PICK + (mod !== 'normal' ? ' ' + WHY[mod] : ''), finisher: null, picked: true };
}
const _base25 = base;
base = function (k) {
  const b = _base25(k), pk = (S.schedule.pick || {})[k]; if (!b || !pk) return b;
  const s = pickSession(k, pk, b); return s ? { ...b, sessions: b.sessions.concat([s]) } : b;
};
dayPlan = function (k) {
  const b = base(k); if (!b) return null;
  const mv = S.schedule.moves, rep = new Set(((S.schedule.pick || {})[k] || {}).rep || []);
  const own = b.sessions.filter(s => !rep.has(s.key) && (!mv[s.key] || mv[s.key] === k));
  const incoming = Object.keys(mv).filter(key => mv[key] === k && key.split(':')[0] !== k && !rep.has(key)).map(key => { const s = sessionByKey(key); return s ? { ...s, movedFrom: key.split(':')[0] } : null; }).filter(Boolean);
  const sessions = own.concat(incoming).map(s => ({ ...s, skipped: !!S.schedule.skips[s.key], replaced: replacedBy(s.key), date: k }));
  return { ...b, sessions, off: S.schedule.off[k] || null };
};
invalidatePlan();

/* ---------- categories, balance, guidance ---------- */
function wCats(w) {
  if (/:MIN$/.test(w.sessionKey || '')) return ['min'];
  if (w.kind === 'lift') { const s = sessionByKey(w.sessionKey || ''); if (s && TPL_CATS[s.tpl]) return TPL_CATS[s.tpl]; const t = (w.title || '').toLowerCase(); return /lower|leg/.test(t) ? ['legs'] : /pull/.test(t) ? ['pull'] : /push/.test(t) ? ['push'] : /full/.test(t) ? ['push', 'pull', 'legs'] : ['push', 'pull']; }
  return w.cardio ? ['cardio'] : [];
}
function catsOn(k) { const c = new Set(); S.workouts.filter(w => w.date === k).forEach(w => wCats(w).forEach(x => c.add(x))); return c; }
function weekBalance(k) { const ws = weekStart(k), n = { push: 0, pull: 0, legs: 0, cardio: 0, min: 0 }; S.workouts.filter(w => w.date >= ws && w.date <= addDays(ws, 6)).forEach(w => wCats(w).forEach(c => n[c]++)); return n; }
function legsGuard(k) { // 48-h rule: grey legs after hard hockey / MTB (effort ≥7) today or yesterday; warn at 2 days or before hockey
  const acts = hardActsNear(k).filter(w => w.date <= k); const tom = dayPlan(addDays(k, 1)), hockeyTom = tom && tom.sessions.some(s => isHockeyS(s) && sessStatus(s) === 'todo');
  if (acts.length) { const a = acts.reduce((x, y) => (y.date > x.date ? y : x)), gap = diffDays(a.date, k), what = `${a.title}${a.cardio.rpe ? ' (effort ' + a.cardio.rpe + ')' : ''} ${gap === 0 ? 'today' : gap === 1 ? 'yesterday' : '2 days ago'}`; return { grey: gap <= 1, msg: gap <= 1 ? `${what} — no heavy legs within 48 h` : `${what} — right at 48 h, keep legs light` }; }
  if (hockeyTom) return { grey: false, msg: 'Hockey tomorrow — keep legs light' };
  return null;
}
function pickRec(k) {
  const bal = weekBalance(k), y = catsOn(addDays(k, -1)), lg = legsGuard(k), dp = dayPlan(k);
  if (dp && dp.sessions.some(s => s.kind === 'lift' && sessStatus(s) === 'todo')) { const s = dp.sessions.find(x => x.kind === 'lift' && sessStatus(x) === 'todo'); return { type: null, plan: s, why: 'The plan has it covered — do that first.' }; }
  const score = t => { const P = PICKS[t]; let v = 0; P.cats.forEach(c => { v += bal[c] ? -bal[c] : 2; if (y.has(c)) v -= 3; }); if (P.cats.includes('legs') && lg) v -= lg.grey ? 20 : 4; if (t === 'upper') v += 0.5; return v / P.cats.length; };
  const t = ['pull', 'push', 'legs', 'upper', 'full'].sort((a, b) => score(b) - score(a))[0];
  const P = PICKS[t], why = P.cats.map(c => bal[c] ? (y.has(c) ? `${c} yesterday` : `${c} ×${bal[c]} this week`) : `no ${c} yet this week`).join(' · ');
  return { type: t, why: why.charAt(0).toUpperCase() + why.slice(1) };
}
function balanceHtml(k) {
  const n = weekBalance(k), row = [['push', 'Push', 2], ['pull', 'Pull', 2], ['legs', 'Legs', 1], ['cardio', 'Cardio', 3]];
  return `<div class="bal">${row.map(([id, l, tgt]) => `<div class="bal-i ${n[id] >= tgt ? 'ok' : ''}"><span>${l}</span><div class="bal-p">${[...Array(Math.max(tgt, n[id]))].map((_, i) => `<i class="${i < n[id] ? 'on c-' + id : ''}"></i>`).join('')}</div></div>`).join('')}</div><div class="xs dim" style="margin-top:6px">Week balance (done)${n.min ? ` · ${n.min} min day${n.min > 1 ? 's' : ''}` : ''} · goal ≥2 lifts</div>`;
}
const pickNow = k => (S.schedule.pick || {})[k] || null;
function pickDoneW(k) { const pk = pickNow(k); if (!pk) return null; const key = k + ':' + (pk.type === 'min' ? 'MIN' : 'PK-' + pk.type); return sessionDone(key) || replacedBy(key) || null; }

/* ---------- the card ---------- */
function pickGrid(k) {
  const lg = legsGuard(k), y = catsOn(addDays(k, -1)), rec = pickRec(k), cur = pickNow(k);
  return `<div class="pgrid">${Object.entries(PICKS).map(([id, P]) => {
    const grey = (id === 'legs' && lg && lg.grey), warn = ((id === 'legs' || id === 'full') && lg) ? lg.msg : (P.cats.some(c => c !== 'cardio' && y.has(c)) ? `${P.cats.filter(c => y.has(c)).join(' + ')} yesterday` : '');
    return `<button class="pk tap ${grey ? 'grey' : ''} ${rec.type === id ? 'rec' : ''} ${cur && cur.type === id ? 'on' : ''}" data-a="pick" data-t="${id}" data-date="${k}" ${grey ? 'aria-disabled="true"' : ''}><span class="pk-ic">${P.ic}</span><b>${P.label}</b>${P.sub ? `<small>${P.sub}</small>` : ''}${warn ? `<em>⚠︎ ${esc(warn)}</em>` : ''}</button>`;
  }).join('')}</div>`;
}
function pickCard(k, where) {
  const dp = dayPlan(k); if (!dp) return '';
  const rec = pickRec(k), cur = pickNow(k), done = pickDoneW(k), open = where === 'train' || UI.pickOpen === k || (!dp.sessions.length && !qaExtras(k).length);
  const trained = dp.sessions.length && nnItem('train', k).ok && dp.sessions.some(s => ['done', 'swapped'].includes(sessStatus(s)));
  let h = `<div class="card pickc" id="pickCard-${where}"><div class="row between"><b class="pc-t">🎯 ${where === 'train' ? 'Pick a workout' : 'Plan first — or pick something else'}</b><span class="chip grad pc-tag">Something &gt; nothing.</span></div>`;
  if (where === 'train') h += `<div class="pdays">${[...Array(BACKDATE_DAYS + 1)].map((_, i) => addDays(today(), i - BACKDATE_DAYS)).map(d => `<button class="tap ${d === k ? 'on' : ''}" data-a="pickDay" data-date="${d}"><span>${DOW[dow(d)]}</span><b>${pkey(d).getDate()}</b>${pickNow(d) ? '<i></i>' : ''}</button>`).join('')}</div>`;
  if (cur) { const reps = (cur.rep || []).map(key => (sessionByKey(key) || { title: key.split(':')[1] }).title); h += `<div class="pcur"><span>${cur.type === 'min' ? '⚡' : PICKS[cur.type] ? PICKS[cur.type].ic : '🎯'}</span><div class="grow"><b>${cur.type === 'min' ? 'Minimum day' : PICKS[cur.type].label} is on ${k === today() ? 'today' : fmtDow(k)}</b><div class="xs dim">${done ? '✓ done — counts for the streak' + (cur.type === 'min' ? ' (min)' : ' and the 2-lift rule') : reps.length ? 'replaces ' + esc(reps.join(' + ')) : 'added to the day'}</div></div>${done ? '' : `<button class="btn sm sec tap" data-a="pickClear" data-date="${k}">Back to plan</button>`}</div>`; }
  if (dp.meta.deload) h += `<div class="xs dim pdl">Deload week — lifts top out at RPE 7 (≈3 reps in the tank). Nov 2 the plan picks back up.</div>`;
  if (trained && !cur && where === 'today') h += `<div class="small muted" style="margin-top:8px">✓ Training is done today. Extra? Pick it below.</div>`;
  else if (rec.plan && !cur) h += `<div class="small muted" style="margin-top:8px">${esc(rec.plan.title)} is on the plan — ${esc(rec.why)}</div>`;
  else if (rec.type) h += `<button class="prec tap" data-a="pick" data-t="${rec.type}" data-date="${k}"><span>${PICKS[rec.type].ic}</span><div class="grow"><b>Recommended: ${PICKS[rec.type].label}</b><div class="xs dim">${esc(rec.why)}</div></div><span class="pgo">Go ›</span></button>`;
  h += `<div class="row pbtns">${where === 'today' ? `<button class="btn sm sec tap grow" data-a="pickToggle" data-date="${k}" aria-expanded="${open}">${open ? 'Hide picks ▴' : 'Pick something else ▾'}</button>` : ''}<button class="btn sm tap grow pmin" data-a="minDay" data-date="${k}" ${cur && cur.type === 'min' ? 'disabled' : ''}>⚡ Minimum day · 15–20′</button></div>`;
  if (open) h += pickGrid(k);
  h += `<div class="xs dim" style="margin:8px 0 2px">Minimum day = push-ups, DB rows / band pulls, 10′ walk or spin, mobility. Keeps the streak (marked “min”), not a lift.</div>`;
  return h + balanceHtml(k) + `</div>`;
}

/* ---------- actions ---------- */
let UNDO_PICK = null;
function setPick(k, type) {
  const prev = pickNow(k); if (prev && pickDoneW(k)) { toast('Today’s pick is already done — add more with ＋ Activity'); return false; }
  if (S.active && prev && S.active.sessionKey === k + ':PK-' + prev.type) { toast('Finish or discard the workout in progress first'); return false; }
  S.schedule.pick = S.schedule.pick || {}; delete S.schedule.pick[k]; invalidatePlan();
  const dp = dayPlan(k), rep = dp ? dp.sessions.filter(s => s.kind !== 'test' && ['todo', 'skipped'].includes(sessStatus(s))).map(s => s.key) : [];
  S.schedule.pick[k] = { type, rep, at: Date.now() }; invalidatePlan(); UNDO_PICK = { k, prev }; save(); haptic([12, 30, 12]); return rep;
}
ACT.pick = (el, d) => {
  const k = d.date || today(), t = d.t, P = PICKS[t]; if (!P) return;
  if (k > today() || !canBackdate(k)) return toast(`Pick for today or the last ${BACKDATE_DAYS} days`);
  if (P.qa) { // cardio: open quick add preset (it replaces what's left on the plan, as always)
    ACT.qaOpen(el, { date: k }); const q = UI.qa; if (!q) return; [q.type, q.sub, q.dur, q.rpe] = [P.qa[0], P.qa[1] || 'mtb', P.qa[2], P.qa[3]]; const x = $('#qa'); if (x) x.outerHTML = qaHtml(); return;
  }
  if (t === 'rest') {
    const dp = dayPlan(k), todo = dp ? dp.sessions.filter(s => s.kind !== 'test' && sessStatus(s) === 'todo') : [];
    if (!todo.length) return toast('Nothing left on the plan — enjoy the rest 💤');
    if (!confirm(`Rest ${k === today() ? 'today' : fmtDow(k)}? This skips ${todo.map(s => s.title).join(' + ')}.\n\nTip: a 15–20′ Minimum day keeps the streak alive — rest doesn’t.`)) return;
    todo.forEach(s => { S.schedule.skips[s.key] = { reason: 'Rest day (picked)', t: Date.now() }; }); UNDO_PICK = { rest: todo.map(s => s.key) }; save(); toast('Rest day logged — sleep, protein, mobility', 'pickUndo'); return rerenderKeep();
  }
  const lg = legsGuard(k);
  if ((t === 'legs' && lg && lg.grey && !confirm(`⚠️ ${lg.msg}.\nThe rule is no heavy lower body within 48 h of hard hockey or a hard ride. Do it anyway (keep it light)?`)) || (t === 'full' && lg && lg.grey && !confirm(`⚠️ ${lg.msg}. Full Body includes legs — keep them light. Continue?`))) return;
  const rep = setPick(k, t); if (rep === false) return;
  UI.pickOpen = null; closeSheet();
  toast(`${P.label} is on ${k === today() ? 'today' : fmtDow(k)}${rep.length ? ' · replaces ' + rep.map(x => (sessionByKey(x) || { title: 'plan' }).title).join(' + ') : ''}`, 'pickUndo');
  rerenderKeep();
};
ACT.minDay = (el, d) => {
  const k = d.date || today(); if (k > today() || !canBackdate(k)) return toast(`Pick for today or the last ${BACKDATE_DAYS} days`);
  const rep = setPick(k, 'min'); if (rep === false) return;
  toast(`Minimum day ${k === today() ? 'today' : fmtDow(k)} — 15–20′. Something > nothing.`, 'pickUndo'); rerenderKeep();
};
ACT.pickUndo = () => {
  const u = UNDO_PICK; if (!u) return; UNDO_PICK = null;
  if (u.rest) u.rest.forEach(key => delete S.schedule.skips[key]);
  else { S.schedule.pick = S.schedule.pick || {}; if (u.prev) S.schedule.pick[u.k] = u.prev; else delete S.schedule.pick[u.k]; }
  invalidatePlan(); save(); toast('Back to the plan'); rerenderKeep();
};
ACT.pickClear = (el, d) => { const k = d.date; if (pickDoneW(k)) return; UNDO_PICK = { k, prev: pickNow(k) }; if (S.schedule.pick) delete S.schedule.pick[k]; invalidatePlan(); save(); haptic(); toast('Back to the plan', 'pickUndo'); rerenderKeep(); };
ACT.pickToggle = (el, d) => { UI.pickOpen = UI.pickOpen === d.date ? null : d.date; haptic(); rerenderKeep(); };
ACT.pickDay = (el, d) => { UI.pickDate = d.date === today() ? null : d.date; haptic(); rerenderKeep(); };

/* ---------- one-time import: Sun hockey + Mon/Tue MTB (Oct 25–27) ---------- */
const IMPORT_W43 = [
  { k: '2026-10-25', type: 'hockey', sub: null, title: 'Hockey', dur: 60, rpe: 7 },
  { k: '2026-10-26', type: 'bike', sub: 'mtb', title: 'MTB ride', dur: 60, rpe: 6 },
  { k: '2026-10-27', type: 'bike', sub: 'mtb', title: 'MTB ride', dur: 60, rpe: 6 },
];
const impLogged = k => S.workouts.some(w => w.date === k);
function importCard() {
  const t = today(); if ((S.v26 || {}).import43 || t < '2026-10-27' || t > '2026-11-01') return '';
  const rows = IMPORT_W43.filter(r => canBackdate(r.k) && r.k <= t); if (!rows.length) return '';
  return `<div class="card impc" id="importCard"><div class="row between"><b>📥 Import this week’s activities?</b><span class="chip">one-time</span></div><div class="small muted" style="margin:4px 0 10px">Logs them as quick-add swaps that replace that day’s plan. Minutes & effort are <b>estimates</b> — edit before importing (or later via Details).</div>
  ${rows.map((r, i) => { const has = impLogged(r.k); return `<div class="improw ${has ? 'has' : ''}"><div class="grow"><b>${r.type === 'hockey' ? '🏒' : '🚵'} ${fmtDow(r.k)} · ${r.title}</b>${has ? '<div class="xs dim">already logged that day — will be skipped</div>' : ''}</div>${has ? '' : `<label class="impf"><input class="inp" type="number" inputmode="numeric" min="5" max="300" data-impd="${i}" value="${r.dur}"><span>min</span></label><label class="impf"><input class="inp" type="number" inputmode="numeric" min="1" max="10" data-impr="${i}" value="${r.rpe}"><span>effort</span></label>`}</div>`; }).join('')}
  <div class="row" style="gap:8px;margin-top:12px"><button class="btn tap grow" data-a="impGo">Import ✓</button><button class="btn sec tap grow" data-a="impNo">No thanks</button></div></div>`;
}
ACT.impGo = () => {
  const t = today(); let n = 0, skipped = 0;
  IMPORT_W43.forEach((r, i) => {
    if (r.k > t || !canBackdate(r.k)) return;
    if (impLogged(r.k) || S.workouts.some(w => w.imp === 'w43' && w.date === r.k)) { skipped++; return; } // never double-log or overwrite a logged day
    const di = $(`[data-impd="${i}"]`), ri = $(`[data-impr="${i}"]`), dur = Math.max(5, Math.min(300, +(di && di.value) || r.dur)), rpe = Math.max(1, Math.min(10, Math.round(+(ri && ri.value) || r.rpe)));
    const Q = QA_TYPES[r.type], dp = dayPlan(r.k), reps = qaTodo(r.k).map(s => s.key), id = uid(), end = atTime(r.k, r.type === 'hockey' ? 20 : 17, 30);
    const w = { id, date: r.k, sessionKey: `${r.k}:QA-${id}`, title: r.title, kind: 'cardio', color: Q.color, wk: dp ? dp.wk : null, mod: 'normal', startedAt: end - dur * 60000, endedAt: end, exercises: [], checklist: [], why: '',
      cardio: { mode: Q.mode, sub: r.sub, title: r.title, steps: [], min: dur, planDist: null, dur, dist: null, rpe, knee: null, notes: 'Imported estimate — edit any time' }, quick: true, swap: true, replaces: reps, est: true, imp: 'w43' };
    computeSummary(w); S.workouts.push(w); reps.forEach(key => { S.schedule.replaced[key] = id; }); n++;
  });
  S.v26 = S.v26 || {}; S.v26.import43 = 'done'; save(); haptic([15, 30, 15]);
  toast(n ? `Imported ${n} activit${n === 1 ? 'y' : 'ies'}${skipped ? ` · ${skipped} day${skipped > 1 ? 's' : ''} already logged` : ''} — estimates, tap Details to edit` : 'Those days were already logged — nothing to import'); rerenderKeep();
};
ACT.impNo = () => { S.v26 = S.v26 || {}; S.v26.import43 = 'dismissed'; save(); haptic(); rerenderKeep(); };

/* ---------- views: Today + Train ---------- */
/* Today is rebuilt in the GROW pass at the bottom of this file. */
const _train25 = VIEWS.train;
VIEWS.train = function () {
  const h = _train25(), k = UI.pickDate && canBackdate(UI.pickDate) ? UI.pickDate : today(), i = h.indexOf('<div class="card">');
  const pc = inPlan(k) ? pickCard(k, 'train') : '';
  const ws = foldSec('wsets', '📊', 'Weekly sets per muscle', 'hypertrophy check', weeklySetsHtml(k));
  return (i >= 0 ? h.slice(0, i) + pc + h.slice(i) : h + pc) + ws;
};
// "min" marker on the streak line
const _wsum25 = weekSumCard;
weekSumCard = function (k, withLast) { let h = _wsum25(k, withLast); const n = weekBalance(k).min; if (n) h = h.replace('<span class="dim">(swaps count)</span>', `<span class="dim">(swaps count · ${n} min day${n > 1 ? 's' : ''})</span>`); return h; };

/* ---------- nightly log: food totals come from the Food tab; typing overrides ---------- */
const _nightly25 = nightlyHtml;
nightlyHtml = function (k) {
  let h = _nightly25(k); const m = mfpFor(k), f = foodDay(k), tot = f.length ? foodTotals(k) : null;
  h = h.replace(/Food totals <small class="dim">[^<]*<\/small>/, `Food totals <small class="dim">${tot && !m ? 'auto from Food · type to override' : m ? 'manual override' : 'from the Food tab · or type totals'}</small>`);
  if (tot && !m) {
    const kc = Math.round(tot.kcal), p = Math.round(tot.p);
    h = h.replace(/(<input[^>]*id="nl-kcal"[^>]*?)value=""/, `$1value="${kc}" data-auto="${kc}"`).replace(/(<input[^>]*id="nl-p"[^>]*?)value=""/, `$1value="${p}" data-auto="${p}"`);
  }
  const btns = `<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm sec tap grow" data-a="nlFood" data-date="${k}">🍽 ${f.length ? `Food log · ${f.length} item${f.length > 1 ? 's' : ''}` : 'Log food for this day'}</button>${m && tot ? `<button class="btn sm sec tap grow" data-a="fUseLog" data-date="${k}">Use food log (${fmtNum(Math.round(tot.kcal))})</button>` : ''}</div>`;
  return h.replace(/(<div class="xs dim" style="margin-top:6px">Targets:)/, btns + '$1');
};
const _applyNl25 = applyNlInputs;
applyNlInputs = function (k) { // untouched auto values are not saved as an override
  ['nl-kcal', 'nl-p'].forEach(id => { const i = $('#' + id); if (i && i.dataset.auto != null && i.value.trim() === i.dataset.auto) i.value = ''; });
  return _applyNl25(k);
};
ACT.nlFood = (el, d) => { if ($('#nightly') && !applyNlInputs(d.date)) return; closeSheet(); UI.foodDate = d.date === today() ? null : d.date; UI.foodView = 'day'; goTab('food'); };

/* ---------- calendar: from the Food tab it opens that day's food log ---------- */
ACT.calSheet = () => { UI.calMonth = null; UI.calFor = null; openSheet(calHtml()); };
ACT.calPick = (el, d) => { if (UI.calFor === 'food') { UI.calFor = null; closeSheet(); UI.foodDate = d.date === today() ? null : d.date; UI.foodView = 'day'; goTab('food'); return; } openNightly(d.date); };
const _calHtml25 = calHtml;
calHtml = function () { const h = _calHtml25(); return UI.calFor === 'food' ? h.replace('<h3>Log a past day</h3>', '<h3>Food log · pick a day</h3>').replace('to open its nightly log.', 'to log food for it.') : h; };

/* =====================================================================================
   v2.6 GROW pass — “simple, fun, easy, but most of all GROW ME”
   ===================================================================================== */

/* ---------- progression nudges: “Last time 185×6 → try 190×5–6 today” ---------- */
function lastTopSet(exId) {
  const h = exHistory(exId), l = h[h.length - 1]; if (!l) return null;
  const d = l.e.sets.filter(s => s.done && s.r); if (!d.length) return null;
  const t = d.find(s => s.tag === 'Top') || d.reduce((a, s) => (s.w || 0) >= (a.w || 0) ? s : a, d[0]);
  return { w: t.w, r: t.r, date: l.date };
}
function nudgeText(exId, role, k) {
  const tt = targetText(exId, { role, k }); if (!tt) return '';
  const ex = EX[exId], l = ex && ex.kind === 'w' ? lastTopSet(exId) : null; if (!l) return 'Next: ' + tt;
  return `Last time ${ex.added && !l.w ? 'BW' : U.wOut(l.w || 0)}×${l.r} → try ${tt} today`;
}
const _prefill25 = prefill;
prefill = function (e, mod, k) {
  _prefill25(e, mod, k);
  if (e.role === 'main') e.sets.forEach(s => { if (!s.done && s.tag === 'Back-off' && s.r != null) s.r = Math.min(10, Math.max(6, s.r + 2)); }); // back-offs 6–10 at −10%
  const ex = EX[e.ex], l = ex && ex.kind === 'w' ? lastTopSet(e.ex) : null;
  if (l && e.note && !/^Last time/.test(e.note)) e.note = `Last time ${ex.added && !l.w ? 'BW' : U.wOut(l.w || 0)}×${l.r}. ${e.note}`;
};
const _restFor25 = restFor; // compound accessories (incline DB, rows, pulldowns, dips…) rest 2 min; isolations 60–90 s
restFor = function (w, ei) { const r = _restFor25(w, ei), e = w.exercises[ei]; if (!r.nextSS && e.role === 'acc' && COMPOUND_ACC.has(e.ex)) r.sec = Math.max(r.sec, 120); return r; };

/* ---------- real PRs only ----------
   v2.5 bug: “Log top sets ✓” / “✓ all sets” saved the prefilled *target* (already +5 lb or +1 rep), so untouched
   prefilled numbers looked like PRs. Now a set only counts for PRs if he typed/edited it or ticked that set himself
   (1 tap on its ✓ = “I hit it”). Bulk-completed untouched sets are flagged s.pf and never award a PR. */
document.addEventListener('input', ev => { const t = ev.target; if (!t || !t.dataset || !t.dataset.f || !S.active || !t.closest('#workout')) return; const e = S.active.exercises[+t.dataset.ei], s = e && e.sets[+t.dataset.si]; if (s) { s.ed = true; delete s.pf; } }, true);
const _exDone25 = ACT.exDone;
ACT.exDone = (el, d) => {
  const w = S.active, e = w && w.exercises[+d.ei]; const before = e ? e.sets.map(s => !!s.done) : [];
  _exDone25(el, d);
  if (e) e.sets.forEach((s, i) => { if (s.done && !before[i] && !s.ed) s.pf = true; }); save();
};
const _setDone25 = ACT.setDone;
ACT.setDone = (el, d) => { _setDone25(el, d); const w = S.active, s = w && w.exercises[+d.ei] && w.exercises[+d.ei].sets[+d.si]; if (s && s.done) { delete s.pf; save(); } };
let LL_PF = null;
const _llSave25 = ACT.llSave;
ACT.llSave = (el, d) => {
  LL_PF = new Set(); const ll = UI.ll;
  if (ll) ll.w.exercises.forEach((e, i) => { const wi = $('#ll-w-' + i), ri = $('#ll-r-' + i); const same = x => !x || x.value === x.defaultValue; if (same(wi) && same(ri)) LL_PF.add(i); });
  try { _llSave25(el, d); } finally { LL_PF = null; }
  setTimeout(checkLevelUp, 900);
};
const _cs25 = computeSummary;
computeSummary = function (w) {
  if (LL_PF && UI.ll && UI.ll.w === w) w.exercises.forEach((e, i) => { if (LL_PF.has(i) && e.sets[0]) e.sets[0].pf = true; else if (e.sets[0]) delete e.sets[0].pf; });
  const hidden = [], hide = o => (o.exercises || []).forEach(e => (e.sets || []).forEach(s => { if (s.pf && s.done) { s.done = false; hidden.push(s); } }));
  S.workouts.forEach(hide); if (!S.workouts.includes(w)) hide(w);
  let sm; try { sm = _cs25(w); } finally { hidden.forEach(s => { s.done = true; }); }
  const doneSets = w.exercises.filter(e => !e.skipped).flatMap(e => e.sets.filter(s => s.done).map(s => ({ s, e })));
  sm.sets = doneSets.length; sm.volume = doneSets.reduce((a, x) => a + (EX[x.e.ex].kind === 'w' ? (x.s.w || 0) * (x.s.r || 0) : 0), 0);
  sm.pf = doneSets.filter(x => x.s.pf).length;
  (sm.prs || []).forEach(p => { // weighted pull-ups / dips log ADDED load — an e1RM of the added plate is meaningless, say it plainly
    const e = w.exercises.find(x => EX[x.ex].n === p.ex); if (!e || !EX[e.ex].added) return;
    const d = e.sets.filter(s => s.done && s.r && !s.pf), best = d.reduce((a, s) => (s.w || 0) > (a.w || 0) || ((s.w || 0) === (a.w || 0) && s.r > a.r) ? s : a, d[0]);
    if (best) { p.txt = `${best.w ? '+' + U.wOut(best.w) + ' ' + wu() : 'BW'} × ${best.r}`; p.type = best.w ? 'Weight' : 'Reps'; }
  });
  return sm;
};
const _showSum25 = showSummary;
showSummary = function (w, fresh) {
  _showSum25(w, fresh); const sm = w.summary || {};
  const hero = document.querySelector('#workout .sum-hero');
  if (hero && sm.pf) hero.insertAdjacentHTML('afterend', `<div class="tip info" id="pfTip"><div class="ic">✍️</div><div class="grow">${sm.pf} set${sm.pf > 1 ? 's were' : ' was'} saved from the prefilled target without a tap or edit, so ${sm.pf > 1 ? 'they don’t' : 'it doesn’t'} count for PRs.<div style="margin-top:8px"><button class="btn sm tap" data-a="pfConfirm" data-id="${w.id}">I really hit those numbers ✓</button></div></div></div>`);
  if (fresh && sm.prs && sm.prs.length) { confetti(); haptic([20, 40, 20, 40, 60]); }
  if (fresh) setTimeout(checkLevelUp, 600);
};
ACT.pfConfirm = (el, d) => {
  const w = S.workouts.find(x => x.id === d.id); if (!w) return;
  w.exercises.forEach(e => e.sets.forEach(s => { delete s.pf; })); computeSummary(w); save(); haptic(15);
  const n = (w.summary.prs || []).length; closeWorkout(); showSummary(w, false); if (n) { confetti(); toast(`Confirmed · ${n} PR${n > 1 ? 's' : ''} 🏆`); } else toast('Confirmed ✓');
};

/* ---------- level-ups (bench e1RM milestones on the road to 225) ---------- */
const LEVELS = [185, 195, 205, 215, 225, 235, 245, 255];
function checkLevelUp() {
  const bn = benchNow(); if (!bn) return;
  S.v26 = S.v26 || {}; const got = S.v26.levels = S.v26.levels || [];
  const hit = LEVELS.filter(v => bn.v >= v && !got.includes(v)); if (!hit.length) return;
  if (!S.v26.levelsInit) { S.v26.levelsInit = 1; hit.forEach(v => got.push(v)); save(); return; } // first run: don't celebrate old history
  hit.forEach(v => got.push(v)); save();
  const top = hit[hit.length - 1]; confetti(); haptic([30, 50, 30, 50, 90]);
  toast(top >= 225 ? `⭐ LEVEL UP: bench e1RM ${top}! 225 is yours.` : `⬆️ LEVEL UP: bench e1RM ${top} — ${225 - top} to 225`);
}

/* ---------- weekly “you got stronger” recap ---------- */
function weekBest(ws, we) {
  const m = {}; S.workouts.filter(w => w.date >= ws && w.date <= we).forEach(w => (w.exercises || []).forEach(e => {
    const ex = EX[e.ex]; if (!ex || ex.kind !== 'w' || e.skipped) return;
    e.sets.filter(s => s.done && s.r && s.w && !s.pf).forEach(s => { const v = e1rm(s.w, s.r); if (!m[e.ex] || v > m[e.ex].v) m[e.ex] = { v, w: s.w, r: s.r }; });
  })); return m;
}
function strongerRecap(k) {
  const ws = weekStart(k), now = weekBest(ws, k), last = weekBest(addDays(ws, -7), addDays(ws, -1)), ups = [];
  for (const id in now) if (last[id] && now[id].v > last[id].v + 0.5) ups.push({ id, n: EX[id].n, d: now[id].v - last[id].v, now: now[id], last: last[id] });
  ups.sort((a, b) => b.d - a.d); return ups;
}
function recapHtml(k) {
  const ups = strongerRecap(k);
  if (!ups.length) return `<div class="grow-row"><span>📈</span><div class="grow small muted">Beat any top set from last week and it shows up here.</div></div>`;
  return `<div class="grow-row"><span>💪</span><div class="grow"><b>You got stronger on ${ups.length} lift${ups.length > 1 ? 's' : ''}</b><div class="xs dim">${ups.slice(0, 3).map(u => `${esc(u.n)} ${U.wOut(u.last.w)}×${u.last.r} → ${U.wOut(u.now.w)}×${u.now.r}`).join(' · ')}</div></div></div>`;
}

/* ---------- weekly hard sets per muscle (planned this week vs done) ---------- */
function weekSetsPlan(k) {
  const ws = weekStart(k), out = {}, add = (m, n) => { for (const mu in m) out[mu] = (out[mu] || 0) + n * m[mu]; };
  for (let i = 0; i < 7; i++) { const d = addDays(ws, i), dp = dayPlan(d); if (!dp) continue; dp.sessions.filter(s => s.kind === 'lift').forEach(s => { const P = S.profile; slotsFor(s.tpl, P).forEach(sl => { const ed = (S.planEdits[d] || {})[sl.id] || {}; if (ed.skip) return; const id = ed.ex || S.swapPrefs[sl.id] || profileExercise(sl, P); add(MUSCLES[id] || {}, buildSets(sl, modOf(dp), P, d).length); }); }); }
  return out;
}
function weekSetsDone(k) {
  const ws = weekStart(k), out = {};
  S.workouts.filter(w => w.date >= ws && w.date <= addDays(ws, 6)).forEach(w => (w.exercises || []).forEach(e => { if (e.skipped) return; const m = MUSCLES[e.ex] || {}, n = e.sets.filter(s => s.done).length; for (const mu in m) out[mu] = (out[mu] || 0) + n * m[mu]; }));
  return out;
}
function weeklySetsHtml(k) {
  const pl = weekSetsPlan(k), dn = weekSetsDone(k), mx = 14, f = v => (Math.round(v * 2) / 2).toString();
  const rows = MUSCLE_ORDER.map(m => { const p = pl[m] || 0, d = dn[m] || 0, low = ['quads', 'hams', 'glutes', 'calves'].includes(m);
    return `<div class="wsm"><span class="wsm-n">${m}</span><div class="wsm-bar"><i class="wsm-band" style="left:${10 / mx * 100}%;width:${2 / mx * 100}%"></i><i class="wsm-p" style="width:${Math.min(100, p / mx * 100)}%"></i><i class="wsm-d" style="width:${Math.min(100, d / mx * 100)}%"></i></div><b class="wsm-v">${f(d)}<span class="dim">/${f(p)}</span></b>${low ? '' : ''}</div>`; }).join('');
  return `<div class="card" id="wsets"><div class="row between"><b>Weekly sets per muscle</b><span class="xs dim">done / planned</span></div><div class="xs dim" style="margin:4px 0 8px">Hard sets @RPE 8–9 (warm-ups don’t count). Target band 10–12 (shaded). Indirect work = ½. Legs run lower on purpose — hockey + MTB load them.</div>${rows}</div>`;
}

/* ---------- GROW card: streak flames · bench → 225 · protein days · weight + waist ---------- */
function growCard(k) {
  const sk = nnStreak(), bn = benchNow(), ws = weekStart(k), T = S.settings;
  const flames = sk >= 14 ? '🔥🔥🔥' : sk >= 7 ? '🔥🔥' : sk >= 1 ? '🔥' : '🌱';
  let pd = 0, pn = 0; for (let d = ws; d <= k; d = addDays(d, 1)) { pn++; if ((proteinFor(d) || 0) >= T.protein) pd++; }
  const prot = Math.round(proteinFor(k) || 0), ppct = Math.min(100, prot / T.protein * 100);
  const b0 = 185, pct = bn ? Math.max(0, Math.min(100, (bn.v - b0) / (225 - b0) * 100)) : 0, nextLv = bn ? LEVELS.find(v => v > bn.v) : null;
  const w = weights(), wl = w.length ? w[w.length - 1] : null, w4 = wl ? w.filter(x => x.k <= addDays(wl.k, -28)).slice(-1)[0] || w[0] : null, wt = waistTrend();
  const dW = wl && w4 && w4 !== wl ? wl.v - w4.v : null, dWa = wt && wt.k !== wt.fk ? wt.last - wt.first : null;
  return `<div class="card growc" id="growCard">
    <div class="row between"><b class="gc-t">${flames} ${sk} day streak</b><span class="xs dim">${sk ? 'keep it lit' : 'start one today'}</span></div>
    <div class="g225"><div class="row between small"><span>🏋️ Bench → 225</span><b>${bn ? `e1RM ${U.wOut(bn.v, 0)} ${wu()}` : 'log a heavy bench'}</b></div><div class="g225-bar"><i style="width:${pct}%"></i>${[195, 205, 215].map(v => `<em style="left:${(v - b0) / 40 * 100}%"></em>`).join('')}</div><div class="xs dim">${bn ? (bn.v >= 225 ? '⭐ 225 unlocked — next: 225 for reps' : `${Math.ceil(225 - bn.v)} ${wu()} to go${nextLv ? ` · next level ${nextLv}` : ''}`) : 'Your first heavy top set sets the bar.'}</div></div>
    <div class="grow-row"><span>🥩</span><div class="grow"><div class="row between small"><span>Protein today</span><b>${prot}/${T.protein} g</b></div><div class="g225-bar pbar"><i style="width:${ppct}%"></i></div><div class="xs dim">${pd}/${pn} protein-goal day${pn > 1 ? 's' : ''} this week</div></div></div>
    <div class="grow-row"><span>⚖️</span><div class="grow small">${wl ? `<b>${U.wOut(wl.v)} ${wu()}</b>${dW != null ? ` <span class="${dW <= 0 ? 'gd' : 'dim'}">${dW > 0 ? '+' : ''}${U.wOut(dW)} in 4 wk</span>` : ''}` : '<span class="dim">No weigh-ins yet</span>'}${wt ? ` · waist <b>${wt.last}″</b>${dWa != null ? ` <span class="${dWa <= 0 ? 'gd' : 'dim'}">${dWa > 0 ? '+' : ''}${(Math.round(dWa * 10) / 10)}″</span>` : ''}` : ''}</div></div>
    ${recapHtml(k)}
  </div>`;
}

/* ---------- simple Today: one answer to “what do I do now?” ---------- */
function todoSessions(dp) { return dp && !dp.off ? dp.sessions.filter(s => ['todo', 'skipped'].includes(sessStatus(s)) || (S.active && S.active.sessionKey === s.key)) : []; }
function heroCard(k, dp) {
  const todo = todoSessions(dp), s = todo[0];
  if (S.active && (!s || S.active.sessionKey !== s.key) && !dp.sessions.some(x => x.key === S.active.sessionKey)) return `<div class="card hero today-hero"><span class="chip grad">In progress</span><div class="ttl">${esc(S.active.title)}</div><button class="btn big tap" data-a="resume">▶ Resume workout</button></div>`;
  if (s) {
    const act = S.active && S.active.sessionKey === s.key, lift = s.kind === 'lift', test = s.kind === 'test';
    const btn = act ? `<button class="btn big tap" data-a="resume">▶ Resume workout</button>` : test ? `<button class="btn big tap" data-a="testSheet" data-key="${s.testKey}">Enter test results</button>` : lift || s.kind === 'cardio' && s.cardio.mode !== 'hockey' ? `<button class="btn big tap" data-a="start" data-day="${k}" data-key="${s.key}">▶ Start today’s workout</button>` : `<button class="btn big tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">✓ Mark done</button>`;
    const second = lift && !act ? `<button class="btn sm sec tap grow" data-a="liftLog" data-day="${k}" data-key="${s.key}">Already did it? Log top sets</button>` : s.kind === 'cardio' && !act ? `<button class="btn sm sec tap grow" data-a="quickDone" data-day="${k}" data-key="${s.key}">Mark done ✓</button>` : '';
    const more = `<details class="hmore"><summary class="tap small">Move · skip · swap ▾</summary><div class="row sa2"><button class="btn sm sec tap grow" data-a="qaOpen" data-date="${k}">↪ Hockey / ride instead</button><button class="btn sm sec tap" data-a="moveSheet" data-key="${s.key}">Move</button><button class="btn sm sec tap" data-a="skip" data-key="${s.key}">Skip</button></div></details>`;
    const sk = S.schedule.skips[s.key];
    return `<div class="card hero today-hero" data-sess="${s.key}"><div class="row between"><span class="chip"><span class="dot c-${s.color}"></span>${dp.meta.deload ? 'Deload · ' : ''}${lift ? 'Strength' : test ? 'Test' : MODE_LABEL[s.cardio.mode]}</span><span class="small muted">~${s.min} min</span></div><div class="ttl">${esc(s.title)}</div><div class="muted small">${esc(s.sub)}</div>${sk ? `<div class="xs" style="color:var(--warn);margin-top:6px">Skipped earlier — still doable today</div>` : ''}${btn}${second ? `<div class="row" style="gap:8px;margin-top:8px">${second}</div>` : ''}${exFold(s, sessionLines(s, modOf(dp), k), false)}${whyBlock(s)}${more}</div>`;
  }
  const did = dp.sessions.filter(x => ['done', 'swapped'].includes(sessStatus(x)));
  if (did.length || nnItem('train', k).ok && dp.sessions.length) return `<div class="card hero today-hero done-hero"><span class="chip grad">✓ Done</span><div class="ttl">${did.length ? esc(did.map(x => x.title).join(' + ')) : 'Training'} ✓</div><div class="small muted">That’s the work. Now grow: protein to ${S.settings.protein} g, sleep 8 h.</div>${did.map(x => `<div style="margin-top:8px">${sessionActions(x)}</div>`).join('')}</div>`;
  return `<div class="card hero today-hero"><span class="chip">${dp.off ? 'Day off' : 'Rest day'}</span><div class="ttl">${dp.off ? '📅 ' + esc(dp.off) : 'Recover 💤'}</div><div class="small muted">Growth happens on rest days — protein, sleep, 10-min mobility. Itching to move? ⚡ Minimum day below.</div></div>`;
}
function pickRow(k) {
  const cur = pickNow(k);
  return `<div class="row pickrow"><button class="btn sec tap grow" data-a="pickSheet" data-date="${k}">🎯 Pick another</button><button class="btn sec tap grow" data-a="minDay" data-date="${k}" ${cur && cur.type === 'min' ? 'disabled' : ''}>⚡ Minimum day</button></div><div class="xs dim pick-tag">Something &gt; nothing.${cur ? ` · Today: <b>${cur.type === 'min' ? 'Minimum day' : PICKS[cur.type].label}</b> <button class="linkbtn tap" data-a="pickUndo" data-date="${k}">back to plan</button>` : ''}</div>`;
}
ACT.pickSheet = (el, d) => { const k = d.date || today(); UI.pickOpen = k; openSheet(`<h3 style="margin:0 44px 10px 0">Pick ${k === today() ? 'today’s' : fmtDow(k) + '’s'} workout</h3>${pickCard(k, 'sheet')}`, 'tall'); UI.pickInSheet = true; };
const _closeSheet26 = closeSheet;
closeSheet = function () { UI.pickInSheet = false; return _closeSheet26.apply(this, arguments); };
['pick', 'minDay'].forEach(a => { const f = ACT[a]; ACT[a] = (el, d) => { const inS = UI.pickInSheet; if (inS && !(a === 'pick' && PICKS[d.t] && PICKS[d.t].qa)) closeSheet(); const r = f(el, d); return r; }; });
['pickUndo', 'pickClear'].forEach(a => { const f = ACT[a]; if (f) ACT[a] = (el, d) => { if (UI.pickInSheet) closeSheet(); return f(el, d); }; });

const _today25orig = VIEWS.today;
VIEWS.today = function () {
  setTimeout(checkLevelUp, 400);
  const k = today(), dp = dayPlan(k), h0 = _today25src();
  let h = hdr(fmtLong(k), 'Today', `<button class="icon-btn round tap" data-a="calSheet" aria-label="Log a past day (calendar)">${CAL_ICON}</button>`);
  h += importCard();
  if (!dp) { h += `<div class="card hero"><span class="chip grad">${k < PLAN_START ? 'Starts Oct 5' : 'Plan complete'}</span><div class="ttl">${k < PLAN_START ? 'Plan starts Monday, Oct 5' : '🏁 Program complete!'}</div></div>`; return h + growCard(k) + seg(h0, '<details class="fold" data-fold="devo"', null); }
  h += `<h2 class="sec first" id="planSec">Do this now</h2>` + lowerRuleTips(k) + heroCard(k, dp);
  const rest = dp.off ? [] : dp.sessions.filter(s => s !== todoSessions(dp)[0] && !['done', 'swapped'].includes(sessStatus(s)));
  rest.forEach(s => h += sessionCard(dp, s, false));
  h += pickRow(k) + extraActsCard(k);
  const dn = k >= PLAN_START ? doNowCard(k) : '';
  if (isEvening()) h += dn; // nightly log is the 'now' thing at night; daytime nudges live in Checklist
  h += `<h2 class="sec">Grow</h2>` + growCard(k);
  // everything else: one tap away, collapsed
  const strip = x => x.replace(/^\s*<h2 class="sec">[\s\S]*?<\/h2>/, '');
  const ctx = contextTips(k), sb = scheduleBanners(k), lw = liftWeek(k);
  h += `<h2 class="sec">More</h2>`;
  if (k >= PLAN_START) h += foldSec('wk', '📅', 'This week', `${lw.done}/2 lifts${sb ? ' · ⚠️ fix' : ''}`, sb + ctx + strip(weekSumCard(k)) + balanceHtml(k), !!sb);
  if (k >= PLAN_START) { const nn = nnDay(k); h += foldSec('nn', '✅', 'Checklist', nn.all ? '✓ all done' : 'today', (isEvening() ? '' : dn) + nnCard(k) + checkinCard(k)); }
  const fuel = seg(h0, '<h2 class="sec">Fuel', '<h2 class="sec">Quick log</h2>'), ql = seg(h0, '<h2 class="sec">Quick log</h2>', '<details class="fold" data-fold="devo"');
  if (fuel) h += foldSec('fuel', '🍽', 'Fuel', `${Math.round(proteinFor(k) || 0)}/${S.settings.protein} g protein`, strip(fuel));
  if (ql) h += foldSec('ql', '⚖️', 'Weigh-in · knee', (S.body[k] || {}).weight ? '✓ weighed' : 'not yet', strip(ql));
  let tail = seg(h0, '<details class="fold" data-fold="devo"', null);
  if (UI.fold.devo !== true) tail = tail.replace('<details class="fold" data-fold="devo" open', '<details class="fold" data-fold="devo"');
  return h + tail;
};
function seg(h, a, b) { const i = h.indexOf(a); if (i < 0) return ''; const j = b ? h.indexOf(b, i + a.length) : -1; return j < 0 ? (b ? h.slice(i) : h.slice(i)) : h.slice(i, j); }
function _today25src() { return _today25orig(); }
