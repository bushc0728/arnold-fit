/* Workout mode: Fitbod-style set logging, rest timer, swaps, PRs, next-session targets */
'use strict';
function resolveEx(slot, k) { const ed = (S.planEdits[k] || {})[slot.id] || {}; return ed.ex || S.swapPrefs[slot.id] || profileExercise(slot, S.profile); }
function prefill(e, mod) {
  const t = nextTarget(e.ex), ex = EX[e.ex];
  if (!t) { e.note = ex.kind === 'hold' ? `${e.reps[0]}–${e.reps[1]}s per side` : ex.kind === 'power' ? 'Max intent, full rest — stop if a landing hurts.' : `First time: work up to a set of ${e.reps[1]} @ RPE 9 — that’s your baseline.`; e.sets.forEach(s => { if (!s.done) { s.w = ex.added ? 0 : null; s.r = ex.kind === 'hold' ? e.reps[0] : ex.kind === 'power' ? e.reps[0] : null; } }); e.target = null; return; }
  e.target = t; e.note = t.note + (mod === 'deload' ? ' · Deload: ~10% lighter, leave reps in the tank' : '');
  e.sets.forEach((s, i) => {
    if (s.done) return;
    let w = t.w; if (w != null && mod === 'deload') w = roundLoad(w * 0.9);
    s.w = w == null ? (ex.added ? 0 : null) : (s.tag === 'Back-off' ? roundLoad(w * 0.9) : w);
    s.r = t.reps[Math.min(i, t.reps.length - 1)];
  });
}
function makeEx(slot, mod, k) {
  const exId = resolveEx(slot, k), ed = (S.planEdits[k] || {})[slot.id] || {};
  const sets = buildSets(slot, mod, S.profile).map(s => ({ ...s, w: null, r: null, rpe: null, done: false }));
  const e = { slot: slot.id, ex: exId, role: slot.role, reps: slot.reps, ss: slot.ss || null, planned: sets.length, sets, skipped: !!ed.skip };
  prefill(e, mod); return e;
}
function createWorkout(k, key) {
  const dp = dayPlan(k), s = dp.sessions.find(x => x.key === key) || sessionByKey(key);
  const w = { id: uid(), date: k, sessionKey: s.key, title: s.title, kind: s.kind, color: s.color, wk: dp.wk, mod: s.mod || 'normal', startedAt: Date.now(), exercises: [], cardio: null, checklist: [], why: s.why };
  if (s.kind === 'lift') { w.exercises = slotsFor(s.tpl, S.profile).map(sl => makeEx(sl, s.mod, k)); if (s.finisher) w.cardio = { ...s.finisher, dur: null, dist: null, rpe: null, knee: null, notes: '' }; }
  if (s.kind === 'cardio') { const c = s.cardio; w.cardio = { mode: c.mode, title: c.title, steps: c.steps, min: c.min, planDist: c.dist || null, dur: null, dist: null, rpe: null, knee: null, notes: '' }; w.checklist = (c.checklist || []).map(l => ({ label: l, done: false })); }
  return w;
}
function startSession(k, key) {
  if (S.active && S.active.sessionKey === key) return openWorkout();
  if (S.active && !confirm('You have a workout in progress. Discard it and start this one?')) return;
  S.active = createWorkout(k, key); save(); closeSheet(); haptic(15); openWorkout();
}
function openWorkout() { closeSheet(); $('#workout').classList.remove('hidden'); document.body.style.overflow = 'hidden'; renderWorkout(); $('#workout').scrollTop = 0; startElapsed(); }
function closeWorkout() { $('#workout').classList.add('hidden'); $('#workout').innerHTML = ''; document.body.style.overflow = ''; stopTimer(); clearInterval(elT); }
let elT; function startElapsed() { clearInterval(elT); elT = setInterval(() => { const el = $('#wk-el'); if (el && S.active) el.textContent = fmtTime((Date.now() - S.active.startedAt) / 1000); }, 1000); }
function wkProgress(w) { let tot = 0, d = 0; w.exercises.forEach(e => { if (e.skipped) return; e.sets.forEach(s => { tot++; if (s.done) d++; }); }); if (w.cardio) { tot++; if (w.cardio.dur) d++; } w.checklist.forEach(c => { tot++; if (c.done) d++; }); return tot ? d / tot : 0; }
function rerenderWk() { const o = $('#workout'); if (o.classList.contains('hidden') || !S.active) return; const y = o.scrollTop; renderWorkout(); o.scrollTop = y; }
function setLabel(e, s, si) { if (si >= e.planned) return 'Extra'; return s.tag === 'Back-off' ? 'Back-off' : s.tag === 'Top' ? 'Top set' : 'Set ' + (si + 1); }
function renderWorkout() {
  const w = S.active; if (!w) return closeWorkout();
  let h = `<div class="wk-top"><button class="icon-btn tap" data-a="minimize" aria-label="Minimize"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button><div><div class="tt">${esc(w.title)}</div><div class="el" id="wk-el">${fmtTime((Date.now() - w.startedAt) / 1000)}</div></div><div class="row" style="gap:6px"><button class="icon-btn tap" data-a="openCoach" aria-label="Coach chat">${CHAT}</button><button class="icon-btn tap" data-a="discard" aria-label="Discard workout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div></div><div class="wk-body"><div class="wk-progress"><i id="wk-prog" style="width:${wkProgress(w) * 100}%"></i></div>`;
  if (w.why) h += `<details class="why" style="margin:0 0 12px"><summary>🧪 Why this session works</summary><div>${esc(w.why)}</div></details>`;
  if (w.exercises.length) h += `<div class="small dim" style="margin:0 2px 12px">Log weight × reps (RPE optional). Add or remove sets freely. Next-session targets update automatically: top of range on all sets → +load · in range → +1 rep · missed → hold.</div>`;
  w.exercises.forEach((e, ei) => {
    const ex = EX[e.ex], all = !e.skipped && e.sets.length && e.sets.every(s => s.done), next = w.exercises[ei + 1];
    const isHold = ex.kind === 'hold', isPow = ex.kind === 'power', bj = e.ex === 'broad_jump';
    const pres = e.role === 'main' ? `Top set + back-offs · ${e.reps[0]}–${e.reps[1]} reps` : isPow ? `${e.planned} × ${e.reps[0]} explosive` : isHold ? `${e.planned} × ${e.reps[0]}–${e.reps[1]} s/side` : `${e.planned} hard set${e.planned > 1 ? 's' : ''} · ${e.reps[0]}–${e.reps[1]} reps`;
    h += `<div class="card excard ${all ? 'complete' : ''} ${e.skipped ? 'exskip' : ''}" id="ex-${ei}" data-ex="${e.ex}">${e.ss ? `<div class="ss-tag" style="margin-bottom:6px">${e.ss} ${next && next.ss === e.ss ? 'A · then straight to B' : 'B'}</div>` : ''}<div class="exh"><div class="exthumb ${e.role === 'main' ? 'main' : ''}">${all ? '✓' : ei + 1}</div><div class="grow"><div class="exn">${esc(ex.n)}</div><div class="ext">${pres} · ${ex.m}${ex.kf ? ' · <span style="color:var(--ok)">knee-friendly</span>' : ''}</div></div><button class="icon-btn tap" data-a="swap" data-ei="${ei}" aria-label="Swap exercise" title="Swap">⇄</button></div>`;
    if (e.skipped) { h += `<div class="row between" style="margin-top:10px"><span class="small muted">Skipped today — target carries over unchanged.</span><button class="btn sm sec tap" data-a="skipEx" data-ei="${ei}">Unskip</button></div></div>`; return; }
    h += `<div class="small dim" style="margin-top:8px">${esc(ex.cue)}</div>${e.note ? `<div class="sugg">🎯 <span>${esc(e.note)}</span></div>` : ''}<div class="sets"><div class="sethead"><span>Set</span><span style="text-align:center">${isHold ? '—' : bj ? 'Dist in' : (ex.added ? '+' : '') + wu()}</span><span style="text-align:center">${isHold ? 'Sec' : 'Reps'}</span><span style="text-align:center">RPE</span><span></span></div>`;
    e.sets.forEach((s, si) => {
      const wv = bj ? (s.w ?? '') : U.wOut(s.w);
      h += `<div class="setrow ${s.done ? 'done' : ''} ${si >= e.planned ? 'extra' : ''}"><div class="tg">${setLabel(e, s, si)}<small>${s.rpeT === 'Max intent' ? 'max' : '@' + s.rpeT}</small></div><input class="inp" type="number" inputmode="decimal" step="any" data-f="w" data-ei="${ei}" data-si="${si}" value="${wv}" placeholder="${isHold ? '—' : '0'}" ${isHold ? 'disabled' : ''} aria-label="Load"><input class="inp" type="number" inputmode="numeric" data-f="r" data-ei="${ei}" data-si="${si}" value="${s.r ?? ''}" placeholder="${e.reps[0]}–${e.reps[1]}" aria-label="Reps"><input class="inp" type="number" inputmode="decimal" step="0.5" min="1" max="10" data-f="rpe" data-ei="${ei}" data-si="${si}" value="${s.rpe ?? ''}" placeholder="${String(s.rpeT).replace('Max intent', '—').split('–')[0]}" aria-label="RPE"><button class="chk tap" data-a="setDone" data-ei="${ei}" data-si="${si}" aria-label="Complete set">${CHECK}</button></div>`;
    });
    h += `</div><div class="exfoot"><button class="tap" data-a="addSet" data-ei="${ei}">+ Set</button>${e.sets.length > 1 ? `<button class="tap" data-a="rmSet" data-ei="${ei}">− Set</button>` : ''}<button class="tap" data-a="skipEx" data-ei="${ei}">Skip</button><button class="tap" data-a="history" data-ex="${e.ex}">History</button></div></div>`;
  });
  if (w.cardio) h += cardioCard(w);
  if (w.checklist.length) h += `<div class="card"><div style="font-weight:750;font-size:17px;margin-bottom:4px">Core + mobility</div>${w.checklist.map((c, i) => `<button class="checkrow ${c.done ? 'on' : ''}" data-a="chk" data-i="${i}"><span class="ck">${c.done ? CHECK.replace('<svg', '<svg width="14" height="14" style="color:#04110C"') : ''}</span><span>${esc(c.label)}</span></button>`).join('')}</div>`;
  h += `</div><div class="wk-bottom"><button class="btn tap" data-a="finish" id="finishBtn">Finish workout</button></div>`;
  $('#workout').innerHTML = h;
}
function cardioCard(w) {
  const c = w.cardio, sw = c.mode === 'swim', hk = c.mode === 'hockey';
  return `<div class="card"><div class="row between"><div class="row"><span class="dot c-${c.mode === 'walk' ? 'bike' : c.mode}"></span><div style="font-weight:750;font-size:17px">${esc(c.title)}</div></div>${c.min ? `<span class="chip">${c.min} min plan</span>` : ''}</div><div class="steps" style="margin-top:6px">${(c.steps || []).map(st => `<div class="step"><div class="bul c-${c.mode === 'walk' ? 'bike' : c.mode}"></div><div><b>${esc(st[0])}</b><span>${esc(st[1])}</span></div></div>`).join('')}</div>
  <div class="grid2" style="margin-top:10px"><div class="field"><label>Duration (min)</label><input class="inp" type="number" inputmode="decimal" data-cf="dur" value="${c.dur ?? ''}" placeholder="${c.min || ''}"></div>${hk ? `<div class="field"><label>Notes</label><input class="inp" data-cf="notes" value="${esc(c.notes)}" placeholder="optional"></div>` : `<div class="field"><label>Distance (${sw ? su() : du()})</label><input class="inp" type="number" inputmode="decimal" step="any" data-cf="dist" value="${c.dist == null ? '' : sw ? U.sOut(c.dist) : U.dOut(c.dist)}" placeholder="${sw && c.planDist ? U.sOut(c.planDist) : '0'}"></div>`}</div>
  <div class="field" style="margin-top:12px"><label>Effort RPE (1–10)</label><div class="pain" style="grid-template-columns:repeat(10,1fr)">${[...Array(10)].map((_, i) => `<button class="tap ${c.rpe === i + 1 ? 'on' : ''}" style="${c.rpe === i + 1 ? 'background:var(--a1)' : ''}" data-a="crpe" data-v="${i + 1}">${i + 1}</button>`).join('')}</div></div>
  <div class="field" style="margin-top:12px"><label>Knee pain (0–10)</label><div class="pain">${[...Array(11)].map((_, i) => `<button class="tap ${c.knee === i ? 'on' : ''}" style="${c.knee === i ? `background:${painColor(i)}` : ''}" data-a="cknee" data-v="${i}">${i}</button>`).join('')}</div>${c.knee >= 3 ? '<div class="small" style="color:var(--bad);margin-top:8px">≥3/10 — stop or swap to bike/swim. Keep the next session knee-friendly.</div>' : ''}</div>
  ${hk ? '' : `<div class="field" style="margin-top:12px"><label>Notes</label><input class="inp" data-cf="notes" value="${esc(c.notes)}" placeholder="How did it feel?"></div>`}</div>`;
}
/* rest timer */
const T = { end: 0, total: 0, id: null, fired: false };
function startRest(sec) {
  T.total = sec; T.end = Date.now() + sec * 1000; T.fired = false; clearInterval(T.id);
  let el = $('#timer'); if (!el) { el = document.createElement('div'); el.id = 'timer'; el.className = 'timer'; document.body.appendChild(el); }
  el.classList.remove('done');
  el.innerHTML = `<div><div class="xs dim" style="font-weight:700;letter-spacing:.06em">REST</div><div class="tm" id="tm">${fmtTime(sec)}</div></div><div class="grow"></div><button class="btn sm sec tap" data-a="restAdj" data-v="-15">−15</button><button class="btn sm sec tap" data-a="restAdj" data-v="15">+15</button><button class="btn sm tap" data-a="restSkip">Skip</button><div class="bar" id="tbar" style="width:100%"></div>`;
  T.id = setInterval(tickRest, 250); tickRest();
}
function tickRest() {
  const el = $('#timer'); if (!el) return clearInterval(T.id);
  const rem = Math.max(0, (T.end - Date.now()) / 1000);
  $('#tm').textContent = rem > 0 ? fmtTime(Math.ceil(rem)) : 'Go! 💥'; $('#tbar').style.width = (rem / T.total * 100) + '%';
  if (rem <= 0 && !T.fired) { T.fired = true; el.classList.add('done'); if (navigator.vibrate) try { navigator.vibrate([250, 120, 250]); } catch (e) {} beep(); setTimeout(() => { if (T.fired) stopTimer(); }, 4000); }
}
function stopTimer() { clearInterval(T.id); const el = $('#timer'); if (el) el.remove(); }

/* swaps — shared by the Swap sheet and the coach chat */
function applySwap(e, id, remember, mod) {
  e.ex = id; e.sets.forEach(s => { if (!s.done) { s.w = null; s.r = null; } }); prefill(e, mod || 'normal');
  if (remember != null) setSwapDefault(e.slot, id, remember);
}
function setSwapDefault(slotId, id, remember) {
  const slot = slotById(slotId); if (!slot) return;
  if (remember) { if (profileExercise(slot, S.profile) === id) delete S.swapPrefs[slotId]; else S.swapPrefs[slotId] = id; }
}
function swapSheet(ei) {
  const e = S.active.exercises[ei], sl = slotById(e.slot), base = sl ? profileExercise(sl, S.profile) : e.ex, pref = S.swapPrefs[e.slot], fam = [...new Set([...altsFor(base), ...(pref ? [pref, ...altsFor(pref)] : []), ...altsFor(e.ex), e.ex])];
  openSheet(`<h3>Swap exercise</h3><div class="small muted" style="margin-bottom:14px">Knee irritated (≥3/10)? Pick a knee-friendly option. Same sets & reps.</div>${fam.map(id => { const x = EX[id]; return `<button class="opt tap ${id === e.ex ? 'cur' : ''}" data-a="doSwap" data-ei="${ei}" data-ex="${id}"><div class="grow"><div style="font-weight:700">${esc(x.n)} ${x.kf ? '<span class="chip ok" style="font-size:9px;padding:2px 6px">Knee-friendly</span>' : ''}</div><div class="small muted" style="margin-top:3px">${esc(x.eq)} · ${esc(x.cue)}</div></div>${id === e.ex ? '<span class="chip grad">Current</span>' : ''}</button>`; }).join('')}<label class="row small muted" style="margin-top:10px"><input type="checkbox" id="swapRemember" checked style="width:18px;height:18px;accent-color:#FF2E63"> Use this swap in future sessions (default)</label>`);
}
function historySheet(exId) {
  const hst = exHistory(exId).slice(-8).reverse(), t = nextTarget(exId);
  openSheet(`<h3>${esc(EX[exId].n)}</h3>${t ? `<div class="sugg">🎯 <span>Next: <b>${esc(targetText(exId))}</b> — ${esc(t.note)}</span></div>` : ''}<div class="small muted" style="margin:12px 0">Recent sessions · best est. 1RM (Epley)</div>${hst.length ? hst.map(x => `<div class="card flat" style="padding:12px"><div class="row between"><b>${fmtDate(x.date)}</b><span class="small muted">e1RM ${U.wOut(x.best, 0)} ${wu()}</span></div><div class="small muted" style="margin-top:4px">${x.sets.map(s => `${EX[exId].added && !s.w ? 'BW' : U.wOut(s.w)}×${s.r}${s.rpe ? ' @' + s.rpe : ''}`).join(' · ')}</div></div>`).join('') : '<div class="empty">No history yet — this session sets the baseline.</div>'}`);
}
function computeSummary(w) {
  const doneSets = w.exercises.filter(e => !e.skipped).flatMap(e => e.sets.filter(s => s.done).map(s => ({ s, e })));
  const vol = doneSets.reduce((a, x) => a + (EX[x.e.ex].kind === 'w' ? (x.s.w || 0) * (x.s.r || 0) : 0), 0);
  const prev = S.workouts.filter(o => o.id !== w.id);
  const prs = [];
  w.exercises.forEach(e => {
    const ex = EX[e.ex]; if (ex.kind !== 'w' || e.skipped) return;
    const d = e.sets.filter(s => s.done && s.r); if (!d.length) return;
    const hist = []; prev.forEach(o => (o.exercises || []).forEach(x => { if (x.ex === e.ex && !x.skipped) x.sets.filter(s => s.done && s.r).forEach(s => hist.push(s)); })); if (!hist.length) return;
    const prevBest = Math.max(...hist.map(s => e1rm(s.w, s.r))), prevW = Math.max(...hist.map(s => s.w || 0));
    const best = d.reduce((a, s) => e1rm(s.w, s.r) > e1rm(a.w, a.r) ? s : a, d[0]), mw = Math.max(...d.map(s => s.w || 0));
    if (e1rm(best.w, best.r) > prevBest + 0.01) prs.push({ ex: ex.n, txt: `${U.wOut(best.w)} ${wu()} × ${best.r} · e1RM ${U.wOut(e1rm(best.w, best.r), 0)} ${wu()}`, type: 'e1RM' });
    else if (mw > prevW) prs.push({ ex: ex.n, txt: `Heaviest: ${U.wOut(mw)} ${wu()}`, type: 'Weight' });
    else if (!mw && prevBest === 0 && Math.max(...d.map(s => s.r)) > Math.max(...hist.map(s => s.r || 0))) prs.push({ ex: ex.n, txt: `${Math.max(...d.map(s => s.r))} reps`, type: 'Reps' });
  });
  const baseline = w.exercises.length > 0 && w.exercises.every(e => !prev.some(o => (o.exercises || []).some(x => x.ex === e.ex && x.sets.some(s => s.done))));
  w.summary = { baseline, durMin: Math.max(1, Math.round(((w.endedAt || Date.now()) - w.startedAt) / 60000)), volume: vol, sets: doneSets.length, prs };
  return w.summary;
}
function finishWorkout() {
  const w = S.active; if (!w) return;
  const any = w.exercises.some(e => e.sets.some(s => s.done)) || (w.cardio && w.cardio.dur) || w.checklist.some(c => c.done);
  if (!any && !confirm('Nothing logged yet. Finish anyway?')) return;
  if (w.kind === 'cardio' && w.cardio && w.cardio.dur == null) w.cardio.dur = w.cardio.min || null;
  w.endedAt = Date.now(); computeSummary(w);
  if (w.cardio && w.cardio.knee != null) { const b = S.body[w.date] = S.body[w.date] || {}; b.knee = Math.max(b.knee ?? 0, w.cardio.knee); }
  S.workouts.push(w); S.active = null; delete S.schedule.skips[w.sessionKey]; save(); stopTimer(); clearInterval(elT);
  showSummary(w, true);
}
function targetsList(w) {
  const rows = w.exercises.filter(e => EX[e.ex].kind !== 'power').map(e => { const t = nextTarget(e.ex); if (!t) return ''; const ic = { add_weight: '⬆️', add_rep: '➕', hold: '⏸️' }[t.rule]; return `<div class="exrow tgtrow" data-ex="${e.ex}" data-rule="${t.rule}"><div class="exthumb">${ic}</div><div class="grow"><div class="nm">${esc(EX[e.ex].n)}</div><div class="small muted">${esc(t.note)}</div></div><b class="tgt">${esc(targetText(e.ex))}</b></div>`; }).join('');
  return rows ? `<h2 class="sec">Next session targets</h2><div class="card" id="nextTargets">${rows}</div>` : '';
}
function showSummary(w, fresh) {
  const sm = w.summary || computeSummary(w), c = w.cardio;
  let h = `<div class="wk-top"><span style="width:38px"></span><div class="tt">Summary</div><button class="icon-btn tap" data-a="closeSummary" aria-label="Close">✕</button></div><div class="wk-body"><div class="sum-hero"><div class="trophy">${sm.prs && sm.prs.length ? '🏆' : '💪'}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">${fresh ? 'Workout complete!' : esc(w.title)}</div><div class="muted" style="margin-top:4px">${esc(w.title)} · ${fmtLong(w.date)}</div></div><div class="grid3" style="margin:16px 0">`;
  h += `<div class="stat"><b>${sm.durMin || 0}</b><span>minutes</span></div>`;
  if (w.exercises.length) h += `<div class="stat"><b>${fmtNum(U.wOut(sm.volume || 0, 0))}</b><span>${wu()} volume</span></div><div class="stat"><b>${sm.sets || 0}</b><span>sets</span></div>`;
  else h += `<div class="stat"><b>${c && c.dist ? (c.mode === 'swim' ? U.sOut(c.dist) : U.dOut(c.dist)) : '—'}</b><span>${c && c.mode === 'swim' ? su() : du()}</span></div><div class="stat"><b>${c && c.rpe ? c.rpe : '—'}</b><span>RPE</span></div>`;
  h += `</div>`;
  if (sm.prs && sm.prs.length) h += `<h2 class="sec">Personal records</h2>${sm.prs.map(p => `<div class="pr">🏆 <div class="grow"><b>${esc(p.ex)}</b><div class="small muted">${esc(p.txt)}</div></div><span class="chip test">${p.type}</span></div>`).join('')}`;
  else if (w.exercises.length && fresh) h += sm.baseline ? `<div class="tip good"><div class="ic">🎯</div><div>Baseline set! Every lift today is your benchmark.</div></div>` : `<div class="tip info"><div class="ic">📈</div><div>No PRs this time — targets below keep the progression honest.</div></div>`;
  if (w.exercises.length) h += targetsList(w);
  if (w.exercises.length) h += `<h2 class="sec">Logged</h2><div class="card">${w.exercises.map(e => { const x = EX[e.ex], d = e.sets.filter(s => s.done); const fmt = s => x.kind === 'hold' ? `${s.r}s` : x.added && !s.w ? `BW×${s.r}` : x.kind === 'power' ? `${s.w ? s.w + (e.ex === 'broad_jump' ? '″' : '') + ' · ' : ''}${s.r} reps` : `${U.wOut(s.w)}×${s.r}`; return `<div class="exrow"><div class="grow"><div class="nm">${esc(x.n)}</div><div class="small muted">${e.skipped ? 'skipped' : d.length ? d.map(fmt).join(' · ') + (d.length < e.planned ? ` (${d.length}/${e.planned} sets)` : d.length > e.planned ? ` (+${d.length - e.planned} extra)` : '') : 'not logged'}</div></div></div>`; }).join('')}</div>`;
  if (c && (c.dur || c.dist)) h += `<div class="card"><div class="row between"><b>${esc(c.title)}</b><span class="chip">${c.dur || 0} min</span></div><div class="small muted" style="margin-top:6px">${c.dist ? (c.mode === 'swim' ? U.sOut(c.dist) + ' ' + su() : U.dOut(c.dist) + ' ' + du()) + ' · ' : ''}${c.rpe ? 'RPE ' + c.rpe + ' · ' : ''}${c.knee != null ? 'Knee ' + c.knee + '/10' : ''}</div></div>`;
  if (c && c.knee >= 3) h += `<div class="tip bad"><div class="ic">🛑</div><div>Knee pain ${c.knee}/10 — next session, swap impact work for bike/swim and use knee-friendly lower options.</div></div>`;
  h += `</div><div class="wk-bottom"><button class="btn tap" data-a="closeSummary">Done</button></div>`;
  $('#workout').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  $('#workout').innerHTML = h; $('#workout').scrollTop = 0; $('#toast').classList.remove('show');
  if (fresh) { confetti(); haptic([20, 40, 20]); }
}

ACT.start = (el, d) => startSession(d.day, d.key);
ACT.resume = () => openWorkout();
ACT.minimize = () => { closeWorkout(); render(); toast('Workout saved — tap Resume anytime'); };
ACT.discard = () => { if (confirm('Discard this workout? Logged sets will be lost.')) { S.active = null; save(); closeWorkout(); render(); toast('Workout discarded'); } };
ACT.setDone = (el, d) => {
  const w = S.active, e = w.exercises[+d.ei], s = e.sets[+d.si], ex = EX[e.ex];
  if (!s.done) {
    const focus = f => { const ip = document.querySelector(`[data-f="${f}"][data-ei="${d.ei}"][data-si="${d.si}"]`); if (ip) ip.focus(); };
    if (s.r == null) { focus('r'); toast(ex.kind === 'hold' ? 'Enter seconds first' : 'Enter reps first'); return; }
    if (ex.kind === 'w' && s.w == null && !ex.added) { focus('w'); toast('Enter the load first'); return; }
    if (ex.added && s.w == null) s.w = 0;
    s.done = true; haptic(18);
    if (s.tag === 'Top' && s.w) e.sets.forEach(o => { if (o.tag === 'Back-off' && !o.done) o.w = roundLoad(s.w * 0.9); });
    const nx = w.exercises[+d.ei + 1], nextSS = e.ss && nx && nx.ss === e.ss;
    startRest(nextSS ? 20 : e.role === 'main' ? S.settings.rest.main : ex.kind === 'power' ? 120 : ex.kind === 'hold' ? 60 : S.settings.rest.acc);
    if (e.sets.every(x => x.done)) toast(nextSS ? 'Superset → straight to B' : `${ex.n} ✓`);
  } else { s.done = false; haptic(); }
  save(); rerenderWk();
};
ACT.addSet = (el, d) => { const e = S.active.exercises[+d.ei], l = e.sets[e.sets.length - 1] || { tag: 'Hard', rpeT: '9–10' }; e.sets.push({ tag: l.tag === 'Top' ? 'Back-off' : l.tag, rpeT: l.tag === 'Top' ? '8–9' : l.rpeT, w: l.w ?? null, r: l.r ?? null, rpe: null, done: false }); save(); haptic(); rerenderWk(); };
ACT.rmSet = (el, d) => { const e = S.active.exercises[+d.ei]; if (e.sets.length > 1) e.sets.pop(); save(); haptic(); rerenderWk(); };
ACT.skipEx = (el, d) => { const e = S.active.exercises[+d.ei]; e.skipped = !e.skipped; save(); haptic(); rerenderWk(); toast(e.skipped ? `Skipped ${EX[e.ex].n}` : 'Back in'); };
ACT.swap = (el, d) => swapSheet(+d.ei);
ACT.doSwap = (el, d) => { const e = S.active.exercises[+d.ei], rem = $('#swapRemember') && $('#swapRemember').checked; applySwap(e, d.ex, rem, S.active.mod); save(); closeSheet(); haptic(15); rerenderWk(); toast('Swapped → ' + EX[d.ex].n + (rem ? ' (default)' : '')); };
ACT.history = (el, d) => historySheet(d.ex);
ACT.crpe = (el, d) => { S.active.cardio.rpe = +d.v; save(); haptic(); rerenderWk(); };
ACT.cknee = (el, d) => { S.active.cardio.knee = +d.v; save(); haptic(); rerenderWk(); };
ACT.chk = (el, d) => { const c = S.active.checklist[+d.i]; c.done = !c.done; save(); haptic(10); rerenderWk(); };
ACT.finish = () => finishWorkout();
ACT.restAdj = (el, d) => { T.end += +d.v * 1000; T.total = Math.max(T.total, (T.end - Date.now()) / 1000); haptic(); tickRest(); };
ACT.restSkip = () => { stopTimer(); haptic(); };
ACT.closeSummary = () => { closeWorkout(); goTab(UI.tab === 'settings' ? 'today' : UI.tab); };
ACT.viewSummary = (el, d) => { const x = S.workouts.find(z => z.id === d.id); closeSheet(); if (x) showSummary(x, false); };
document.addEventListener('input', ev => {
  const t = ev.target, w = S.active;
  if (t.dataset.f && w && t.closest('#workout')) {
    const e = w.exercises[+t.dataset.ei], s = e.sets[+t.dataset.si], v = t.value;
    if (t.dataset.f === 'w') s.w = v === '' ? null : (e.ex === 'broad_jump' ? +v : U.wIn(v)); else s[t.dataset.f] = v === '' ? null : +v;
    save();
  } else if (t.dataset.cf && w) {
    const c = w.cardio, f = t.dataset.cf, v = t.value;
    if (f === 'notes') c.notes = v; else if (f === 'dur') c.dur = v === '' ? null : +v; else if (f === 'dist') c.dist = v === '' ? null : (c.mode === 'swim' ? U.sIn(v) : U.dIn(v));
    save(); const p = $('#wk-prog'); if (p) p.style.width = wkProgress(w) * 100 + '%';
  }
});
