/* Train tab: this week's schedule (move / skip / day off), program overview, all weeks */
'use strict';
function statusChip(s) {
  const st = sessStatus(s);
  if (st === 'done') return sessBadge(s);
  if (st === 'skipped') return '<span class="chip">Skipped</span>';
  if (S.active && S.active.sessionKey === s.key) return sessBadge(s);
  return '';
}
VIEWS.train = function () {
  const t = today(), ws = UI.trainWeek || weekStart(t), wk = weekNum(ws), m = inPlan(ws) || inPlan(addDays(ws, 6)) ? weekMeta(Math.max(2, Math.min(14, wk))) : null;
  let h = hdr('Oct 5 → Dec 31, 2026', 'Train');
  // week schedule
  h += `<div class="card"><div class="row between"><button class="icon-btn tap" data-a="trainWeek" data-v="-7" aria-label="Previous week">‹</button><div style="text-align:center"><div style="font-weight:800;font-size:17px">Week ${m ? m.wk : '—'} · ${fmtDate(ws)}–${fmtDate(addDays(ws, 6))}</div><div class="row wrap" style="gap:5px;justify-content:center;margin-top:6px">${m && m.block ? `<span class="chip">${m.block.name}</span>` : ''}${m && m.deload ? '<span class="chip deload">Deload</span>' : ''}${m && m.test ? '<span class="chip test">Test</span>' : ''}${m && m.finals ? '<span class="chip finals">Finals</span>' : ''}</div></div><button class="icon-btn tap" data-a="trainWeek" data-v="7" aria-label="Next week">›</button></div><div class="wkdays" id="weekSchedule">`;
  for (let i = 0; i < 7; i++) {
    const k = addDays(ws, i), dp = dayPlan(k);
    h += `<div class="wkday ${k === t ? 'today' : ''} ${k < t ? 'past' : ''}" data-day="${k}"><div class="wkd"><b>${DOW[i]}</b><span>${pkey(k).getDate()}</span></div><div class="grow">`;
    if (!dp) h += '<div class="small dim">—</div>';
    else {
      if (dp.off) h += `<div class="small" style="color:var(--hockey);font-weight:700">📅 Day off · ${esc(dp.off)}</div>`;
      if (!dp.sessions.length) h += `<div class="small dim">Rest</div>`;
      dp.sessions.forEach(s => {
        const st = sessStatus(s), canAct = st === 'todo' && k >= t;
        h += `<div class="wks ${st}"><div class="row" style="gap:8px"><span class="dot c-${s.color}"></span><span class="grow wkt">${esc(s.title)}${s.movedFrom ? ` <span class="xs" style="color:var(--swim)">↪ from ${DOW[dow(s.movedFrom)]}</span>` : ''}</span>${statusChip(s)}</div>${s.kind !== 'test' ? `<div class="row wkact">${st === 'done' ? (s.kind === 'cardio' ? `<button class="tap" data-a="cardioDetails" data-id="${sessionDone(s.key).id}">Details</button>` : `<button class="tap" data-a="viewSummary" data-id="${sessionDone(s.key).id}">Summary</button>`) : s.kind === 'cardio' && st === 'todo' && k <= t ? `<button class="tap mdone" data-a="quickDone" data-day="${k}" data-key="${s.key}">Mark done ✓</button>` : ''}${st === 'done' ? '' : canAct || k === t ? `<button class="tap" data-a="${S.active && S.active.sessionKey === s.key ? 'resume' : 'start'}" data-day="${k}" data-key="${s.key}">${S.active && S.active.sessionKey === s.key ? 'Resume' : s.kind === 'cardio' ? 'Log' : 'Start'}</button>` : ''}${st !== 'done' ? `<button class="tap" data-a="moveSheet" data-key="${s.key}">Move</button>` : ''}${st === 'skipped' ? `<button class="tap" data-a="unskip" data-key="${s.key}">Unskip</button>` : st === 'todo' ? `<button class="tap" data-a="skip" data-key="${s.key}">Skip</button>` : ''}${s.movedFrom && st !== 'done' ? `<button class="tap" data-a="unmove" data-key="${s.key}">Undo move</button>` : ''}</div>` : `<div class="row wkact"><button class="tap" data-a="testSheet" data-key="${s.testKey}">Results</button></div>`}</div>`;
      });
      if (k >= t) h += `<button class="xs dim offbtn tap" data-a="toggleOff" data-day="${k}">${dp.off ? 'Clear day off' : '+ Mark day off'}</button>`;
    }
    h += `</div></div>`;
  }
  h += `</div></div>`;
  h += `<div class="card coachcta tap" data-a="openCoach"><div class="row" style="gap:12px"><div class="coach-av">${CHAT}</div><div class="grow"><b>Coach chat</b><div class="small muted">“bench 185 for 5, 5, 4” · “swap the leg press for step-ups” · “skip laterals today”</div></div><span class="muted">›</span></div></div>`;
  // program
  const P = S.profile, tpl = weeklyTemplate(P);
  h += `<h2 class="sec">Your program <button class="btn sm sec tap" data-a="retakeQuiz">Retake quiz</button></h2><div class="card"><div class="tplrow" id="tplPreview">${tpl.map((c, i) => `<div class="tpl ${c ? '' : 'rest'}"><span>${DOW[i][0]}</span><b>${c ? CODE_NAME[c].replace(' + ', '+').replace('Long aerobic', 'Long') : 'Rest'}</b></div>`).join('')}</div><div class="small muted" style="margin-top:10px">${esc(P.style[0].toUpperCase() + P.style.slice(1))} · ${P.days} days/week · ${P.sessionMin}-min sessions · ${(P.goals || []).map(g => GOAL_LABEL[g]).join(', ')}</div><div class="small muted" style="margin-top:6px">Science: double progression (reps → load), block periodization (Base → Build → Sharpen) with deloads, and compound lifts first.</div></div>`;
  h += `<div class="blocks">${BLOCKS.map(b => `<div class="blk ${b.grad}"><span class="chip">Block ${b.n} · ${fmtDate(b.start)}–${fmtDate(b.end)}</span><h3>${b.name}</h3><p>${esc(b.desc)}</p></div>`).join('')}</div>`;
  h += `<div class="tip good" style="margin-top:12px"><div class="ic">🛡️</div><div>${esc(SLIP_RULE)}</div></div>`;
  h += `<h2 class="sec">All weeks</h2>`;
  WEEKS.forEach(m2 => {
    let tot = 0, done = 0; const days = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(m2.start, i), dp = dayPlan(k);
      if (!dp) { days.push(`<div class="day out"><span>${DOW[i][0]}</span><span class="dn">${pkey(k).getDate()}</span><span class="pips"></span></div>`); continue; }
      const sd = dp.sessions.map(s => sessStatus(s) !== 'todo'); tot += sd.length; done += sd.filter(Boolean).length;
      const all = sd.length && sd.every(Boolean);
      days.push(`<button class="day tap ${k === t ? 'today' : ''} ${all ? 'done' : ''} ${dp.off ? 'offd' : ''}" data-a="daySheet" data-day="${k}"><span>${DOW[i][0]}</span><span class="dn">${pkey(k).getDate()}</span><span class="pips">${dp.sessions.map(s => `<i class="c-${s.color}"></i>`).join('')}</span></button>`);
    }
    const cur = t >= m2.start && t <= m2.end;
    h += `<div class="card week ${cur ? 'cur' : ''}"><div class="row between"><div><div class="wt">Week ${m2.wk} <span class="muted small" style="font-weight:600">· ${fmtDate(m2.start)}–${fmtDate(m2.end)}</span></div><div class="row wrap" style="gap:5px;margin-top:6px"><span class="chip">${m2.block.name}</span>${m2.deload ? '<span class="chip deload">Deload</span>' : ''}${m2.test ? '<span class="chip test">Test</span>' : ''}${m2.finals ? '<span class="chip finals">Finals</span>' : ''}${cur ? '<span class="chip grad">Now</span>' : ''}</div></div><div style="text-align:right"><div style="font-weight:800;font-size:18px">${done}/${tot}</div><div class="xs dim">sessions</div></div></div>${m2.note ? `<div class="small muted" style="margin-top:8px">${esc(m2.note)}</div>` : ''}<div class="days">${days.join('')}</div><div class="pbar"><i style="width:${tot ? done / tot * 100 : 0}%"></i></div></div>`;
  });
  return h;
};
function daySheet(k) {
  const dp = dayPlan(k); if (!dp) return;
  let h = `<div class="small muted">Week ${dp.wk} · Block ${dp.block.n} ${dp.block.name}</div><h3>${fmtLong(k)}</h3><div class="row wrap" style="gap:6px;margin:8px 0 14px">${dp.meta.deload ? '<span class="chip deload">Deload</span>' : ''}${dp.meta.test ? '<span class="chip test">Test week</span>' : ''}${dp.meta.finals ? '<span class="chip finals">Finals</span>' : ''}${dp.off ? `<span class="chip finals">Day off · ${esc(dp.off)}</span>` : ''}${k === today() ? '<span class="chip grad">Today</span>' : ''}</div>`;
  if (!dp.sessions.length) h += '<div class="empty">Rest day — mobility + recovery.</div>';
  dp.sessions.forEach(s => { h += `<div class="card"><div class="row between"><div style="font-size:18px;font-weight:750">${esc(s.title)}</div><span class="small muted">~${s.min}′</span></div>${s.movedFrom ? `<div class="small" style="color:var(--swim)">↪ Moved from ${fmtDow(s.movedFrom)}</div>` : ''}<div class="small muted" style="margin:4px 0 8px">${esc(s.sub)}</div><div class="exlist">${sessionLines(s, modOf(dp), k)}</div>${whyBlock(s)}${sessionActions(s)}</div>`; });
  h += `<div class="small dim" style="margin-top:4px">+ Daily 10-min mobility</div>`;
  openSheet(h);
}
ACT.daySheet = (el, d) => daySheet(d.day);
ACT.trainWeek = (el, d) => { const ws = addDays(UI.trainWeek || weekStart(today()), +d.v); if (ws < weekStart(PLAN_START) || ws > weekStart(PLAN_END)) return; UI.trainWeek = ws; haptic(); rerenderKeep(); };
ACT.toggleOff = (el, d) => { const o = S.schedule.off; if (o[d.day]) delete o[d.day]; else o[d.day] = prompt('Reason (e.g. Event, Travel)?', 'Event') || 'Off'; invalidatePlan(); save(); rerenderKeep(); };

/* ---------- move / skip ---------- */
function moveCandidates(key) {
  const s = sessionByKey(key), from = key.split(':')[0], t = today();
  const startK = weekStart(t > from ? t : from), out = [];
  for (let i = 0; i < 10; i++) {
    const k = addDays(startK, i); if (k === from && !S.schedule.moves[key]) continue;
    if (!inPlan(k)) continue;
    if (S.schedule.moves[key] === k) continue;
    out.push({ k, chk: checkMove(key, k) });
  }
  return { s, out };
}
function moveSheet(key) {
  const { s, out } = moveCandidates(key); if (!s) return;
  const valid = out.filter(o => !o.chk.blocked); const best = valid.slice().sort((a, b) => b.chk.score - a.chk.score || (a.k < b.k ? -1 : 1))[0];
  let h = `<h3>Move ${esc(s.title)}</h3><div class="small muted" style="margin-bottom:14px">Originally ${fmtDow(key.split(':')[0])}. Pick a new day — the knee rules are checked for every option.</div>`;
  out.forEach(o => {
    const c = o.chk, dp = dayPlan(o.k), others = dp ? dp.sessions.filter(x => x.key !== key) : [];
    const cls = c.blocked ? 'blocked' : c.conflicts.length ? 'conflict' : c.warnings.length ? 'warn' : 'okm';
    h += `<button class="opt movopt ${cls} tap" data-a="doMove" data-key="${key}" data-to="${o.k}" ${c.blocked ? 'disabled' : ''}><div class="grow"><div class="row between"><b>${fmtDow(o.k)}${o.k === today() ? ' · Today' : ''}</b>${best && o.k === best.k ? '<span class="chip ok">Best</span>' : c.blocked ? `<span class="chip">${esc(c.blocked)}</span>` : c.conflicts.length ? '<span class="chip bad">Knee rule</span>' : c.warnings.length ? '<span class="chip test">Caution</span>' : '<span class="chip ok">OK</span>'}</div><div class="small muted" style="margin-top:3px">${others.length ? 'With: ' + others.map(x => esc(x.title)).join(', ') : 'Free day'}</div>${c.conflicts.map(x => `<div class="small mv-conf">⛔ ${esc(x)}</div>`).join('')}${c.warnings.map(x => `<div class="small mv-warn">⚠️ ${esc(x)}</div>`).join('')}</div></button>`;
  });
  h += `<button class="btn ghost tap" style="margin-top:6px" data-a="skip" data-key="${key}" data-reason="Dropped">Drop it this week (if things slip)</button>`;
  openSheet(h);
}
function doMove(key, to, force) {
  const c = checkMove(key, to), s = sessionByKey(key);
  if (c.blocked) { toast('Can’t move there: ' + c.blocked); return false; }
  if (c.conflicts.length && !force && !confirm('⚠️ Knee rule conflict:\n• ' + c.conflicts.join('\n• ') + '\n\nMove anyway?')) return false;
  const prev = { move: S.schedule.moves[key], skip: S.schedule.skips[key] };
  UNDO_MOVE = { key, prev };
  if (to === key.split(':')[0]) delete S.schedule.moves[key]; else S.schedule.moves[key] = to;
  delete S.schedule.skips[key]; invalidatePlan(); save(); closeSheet(); haptic(15);
  toast(`Moved ${s.title} → ${fmtDow(to)}${c.conflicts.length ? ' (knee-rule override)' : ''}`, 'undoMove');
  rerenderKeep(); return true;
}
let UNDO_MOVE = null;
ACT.undoMove = () => { if (!UNDO_MOVE) return; const { key, prev } = UNDO_MOVE; if (prev.move) S.schedule.moves[key] = prev.move; else delete S.schedule.moves[key]; if (prev.skip) S.schedule.skips[key] = prev.skip; UNDO_MOVE = null; invalidatePlan(); save(); toast('Move undone'); rerenderKeep(); };
ACT.moveSheet = (el, d) => moveSheet(d.key);
ACT.doMove = (el, d) => doMove(d.key, d.to);
ACT.unmove = (el, d) => { delete S.schedule.moves[d.key]; invalidatePlan(); save(); toast('Back on its original day'); rerenderKeep(); };
ACT.skip = (el, d) => { S.schedule.skips[d.key] = { reason: d.reason || 'Skipped', t: Date.now() }; save(); closeSheet(); haptic(); toast('Session skipped', 'undoSkip'); UNDO_SKIP = d.key; rerenderKeep(); };
let UNDO_SKIP = null;
ACT.undoSkip = () => { if (UNDO_SKIP) delete S.schedule.skips[UNDO_SKIP]; save(); toast('Skip undone'); rerenderKeep(); };
ACT.unskip = (el, d) => { delete S.schedule.skips[d.key]; save(); haptic(); rerenderKeep(); };
ACT.dropSkip = (el, d) => { const sk = S.schedule.skips[d.key]; if (sk) sk.needsMove = false; save(); toast('OK — protect the key sessions this week'); rerenderKeep(); };
