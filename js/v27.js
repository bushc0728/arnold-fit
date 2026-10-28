/* =====================================================================================
   v2.7 — simplification pass, built around the workout
   "I feel like there's too much in my app." + "Workout is the most important thing to track."
   Every screen does one job. Nothing is deleted: secondary features move under More / Progress.
   ===================================================================================== */
'use strict';
const NAV27 = ['today', 'food', 'progress', 'more'];
const MORE_SUB = new Set(['train', 'fuel', 'settings', 'history', 'habits', 'guide']);
function v27() { S.v27 = S.v27 || {}; S.v27.recapSeen = S.v27.recapSeen || {}; return S.v27; }

/* ---------- header: title + one optional action; back arrow on More sub-pages ---------- */
hdr = function (eyebrow, title, extra = '') {
  UI.title = title; const sub = MORE_SUB.has(UI.tab);
  return `<div class="hdr hdr27">${sub ? `<button class="icon-btn round tap back27" data-a="goTab" data-tab="more" aria-label="Back to More">‹</button>` : ''}<div class="grow"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="row" style="gap:8px">${extra}</div></div>`;
};
const _render26 = render;
render = function () { _render26.apply(this, arguments); const cur = NAV27.includes(UI.tab) ? UI.tab : 'more'; $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === cur)); };

/* ---------- formatting helpers ---------- */
function fmtSet27(exId, s) {
  const ex = EX[exId]; if (!s) return '';
  if (ex.kind === 'hold') return `${s.r}s`;
  if (ex.kind === 'power') return `${s.r} reps`;
  if (s.r == null) return '';
  if (s.w == null || s.w === '') return EX[exId].added ? `BW×${s.r}` : '';
  if (ex.added) return s.w ? `+${U.wOut(s.w)}×${s.r}` : `BW×${s.r}`;
  return `${U.wOut(s.w)}×${s.r}`;
}
function topOf27(e) { const d = e.sets.filter(s => s.done && s.r); if (!d.length) return null; return d.find(s => s.tag === 'Top') || d.reduce((a, s) => ((s.w || 0) * (1 + s.r / 30)) > ((a.w || 0) * (1 + a.r / 30)) ? s : a, d[0]); }
function wkVol27(w) { return (w.exercises || []).filter(e => !e.skipped && EX[e.ex] && EX[e.ex].kind === 'w').reduce((a, e) => a + e.sets.filter(s => s.done).reduce((b, s) => b + (s.w || 0) * (s.r || 0), 0), 0); }
function sessCode27(w) { return String(w.sessionKey || '').split(':').slice(1).join(':'); }
function prevSame27(w) { const c = sessCode27(w); return S.workouts.filter(o => o.id !== w.id && (o.exercises || []).length && (o.date < w.date || (o.date === w.date && (o.endedAt || 0) < (w.endedAt || Infinity))) && (sessCode27(o) === c || o.title === w.title)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.endedAt || 0) - (b.endedAt || 0)).pop() || null; }

/* ---------- workout hero: session + visible exercise list + one big Start ---------- */
function exRows27(s, k) {
  if (s.kind !== 'lift') return s.kind === 'cardio' ? `<div class="ex27-c">${sessionLines(s, s.mod, k)}</div>` : '';
  const rows = slotsFor(s.tpl, S.profile).map(sl => {
    const e = makeEx(sl, s.mod, k), ex = EX[e.ex], first = e.sets[0], n = e.sets.length, last = ex.kind === 'w' ? lastTopSet(e.ex) : null;
    const main = ['main', 'bench'].includes(e.role), [lo, hi] = e.reps || [];
    const plan = main && n > 1 ? `top ${lo}–${hi} + ${n - 1} back-off${n > 2 ? 's' : ''}` : ex.kind === 'hold' ? `${n} × ${lo}–${hi}s` : `${n} × ${lo}–${hi}`;
    const tgt = fmtSet27(e.ex, first);
    const lastTxt = last ? `last ${ex.added && !last.w ? 'BW' : (ex.added ? '+' : '') + U.wOut(last.w || 0)}×${last.r}` : ex.kind === 'w' ? 'new' : '';
    return `<div class="ex27 ${e.skipped ? 'skipped' : ''} ${main ? 'main' : ''}"><div class="grow"><div class="nm">${esc(ex.n)}</div><div class="xs dim">${plan}${lastTxt ? ' · ' + lastTxt : ''}</div></div>${e.skipped ? '<b class="tg dim">skip</b>' : tgt ? `<b class="tg">${esc(tgt)}</b>` : `<span class="tg0">@RPE ${esc(first && first.rpeT || '8–9')}</span>`}</div>`;
  }).join('');
  const fin = s.finisher ? `<div class="ex27"><div class="grow"><div class="nm">${esc(s.finisher.title)}</div><div class="xs dim">${s.finisher.min}′ easy finisher</div></div></div>` : '';
  return `<div class="ex27-list">${rows}${fin}</div>`;
}
function links27(k, s) {
  const L = [];
  if (s && s.kind === 'lift') L.push(`<button class="lk27 tap" data-a="liftLog" data-day="${k}" data-key="${s.key}">Already did it</button>`);
  else if (s && s.kind === 'cardio') L.push(`<button class="lk27 tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">Already did it</button>`);
  L.push(`<button class="lk27 tap" data-a="pickSheet" data-date="${k}">Pick another</button>`);
  const cur = pickNow(k);
  if (!(cur && cur.type === 'min')) L.push(`<button class="lk27 tap" data-a="minDay" data-date="${k}">Minimum day</button>`);
  L.push(`<button class="lk27 tap" data-a="qaOpen" data-date="${k}">Log activity</button>`);
  return `<div class="links27">${L.join('')}</div>${cur ? `<div class="xs dim pick27">Today: <b>${cur.type === 'min' ? 'Minimum day' : PICKS[cur.type].label}</b> · <button class="linkbtn tap" data-a="pickUndo" data-date="${k}">back to plan</button></div>` : ''}`;
}
function hero27(k, dp) {
  const todo = todoSessions(dp), s = todo[0];
  if (S.active && (!s || S.active.sessionKey !== s.key) && !dp.sessions.some(x => x.key === S.active.sessionKey)) return `<div class="card hero27"><div class="kick27">In progress</div><div class="ttl27">${esc(S.active.title)}</div><button class="btn big tap" data-a="resume">▶ Resume workout</button></div>`;
  if (s) {
    const act = S.active && S.active.sessionKey === s.key, lift = s.kind === 'lift', test = s.kind === 'test', hockey = s.kind === 'cardio' && s.cardio.mode === 'hockey';
    const btn = act ? `<button class="btn big tap" data-a="resume">▶ Resume workout</button>` : test ? `<button class="btn big tap" data-a="testSheet" data-key="${s.testKey}">Enter test results</button>` : hockey ? `<button class="btn big tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">✓ Mark done</button>` : `<button class="btn big tap" data-a="start" data-day="${k}" data-key="${s.key}">▶ Start workout</button>`;
    const kick = `${dp.meta.deload ? 'Deload · ' : ''}${lift ? 'Strength' : test ? 'Test' : MODE_LABEL[s.cardio.mode]}`;
    return `<div class="card hero27" data-sess="${s.key}"><div class="row between"><span class="kick27">${kick}</span><span class="small muted">~${s.min} min</span></div><div class="ttl27">${esc(s.title)}</div>${S.schedule.skips[s.key] ? `<div class="xs" style="color:var(--warn)">Skipped earlier — still doable today</div>` : ''}${exRows27(s, k)}${btn}${act ? '' : links27(k, s)}</div>`;
  }
  const did = dp.sessions.filter(x => ['done', 'swapped'].includes(sessStatus(x)));
  if (did.length || (nnItem('train', k).ok && dp.sessions.length)) {
    const ws = S.workouts.filter(w => w.date === k && (w.exercises || []).some(e => e.sets.some(x => x.done)));
    const body = ws.map(w => { const tops = w.exercises.filter(e => ['main', 'bench'].includes(e.role)).map(e => { const t = topOf27(e); return t ? `${EX[e.ex].n.replace(/^Barbell /, '')} ${fmtSet27(e.ex, t)}` : ''; }).filter(Boolean).slice(0, 3); const pr = (w.summary && w.summary.prs || []).length; return `<button class="done27 tap" data-a="viewSummary" data-id="${w.id}"><div class="grow"><b>${esc(w.title)}</b><div class="xs dim">${tops.join(' · ') || (w.summary ? w.summary.sets + ' sets' : '')}</div></div>${pr ? `<span class="pr27">${pr} PR${pr > 1 ? 's' : ''}</span>` : ''}<span class="chev27">›</span></button>`; }).join('');
    return `<div class="card hero27 done27h"><div class="kick27 ok">Done</div><div class="ttl27">${did.length ? esc(did.map(x => x.title).join(' + ')) : 'Training'} ✓</div>${body}<div class="small muted" style="margin-top:6px">Now grow: ${S.settings.protein} g protein, 8 h sleep.</div>${links27(k, null)}</div>`;
  }
  return `<div class="card hero27"><div class="kick27">${dp.off ? 'Day off' : 'Rest day'}</div><div class="ttl27">${dp.off ? esc(dp.off) : 'Recover'}</div><div class="small muted">Growth happens on rest days: protein, sleep, 10-min mobility.</div><button class="btn big sec tap" data-a="pickSheet" data-date="${k}">Pick a workout anyway</button>${links27(k, null).replace(/<button class="lk27 tap" data-a="pickSheet"[^>]*>Pick another<\/button>/, '')}</div>`;
}
function alsoToday27(k, dp, first) {
  if (!dp || dp.off) return '';
  const rest = dp.sessions.filter(s => s !== first && ['todo', 'skipped'].includes(sessStatus(s)));
  return rest.map(s => `<div class="card also27"><div class="grow"><div class="xs dim">Also today</div><b>${esc(s.title)}</b> <span class="small muted">~${s.min} min</span></div>${s.kind === 'cardio' && s.cardio.mode === 'hockey' ? `<button class="btn sm sec tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">Done ✓</button>` : `<button class="btn sm sec tap" data-a="start" data-day="${k}" data-key="${s.key}">Start</button>`}</div>`).join('');
}

/* ---------- checklist row: 4–5 tappable icons ---------- */
function checkRow27(k) {
  const nn = nnDay(k);
  const act = i => i.id === 'train' ? 'data-a="chkTrain27"' : i.id === 'protein' ? 'data-a="goTab" data-tab="food"' : i.id === 'devo' ? `data-a="openDevo" data-k="${k}"` : `data-a="nnTog" data-id="${i.id}" data-date="${k}"`;
  const ic = i => i.id === 'devo' ? '📖' : i.ic, LB = { train: 'Train', protein: 'Protein', mobility: 'Mobility', devo: 'Devo', sleep: 'Sleep', steps: 'Steps', creatine: 'Creatine', water: 'Water', noalc: 'No alc', weigh: 'Weigh' };
  return `<div class="chk27" id="chk27">${nn.items.map(i => `<button class="ci27 tap ${i.ok ? 'on' : ''}" ${act(i)} aria-label="${esc(i.short || i.label)}${i.ok ? ' done' : ''}"><span class="ic">${ic(i)}</span><span class="lb">${esc(LB[i.id] || (i.short || i.label).split(' ')[0])}</span></button>`).join('')}</div>`;
}
ACT.chkTrain27 = () => toast('Checks itself when you log a workout');

/* ---------- Grow strip: streak · bench → 225 · protein ---------- */
function growStrip27(k) {
  const sk = nnStreak(), bn = benchNow(), T = S.settings, prot = Math.round(proteinFor(k) || 0);
  const pct = bn ? Math.max(0, Math.min(100, (bn.v - 185) / 40 * 100)) : 0, pp = Math.min(100, prot / T.protein * 100);
  return `<div class="grow27" id="growCard">
    <button class="g27 tap" data-a="goTab" data-tab="progress"><b>🔥 ${sk}</b><span>day streak</span></button>
    <button class="g27 wide tap" data-a="goTab" data-tab="progress"><span class="row between"><span>Bench → 225</span><b>${bn ? U.wOut(bn.v, 0) : '—'}</b></span><span class="bar27"><i style="width:${pct}%"></i></span></button>
    <button class="g27 tap" data-a="goTab" data-tab="food"><b>${prot}<small>/${T.protein}g</small></b><span>protein</span><span class="bar27 p"><i style="width:${pp}%"></i></span></button>
  </div>`;
}
function recapCard27(k) {
  const d = dow(k); if (d !== 6 && d !== 0) return '';
  const rk = d === 0 ? addDays(k, -1) : k, ws = weekStart(rk); if (v27().recapSeen[ws]) return '';
  const ups = strongerRecap(rk), x = `<button class="icon-btn tap" data-a="recapHide27" data-ws="${ws}" aria-label="Dismiss">✕</button>`;
  if (!ups.length) {
    const ws7 = addDays(ws, 6), wk = S.workouts.filter(w => w.date >= ws && w.date <= ws7), lift = wk.filter(w => (w.exercises || []).length);
    if (!wk.length) return '';
    const sets = lift.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.filter(s => s.done).length, 0), 0), vol = lift.reduce((a, w) => a + wkVol27(w), 0);
    return `<div class="card recap27"><div class="row between"><b>${d === 6 ? 'This week' : 'Last week'}: ${wk.length} session${wk.length > 1 ? 's' : ''}</b>${x}</div><div class="small muted">${lift.length} lifting · ${sets} sets${vol ? ' · ' + U.wOut(vol, 0) + ' ' + wu() + ' volume' : ''}</div></div>`;
  }
  return `<div class="card recap27"><div class="row between"><b>You got stronger on ${ups.length} lift${ups.length > 1 ? 's' : ''}</b><button class="icon-btn tap" data-a="recapHide27" data-ws="${ws}" aria-label="Dismiss">✕</button></div><div class="small muted">${ups.slice(0, 3).map(u => `${esc(u.n)} ${U.wOut(u.last.w)}×${u.last.r} → <b>${U.wOut(u.now.w)}×${u.now.r}</b>`).join('<br>')}</div></div>`;
}
ACT.recapHide27 = (el, d) => { v27().recapSeen[d.ws] = 1; save(); haptic(); rerenderKeep(); };

/* ---------- Today ---------- */
VIEWS.today = function () {
  setTimeout(checkLevelUp, 400);
  const k = today(), dp = dayPlan(k);
  let h = hdr(fmtLong(k), 'Today', `<button class="icon-btn round tap" data-a="calSheet" aria-label="Log a past day (calendar)">${CAL_ICON}</button>`);
  h += importCard();
  if (!dp) return h + `<div class="card hero27"><div class="kick27">${k < PLAN_START ? 'Starts Oct 5' : 'Plan complete'}</div><div class="ttl27">${k < PLAN_START ? 'Plan starts Monday, Oct 5' : 'Program complete'}</div></div>` + growStrip27(k);
  h += lowerRuleTips(k); // the one tip that matters: 48-h legs rule
  h += hero27(k, dp) + alsoToday27(k, dp, todoSessions(dp)[0]);
  if (k >= PLAN_START) h += checkRow27(k);
  h += growStrip27(k) + recapCard27(k);
  if (isEvening() && k >= PLAN_START) h += `<button class="btn sec tap nl27" data-a="nightly" data-date="${k}">🌙 Nightly log</button>`;
  return h;
};
/* Move / skip moved into the Pick sheet */
const _pickSheet26 = ACT.pickSheet;
ACT.pickSheet = (el, d) => {
  _pickSheet26(el, d); const k = d.date || today(), dp = dayPlan(k), s = dp && !dp.off ? todoSessions(dp)[0] : null, sh = $('.sheet'); if (!sh || !s) return;
  sh.insertAdjacentHTML('beforeend', `<div class="small muted" style="margin:16px 2px 8px">Or change “${esc(s.title)}”</div><div class="row"><button class="btn sec tap grow" data-a="moveSheet" data-key="${s.key}">Move to another day</button><button class="btn sec tap grow" data-a="skip" data-key="${s.key}">Skip</button></div>`);
};

/* ---------- Workout logger: less text, straight to the sets ---------- */
const _renderWorkout26 = renderWorkout;
renderWorkout = function () {
  _renderWorkout26.apply(this, arguments);
  const o = $('#workout'); if (!o) return;
  const why = o.querySelector('.wk-body > details.why, details.why'); if (why) why.remove();
  [...o.querySelectorAll('.small.dim')].forEach(x => { if (/^Log weight × reps/.test(x.textContent)) x.remove(); });
};

/* ---------- Summary: PRs + volume vs last time ---------- */
const _showSummary26 = showSummary;
showSummary = function (w, fresh) {
  _showSummary26.apply(this, arguments);
  if (!(w.exercises || []).length) return;
  const p = prevSame27(w), o = $('#workout'), g = o && o.querySelector('.grid3'); if (!g) return;
  let h = '';
  if (p) {
    const v = wkVol27(w), pv = wkVol27(p), dv = v - pv, pct = pv ? Math.round(dv / pv * 100) : 0;
    const rows = w.exercises.filter(e => !e.skipped && EX[e.ex].kind === 'w').map(e => { const t = topOf27(e), pe = (p.exercises || []).find(x => x.ex === e.ex), pt = pe ? topOf27(pe) : null; if (!t) return ''; const up = pt ? e1rm(t.w || 0, t.r) - e1rm(pt.w || 0, pt.r) : null; return `<div class="vs27r"><span class="grow">${esc(EX[e.ex].n)}</span><span class="dim">${pt ? fmtSet27(e.ex, pt) : '—'}</span><span class="ar">→</span><b class="${up == null ? '' : up > 0.5 ? 'up' : up < -0.5 ? 'dn' : ''}">${fmtSet27(e.ex, t)}</b></div>`; }).join('');
    h = `<div class="card vs27" id="vsLast"><div class="row between"><b>vs last ${esc(p.title)}</b><span class="xs dim">${fmtDate(p.date)}</span></div><div class="vs27k"><div><b class="${dv >= 0 ? 'up' : 'dn'}">${dv >= 0 ? '+' : '−'}${fmtNum(U.wOut(Math.abs(dv), 0))}</b><span>${wu()} volume${pv ? ` (${dv >= 0 ? '+' : ''}${pct}%)` : ''}</span></div><div><b>${(w.summary || {}).sets || 0}<small> / ${(p.summary || {}).sets || '—'}</small></b><span>sets vs last</span></div></div>${rows}</div>`;
  } else h = `<div class="card vs27" id="vsLast"><b>First ${esc(w.title)} logged</b><div class="small muted">Next time you’ll see volume and top sets vs today.</div></div>`;
  g.insertAdjacentHTML('afterend', h);
};

/* ---------- Workout history ---------- */
function histRows27(n) {
  const ws = S.workouts.slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (b.endedAt || 0) - (a.endedAt || 0));
  const list = n ? ws.slice(0, n) : ws;
  if (!list.length) return '<div class="empty">Your logged workouts show up here.</div>';
  return list.map(w => {
    const lift = (w.exercises || []).some(e => e.sets.some(s => s.done));
    const tops = lift ? w.exercises.filter(e => !e.skipped && EX[e.ex].kind === 'w').map(e => ({ e, t: topOf27(e) })).filter(x => x.t).sort((a, b) => (['bench', 'main', 'tech'].includes(b.e.role) ? 1 : 0) - (['bench', 'main', 'tech'].includes(a.e.role) ? 1 : 0)).slice(0, 3).map(x => `${EX[x.e.ex].n.replace(/^(Barbell|Weighted|Chest-Supported) /, '')} ${fmtSet27(x.e.ex, x.t)}`) : [];
    const c = w.cardio, meta = lift ? tops.join(' · ') : c ? [c.dur ? c.dur + ' min' : '', c.dist ? (c.mode === 'swim' ? U.sOut(c.dist) + ' ' + su() : U.dOut(c.dist) + ' ' + du()) : '', c.rpe ? 'effort ' + c.rpe : ''].filter(Boolean).join(' · ') : '';
    const pr = (w.summary && w.summary.prs || []).length;
    return `<button class="hist27 tap" data-a="viewSummary" data-id="${w.id}"><div class="hd"><b>${fmtDate(w.date)}</b><span>${DOW[dow(w.date)]}</span></div><div class="grow"><div class="nm">${esc(w.title)}</div><div class="xs dim">${esc(meta) || '&nbsp;'}</div></div>${pr ? `<span class="pr27">${pr} PR${pr > 1 ? 's' : ''}</span>` : ''}</button>`;
  }).join('');
}
VIEWS.history = function () { return hdr(`${S.workouts.length} sessions logged`, 'History') + `<div class="card hist27c" id="histAll">${histRows27(0)}</div>`; };

/* ---------- Progress: workout first ---------- */
const _progress26 = VIEWS.progress;
VIEWS.progress = function () {
  const k = today(), h0 = _progress26(), strip = x => x.replace(/^\s*<h2 class="sec[^"]*">[\s\S]*?<\/h2>/, '');
  const S2 = (a, b) => seg(h0, a, b);
  const weight = S2('<h2 class="sec">Weight trend', '<h2 class="sec">Bench press'), kcal = S2('<h2 class="sec">Calorie check', '<h2 class="sec">Discipline'), disc = S2('<h2 class="sec">Discipline', '<h2 class="sec">Waist'), waist = S2('<h2 class="sec">Waist', '<h2 class="sec">Estimated 1RM'), e1 = S2('<h2 class="sec">Estimated 1RM', '<h2 class="sec">Cardio per week'), cardio = S2('<h2 class="sec">Cardio per week', '<h2 class="sec">Habit completion'), habit = S2('<h2 class="sec">Habit completion', '<h2 class="sec">Knee pain'), knee = S2('<h2 class="sec">Knee pain', '<h2 class="sec">Test days'), tests = S2('<h2 class="sec">Test days', null);
  const bn = benchNow(), nx = bn ? LEVELS.find(v => v > bn.v) : null;
  let bc = benchCard().replace(/<h2 class="sec">[\s\S]*?<\/h2>/, `<h2 class="sec first">Bench press <small>${nx ? 'next ' + nx + ' lb' : 'goal 225'}</small></h2>`).replace(/<div class="xs dim" style="margin-top:8px">Phases:[\s\S]*?<\/div>/, '');
  let h = hdr('Strength first', 'Progress') + bc;
  const nW = S.workouts.length;
  h += `<h2 class="sec">Workout history <button class="btn sm sec tap" data-a="goTab" data-tab="history">All ${nW}</button></h2><div class="card hist27c" id="histCard">${histRows27(5)}</div>`;
  h += e1.replace('<h2 class="sec">Estimated 1RM', '<h2 class="sec">Main lifts · e1RM');
  const ups = strongerRecap(k), lastUps = strongerRecap(addDays(weekStart(k), -1));
  h += `<h2 class="sec">Weekly recap</h2><div class="card" id="recap27">${[['This week', ups], ['Last week', lastUps]].map(([t, u]) => `<div class="rc27"><div class="xs dim">${t}</div>${u.length ? `<b>Stronger on ${u.length} lift${u.length > 1 ? 's' : ''}</b><div class="small muted">${u.slice(0, 3).map(x => `${esc(x.n)} ${U.wOut(x.last.w)}×${x.last.r} → ${U.wOut(x.now.w)}×${x.now.r}`).join(' · ')}</div>` : '<div class="small muted">No top set beaten yet.</div>'}</div>`).join('')}</div>`;
  h += weight.replace('<small>+ food averages</small>', '') + waist;
  h += `<h2 class="sec">More stats</h2>`;
  h += foldSec('p-wsets', '', 'Weekly sets per muscle', 'hard sets', weeklySetsHtml(k));
  h += foldSec('p-week', '', 'This week', `${liftWeek(k).done}/2 lifts`, strip(weekSumCard(k, true)) + balanceHtml(k));
  h += foldSec('p-ci', '', 'Check-ins & streak', `🔥 ${nnStreak()}`, checkinCard(k) + strip(disc));
  h += foldSec('p-kcal', '', 'Calorie check', `${fmtNum(S.settings.kcal)} kcal`, strip(kcal));
  h += foldSec('p-cardio', '', 'Cardio per week', '', strip(cardio));
  h += foldSec('p-hab', '', 'Habit completion', '', strip(habit));
  h += foldSec('p-knee', '', 'Knee pain', '', strip(knee));
  h += foldSec('p-tests', '', 'Test days', '', strip(tests).replace(/^\s*<button[^>]*data-a="testSheet"[^>]*>Enter results<\/button>\s*<\/h2>/, '') + `<button class="btn sm sec tap" style="margin-top:10px" data-a="testSheet" data-key="${currentTestKey()}">Enter test results</button>`);
  return h;
};

/* ---------- More ---------- */
VIEWS.more = function () {
  const k = today(), dp = dayPlan(k), devoOn = !!(S.devo.done[k] || (S.habitLog[k] || {}).bible), hp = Math.round(habitPct(k) * 100);
  const row = (a, t, m, extra = '') => `<button class="more27 tap" data-a="${a}" ${extra}><span class="grow">${t}</span><span class="small dim">${m}</span><span class="chev27">›</span></button>`;
  let h = hdr('Everything else', 'More');
  h += `<div class="card list27">${row('goTab', 'Workout history', `${S.workouts.length} logged`, 'data-tab="history"')}${row('goTab', 'Program & schedule', dp && dp.block ? `Block ${dp.block.n} · week ${dp.wk}` : '', 'data-tab="train"')}${row('openDevo', 'Devotional', devoOn ? 'done today' : 'not yet', `data-k="${k}"`)}${row('goTab', 'Habits', `${hp}% today`, 'data-tab="habits"')}${row('openCoach', 'Coach', 'chat · quick commands')}${row('goTab', 'Motivation', 'verses · videos', 'data-tab="fuel"')}${row('goTab', 'Guide', 'mobility · rules', 'data-tab="guide"')}</div>`;
  h += `<div class="card list27">${row('goTab', 'Settings', 'targets · units', 'data-tab="settings"')}${row('backup27', 'Data backup', 'export · import')}</div>`;
  h += `<div class="xs dim" style="text-align:center;margin-top:14px">Arnold Fit v2.7 · data stays on this phone</div>`;
  return h;
};
VIEWS.habits = function () { return hdr(UI.habDate ? fmtLong(UI.habDate) : 'Today', 'Habits') + habitsCard(); };
VIEWS.guide = function () { return hdr('How the plan works', 'Guide') + guideCard().replace(/^\s*<h2 class="sec">Guide<\/h2>/, ''); };
ACT.backup27 = () => { goTab('settings'); setTimeout(() => { const h = $$('#view h2.sec').find(x => /Backup/.test(x.textContent)); if (h) { h.scrollIntoView(); scrollBy(0, -12); } }, 60); };

/* ---------- Food: ring + 4 meals; one + button; week behind a toggle ---------- */
VIEWS.food = function () {
  const k = foodK(), wk = UI.foodView === 'week';
  let h = hdr(wk ? 'This week' : fDayLbl(k) === 'Today' ? fmtLong(k) : fDayLbl(k), 'Food', `<button class="pill27 tap" data-a="fView" data-v="${wk ? 'day' : 'week'}">${wk ? 'Day' : 'Week'}</button><button class="icon-btn round tap" data-a="fCal" aria-label="Pick a day (calendar)">${CAL_ICON}</button>`);
  return h + (wk ? foodWeekHtml() : food27(k));
};
function food27(k) {
  const T = fTargets(), log = foodDay(k), tot = sumT(log), isT = k === today(), man = mfpFor(k), left = T.kcal - tot.kcal, pOk = tot.p >= T.p;
  let h = `<div class="card fsum27" id="foodSum"><div class="row between fnav27"><button class="icon-btn tap" data-a="foodDay" data-v="-1" aria-label="Previous day">‹</button><b id="foodDateLbl">${fDayLbl(k)}</b><button class="icon-btn tap" data-a="foodDay" data-v="1" aria-label="Next day" ${isT ? 'disabled' : ''}>›</button></div>
    <div class="row" style="gap:16px;align-items:center"><div class="fring">${ringSvg(tot.kcal, T.kcal)}<div class="fring-c"><b id="kcalTot">${fmtNum(tot.kcal)}</b><span>of ${fmtNum(T.kcal)}</span></div></div>
    <div class="grow"><div class="big27 ${pOk ? 'okc' : ''}" id="protTot">${gR(tot.p)}<small> / ${T.p} g protein${pOk ? ' ✓' : ''}</small></div><div class="pbar"><i class="pgreen" style="width:${Math.min(100, tot.p / T.p * 100)}%"></i></div>
    <div class="small muted" style="margin-top:8px">${fmtNum(Math.abs(left))} ${left < 0 ? 'kcal over' : 'kcal left'} · ${gR(tot.c)} C · ${gR(tot.f)} F</div></div></div></div>`;
  if (man && (man.kcal != null || man.p != null)) h += `<div class="tip info"><div class="grow small">Nightly-log number counts for this day: ${man.kcal != null ? fmtNum(man.kcal) + ' kcal' : ''}${man.kcal != null && man.p != null ? ' · ' : ''}${man.p != null ? man.p + ' g protein' : ''}. <button class="linkbtn tap" data-a="fUseLog" data-date="${k}">Use the food log</button></div></div>`;
  h += `<button class="btn tap fadd27" data-a="faOpen" data-m="${autoMealFor(k)}">＋ Log food</button>`;
  MEALS.forEach(([id, n]) => {
    const es = log.filter(e => e.meal === id), mt = sumT(es), done = (S.food.meals[k] || {})[id];
    h += `<div class="card fmeal fmeal27" data-meal="${id}"><div class="fmeal-h"><button class="mck tap ${done ? 'on' : ''}" data-a="mealChk" data-m="${id}" aria-label="${n} eaten">${CHECK}</button><b class="grow">${n}</b><span class="small muted">${es.length ? `${fmtNum(mt.kcal)} kcal · ${gR(mt.p)} g P` : ''}</span><button class="icon-btn tap" data-a="fMealMore" data-m="${id}" aria-label="More for ${n}">⋯</button><button class="icon-btn tap add27" data-a="faOpen" data-m="${id}" aria-label="Add to ${n}">＋</button></div>`;
    h += es.map(e => `<div class="fent"><button class="grow tap fpick" data-a="fEdit" data-id="${e.id}"><div class="fn">${esc(e.name)}</div><div class="xs dim">${esc(eAmt(e))} · ${fmtNum(eTot(e).kcal)} kcal · ${gR(eTot(e).p)} P</div></button>${e.unit ? '' : `<div class="qty"><button class="tap" data-a="fqty" data-id="${e.id}" data-v="-1" aria-label="Less">−</button><span>${+(e.qty || 1).toFixed(2)}</span><button class="tap" data-a="fqty" data-id="${e.id}" data-v="1" aria-label="More">+</button></div>`}<button class="icon-btn tap fdel" data-a="fdel" data-id="${e.id}" aria-label="Delete ${esc(e.name)}">✕</button></div>`).join('') + `</div>`;
  });
  return h;
}
