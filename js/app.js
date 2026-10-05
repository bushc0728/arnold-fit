/* Arnold Fit — UI */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const MODE_LABEL = { run: 'Run', swim: 'Swim', bike: 'Bike', hockey: 'Hockey' };
const UI = { tab: 'today', liftSel: 'incline_bench', cardioSel: 'run', testSel: null };

function haptic(ms = 8) { if (S.settings.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
let actx; function beep() { if (!S.settings.sound) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); [0, 0.18].forEach(t => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(0.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.15); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.16); }); } catch (e) {} }
function confetti() { const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#FF7A3D', '#FF2E63', '#2EE6A6', '#3DA9FC', '#FFC145', '#B98CFF']; for (let i = 0; i < 60; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length]; p.style.animationDelay = Math.random() * 0.5 + 's'; p.style.animationDuration = 1.4 + Math.random() * 1.2 + 's'; c.appendChild(p); } document.body.appendChild(c); setTimeout(() => c.remove(), 3200); }
const painColor = v => v <= 2 ? '#2EE6A6' : v <= 4 ? '#FFC145' : '#FF4D5E';
const wu = () => U.w(), du = () => U.d(), su = () => U.s(), lu = () => U.len();

/* ======================= sheets ======================= */
function openSheet(html, cls = '') { closeSheet(); const r = $('#sheet-root'); r.innerHTML = `<div class="scrim" data-a="closeSheet"></div><div class="sheet ${cls}" role="dialog"><div class="grab"></div><button class="icon-btn tap" data-a="closeSheet" aria-label="Close" style="position:absolute;right:14px;top:14px">✕</button>${html}</div>`; haptic(); }
function closeSheet() { $('#sheet-root').innerHTML = ''; }

/* ======================= render root ======================= */
function render() {
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const v = $('#view');
  v.innerHTML = { today: viewToday, plan: viewPlan, progress: viewProgress, settings: viewSettings }[UI.tab]();
}
function rerenderKeep() { const y = scrollY; render(); scrollTo(0, y); }
function rerenderWk() { const o = $('#workout'), y = o.scrollTop; renderWorkout(); o.scrollTop = y; }

/* ======================= TODAY ======================= */
function sessionLines(s, mod) {
  if (s.kind === 'lift') {
    return TEMPLATES[s.tpl].slots.map(sl => {
      const exId = S.swapPrefs[sl.id] || sl.ex, ex = EX[exId], sets = buildSets(sl, mod);
      let pres;
      if (sl.role === 'main') pres = `1 top @RPE ${sets[0].rpeT} + ${sets.length - 1} back-off · ${sl.reps[0]}–${sl.reps[1]}`;
      else if (sl.role === 'power') pres = `${sets.length}×${sl.reps[0]} · max intent`;
      else if (sl.role === 'hold') pres = `${sets.length}×${sl.reps[0]}–${sl.reps[1]}s/side`;
      else pres = `${sets.length} hard × ${sl.reps[0]}–${sl.reps[1]} @RPE ${sets[0].rpeT}`;
      const ini = ex.n.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('');
      return `<div class="exrow"><div class="exthumb ${sl.role === 'main' ? 'main' : ''}">${ini}</div><div class="grow"><div class="nm">${esc(ex.n)}${sl.ss ? ' <span class="ss-tag">SS</span>' : ''}</div><div class="small muted">${pres}</div></div></div>`;
    }).join('') + (TEMPLATES[s.tpl].finisher ? `<div class="exrow"><div class="exthumb" style="color:var(--bike)">B</div><div class="grow"><div class="nm">15′ Easy Bike</div><div class="small muted">Finisher · RPE 3–4</div></div></div>` : '');
  }
  if (s.kind === 'cardio') return `<div class="steps">${s.cardio.steps.map(st => `<div class="step"><div class="bul c-${s.cardio.mode}"></div><div><b>${esc(st[0])}</b><span>${esc(st[1])}</span></div></div>`).join('')}</div>${s.cardio.tip ? `<div class="small" style="color:var(--warn);margin-top:6px">⚠️ ${esc(s.cardio.tip)}</div>` : ''}`;
  if (s.kind === 'test') return `<ul class="clean">${TEST_FIELDS.map(f => `<li>${f.label}</li>`).join('')}</ul>`;
  return '';
}
const testDone = key => Object.keys(S.tests[key] || {}).length > 0;
function sessionButton(day, s, i) {
  const done = sessionDone(s.key);
  const act = S.active && S.active.sessionKey === s.key;
  if (s.kind === 'test') return `<button class="btn ${testDone(s.testKey) ? 'sec' : ''} tap" data-a="testSheet" data-key="${s.testKey}">${testDone(s.testKey) ? 'Edit test results' : 'Enter test results'}</button>`;
  if (act) return `<button class="btn tap" data-a="resume">▶ Resume workout</button>`;
  if (done) return `<div class="row between"><div class="done-badge">${CHECK.replace('<svg', '<svg width="20" height="20"')} Done · ${done.summary ? done.summary.durMin + ' min' : ''}</div><div class="row"><button class="btn sm sec tap" data-a="viewSummary" data-id="${done.id}">Summary</button><button class="btn sm ghost tap" data-a="start" data-day="${day.k}" data-i="${i}">Redo</button></div></div>`;
  return `<button class="btn tap" data-a="start" data-day="${day.k}" data-i="${i}">${s.kind === 'lift' ? 'Start workout' : 'Start ' + (MODE_LABEL[s.cardio.mode] || 'session').toLowerCase()}</button>`;
}
function contextTips(k) {
  const tips = [], d = dow(k);
  const tom = dayPlan(addDays(k, 1));
  if (tom && tom.sessions.some(s => s.cardio && s.cardio.mode === 'hockey')) tips.push(['⛸️', 'Hockey tomorrow — <b>no running today</b>, keep the legs easy.', '']);
  if (d === 6) tips.push(['🏒', 'Hockey day. Warm up hips & groin, log knee pain after the skate.', 'info']);
  if (d === 0 || d === 1) tips.push(['🦵', 'Within 48 h of hockey — <b>no hard lower work</b> until Wednesday.', 'info']);
  const kb = [0, 1, 2].map(i => S.body[addDays(k, -i)]).find(b => b && b.knee != null);
  if (kb && kb.knee >= 3) tips.unshift(['🛑', `Knee pain ${kb.knee}/10 logged. Stop anything ≥3/10 and <b>swap to a knee-friendly option</b> (tap ⇄ in the workout).`, 'bad']);
  return tips.map(t => `<div class="tip ${t[2]}"><div class="ic">${t[0]}</div><div>${t[1]}</div></div>`).join('');
}
function modOf(dp) { return dp.meta.deload ? 'deload' : dp.meta.finals ? 'reduced' : 'normal'; }
function viewToday() {
  const k = today(), day = dayPlan(k), b = S.body[k] || {}, log = S.habitLog[k] || {};
  const hs = S.settings.habits, pct = habitPct(k), st = streak();
  let h = `<div class="hdr"><div><div class="eyebrow">${fmtLong(k)}</div><h1>Today</h1></div><div class="avatar">${esc((S.settings.name || 'C')[0])}</div></div>`;
  if (S.active && (!day || !day.sessions.some(s => s.key === S.active.sessionKey))) h += `<div class="tip info"><div class="ic">⏱️</div><div class="grow">Workout in progress: <b>${esc(S.active.title)}</b><div style="margin-top:8px"><button class="btn sm tap" data-a="resume">Resume</button></div></div></div>`;
  if (!day) {
    const before = k < PLAN_START;
    h += `<div class="card hero"><span class="chip grad">${before ? 'Starts Oct 5' : 'Plan complete'}</span><div class="ttl">${before ? 'Plan starts Monday, Oct 5' : '🏁 Program complete!'}</div><div class="muted">${before ? 'Log baseline weight and habits now.' : 'Review your test comparison in Progress.'}</div></div>`;
  } else {
    const m = day.meta, totalDays = diffDays(PLAN_START, PLAN_END) + 1, dn = diffDays(PLAN_START, k) + 1;
    h += `<div class="card" style="padding:14px 16px"><div class="row between"><div class="row wrap" style="gap:6px"><span class="chip grad">Block ${day.block.n} · ${day.block.name}</span><span class="chip">Week ${day.wk}</span>${m.deload ? '<span class="chip deload">Deload</span>' : ''}${m.test ? '<span class="chip test">Test week</span>' : ''}${m.finals ? '<span class="chip finals">Finals</span>' : ''}</div><div class="small dim">Day ${dn}/${totalDays}</div></div>${m.note ? `<div class="small muted" style="margin-top:10px">${esc(m.note)}</div>` : ''}<div class="pbar"><i style="width:${dn / totalDays * 100}%"></i></div></div>`;
    h += contextTips(k);
    if (m.test && m.testKey && !day.sessions.some(s => s.kind === 'test')) h += `<div class="tip" style="background:rgba(247,225,75,.07);border-color:rgba(247,225,75,.25)"><div class="ic">📋</div><div class="grow">Test week (${TESTS.find(t => t.key === m.testKey).label}). Fit the mile, 100 yd swim, pull-ups & broad jump into this week.<div style="margin-top:8px"><button class="btn sm sec tap" data-a="testSheet" data-key="${m.testKey}">${testDone(m.testKey) ? 'Edit results' : 'Enter results'}</button></div></div></div>`;
    day.sessions.forEach((s, i) => {
      if (i === 0) h += `<div class="card hero"><div class="row between"><span class="chip"><span class="dot c-${s.color}"></span>${s.kind === 'lift' ? 'Strength' : s.kind === 'test' ? 'Test' : MODE_LABEL[s.cardio.mode]}</span><span class="small muted">~${s.min} min</span></div><div class="ttl">${esc(s.title)}</div><div class="muted small">${esc(s.sub)}</div><div class="exlist" style="margin-top:12px">${sessionLines(s, modOf(day))}</div>${sessionButton(day, s, i)}</div>`;
      else h += `<div class="card"><div class="row between" style="margin-bottom:6px"><span class="chip"><span class="dot c-${s.color}"></span>Also today</span><span class="small muted">~${s.min} min</span></div><div style="font-size:19px;font-weight:750;margin:4px 0">${esc(s.title)}</div>${sessionLines(s, modOf(day))}<div style="margin-top:12px">${sessionButton(day, s, i)}</div></div>`;
    });
  }
  h += `<h2 class="sec">Daily habits <small>${hs.filter(x => log[x.id]).length}/${hs.length}</small></h2><div class="card"><div class="ringwrap"><div class="ring">${Charts.ring(pct)}<div class="ctr"><div><b>${Math.round(pct * 100)}%</b><span>today</span></div></div></div><div><div class="streak" id="streak">🔥 ${st} day${st === 1 ? '' : 's'}</div><div class="small muted">Streak · days with ≥75% of habits</div></div></div><div class="habits">${hs.map(x => `<button class="habit ${log[x.id] ? 'on' : ''}" data-a="habit" data-id="${esc(x.id)}"><span class="ck">${CHECK}</span><span>${esc(x.ic || '')} ${esc(x.label)}</span></button>`).join('')}</div></div>`;
  const prot = b.protein || 0, pt = S.settings.protein;
  h += `<h2 class="sec">Quick log</h2><div class="card"><div class="grid2"><div class="field"><label>Weight (${wu()})</label><input class="inp" id="q-weight" type="number" inputmode="decimal" step="0.1" placeholder="${esc(U.wOut(lastWeight()))}" value="${esc(U.wOut(b.weight))}"></div><div class="field"><label>Protein (g)</label><input class="inp" id="q-protein" type="number" inputmode="numeric" placeholder="0" value="${b.protein ?? ''}"><div class="qadd"><button class="tap" data-a="addProt" data-v="40">+40</button><button class="tap" data-a="addProt" data-v="50">+50</button></div></div></div><div class="field" style="margin-top:14px"><label>Knee pain (0–10) ${b.knee != null ? `· <span style="color:${painColor(b.knee)}">${b.knee}/10</span>` : ''}</label><div class="pain" id="q-knee">${[...Array(11)].map((_, i) => `<button class="tap ${b.knee === i ? 'on' : ''}" style="${b.knee === i ? `background:${painColor(i)}` : ''}" data-a="knee" data-v="${i}">${i}</button>`).join('')}</div></div><div class="pbar" style="margin-top:16px"><i style="width:${Math.min(100, prot / pt * 100)}%"></i></div><div class="row between small muted" style="margin-top:6px"><span>Protein ${prot} / ${pt} g</span><span>${Math.max(0, pt - prot)} g to go</span></div><button class="btn" style="margin-top:14px" data-a="saveQuick">Save log</button></div>`;
  h += `<h2 class="sec">Daily 10-min mobility</h2><div class="card"><ul class="clean">${MOBILITY.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  h += `<h2 class="sec">Fuel <small>${fmtNum(S.settings.kcal)} kcal · ${S.settings.protein} g P</small></h2><div class="card"><ul class="clean">${NUTRITION.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  h += `<h2 class="sec">Knee rules</h2>${KNEE_RULES.map((r, i) => `<div class="tip ${i ? 'info' : 'bad'}"><div class="ic">${['🛑', '🏃', '⏱️', '☝️'][i]}</div><div>${esc(r)}</div></div>`).join('')}<div class="tip good"><div class="ic">🛡️</div><div>${esc(SLIP_RULE)}</div></div>`;
  return h;
}
function lastWeight() { const w = weights(); return w.length ? w[w.length - 1].v : S.settings.startWeight; }

/* ======================= PLAN ======================= */
function viewPlan() {
  const t = today();
  let h = `<div class="hdr"><div><div class="eyebrow">Oct 5 → Dec 31, 2026</div><h1>Plan</h1></div><div class="avatar">${esc((S.settings.name || 'C')[0])}</div></div>`;
  h += `<div class="blocks">${BLOCKS.map(b => `<div class="blk ${b.grad}"><span class="chip">Block ${b.n} · ${fmtDate(b.start)}–${fmtDate(b.end)}</span><h3>${b.name}</h3><p>${esc(b.desc)}</p></div>`).join('')}</div>`;
  h += `<div class="card flat" style="margin-top:12px"><div class="small muted"><b style="color:var(--t1)">Weekly template</b> · Mon Upper A · Tue Run + core · Wed Lower + Power · Thu Swim · Fri Upper B + bike · Sat Long aerobic · Sun Hockey · daily 10′ mobility</div><div class="small" style="margin-top:8px;color:var(--ok)">🛡️ ${esc(SLIP_RULE)}</div></div>`;
  h += `<h2 class="sec">Weeks</h2>`;
  WEEKS.forEach(m => {
    let tot = 0, done = 0; const days = [];
    for (let i = 0; i < 7; i++) {
      const k = addDays(m.start, i), dp = dayPlan(k);
      if (!dp) { days.push(`<div class="day out"><span>${DOW[i][0]}</span><span class="dn">${pkey(k).getDate()}</span><span class="pips"></span></div>`); continue; }
      const sd = dp.sessions.map(s => !!(s.kind === 'test' ? testDone(s.testKey) : sessionDone(s.key)));
      tot += sd.length; done += sd.filter(Boolean).length;
      const all = sd.length && sd.every(Boolean);
      days.push(`<button class="day tap ${k === t ? 'today' : ''} ${all ? 'done' : ''}" data-a="daySheet" data-day="${k}"><span>${DOW[i][0]}</span><span class="dn">${pkey(k).getDate()}</span><span class="pips">${dp.sessions.map(s => `<i class="c-${s.color}"></i>`).join('')}</span></button>`);
    }
    const cur = t >= m.start && t <= m.end;
    h += `<div class="card week ${cur ? 'cur' : ''}" ${cur ? 'id="curweek"' : ''}><div class="row between"><div><div class="wt">Week ${m.wk} <span class="muted small" style="font-weight:600">· ${fmtDate(m.start)}–${fmtDate(m.end)}</span></div><div class="row wrap" style="gap:5px;margin-top:6px"><span class="chip">${m.block.name}</span>${m.deload ? '<span class="chip deload">Deload</span>' : ''}${m.test ? '<span class="chip test">Test</span>' : ''}${m.finals ? '<span class="chip finals">Finals</span>' : ''}${cur ? '<span class="chip grad">Now</span>' : ''}</div></div><div style="text-align:right"><div style="font-weight:800;font-size:18px">${done}/${tot}</div><div class="xs dim">sessions</div></div></div>${m.note ? `<div class="small muted" style="margin-top:8px">${esc(m.note)}</div>` : ''}<div class="days">${days.join('')}</div><div class="pbar"><i style="width:${tot ? done / tot * 100 : 0}%"></i></div></div>`;
  });
  h += `<div class="legend" style="justify-content:center;margin-bottom:10px">${[['lift', 'Upper'], ['lower', 'Lower'], ['run', 'Run'], ['swim', 'Swim'], ['bike', 'Bike'], ['hockey', 'Hockey'], ['test', 'Test']].map(x => `<span><i class="c-${x[0]}" style="width:8px;height:8px;border-radius:50%"></i>${x[1]}</span>`).join('')}</div>`;
  return h;
}
function daySheet(k) {
  const dp = dayPlan(k); if (!dp) return;
  let h = `<div class="small muted">Week ${dp.wk} · Block ${dp.block.n} ${dp.block.name}</div><h3>${fmtLong(k)}</h3><div class="row wrap" style="gap:6px;margin:8px 0 14px">${dp.meta.deload ? '<span class="chip deload">Deload</span>' : ''}${dp.meta.test ? '<span class="chip test">Test week</span>' : ''}${dp.meta.finals ? '<span class="chip finals">Finals</span>' : ''}${k === today() ? '<span class="chip grad">Today</span>' : ''}</div>`;
  dp.sessions.forEach((s, i) => { h += `<div class="card"><div class="row between"><div style="font-size:18px;font-weight:750">${esc(s.title)}</div><span class="small muted">~${s.min}′</span></div><div class="small muted" style="margin:4px 0 8px">${esc(s.sub)}</div><div class="exlist">${sessionLines(s, modOf(dp))}</div>${sessionButton(dp, s, i)}</div>`; });
  h += `<div class="small dim" style="margin-top:4px">+ Daily 10-min mobility</div>`;
  openSheet(h);
}

/* ======================= WORKOUT ======================= */
function incFor(ex) { const kg = wu() === 'kg'; const disp = ex.lw && !ex.db ? (kg ? 5 : 10) : (kg ? 2.5 : 5); return { lb: kg ? disp * 2.20462 : disp, label: ex.db && !kg ? '+2.5–5' : '+' + disp }; }
function suggest(e, mod) {
  const ex = EX[e.ex], hist = exHistory(e.ex), last = hist[hist.length - 1], [lo, hi] = e.reps;
  if (ex.kind === 'hold') { const best = last ? Math.max(...last.sets.map(s => s.r || 0)) : 0; const tgt = last ? Math.min(hi, best + 5) : lo; return { w: null, r: tgt, note: last ? `Last best ${best}s → aim <b>${tgt}s</b> per side` : `${lo}–${hi}s per side, controlled breathing` }; }
  if (ex.kind === 'power') return { w: last ? last.sets[0].w : null, r: lo, note: 'Max intent, full rest. Quality over fatigue — stop if a landing hurts.' };
  if (!last) return { w: ex.added ? 0 : null, r: null, note: `First time: work up to a set of ${hi} @ RPE 9 — that's your baseline.` };
  const ref = e.role === 'main' ? (last.sets.find(s => s.tag === 'Top') || last.sets[0]) : last.sets.reduce((a, s) => (s.w || 0) >= (a.w || 0) ? s : a, last.sets[0]);
  const allHit = last.sets.every(s => (s.r || 0) >= hi), inc = incFor(ex);
  let w = ref.w || 0, note, up = false;
  if (allHit) { w = roundLoad(w + inc.lb); up = true; note = `Hit ${hi} reps on every set last time → <b>${inc.label} ${wu()}</b>`; }
  else note = `Last: <b>${U.wOut(ref.w)} ${wu()} × ${ref.r}</b> — beat it, aim for ${hi} reps on all sets`;
  if (mod === 'deload') { w = roundLoad(w * 0.9); note = 'Deload: ~10% lighter, crisp reps, leave 3 in the tank.'; }
  return { w, r: null, note, up, lastSets: last.sets };
}
function applySuggest(e, mod) {
  const sg = suggest(e, mod); e.note = sg.note;
  e.sets.forEach((s, i) => {
    if (s.done) return;
    s.w = sg.w == null ? null : (s.tag === 'Back-off' ? roundLoad(sg.w * 0.9) : sg.w);
    const prev = sg.lastSets && sg.lastSets[i];
    s.r = sg.r != null ? sg.r : (prev && !sg.up ? prev.r : null);
  });
}
function makeEx(slot, mod) {
  const exId = S.swapPrefs[slot.id] || slot.ex;
  const e = { slot: slot.id, ex: exId, role: slot.role, reps: slot.reps, ss: slot.ss || null, sets: buildSets(slot, mod).map(s => ({ ...s, w: null, r: null, rpe: null, done: false })) };
  applySuggest(e, mod); return e;
}
function startSession(k, i) {
  const dp = dayPlan(k); const s = dp.sessions[i];
  if (S.active && S.active.sessionKey === s.key) return openWorkout();
  if (S.active && !confirm('You have a workout in progress. Discard it and start this one?')) return;
  const w = { id: uid(), date: k, sessionKey: s.key, title: s.title, kind: s.kind, color: s.color, wk: dp.wk, mod: s.mod || 'normal', startedAt: Date.now(), exercises: [], cardio: null, checklist: [] };
  if (s.kind === 'lift') { const t = TEMPLATES[s.tpl]; w.exercises = t.slots.map(sl => makeEx(sl, s.mod)); if (t.finisher) w.cardio = { ...t.finisher, dur: null, dist: null, rpe: null, knee: null, notes: '' }; }
  if (s.kind === 'cardio') { const c = s.cardio; w.cardio = { mode: c.mode, title: c.title, steps: c.steps, min: c.min, planDist: c.dist || null, dur: null, dist: null, rpe: null, knee: null, notes: '' }; w.checklist = (c.checklist || []).map(l => ({ label: l, done: false })); }
  S.active = w; save(); closeSheet(); haptic(15); openWorkout();
}
function openWorkout() { closeSheet(); $('#workout').classList.remove('hidden'); document.body.style.overflow = 'hidden'; renderWorkout(); $('#workout').scrollTop = 0; startElapsed(); }
function closeWorkout() { $('#workout').classList.add('hidden'); $('#workout').innerHTML = ''; document.body.style.overflow = ''; stopTimer(); clearInterval(elT); }
let elT; function startElapsed() { clearInterval(elT); elT = setInterval(() => { const el = $('#wk-el'); if (el && S.active) el.textContent = fmtTime((Date.now() - S.active.startedAt) / 1000); }, 1000); }
function wkProgress(w) { let tot = 0, d = 0; w.exercises.forEach(e => e.sets.forEach(s => { tot++; if (s.done) d++; })); if (w.cardio) { tot++; if (w.cardio.dur) d++; } w.checklist.forEach(c => { tot++; if (c.done) d++; }); return tot ? d / tot : 0; }
function renderWorkout() {
  const w = S.active; if (!w) return closeWorkout();
  let h = `<div class="wk-top"><button class="icon-btn tap" data-a="minimize" aria-label="Minimize"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button><div><div class="tt">${esc(w.title)}</div><div class="el" id="wk-el">${fmtTime((Date.now() - w.startedAt) / 1000)}</div></div><button class="icon-btn tap" data-a="discard" aria-label="Discard workout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div><div class="wk-body"><div class="wk-progress"><i id="wk-prog" style="width:${wkProgress(w) * 100}%"></i></div>`;
  if (w.mod === 'deload') h += `<div class="tip info"><div class="ic">🌊</div><div>Deload week: top sets at RPE 7, fewer sets. Recover & absorb.</div></div>`;
  if (w.mod === 'reduced') h += `<div class="tip info"><div class="ic">📚</div><div>Finals week: keep the top sets heavy, fewer back-offs. In and out.</div></div>`;
  if (w.exercises.length) h += `<div class="small dim" style="margin:0 2px 12px">Double progression: hit the top of the range on all sets → add weight next time. Tap ⇄ to swap if a knee complains (≥3/10).</div>`;
  w.exercises.forEach((e, ei) => {
    const ex = EX[e.ex], all = e.sets.every(s => s.done), next = w.exercises[ei + 1];
    const isHold = ex.kind === 'hold', isPow = ex.kind === 'power', bj = e.ex === 'broad_jump';
    const pres = e.role === 'main' ? `Top set + back-offs · ${e.reps[0]}–${e.reps[1]} reps` : isPow ? `${e.sets.length} × ${e.reps[0]} explosive` : isHold ? `${e.sets.length} × ${e.reps[0]}–${e.reps[1]} s/side` : `${e.sets.length} hard set${e.sets.length > 1 ? 's' : ''} · ${e.reps[0]}–${e.reps[1]} reps`;
    h += `<div class="card excard ${all ? 'complete' : ''}" id="ex-${ei}">${e.ss ? `<div class="ss-tag" style="margin-bottom:6px">${e.ss} ${next && next.ss === e.ss ? 'A · then straight to B' : 'B'}</div>` : ''}<div class="exh"><div class="exthumb ${e.role === 'main' ? 'main' : ''}">${all ? '✓' : ei + 1}</div><div class="grow"><div class="exn">${esc(ex.n)}</div><div class="ext">${pres} · ${ex.m}${ex.kf ? ' · <span style="color:var(--ok)">knee-friendly</span>' : ''}</div></div><button class="icon-btn tap" data-a="swap" data-ei="${ei}" aria-label="Swap exercise" title="Swap">⇄</button></div><div class="small dim" style="margin-top:8px">${esc(ex.cue)}</div>${e.note ? `<div class="sugg">💡 <span>${e.note}</span></div>` : ''}<div class="sets"><div class="sethead"><span>Set</span><span style="text-align:center">${isHold ? '—' : bj ? 'Dist in' : (ex.added ? '+' : '') + wu()}</span><span style="text-align:center">${isHold ? 'Sec' : 'Reps'}</span><span style="text-align:center">RPE</span><span></span></div>`;
    e.sets.forEach((s, si) => {
      const wv = bj ? (s.w ?? '') : U.wOut(s.w);
      h += `<div class="setrow ${s.done ? 'done' : ''}"><div class="tg">${s.tag === 'Back-off' ? 'Back-off' : s.tag === 'Top' ? 'Top set' : 'Set ' + (si + 1)}<small>${s.rpeT === 'Max intent' ? 'max' : '@' + s.rpeT}</small></div><input class="inp" type="number" inputmode="decimal" step="any" data-f="w" data-ei="${ei}" data-si="${si}" value="${wv}" placeholder="${isHold ? '—' : '0'}" ${isHold ? 'disabled' : ''} aria-label="Load"><input class="inp" type="number" inputmode="numeric" data-f="r" data-ei="${ei}" data-si="${si}" value="${s.r ?? ''}" placeholder="${e.reps[0]}–${e.reps[1]}" aria-label="Reps"><input class="inp" type="number" inputmode="decimal" step="0.5" min="1" max="10" data-f="rpe" data-ei="${ei}" data-si="${si}" value="${s.rpe ?? ''}" placeholder="${String(s.rpeT).replace('Max intent', '—').split('–')[0]}" aria-label="RPE"><button class="chk tap" data-a="setDone" data-ei="${ei}" data-si="${si}" aria-label="Complete set">${CHECK}</button></div>`;
    });
    h += `</div><div class="exfoot"><button class="tap" data-a="addSet" data-ei="${ei}">+ Set</button>${e.sets.length > 1 ? `<button class="tap" data-a="rmSet" data-ei="${ei}">− Set</button>` : ''}<button class="tap" data-a="history" data-ex="${e.ex}">History</button></div></div>`;
  });
  if (w.cardio) h += cardioCard(w);
  if (w.checklist.length) h += `<div class="card"><div style="font-weight:750;font-size:17px;margin-bottom:4px">Core + mobility</div>${w.checklist.map((c, i) => `<button class="checkrow ${c.done ? 'on' : ''}" data-a="chk" data-i="${i}"><span class="ck">${c.done ? CHECK.replace('<svg', '<svg width="14" height="14" style="color:#04110C"') : ''}</span><span>${esc(c.label)}</span></button>`).join('')}</div>`;
  h += `</div><div class="wk-bottom"><button class="btn tap" data-a="finish" id="finishBtn">Finish workout</button></div>`;
  $('#workout').innerHTML = h;
}
function cardioCard(w) {
  const c = w.cardio, sw = c.mode === 'swim', hk = c.mode === 'hockey';
  return `<div class="card"><div class="row between"><div class="row"><span class="dot c-${c.mode}"></span><div style="font-weight:750;font-size:17px">${esc(c.title)}</div></div>${c.min ? `<span class="chip">${c.min} min plan</span>` : ''}</div><div class="steps" style="margin-top:6px">${(c.steps || []).map(st => `<div class="step"><div class="bul c-${c.mode}"></div><div><b>${esc(st[0])}</b><span>${esc(st[1])}</span></div></div>`).join('')}</div>
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

function swapSheet(ei) {
  const e = S.active.exercises[ei], fam = altsFor(e.ex);
  openSheet(`<h3>Swap exercise</h3><div class="small muted" style="margin-bottom:14px">Knee irritated (≥3/10)? Pick a knee-friendly option. Same sets & reps.</div>${fam.map(id => { const x = EX[id]; return `<button class="opt tap ${id === e.ex ? 'cur' : ''}" data-a="doSwap" data-ei="${ei}" data-ex="${id}"><div class="grow"><div style="font-weight:700">${esc(x.n)} ${x.kf ? '<span class="chip ok" style="font-size:9px;padding:2px 6px">Knee-friendly</span>' : ''}</div><div class="small muted" style="margin-top:3px">${esc(x.eq)} · ${esc(x.cue)}</div></div>${id === e.ex ? '<span class="chip grad">Current</span>' : ''}</button>`; }).join('')}<label class="row small muted" style="margin-top:10px"><input type="checkbox" id="swapRemember" checked style="width:18px;height:18px;accent-color:#FF2E63"> Use this swap in future sessions</label>`);
}
function historySheet(exId) {
  const hst = exHistory(exId).slice(-8).reverse();
  openSheet(`<h3>${esc(EX[exId].n)}</h3><div class="small muted" style="margin-bottom:12px">Recent sessions · best est. 1RM (Epley)</div>${hst.length ? hst.map(x => `<div class="card flat" style="padding:12px"><div class="row between"><b>${fmtDate(x.date)}</b><span class="small muted">e1RM ${U.wOut(x.best, 0)} ${wu()}</span></div><div class="small muted" style="margin-top:4px">${x.sets.map(s => `${EX[exId].added && !s.w ? 'BW' : U.wOut(s.w)}×${s.r}${s.rpe ? ' @' + s.rpe : ''}`).join(' · ')}</div></div>`).join('') : '<div class="empty">No history yet — this session sets the baseline.</div>'}`);
}
function finishWorkout() {
  const w = S.active; if (!w) return;
  const doneSets = w.exercises.flatMap(e => e.sets.filter(s => s.done).map(s => ({ s, e })));
  if (!doneSets.length && !(w.cardio && w.cardio.dur) && !w.checklist.some(c => c.done)) { if (!confirm('Nothing logged yet. Finish anyway?')) return; }
  if (w.kind === 'cardio' && w.cardio && w.cardio.dur == null) w.cardio.dur = w.cardio.min || null; // assume plan done if left blank
  const prs = [];
  w.exercises.forEach(e => {
    const ex = EX[e.ex]; if (ex.kind !== 'w') return;
    const d = e.sets.filter(s => s.done && s.r); if (!d.length) return;
    const hist = exHistory(e.ex); if (!hist.length) return;
    const prevBest = Math.max(...hist.map(h => h.best)), prevW = Math.max(...hist.flatMap(h => h.sets.map(s => s.w || 0)));
    const prevReps0 = Math.max(...hist.flatMap(h => h.sets.filter(s => !s.w).map(s => s.r || 0)), 0);
    const best = d.reduce((a, s) => e1rm(s.w, s.r) > e1rm(a.w, a.r) ? s : a, d[0]);
    const mw = Math.max(...d.map(s => s.w || 0));
    if (e1rm(best.w, best.r) > prevBest + 0.01) prs.push({ ex: ex.n, txt: `${U.wOut(best.w)} ${wu()} × ${best.r} · e1RM ${U.wOut(e1rm(best.w, best.r), 0)} ${wu()}`, type: 'e1RM' });
    else if (mw > prevW) prs.push({ ex: ex.n, txt: `Heaviest: ${U.wOut(mw)} ${wu()}`, type: 'Weight' });
    else if (!mw && prevBest === 0 && Math.max(...d.map(s => s.r)) > prevReps0) prs.push({ ex: ex.n, txt: `${Math.max(...d.map(s => s.r))} reps`, type: 'Reps' });
  });
  const vol = doneSets.reduce((a, x) => a + (EX[x.e.ex].kind === 'w' ? (x.s.w || 0) * (x.s.r || 0) : 0), 0);
  w.endedAt = Date.now();
  const baseline = w.exercises.length > 0 && w.exercises.every(e => !S.workouts.some(o => (o.exercises || []).some(x => x.ex === e.ex && x.sets.some(st => st.done))));
  w.summary = { baseline, durMin: Math.max(1, Math.round((w.endedAt - w.startedAt) / 60000)), volume: vol, sets: doneSets.length, prs };
  if (w.cardio && w.cardio.knee != null) { const b = S.body[w.date] = S.body[w.date] || {}; b.knee = Math.max(b.knee ?? 0, w.cardio.knee); }
  S.workouts.push(w); S.active = null; save(); stopTimer(); clearInterval(elT);
  showSummary(w, true);
}
function showSummary(w, fresh) {
  const sm = w.summary || {}, c = w.cardio;
  let h = `<div class="wk-top"><span style="width:38px"></span><div class="tt">Summary</div><button class="icon-btn tap" data-a="closeSummary" aria-label="Close">✕</button></div><div class="wk-body"><div class="sum-hero"><div class="trophy">${sm.prs && sm.prs.length ? '🏆' : '💪'}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">${fresh ? 'Workout complete!' : esc(w.title)}</div><div class="muted" style="margin-top:4px">${esc(w.title)} · ${fmtLong(w.date)}</div></div><div class="grid3" style="margin:16px 0">`;
  h += `<div class="stat"><b>${sm.durMin || 0}</b><span>minutes</span></div>`;
  if (w.exercises.length) h += `<div class="stat"><b>${fmtNum(U.wOut(sm.volume || 0, 0))}</b><span>${wu()} volume</span></div><div class="stat"><b>${sm.sets || 0}</b><span>sets</span></div>`;
  else h += `<div class="stat"><b>${c && c.dist ? (c.mode === 'swim' ? U.sOut(c.dist) : U.dOut(c.dist)) : '—'}</b><span>${c && c.mode === 'swim' ? su() : du()}</span></div><div class="stat"><b>${c && c.rpe ? c.rpe : '—'}</b><span>RPE</span></div>`;
  h += `</div>`;
  if (sm.prs && sm.prs.length) h += `<h2 class="sec">Personal records</h2>${sm.prs.map(p => `<div class="pr">🏆 <div class="grow"><b>${esc(p.ex)}</b><div class="small muted">${esc(p.txt)}</div></div><span class="chip test">${p.type}</span></div>`).join('')}`;
  else if (w.exercises.length && fresh) h += sm.baseline ? `<div class="tip good"><div class="ic">🎯</div><div>Baseline set! Every lift today is your benchmark — next session's loads are auto-suggested with double progression.</div></div>` : `<div class="tip info"><div class="ic">📈</div><div>No PRs this time — next session's suggested loads are already updated from today.</div></div>`;
  if (w.exercises.length) h += `<h2 class="sec">Exercises</h2><div class="card">${w.exercises.map(e => { const x = EX[e.ex], d = e.sets.filter(s => s.done); const fmt = s => x.kind === 'hold' ? `${s.r}s` : x.added && !s.w ? `BW×${s.r}` : x.kind === 'power' ? `${s.w ? s.w + (e.ex === 'broad_jump' ? '″' : '') + ' · ' : ''}${s.r} reps` : `${U.wOut(s.w)}×${s.r}`; return `<div class="exrow"><div class="grow"><div class="nm">${esc(x.n)}</div><div class="small muted">${d.length ? d.map(fmt).join(' · ') : 'skipped'}</div></div></div>`; }).join('')}</div>`;
  if (c && (c.dur || c.dist)) h += `<div class="card"><div class="row between"><b>${esc(c.title)}</b><span class="chip">${c.dur || 0} min</span></div><div class="small muted" style="margin-top:6px">${c.dist ? (c.mode === 'swim' ? U.sOut(c.dist) + ' ' + su() : U.dOut(c.dist) + ' ' + du()) + ' · ' : ''}${c.rpe ? 'RPE ' + c.rpe + ' · ' : ''}${c.knee != null ? 'Knee ' + c.knee + '/10' : ''}</div></div>`;
  if (c && c.knee >= 3) h += `<div class="tip bad"><div class="ic">🛑</div><div>Knee pain ${c.knee}/10 — next session, swap impact work for bike/swim and use knee-friendly lower options.</div></div>`;
  h += `</div><div class="wk-bottom"><button class="btn tap" data-a="closeSummary">Done</button></div>`;
  $('#workout').classList.remove('hidden'); document.body.style.overflow = 'hidden';
  $('#workout').innerHTML = h; $('#workout').scrollTop = 0; $('#toast').classList.remove('show');
  if (fresh) { confetti(); haptic([20, 40, 20]); }
}

/* ======================= PROGRESS ======================= */
const xT = k => diffDays(PLAN_START, k);
const monthTicks = [{ x: xT('2026-10-05'), label: 'Oct 5' }, { x: xT('2026-11-01'), label: 'Nov 1' }, { x: xT('2026-12-01'), label: 'Dec 1' }, { x: xT('2026-12-31'), label: 'Dec 31' }];
function weekAgg() {
  const t = today();
  return WEEKS.map(m => {
    const r = { wk: m.wk, run: 0, swim: 0, bike: 0, hockey: 0, prun: 0, pswim: 0, pbike: 0, phockey: 0, hab: 0, habN: 0 };
    for (let i = 0; i < 7; i++) {
      const k = addDays(m.start, i); if (k > PLAN_END) break; const dp = dayPlan(k);
      dp.sessions.forEach(s => { if (s.kind === 'cardio') { const c = s.cardio; if (c.mode === 'swim') r.pswim += c.dist || 0; else r['p' + c.mode] += c.min || 0; } if (s.kind === 'lift' && TEMPLATES[s.tpl].finisher) r.pbike += 15; });
      if (k <= t) { r.hab += habitPct(k); r.habN++; }
    }
    S.workouts.filter(w => w.date >= m.start && w.date <= m.end && w.cardio).forEach(w => { const c = w.cardio; if (c.mode === 'swim') r.swim += c.dist || 0; else if (r[c.mode] != null) r[c.mode] += +c.dur || 0; });
    return r;
  });
}
function viewProgress() {
  const t = today(), ws = weights(), r7 = rolling7(), pj = projection(), goal = S.settings.goalWeight;
  let h = `<div class="hdr"><div><div class="eyebrow">Goal ${U.wOut(goal)} ${wu()} by Dec 31</div><h1>Progress</h1></div><div class="avatar">${esc((S.settings.name || 'C')[0])}</div></div>`;
  const cur = r7.length ? r7[r7.length - 1].v : null, start = S.settings.startWeight;
  h += `<div class="card"><div class="row between"><div><div class="small muted">Weight · 7-day avg</div><div class="kpi">${cur ? U.wOut(cur) : '—'}<small>${wu()}</small></div></div><div style="text-align:right">${cur ? `<div class="delta ${cur <= start ? 'good' : 'bad'}">${cur <= start ? '▼' : '▲'} ${U.wOut(Math.abs(start - cur))} ${wu()} from ${U.wOut(start)}</div><div class="small muted">${cur > goal ? U.wOut(cur - goal) + ' ' + wu() + ' to go' : 'Goal reached 🎉'}</div>` : '<div class="small muted">Log weight on Today</div>'}</div></div>`;
  const series = [{ pts: r7.map(p => ({ x: xT(p.k), y: U.wOut(p.v) })), color: '#FF2E63', width: 3, dots: false }, { pts: ws.map(p => ({ x: xT(p.k), y: U.wOut(p.v) })), color: '#FF9A6B', line: false, area: false, r: 2.6, dotOpacity: .6 }];
  const xMax = xT(PLAN_END) + 3;
  if (pj && pj.date && cur) { const endX = Math.min(xT(pj.date), xMax); series.push({ pts: [{ x: xT(pj.last), y: U.wOut(cur) }, { x: endX, y: U.wOut(cur + pj.slope * (endX - xT(pj.last))) }], color: '#FFC145', dash: '5 5', width: 2, dots: false, area: false }); }
  h += `<div style="margin-top:12px">${Charts.line({ series, hlines: [{ y: U.wOut(goal), label: 'Goal ' + U.wOut(goal), color: '#2EE6A6' }], xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Log your weight on the Today tab to see the trend.' })}</div><div class="legend"><span><i style="background:#FF2E63"></i>7-day avg</span><span><i style="background:#FF9A6B;height:6px;width:6px;border-radius:50%"></i>Daily</span><span><i style="background:#2EE6A6"></i>Goal</span><span><i style="background:#FFC145"></i>Projection</span></div>`;
  if (pj) {
    const weeksLeft = Math.max(0.5, diffDays(t, PLAN_END) / 7), need = cur ? Math.max(0, (cur - goal) / weeksLeft) : 0;
    const ok = pj.reached || (pj.date && pj.date <= PLAN_END);
    h += `<div class="tip ${ok ? 'good' : 'info'}" id="projection" style="margin:12px 0 0"><div class="ic">📈</div><div>${pj.reached ? 'Goal weight reached — shift to maintenance or a slow recomp.' : pj.date ? `At ${U.wOut(Math.abs(pj.perWeek), 2)} ${wu()}/wk you'll hit <b>${U.wOut(goal)} ${wu()} on ${fmtDate(pj.date)}${pj.date.slice(0, 4) !== '2026' ? ', ' + pj.date.slice(0, 4) : ''}</b>${pj.date <= PLAN_END ? ' — ahead of Dec 31 ✅' : '.'}` : 'Trend is flat or rising — no projected date yet.'} ${pj.reached ? '' : `Needed pace: ${U.wOut(need, 2)} ${wu()}/wk.`}</div></div>`;
  } else h += `<div class="small dim" style="margin-top:10px">Projected goal date appears after ~4 weigh-ins.</div>`;
  h += `</div>`;
  const cs = calorieSuggestion();
  h += `<h2 class="sec">Calorie check <small>${fmtNum(S.settings.kcal)} kcal now</small></h2><div class="card" id="kcalcard">`;
  if (cs.status === 'need') h += `<div class="row"><div style="font-size:22px">🍽️</div><div class="small muted">Needs ≥3 weigh-ins in each of the last two 7-day windows to compare weekly averages.${cs.cur ? ` This week: ${cs.cur.n}.` : ''}</div></div>`;
  else h += `<div class="row between"><div><div class="small muted">Prior 7d → last 7d avg</div><div style="font-weight:800;font-size:20px">${U.wOut(cs.prev.v)} → ${U.wOut(cs.cur.v)} ${wu()}</div></div><span class="chip ${cs.status === 'hold' ? 'ok' : 'test'}">${cs.status === 'hold' ? 'Hold' : cs.status === 'down' ? '−150 kcal' : '+150 kcal'}</span></div><div class="small muted" style="margin:10px 0">${esc(cs.msg)}</div>${cs.status !== 'hold' ? `<button class="btn sm tap" data-a="applyKcal" data-v="${cs.to}">Apply ${fmtNum(cs.to)} kcal</button>` : ''}`;
  h += `<div class="xs dim" style="margin-top:10px">Rule: weekly avg drops &lt;0.5 lb → −150 kcal · &gt;1.5 lb → +150 kcal. Keep protein ≥${S.settings.protein} g.</div></div>`;
  const wa = Object.keys(S.body).filter(k => S.body[k].waist).sort().map(k => ({ x: xT(k), y: U.lOut(S.body[k].waist) }));
  TESTS.forEach(ts => { const v = S.tests[ts.key].waist; if (v && !wa.find(p => p.x === xT(ts.date))) wa.push({ x: xT(ts.date), y: U.lOut(v) }); });
  wa.sort((a, b) => a.x - b.x);
  h += `<h2 class="sec">Waist <small>${wa.length ? wa[wa.length - 1].y + ' ' + lu() : ''}</small></h2><div class="card">${Charts.line({ series: [{ pts: wa, color: '#3DA9FC', r: 3.5 }], xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Measure at the navel, morning, relaxed.' })}<div class="row" style="margin-top:12px"><input class="inp grow" id="waist-in" type="number" inputmode="decimal" step="0.1" placeholder="Waist today (${lu()})" value="${S.body[t] && S.body[t].waist ? U.lOut(S.body[t].waist) : ''}"><button class="btn sm tap" style="height:48px" data-a="saveWaist">Log</button></div></div>`;
  const lifts = ['incline_bench', 'weighted_pullup', 'flat_db_press', 'lat_pulldown', 'rdl', 'leg_press'];
  const short = { incline_bench: 'Incline', weighted_pullup: 'Pull-up', flat_db_press: 'DB Press', lat_pulldown: 'Pulldown', rdl: 'RDL', leg_press: 'Leg Press' };
  const lh = exHistory(UI.liftSel);
  h += `<h2 class="sec">Estimated 1RM <small>${lh.length ? 'Best ' + U.wOut(Math.max(...lh.map(x => x.best)), 0) + ' ' + wu() : ''}</small></h2><div class="card"><div class="seg" style="margin-bottom:12px">${lifts.map(l => `<button class="${UI.liftSel === l ? 'on' : ''}" data-a="liftSel" data-v="${l}">${short[l]}</button>`).join('')}</div>${Charts.line({ series: [{ pts: lh.map(x => ({ x: xT(x.date), y: U.wOut(x.best, 0) })), color: '#FF7A3D', r: 3.5 }], xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Finish a workout with this lift to chart e1RM (Epley).' })}${EX[UI.liftSel].added ? '<div class="xs dim" style="margin-top:6px">Pull-up e1RM uses added load.</div>' : ''}</div>`;
  const wa2 = weekAgg(), cur2 = WEEKS.findIndex(m => t >= m.start && t <= m.end), sel = UI.cardioSel;
  h += `<h2 class="sec">Cardio per week <small>${sel === 'swim' ? su() : 'min'} · ghost = plan</small></h2><div class="card"><div class="seg" style="margin-bottom:12px">${['run', 'swim', 'bike', 'hockey'].map(m => `<button class="${sel === m ? 'on' : ''}" data-a="cardioSel" data-v="${m}">${MODE_LABEL[m]}</button>`).join('')}</div>${Charts.bars({ id: 'cv', labels: wa2.map(r => 'W' + r.wk), values: wa2.map(r => sel === 'swim' ? U.sOut(r.swim) : r[sel]), ghost: wa2.map(r => sel === 'swim' ? U.sOut(r.pswim) : r['p' + sel]), color: { run: '#2EE6A6', swim: '#3DA9FC', bike: '#FFC145', hockey: '#B98CFF' }[sel], hi: cur2 })}</div>`;
  h += `<h2 class="sec">Habit completion</h2><div class="card">${Charts.bars({ id: 'hb', labels: wa2.map(r => 'W' + r.wk), values: wa2.map(r => r.habN ? r.hab / r.habN * 100 : 0), color: '#FF7A3D', color2: '#FF2E63', fmt: v => Math.round(v) + '%', hi: cur2 })}</div>`;
  const kn = Object.keys(S.body).filter(k => S.body[k].knee != null).sort().map(k => ({ x: xT(k), y: S.body[k].knee }));
  h += `<h2 class="sec">Knee pain</h2><div class="card">${Charts.line({ series: [{ pts: kn, color: '#FFC145', r: 3, area: false, width: 1.5 }], hlines: [{ y: 3, label: 'Swap ≥3', color: '#FF4D5E' }], yMin: 0, yMax: 10, xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Log knee pain daily on Today.' })}</div>`;
  h += `<h2 class="sec">Test days <button class="btn sm tap" data-a="testSheet" data-key="${currentTestKey()}">Enter results</button></h2><div class="card" style="overflow-x:auto"><table class="tests"><tr><th>Test</th>${TESTS.map(x => `<th>${x.short}</th>`).join('')}<th>Δ</th></tr>${TEST_FIELDS.map(f => { const vals = TESTS.map(x => testVal(x.key, f.id)); const nn = vals.filter(v => v != null); let dl = ''; if (nn.length >= 2) { const d = nn[nn.length - 1] - nn[0]; const good = f.better === 'down' ? d < 0 : d > 0; dl = `<span class="delta ${d === 0 ? '' : good ? 'good' : 'bad'}">${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtTest(f, Math.abs(d))}</span>`; } return `<tr><td>${f.label}</td>${vals.map(v => `<td>${v == null ? '<span class="dim">—</span>' : fmtTest(f, v)}</td>`).join('')}<td>${dl || '<span class="dim">—</span>'}</td></tr>`; }).join('')}</table><div class="xs dim" style="margin-top:8px">Weight auto-fills from that week's average weigh-ins.</div></div>`;
  return h;
}
function currentTestKey() { const t = today(); const up = TESTS.find(x => weekStart(x.date) <= t && t <= addDays(weekStart(x.date), 6)) || TESTS.find(x => x.date >= t) || TESTS[TESTS.length - 1]; return up.key; }
function testWeekAvg(key) { const ts = TESTS.find(x => x.key === key); const w0 = weekStart(ts.date); const vs = weights().filter(p => p.k >= w0 && p.k <= addDays(w0, 6)).map(p => p.v); return vs.length ? vs.reduce((a, b) => a + b) / vs.length : null; }
function testVal(key, f) { const v = (S.tests[key] || {})[f]; if (v != null && v !== '') return +v; if (f === 'weight') return testWeekAvg(key); return null; }
function fmtTest(f, v) { if (f.unit === 'time') return fmtTime(v); if (f.unit === 'w') return U.wOut(v); if (f.unit === 'len') return U.lOut(v) + (lu() === 'in' ? '″' : ''); return Math.round(v); }
function testSheet(key) {
  UI.testSel = key; const tv = S.tests[key] || {}, ts = TESTS.find(x => x.key === key), avg = testWeekAvg(key);
  openSheet(`<h3>Test results</h3><div class="small muted" style="margin-bottom:12px">Test fresh, after a warm-up. Stop anything ≥3/10 knee pain.</div><div class="seg" style="margin-bottom:14px">${TESTS.map(x => `<button class="${x.key === key ? 'on' : ''}" data-a="testSheet" data-key="${x.key}">${x.label}</button>`).join('')}</div><div class="grid2">
  <div class="field"><label>Avg weight (${wu()})</label><input class="inp" id="t-weight" type="number" inputmode="decimal" step="0.1" value="${tv.weight != null ? U.wOut(tv.weight) : ''}" placeholder="${avg ? 'auto ' + U.wOut(avg) : 'week avg'}"></div>
  <div class="field"><label>Waist (${lu()})</label><input class="inp" id="t-waist" type="number" inputmode="decimal" step="0.1" value="${tv.waist != null ? U.lOut(tv.waist) : ''}"></div>
  <div class="field"><label>1-mile (mm:ss)</label><input class="inp" id="t-mile" inputmode="numeric" placeholder="8:30" value="${tv.mile != null ? fmtTime(tv.mile) : ''}"></div>
  <div class="field"><label>100 yd swim (mm:ss)</label><input class="inp" id="t-swim100" inputmode="numeric" placeholder="2:30" value="${tv.swim100 != null ? fmtTime(tv.swim100) : ''}"></div>
  <div class="field"><label>Max strict pull-ups</label><input class="inp" id="t-pullups" type="number" inputmode="numeric" value="${tv.pullups ?? ''}"></div>
  <div class="field"><label>Broad jump (${lu()})</label><input class="inp" id="t-broad" type="number" inputmode="decimal" value="${tv.broad != null ? U.lOut(tv.broad) : ''}"></div></div>
  <div class="small dim" style="margin-top:10px">Test date: ${fmtLong(ts.date)}. Leave weight blank to use that week's average${avg ? ` (${U.wOut(avg)} ${wu()})` : ''}.</div><button class="btn tap" style="margin-top:16px" data-a="saveTests">Save results</button>`);
}

/* ======================= SETTINGS ======================= */
function viewSettings() {
  const st = S.settings, un = st.units;
  const seg = (name, opts) => `<div class="seg" style="width:140px">${opts.map(o => `<button class="${un[name] === o ? 'on' : ''}" data-a="unit" data-n="${name}" data-v="${o}">${o}</button>`).join('')}</div>`;
  const tog = n => `<input type="checkbox" data-tog="${n}" ${st[n] ? 'checked' : ''} style="width:22px;height:22px;accent-color:#FF2E63">`;
  let h = `<div class="hdr"><div><div class="eyebrow">Arnold Fit</div><h1>Settings</h1></div><div class="avatar">${esc((st.name || 'C')[0])}</div></div>`;
  h += `<h2 class="sec">Targets</h2><div class="card setlist"><div class="li"><span>Calories (kcal)</span><input class="inp" type="number" inputmode="numeric" data-set="kcal" value="${st.kcal}"></div><div class="li"><span>Protein (g/day)</span><input class="inp" type="number" inputmode="numeric" data-set="protein" value="${st.protein}"></div><div class="li"><span>Start weight (${wu()})</span><input class="inp" type="number" inputmode="decimal" data-set="startWeight" value="${U.wOut(st.startWeight)}"></div><div class="li"><span>Goal weight (${wu()})</span><input class="inp" type="number" inputmode="decimal" data-set="goalWeight" value="${U.wOut(st.goalWeight)}"></div><div class="li"><span>Name</span><input class="inp" data-set="name" value="${esc(st.name)}"></div></div>`;
  h += `<h2 class="sec">Units</h2><div class="card setlist"><div class="li"><span>Weight</span>${seg('w', ['lb', 'kg'])}</div><div class="li"><span>Run/bike distance</span>${seg('d', ['mi', 'km'])}</div><div class="li"><span>Swim distance</span>${seg('s', ['yd', 'm'])}</div><div class="li"><span>Body length</span>${seg('len', ['in', 'cm'])}</div></div>`;
  h += `<h2 class="sec">Workout</h2><div class="card setlist"><div class="li"><span>Rest · main lifts (s)</span><input class="inp" type="number" inputmode="numeric" data-rest="main" value="${st.rest.main}"></div><div class="li"><span>Rest · accessories (s)</span><input class="inp" type="number" inputmode="numeric" data-rest="acc" value="${st.rest.acc}"></div><div class="li"><span>Vibration</span>${tog('haptics')}</div><div class="li"><span>Timer sound</span>${tog('sound')}</div>${Object.keys(S.swapPrefs).length ? `<div class="li"><span>${Object.keys(S.swapPrefs).length} saved exercise swap(s)</span><button class="btn sm sec tap" data-a="clearSwaps">Clear</button></div>` : ''}</div>`;
  h += `<h2 class="sec">Habits</h2><div class="card">${st.habits.map((x, i) => `<div class="hab-edit"><input class="inp" style="width:58px;text-align:center" data-hab="ic" data-i="${i}" value="${esc(x.ic || '')}" maxlength="4" aria-label="Icon"><input class="inp grow" data-hab="label" data-i="${i}" value="${esc(x.label)}" aria-label="Habit name"><button class="icon-btn tap" style="height:44px;width:44px" data-a="rmHabit" data-i="${i}" aria-label="Delete habit">✕</button></div>`).join('')}<button class="btn sec sm tap" style="width:100%;margin-top:4px" data-a="addHabit">+ Add habit</button></div>`;
  h += `<h2 class="sec">Backup</h2><div class="card"><div class="small muted" style="margin-bottom:12px">All data lives on this device (localStorage). Export a JSON backup regularly — e.g. save it to Files/iCloud.</div><div class="grid2"><button class="btn sec tap" data-a="export">⬇︎ Export</button><button class="btn sec tap" data-a="import">⬆︎ Import</button></div><input type="file" id="importFile" accept="application/json,.json" class="hidden"><button class="btn danger tap" style="margin-top:10px" data-a="reset">Reset all data</button></div>`;
  h += `<h2 class="sec">Install</h2><div class="card small muted" style="line-height:1.5">iPhone: open in <b>Safari</b> → Share → <b>Add to Home Screen</b>. Android: Chrome ⋮ → <b>Install app</b>. Works offline after the first load.</div><div class="xs dim" style="text-align:center;margin:18px 0">Arnold Fit v1.0 · ${S.workouts.length} sessions logged</div>`;
  return h;
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'arnold-fit', version: 1, exported: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `arnold-fit-backup-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup exported ✓');
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => { try { const j = JSON.parse(rd.result); const d = j.data || j; if (!d || typeof d !== 'object' || !d.settings || !d.habitLog) throw new Error('not an Arnold Fit backup'); if (!confirm('Replace all current data with this backup?')) return; S = migrate(d); save(); render(); toast('Backup imported ✓'); } catch (e) { toast('Import failed: ' + e.message); } };
  rd.readAsText(file);
}

/* ======================= events ======================= */
function goTab(tab) { UI.tab = tab; render(); window.scrollTo(0, 0); if (tab === 'plan') { const c = $('#curweek'); if (c) setTimeout(() => c.scrollIntoView({ block: 'center' }), 30); } }
document.addEventListener('click', ev => {
  const tb = ev.target.closest('#tabbar button'); if (tb) { haptic(); goTab(tb.dataset.tab); return; }
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, k = today(), w = S.active;
  const d = el.dataset;
  switch (a) {
    case 'closeSheet': closeSheet(); break;
    case 'habit': { const l = S.habitLog[k] = S.habitLog[k] || {}; if (l[d.id]) delete l[d.id]; else l[d.id] = true; save(); haptic(l[d.id] ? 12 : 6); rerenderKeep(); if (l[d.id] && habitPct(k) === 1) { toast('All habits done 🔥'); confetti(); } break; }
    case 'addProt': { const i = $('#q-protein'); i.value = (+i.value || 0) + +d.v; haptic(); break; }
    case 'knee': { const b = S.body[k] = S.body[k] || {}; b.knee = +d.v; save(); haptic(); rerenderKeep(); break; }
    case 'saveQuick': {
      const b = S.body[k] = S.body[k] || {}; const wv = $('#q-weight').value, pv = $('#q-protein').value;
      if (wv !== '') { const lb = U.wIn(wv); if (!(lb >= 80 && lb <= 500)) { toast('Check that weight'); return; } b.weight = +lb.toFixed(2); (S.habitLog[k] = S.habitLog[k] || {}).weigh = true; }
      if (pv !== '') { b.protein = Math.max(0, Math.round(+pv)); if (b.protein >= S.settings.protein) (S.habitLog[k] = S.habitLog[k] || {}).protein = true; }
      save(); haptic(15); toast('Logged ✓'); rerenderKeep(); break;
    }
    case 'start': startSession(d.day, +d.i); break;
    case 'resume': openWorkout(); break;
    case 'daySheet': daySheet(d.day); break;
    case 'minimize': closeWorkout(); render(); toast('Workout saved — tap Resume anytime'); break;
    case 'discard': if (confirm('Discard this workout? Logged sets will be lost.')) { S.active = null; save(); closeWorkout(); render(); toast('Workout discarded'); } break;
    case 'setDone': {
      const e = w.exercises[+d.ei], s = e.sets[+d.si], ex = EX[e.ex];
      if (!s.done) {
        const focus = f => { const ip = document.querySelector(`[data-f="${f}"][data-ei="${d.ei}"][data-si="${d.si}"]`); if (ip) ip.focus(); };
        if (s.r == null) { focus('r'); toast(ex.kind === 'hold' ? 'Enter seconds first' : 'Enter reps first'); return; }
        if (ex.kind === 'w' && s.w == null && !ex.added) { focus('w'); toast('Enter the load first'); return; }
        if (ex.added && s.w == null) s.w = 0;
        s.done = true; haptic(18);
        if (s.tag === 'Top' && s.w) e.sets.forEach(o => { if (o.tag === 'Back-off' && !o.done) o.w = roundLoad(s.w * 0.9); });
        const nx = w.exercises[+d.ei + 1], nextSS = e.ss && nx && nx.ss === e.ss;
        const rest = nextSS ? 20 : e.role === 'main' ? S.settings.rest.main : ex.kind === 'power' ? 120 : ex.kind === 'hold' ? 60 : S.settings.rest.acc;
        startRest(rest);
        if (e.sets.every(x => x.done)) toast(nextSS ? 'Superset → straight to B' : `${ex.n} ✓`);
      } else { s.done = false; haptic(); }
      save(); rerenderWk(); break;
    }
    case 'addSet': { const e = w.exercises[+d.ei], l = e.sets[e.sets.length - 1]; e.sets.push({ tag: l.tag === 'Top' ? 'Back-off' : l.tag, rpeT: l.tag === 'Top' ? '8–9' : l.rpeT, w: l.w, r: null, rpe: null, done: false }); save(); haptic(); rerenderWk(); break; }
    case 'rmSet': { const e = w.exercises[+d.ei]; if (e.sets.length > 1) e.sets.pop(); save(); haptic(); rerenderWk(); break; }
    case 'swap': swapSheet(+d.ei); break;
    case 'doSwap': {
      const e = w.exercises[+d.ei], id = d.ex, rem = $('#swapRemember') && $('#swapRemember').checked;
      e.ex = id; e.sets.forEach(s => { if (!s.done) { s.w = null; s.r = null; } }); applySuggest(e, w.mod);
      const slot = Object.values(TEMPLATES).flatMap(t => t.slots).find(s => s.id === e.slot);
      if (rem) { if (slot && slot.ex === id) delete S.swapPrefs[e.slot]; else S.swapPrefs[e.slot] = id; }
      save(); closeSheet(); haptic(15); rerenderWk(); toast('Swapped → ' + EX[id].n); break;
    }
    case 'history': historySheet(d.ex); break;
    case 'crpe': w.cardio.rpe = +d.v; save(); haptic(); rerenderWk(); break;
    case 'cknee': w.cardio.knee = +d.v; save(); haptic(); rerenderWk(); break;
    case 'chk': w.checklist[+d.i].done = !w.checklist[+d.i].done; save(); haptic(10); rerenderWk(); break;
    case 'finish': finishWorkout(); break;
    case 'restAdj': T.end += +d.v * 1000; T.total = Math.max(T.total, (T.end - Date.now()) / 1000); haptic(); tickRest(); break;
    case 'restSkip': stopTimer(); haptic(); break;
    case 'closeSummary': closeWorkout(); goTab('today'); break;
    case 'viewSummary': { const x = S.workouts.find(z => z.id === d.id); closeSheet(); if (x) showSummary(x, false); break; }
    case 'testSheet': testSheet(d.key); break;
    case 'saveTests': {
      const key = UI.testSel, tv = {}; const g = id => $('#t-' + id).value.trim();
      if (g('weight')) tv.weight = U.wIn(g('weight')); if (g('waist')) tv.waist = U.lIn(g('waist'));
      if (g('mile')) { const s = parseTime(g('mile')); if (s == null) return toast('Mile time as mm:ss'); tv.mile = s; }
      if (g('swim100')) { const s = parseTime(g('swim100')); if (s == null) return toast('Swim time as mm:ss'); tv.swim100 = s; }
      if (g('pullups')) tv.pullups = +g('pullups'); if (g('broad')) tv.broad = U.lIn(g('broad'));
      S.tests[key] = tv; save(); closeSheet(); haptic(15); toast('Test results saved ✓'); rerenderKeep(); break;
    }
    case 'applyKcal': S.kcalLog.push({ date: k, from: S.settings.kcal, to: +d.v }); S.settings.kcal = +d.v; save(); haptic(15); toast('Target → ' + fmtNum(S.settings.kcal) + ' kcal'); rerenderKeep(); break;
    case 'saveWaist': { const v = $('#waist-in').value; if (!v) return toast('Enter waist first'); (S.body[k] = S.body[k] || {}).waist = +U.lIn(v).toFixed(2); save(); haptic(15); toast('Waist logged ✓'); rerenderKeep(); break; }
    case 'liftSel': UI.liftSel = d.v; haptic(); rerenderKeep(); break;
    case 'cardioSel': UI.cardioSel = d.v; haptic(); rerenderKeep(); break;
    case 'unit': S.settings.units[d.n] = d.v; save(); haptic(); rerenderKeep(); break;
    case 'rmHabit': { const hb = S.settings.habits[+d.i]; if (confirm(`Remove “${hb.label}”?`)) { S.settings.habits.splice(+d.i, 1); save(); rerenderKeep(); } break; }
    case 'addHabit': S.settings.habits.push({ id: 'h' + uid(), label: 'New habit', ic: '✅' }); save(); rerenderKeep(); setTimeout(() => { const ins = document.querySelectorAll('[data-hab="label"]'); const l = ins[ins.length - 1]; l.focus(); l.select(); }, 50); break;
    case 'clearSwaps': S.swapPrefs = {}; save(); rerenderKeep(); toast('Swaps cleared'); break;
    case 'export': exportData(); break;
    case 'import': $('#importFile').click(); break;
    case 'reset': if (confirm('Erase ALL Arnold Fit data on this device?') && confirm('Really? Export a backup first if unsure.')) { localStorage.removeItem(STORE_KEY); S = defaultState(); save(); render(); toast('All data reset'); } break;
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, w = S.active;
  if (t.dataset.f && w) {
    const e = w.exercises[+t.dataset.ei], s = e.sets[+t.dataset.si], v = t.value;
    if (t.dataset.f === 'w') s.w = v === '' ? null : (e.ex === 'broad_jump' ? +v : U.wIn(v));
    else s[t.dataset.f] = v === '' ? null : +v;
    save();
  } else if (t.dataset.cf && w) {
    const c = w.cardio, f = t.dataset.cf, v = t.value;
    if (f === 'notes') c.notes = v; else if (f === 'dur') c.dur = v === '' ? null : +v; else if (f === 'dist') c.dist = v === '' ? null : (c.mode === 'swim' ? U.sIn(v) : U.dIn(v));
    save(); const p = $('#wk-prog'); if (p) p.style.width = wkProgress(w) * 100 + '%';
  }
});
document.addEventListener('change', ev => {
  const t = ev.target, st = S.settings;
  if (t.id === 'importFile' && t.files[0]) { importData(t.files[0]); t.value = ''; return; }
  if (t.dataset.set) { const n = t.dataset.set; if (n === 'name') st.name = t.value.trim() || 'Christopher'; else if (n === 'startWeight' || n === 'goalWeight') st[n] = U.wIn(t.value) || st[n]; else st[n] = +t.value || st[n]; save(); toast('Saved ✓'); }
  if (t.dataset.rest) { st.rest[t.dataset.rest] = Math.max(10, +t.value || 90); save(); toast('Saved ✓'); }
  if (t.dataset.tog) { st[t.dataset.tog] = t.checked; save(); }
  if (t.dataset.hab) { const hb = st.habits[+t.dataset.i]; hb[t.dataset.hab] = t.value.trim() || hb[t.dataset.hab]; save(); toast('Habit updated ✓'); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });

/* ======================= boot ======================= */
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW register failed', e)));
}
