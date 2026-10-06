/* Coach chat: natural-language edits to the current / most recent session (log, plan, swaps) with undo */
'use strict';
const COACH_UNDO = {}; // id -> {label, snap} (in-memory; expires on reload)
let COACH_LAST = null;
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, a: 1, an: 1, single: 1 };
function coachSnap() { return JSON.stringify({ active: S.active, workouts: S.workouts, planEdits: S.planEdits, swapPrefs: S.swapPrefs, schedule: S.schedule }); }
function pushUndo(label, snap) { const id = uid(); COACH_UNDO[id] = { label, snap }; COACH_LAST = id; return id; }
function restoreSnap(snap) { const o = JSON.parse(snap); S.active = o.active; S.workouts = o.workouts; S.planEdits = o.planEdits; S.swapPrefs = o.swapPrefs; S.schedule = o.schedule; invalidatePlan(); save(); }

/* ---------- exercise matching ---------- */
function wordsOf(t) {
  const raw = String(t).toLowerCase().replace(/(\w)-(\w)/g, '$1$2').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  raw.forEach((w, i) => { out.add(w); if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) out.add(w.slice(0, -1)); if (w.endsWith('es') && w.length > 4) out.add(w.slice(0, -2)); if (raw[i + 1]) { const j = w + raw[i + 1]; out.add(j); if (j.endsWith('s') && !j.endsWith('ss')) out.add(j.slice(0, -1)); } });
  return out;
}
const STOP = new Set(['the', 'a', 'an', 'of', 'for', 'to', 'with', 'set', 'sets', 'rep', 'reps', 'today', 'i', 'did', 'only', 'and', 'my', 'add', 'skip', 'swap', 'at', 'lb', 'lbs', 'kg', 'x', 'on', 'one', 'two', 'three', 'four', 'just', 'do', 'out', 'in', 'this', 'session', 'workout', 'extra', 'another', 'remove', 'got', 'more', 'arm', 'single']);
function exScore(id, W) {
  let sc = 0; const ex = EX[id]; if (!ex) return 0;
  Object.keys(EX_ALIASES).forEach(a => { if (W.has(a)) { const i = EX_ALIASES[a].indexOf(id); if (i >= 0) sc += 10 - Math.min(i, 5); } });
  const nw = wordsOf(ex.n);
  nw.forEach(w => { if (!STOP.has(w) && w.length > 2 && W.has(w)) sc += 3; });
  if (W.has(id.replace(/_/g, ''))) sc += 6;
  return sc;
}
function matchEx(text, ids) {
  const W = wordsOf(text); let best = null, bs = 0; [...new Set(ids)].forEach(id => { const s = exScore(id, W); if (s > bs) { bs = s; best = id; } });
  if (!best) return null; const g = matchGlobal(text); if (!g || g === best) return best;
  const gs = exScore(g, W); return bs >= gs * 0.6 ? best : null; // e.g. "leg press" must not match "incline bench" via the word "press"
}
function matchGlobal(text, prefer = []) {
  const W = wordsOf(text); let best = null, bs = 0;
  Object.keys(EX).forEach(id => { let s = exScore(id, W); if (s && prefer.includes(id)) s += 4; if (s > bs) { bs = s; best = id; } });
  return best;
}

/* ---------- where does an edit go? ---------- */
function planLiftSessions(k) { const dp = dayPlan(k); if (!dp || dp.off) return []; return dp.sessions.filter(s => s.kind === 'lift' && !s.skipped && !sessionDone(s.key)); }
function planSlots(k, s) { return slotsFor(s.tpl, S.profile).map(sl => ({ sl, ex: resolveEx(sl, k) })); }
function doneRecent() { return S.workouts.filter(w => w.exercises && w.exercises.length && w.date <= today()).slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (b.endedAt || 0) - (a.endedAt || 0)); }
// for logging: active → today's completed → today's planned (auto-start) → most recent completed
function logTarget(text) {
  const t = today();
  if (S.active) { const id = matchEx(text, S.active.exercises.map(e => e.ex)); if (id) return { w: S.active, e: S.active.exercises.find(e => e.ex === id), where: 'active' }; }
  for (const w of doneRecent().filter(w => w.date === t)) { const id = matchEx(text, w.exercises.map(e => e.ex)); if (id) return { w, e: w.exercises.find(e => e.ex === id), where: 'done' }; }
  if (!S.active) for (const s of planLiftSessions(t)) { const id = matchEx(text, planSlots(t, s).map(x => x.ex)); if (id) { const w = createWorkout(t, s.key); S.active = w; return { w, e: w.exercises.find(e => e.ex === id), where: 'started' }; } }
  for (const w of doneRecent().filter(w => diffDays(w.date, t) <= 21)) { const id = matchEx(text, w.exercises.map(e => e.ex)); if (id) return { w, e: w.exercises.find(e => e.ex === id), where: 'done' }; }
  return null;
}
// for plan edits (skip / swap): active → today's planned → next planned within 7 days
function planTarget(text, todayOnly) {
  const t = today();
  if (S.active) { const id = matchEx(text, S.active.exercises.map(e => e.ex)); if (id) return { where: 'active', w: S.active, e: S.active.exercises.find(e => e.ex === id), id }; }
  for (let i = 0; i <= (todayOnly ? 0 : 7); i++) {
    const k = addDays(t, i);
    for (const s of planLiftSessions(k)) { const ps = planSlots(k, s), id = matchEx(text, ps.map(x => x.ex)); if (id) return { where: 'plan', k, s, slot: ps.find(x => x.ex === id).sl, id }; }
  }
  return null;
}
const whereTxt = r => r.where === 'active' ? `your in-progress ${r.w.title}` : r.where === 'started' ? `today’s ${r.w.title} (started it for you — tap Resume, then Finish when done)` : `${r.w.title} on ${fmtDow(r.w.date)}`;
function afterLogEdit(r) { if (r.w.endedAt) computeSummary(r.w); }
function withActive(fn) { // include the in-progress workout so targets are recalculated live
  const a = S.active, add = a && !S.workouts.includes(a); if (add) S.workouts.push(a);
  try { return fn(); } finally { if (add) S.workouts.pop(); }
}
function nextLine(exId) { return withActive(() => { const t = nextTarget(exId); return t ? ` Next time: **${targetText(exId)}** — ${t.note}.` : ''; }); }
function fmtSets(e) { const x = EX[e.ex]; return e.sets.filter(s => s.done).map(s => x.kind === 'hold' ? s.r + 's' : x.added && !s.w ? 'BW×' + s.r : U.wOut(s.w) + '×' + s.r).join(', '); }
function parseW(v) { return U.wIn(+v); }

/* ---------- command handlers: each returns {text, acts?} ---------- */
const COACH_CMDS = [
  { re: /^(?:undo|undo (?:that|it|last)|revert(?: that)?)$/, fn: () => coachUndoLast() },
  { re: /^(?:(?:what are )?my goals?\??|goals?|how'?s my bench(?: going| doing)?\??|bench (?:progress|goal|e1rm|max)\??|what'?s my bench (?:max|e1rm|goal|at)\??|how strong am i\??)$/, fn: () => cmdGoals() },
  { re: /^(?:help|commands|what can you do\??|\?)$/, fn: () => ({ text: 'Try:\n• **how’s my bench?** / **my goals**\n• **bench 185 for 5, 5, 4**\n• **I only did 2 sets of bench**\n• **add a set of pull-ups 8 reps**\n• **remove a set of rows**\n• **swap the leg press for step-ups**\n• **skip laterals today** / **unskip laterals**\n• **what’s my target for RDL?**\n• **skip today** · **move today to Thursday**\nEvery change comes with Undo.' }) },
  { re: /\b(?:only|just)\s+(?:did|got|managed|finished|completed)\s+(\d+|one|two|three|four|a|an|single)\s+sets?\s+(?:of|on|for)?\s*(.+)$/, fn: m => cmdOnlyDid(NUMW[m[1]] || +m[1], m[2]) },
  { re: /^(?:did\s+)?(\d+|one|two|three|four)\s+sets?\s+of\s+(.+?)\s*(?:only)?$/, test: t => !/\d+\s*(?:reps?|x|×|for|at|@)/.test(t.replace(/^(?:did\s+)?(\d+|one|two|three|four)\s+sets?\s+of/, '')), fn: m => cmdOnlyDid(NUMW[m[1]] || +m[1], m[2]) },
  { re: /\b(?:add|log|did)\s+(?:a|an|one|1|another|an extra|one more)\s+(?:extra\s+)?set\s+(?:of|for|to|on)\s+(.+)$/, fn: m => cmdAddSet(m[1]) },
  { re: /\b(?:remove|delete|drop|take off)\s+(?:a|one|1|the last|last)\s+set\s+(?:of|from|on|for)\s+(.+)$/, fn: m => cmdRmSet(m[1]) },
  { re: /\b(?:swap|switch|replace|sub|substitute|change)\s+(?:out\s+)?(?:the\s+)?(.+?)\s+(?:for|with|to|->|→)\s+(?:the\s+|some\s+)?(.+?)(?:\s+today)?$/, fn: m => cmdSwap(m[1], m[2]) },
  { re: /^(?:do|doing|i'?ll do)\s+(?:the\s+)?(.+?)\s+instead of\s+(?:the\s+)?(.+?)(?:\s+today)?$/, fn: m => cmdSwap(m[2], m[1]) },
  { re: /^(?:skip|skipping)\s+(?:today|today'?s (?:session|workout|lift)|the (?:session|workout))$/, fn: () => cmdSkipSession() },
  { re: /^(?:unskip|un-skip|bring back|add back)\s+(?:the\s+)?(.+?)(?:\s+today)?$/, fn: m => cmdSkipEx(m[1], false) },
  { re: /^(?:skip|skipping|drop|no|cut|leave out)\s+(?:the\s+)?(.+?)(?:\s+(?:today|this session|this time))?$/, fn: m => cmdSkipEx(m[1], true) },
  { re: /\bmove\s+(?:today|today'?s (?:session|workout|lift)|it)\s+to\s+(mon|tue|wed|thu|fri|sat|sun)\w*/, fn: m => cmdMove(m[1]) },
  { re: /\b(?:target|next time|what weight|what should i (?:do|lift|hit))\b.*?(?:for|on)?\s*([a-z][a-z \-]+)\??$/, fn: m => cmdTarget(m[1]) },
];
function parseLog(t) {
  let m = t.match(/(\d+)\s*(?:x|×|sets? of)\s*(\d+)\s*(?:reps?)?\s*(?:at|@|with)\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg|#)?/);
  if (m) return { reps: Array(+m[1]).fill(+m[2]), w: +m[3], rest: t.replace(m[0], ' ') };
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|kg|#)?\s*(?:for|x|×|@)\s*((?:\d+\s*(?:,|and|\/|\s)\s*)*\d+)\s*(?:reps?)?/);
  if (m) { const reps = m[2].split(/[^\d]+/).filter(Boolean).map(Number); return { reps, w: +m[1], rest: t.replace(m[0], ' ') }; }
  m = t.match(/(?:bw|bodyweight)\s*(?:for|x|×)\s*((?:\d+\s*(?:,|and|\/|\s)\s*)*\d+)/);
  if (m) return { reps: m[1].split(/[^\d]+/).filter(Boolean).map(Number), w: 0, rest: t.replace(m[0], ' ') };
  return null;
}
function notFound(txt) { return { text: `I couldn’t find “${txt.trim()}” in your current, today’s, or recent sessions. Try the exercise name as it appears in the plan (e.g. “incline bench”, “lat pulldown”).` }; }
function cmdLog(L) {
  const exText = L.rest.replace(/\b(i|did|got|hit|logged?|today|reps?|sets?|for|on)\b/g, ' ');
  const snap = coachSnap(), r = logTarget(exText); if (!r) return notFound(exText);
  const e = r.e, ex = EX[e.ex], wl = parseW(L.w);
  e.skipped = false;
  L.reps.forEach((rp, i) => { const s = e.sets[i]; if (s) Object.assign(s, { w: wl, r: rp, done: true }); else { const l = e.sets[e.sets.length - 1] || { tag: 'Hard', rpeT: '9–10' }; e.sets.push({ tag: l.tag === 'Top' ? 'Back-off' : l.tag, rpeT: l.tag === 'Top' ? '8–9' : l.rpeT, w: wl, r: rp, rpe: null, done: true }); } });
  e.sets.length = L.reps.length; afterLogEdit(r); save();
  const n = e.sets.length, pl = e.planned;
  return { text: `Logged **${ex.n}**: ${fmtSets(e)} (${n}/${pl} planned sets${n > pl ? `, +${n - pl} extra` : ''}) in ${whereTxt(r)}.${nextLine(e.ex)}`, undo: pushUndo('log ' + ex.n, snap) };
}
function cmdOnlyDid(n, exText) {
  if (!n || n < 1) return { text: 'How many sets? e.g. “I only did 2 sets of bench”.' };
  const snap = coachSnap(), r = logTarget(exText); if (!r) return notFound(exText);
  const e = r.e, ex = EX[e.ex]; e.skipped = false;
  const done = e.sets.filter(s => s.done), keep = done.slice(0, n);
  if (keep.length < n) e.sets.filter(s => !s.done).slice(0, n - keep.length).forEach(s => { if (s.r == null) s.r = e.reps[0]; if (s.w == null && ex.added) s.w = 0; s.done = true; keep.push(s); });
  e.sets = e.sets.filter(s => keep.includes(s)); afterLogEdit(r); save();
  const missingW = ex.kind === 'w' && !ex.added && e.sets.some(s => s.w == null);
  return { text: `Got it — **${ex.n}**: ${e.sets.length}/${e.planned} sets logged${fmtSets(e) ? ' (' + fmtSets(e) + ')' : ''} in ${whereTxt(r)}.${e.sets.length < e.planned ? ' Fewer sets than planned → the weight holds next time.' : ''}${nextLine(e.ex)}${missingW ? ' Tell me the load too, e.g. “bench 185 for 5, 5”.' : ''}`, undo: pushUndo('sets ' + ex.n, snap) };
}
function cmdAddSet(t) {
  const rm = t.match(/(\d+)\s*(?:reps?|r\b)/) || t.match(/(?:for|x|×)\s*(\d+)\b(?!\s*(?:lbs?|kg))/), wm = t.match(/(?:at|@|with)\s*(\d+(?:\.\d+)?)/) || t.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|kg|#)/);
  const exText = t.replace(/\d+(?:\.\d+)?\s*(?:reps?|lbs?|kg|#|r\b)?/g, ' ').replace(/\b(at|@|with|for|x)\b/g, ' ');
  const snap = coachSnap(), r = logTarget(exText); if (!r) return notFound(exText);
  const e = r.e, ex = EX[e.ex], last = [...e.sets].reverse().find(s => s.done) || e.sets[e.sets.length - 1] || {};
  const reps = rm ? +rm[1] : (last.r ?? e.reps[0]), w = wm ? parseW(wm[1]) : (last.w ?? (ex.added ? 0 : null));
  e.skipped = false;
  const open = e.sets.find(s => !s.done); let extra = false;
  if (open) Object.assign(open, { w, r: reps, done: true }); // log into the next planned set
  else { e.sets.push({ tag: last.tag === 'Top' ? 'Back-off' : (last.tag || 'Hard'), rpeT: last.tag === 'Top' ? '8–9' : (last.rpeT || '9–10'), w, r: reps, rpe: null, done: true }); extra = e.sets.length > e.planned; }
  afterLogEdit(r); save();
  return { text: `${open ? 'Logged a set of' : 'Added a set to'} **${ex.n}**: ${ex.added && !w ? 'BW' : U.wOut(w) + ' ' + wu()} × ${reps}${extra ? ' (extra set)' : ''} — now ${e.sets.filter(s => s.done).length} logged / ${e.planned} planned in ${whereTxt(r)}.${nextLine(e.ex)}`, undo: pushUndo('add set ' + ex.n, snap) };
}
function cmdRmSet(t) {
  const snap = coachSnap(), r = logTarget(t); if (!r) return notFound(t);
  const e = r.e, ex = EX[e.ex]; if (e.sets.length <= 1 && !e.sets.some(s => s.done)) return { text: `${ex.n} has only one set left — say “skip ${ex.n.toLowerCase()}” to drop it.` };
  let i = e.sets.map(s => s.done).lastIndexOf(true); if (i < 0) i = e.sets.length - 1; e.sets.splice(i, 1); afterLogEdit(r); save();
  return { text: `Removed a set from **${ex.n}** — ${e.sets.filter(s => s.done).length} logged / ${e.planned} planned in ${whereTxt(r)}.${nextLine(e.ex)}`, undo: pushUndo('remove set ' + ex.n, snap) };
}
function cmdSwap(aText, bText) {
  const r = planTarget(aText); if (!r) return notFound(aText);
  const sl0 = r.where === 'active' ? slotById(r.e.slot) : r.slot, fam = [...new Set([...(sl0 ? altsFor(profileExercise(sl0, S.profile)) : []), ...altsFor(r.id)])], b = matchGlobal(bText, fam);
  if (!b) return { text: `I don’t know “${bText}”. Try one of: ${fam.map(id => EX[id].n).join(', ')}.` };
  if (b === r.id) return { text: `You’re already doing ${EX[b].n}.` };
  const snap = coachSnap(); let slotId, when;
  if (r.where === 'active') { applySwap(r.e, b, null, r.w.mod); slotId = r.e.slot; when = `your in-progress ${r.w.title}`; }
  else { const pe = S.planEdits[r.k] = S.planEdits[r.k] || {}; pe[r.slot.id] = { ...(pe[r.slot.id] || {}), ex: b }; slotId = r.slot.id; when = `${r.s.title} on ${fmtDow(r.k)}`; }
  invalidatePlan(); save();
  const kneeNote = hasKnee(S.profile) && EX[b].kf ? ' (knee-friendly ✓)' : '';
  const famNote = fam.includes(b) ? '' : ' Heads-up: that’s outside the usual swap family, so its targets start fresh.';
  const t = withActive(() => nextTarget(b));
  return { text: `Swapped **${EX[r.id].n} → ${EX[b].n}**${kneeNote} for ${when}. Same sets and reps.${t ? ` Target: **${withActive(() => targetText(b))}**.` : ' First time on it: work up to a hard set at the top of the range to set your baseline.'}${famNote} Want this as your default from now on?`, undo: pushUndo('swap', snap), acts: [{ l: 'Make it my default', a: 'coachDefault', d: { slot: slotId, ex: b } }, { l: 'Just today', a: 'coachJustToday', d: {} }] };
}
function cmdSkipEx(t, on) {
  const r = planTarget(t, true) || planTarget(t); if (!r) return notFound(t);
  const snap = coachSnap(), n = EX[r.id].n; let when;
  if (r.where === 'active') { r.e.skipped = on; when = `your in-progress ${r.w.title}`; }
  else { const pe = S.planEdits[r.k] = S.planEdits[r.k] || {}; const cur = { ...(pe[r.slot.id] || {}) }; if (on) cur.skip = true; else delete cur.skip; if (Object.keys(cur).length) pe[r.slot.id] = cur; else delete pe[r.slot.id]; when = `${r.s.title} on ${fmtDow(r.k)}`; }
  save();
  return { text: on ? `Skipping **${n}** in ${when}. Its target carries over unchanged${targetText(r.id) ? ': ' + targetText(r.id) : ''}.` : `**${n}** is back in ${when}.`, undo: pushUndo('skip ' + n, snap) };
}
function cmdSkipSession() {
  const s = (dayPlan(today()) || { sessions: [] }).sessions.find(x => x.kind !== 'test' && !x.skipped && !sessionDone(x.key));
  if (!s) return { text: 'Nothing left to skip today.' };
  const snap = coachSnap(); S.schedule.skips[s.key] = { reason: 'Skipped via coach', needsMove: true, t: Date.now() }; save();
  return { text: `Skipped **${s.title}**. ${['UA', 'UB', 'LOW'].some(c => s.key.endsWith(':' + c)) ? 'It’s a key session — say “move today to Thursday” or use Move on the Train tab to fit it in.' : 'No stress — protect the key lifts this week.'}`, undo: pushUndo('skip session', snap) };
}
function cmdMove(d) {
  const t = today(), s = (dayPlan(t) || { sessions: [] }).sessions.find(x => x.kind !== 'test' && !sessionDone(x.key));
  if (!s) return { text: 'Nothing left to move today.' };
  const idx = DOW.findIndex(x => x.toLowerCase() === d.slice(0, 3)); let to = addDays(weekStart(t), idx); if (to <= t) to = addDays(to, 7);
  const c = checkMove(s.key, to);
  if (c.blocked) return { text: `Can’t move ${s.title} to ${fmtDow(to)}: ${c.blocked}` };
  const snap = coachSnap(); S.schedule.moves[s.key] = to; delete S.schedule.skips[s.key]; invalidatePlan(); save();
  return { text: `Moved **${s.title} → ${fmtDow(to)}**.${c.conflicts.length ? '\n⚠️ Knee-rule conflict: ' + c.conflicts.join('; ') + '. Undo if you’d rather not risk it.' : ''}${c.warnings.length ? '\nNote: ' + c.warnings.join('; ') : ''}`, undo: pushUndo('move', snap) };
}
function cmdTarget(t) {
  const ids = S.active ? S.active.exercises.map(e => e.ex) : []; const id = matchEx(t, ids) || matchGlobal(t); if (!id) return notFound(t);
  const tg = withActive(() => nextTarget(id)); return { text: tg ? `**${EX[id].n}** next: **${withActive(() => targetText(id))}** — ${tg.note}.` : `No ${EX[id].n} logged yet — first session sets your baseline.` };
}
function cmdGoals() {
  const g = benchGoal(), cur = (rolling7().slice(-1)[0] || {}).v, st = S.settings, P = S.profile;
  const t = withActive(() => nextTarget('flat_bench', { role: 'bench' }));
  let txt = `**Goal #1 — fat loss:** ${U.wOut(st.startWeight)} → ~${U.wOut(st.goalWeight)} ${U.w()} by Dec 31${cur ? ` (7-day avg now ${U.wOut(cur)})` : ''}. That stays the priority.`;
  if (P.goals.includes('strength')) txt += `\n**Goal #2 — get stronger, bench focus:** ${g ? `bench e1RM **${U.wOut(g.now, 0)} ${U.w()}** (${g.pct >= 0 ? '+' : ''}${g.pct.toFixed(1)}% from ${U.wOut(g.base, 0)}). Dec 31 target **${U.wOut(g.lo, 0)}–${U.wOut(g.hi, 0)} ${U.w()}** (+5–10%).` : 'no bench baseline yet — your first heavy top set on Upper A sets it.'}${t ? `\nNext heavy bench: **${withActive(() => targetText('flat_bench', { role: 'bench' }))}** — ${t.note}.` : ''}\nBench is first on both upper days (Upper A heavy, Upper B paused). On a cut, gains are modest — keep protein ≥${st.protein} g.`;
  return { text: txt };
}
function coachUndoLast() { if (!COACH_LAST || !COACH_UNDO[COACH_LAST]) return { text: 'Nothing to undo (undo history resets when the app reloads).' }; const id = COACH_LAST; return doCoachUndo(id); }
function doCoachUndo(id) { const u = COACH_UNDO[id]; if (!u) return { text: 'That undo has expired (undo history resets when the app reloads).' }; restoreSnap(u.snap); delete COACH_UNDO[id]; COACH_LAST = Object.keys(COACH_UNDO).pop() || null; return { text: `Undone (${u.label}). Everything is back the way it was.` }; }
function coachHandle(raw) {
  const t = raw.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim().replace(/[.!]+$/, '');
  if (!t) return null;
  for (const c of COACH_CMDS) { const m = t.match(c.re); if (m && (!c.test || c.test(t))) return c.fn(m); }
  const L = parseLog(t); if (L) return cmdLog(L);
  return { text: 'I didn’t catch that. Try “bench 185 for 5, 5, 4”, “I only did 2 sets of bench”, “add a set of pull-ups 8 reps”, “swap the leg press for step-ups”, or “skip laterals today”. Type **help** for more.' };
}

/* ---------- UI ---------- */
function mdLite(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
function coachMsgHtml(m, i) {
  const acts = (m.acts || []).map(a => `<button class="chip tap cact" data-a="${a.a}" data-i="${i}" ${Object.entries(a.d || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${esc(a.l)}</button>`).join('') + (m.undo && !m.undone ? `<button class="chip tap cact undo" data-a="coachUndo" data-id="${m.undo}" data-i="${i}">↶ Undo</button>` : '');
  return `<div class="msg ${m.role}"><div class="bub">${mdLite(m.text)}</div>${acts ? `<div class="cacts">${acts}</div>` : ''}</div>`;
}
function renderCoach() {
  const o = $('#coach'); if (!o || o.classList.contains('hidden')) return;
  const ctx = (S.profile.goals.includes('strength') ? 'Goals: fat loss #1 · bench strength · ' : '') + (S.active ? `Editing: ${S.active.title} (in progress)` : (() => { const s = planLiftSessions(today())[0]; if (s) return `Today: ${s.title}`; const w = doneRecent()[0]; return w ? `Most recent: ${w.title} · ${fmtDate(w.date)}` : 'No sessions logged yet'; })());
  const msgs = S.chat.length ? S.chat.map(coachMsgHtml).join('') : `<div class="msg bot"><div class="bub">Hey — I’m your coach. Tell me what you actually did and I’ll fix the log, the plan, and your next targets.<br><br>e.g. <b>bench 185 for 5, 5, 4</b> · <b>I only did 2 sets of bench</b> · <b>swap the leg press for step-ups</b></div></div>`;
  const chips = ['how’s my bench?', 'bench 185 for 5, 5, 4', 'I only did 2 sets of bench', 'add a set of pull-ups 8 reps', 'skip laterals today', 'swap the leg press for step-ups', 'help'];
  o.innerHTML = `<div class="wk-top"><button class="icon-btn tap" data-a="closeCoach" aria-label="Close coach">✕</button><div><div class="tt">Coach</div><div class="el small" id="coachCtx">${esc(ctx)}</div></div><button class="icon-btn tap" data-a="clearCoach" aria-label="Clear chat" title="Clear chat">🧹</button></div><div class="chatlog" id="chatlog">${msgs}</div><div class="chatchips">${chips.map(c => `<button class="chip tap" data-a="coachChip" data-t="${esc(c)}">${esc(c)}</button>`).join('')}</div><form class="chatbar" id="chatForm"><input class="inp" id="chatIn" autocomplete="off" placeholder="Tell the coach what you did…" aria-label="Message"><button class="btn sm tap" type="submit" id="chatSend">Send</button></form>`;
  const lg = $('#chatlog'); lg.scrollTop = lg.scrollHeight;
}
function openCoach() { const o = $('#coach'); o.classList.remove('hidden'); document.body.style.overflow = 'hidden'; renderCoach(); setTimeout(() => { const i = $('#chatIn'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); }, 50); }
function closeCoach() { $('#coach').classList.add('hidden'); $('#coach').innerHTML = ''; if ($('#workout').classList.contains('hidden')) document.body.style.overflow = ''; refreshUnder(); }
function refreshUnder() { if (S.active && !$('#workout').classList.contains('hidden')) rerenderWk(); if ($('#workout').classList.contains('hidden')) rerenderKeep(); }
function coachSend(text) {
  text = String(text || '').trim(); if (!text) return;
  S.chat.push({ role: 'me', text, t: Date.now() });
  let res; try { res = coachHandle(text); } catch (err) { console.warn(err); res = { text: 'Something went wrong applying that — nothing was changed.' }; }
  if (res) S.chat.push({ role: 'bot', text: res.text, undo: res.undo || null, acts: res.acts || null, t: Date.now() });
  if (S.chat.length > 80) S.chat = S.chat.slice(-80);
  save(); renderCoach(); haptic(10);
}
ACT.openCoach = () => openCoach();
ACT.closeCoach = () => closeCoach();
ACT.clearCoach = () => { if (confirm('Clear the chat history? (Your logs stay.)')) { S.chat = []; save(); renderCoach(); } };
ACT.coachChip = (el, d) => { const i = $('#chatIn'); i.value = d.t; i.focus(); };
ACT.coachUndo = (el, d) => { const m = S.chat[+d.i]; const r = doCoachUndo(d.id); if (m) m.undone = true; S.chat.push({ role: 'bot', text: r.text, t: Date.now() }); save(); renderCoach(); };
ACT.coachDefault = (el, d) => { const m = S.chat[+d.i]; setSwapDefault(d.slot, d.ex, true); if (m) m.acts = null; S.chat.push({ role: 'bot', text: `Saved: **${EX[d.ex].n}** is now your default for that slot (Settings → Saved swaps to change it). Future sessions will use it.`, t: Date.now() }); invalidatePlan(); save(); renderCoach(); };
ACT.coachJustToday = (el, d) => { const m = S.chat[+d.i]; if (m) m.acts = null; S.chat.push({ role: 'bot', text: 'Just this session then — your default stays the same.', t: Date.now() }); save(); renderCoach(); };
document.addEventListener('submit', ev => { if (ev.target.id === 'chatForm') { ev.preventDefault(); const i = $('#chatIn'); const v = i.value; i.value = ''; coachSend(v); } });
