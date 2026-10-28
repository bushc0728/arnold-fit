/* =====================================================================================
   v2.8 — "Take all the food out, I'll track that on my own. Let me see my week plan and the weeks ahead."
   • Food UI hidden everywhere (stored food data is kept untouched in localStorage).
   • The only food item left: a daily "No sweets" check-off with its own streak.
   • New Plan tab (replaces Food): this week Mon–Sun + the weeks ahead through Dec 31.
   • Bench is no longer featured: no bench strip, level-ups or 225 goal. Barbell bench stays once a week (Mon Upper A) as a normal lift.
   • Weight entry on Progress.
   ===================================================================================== */
'use strict';
const V28_SINCE = '2026-10-28';
NAV27[1] = 'plan';
function v28() { S.v28 = S.v28 || {}; return S.v28; }

/* ---------- one-time, additive settings migration (backup first) ---------- */
(function migrate28() {
  const st = v28(); if (st.migrated) return;
  try { if (!localStorage.getItem(STORE_KEY + '.backup-v2.7')) localStorage.setItem(STORE_KEY + '.backup-v2.7', localStorage.getItem(STORE_KEY) || JSON.stringify(S)); } catch (e) { console.warn('v2.8 backup failed', e); }
  const hs = S.settings.habits, pi = hs.findIndex(h => h.id === 'protein');
  st.hiddenHabits = st.hiddenHabits || [];
  if (pi >= 0) st.hiddenHabits.push({ ...hs[pi], at: pi }), hs.splice(pi, 1); /* kept here so it can be restored; habitLog history untouched */
  if (!hs.some(h => h.id === 'nosweets')) hs.splice(Math.max(0, pi), 0, { id: 'nosweets', label: 'No sweets', ic: '🍬' });
  if (Array.isArray(S.settings.nn)) { st.nnBefore = S.settings.nn.slice(); const i = S.settings.nn.indexOf('protein'); if (i >= 0) S.settings.nn[i] = 'nosweets'; else if (!S.settings.nn.includes('nosweets')) S.settings.nn.splice(1, 0, 'nosweets'); }
  st.since = st.since || (today() < V28_SINCE ? today() : V28_SINCE); st.migrated = Date.now(); save();
})();
NN_DEFAULT.splice(0, NN_DEFAULT.length, 'train', 'nosweets', 'mobility', 'devo', 'sleep');

/* No sweets: counts only from the day v2.8 arrived, so the honest streak isn't broken by days before it existed */
const _nnItem25 = nnItem;
nnItem = function (id, k) {
  if (id === 'nosweets') { const l = S.habitLog[k] || {}; return { id, ic: '🍬', label: 'No sweets', short: 'No sweets', main: 'No sweets', meta: '', ok: !!l.nosweets || k < (v28().since || V28_SINCE) }; }
  return _nnItem25(id, k);
};
const _nnIds25 = nnIds;
nnIds = function () { return _nnIds25().filter(i => i !== 'protein'); };
function sweetsStreak() { return habitStreak('nosweets'); }

/* ---------- no level-ups, no food anywhere ---------- */
checkLevelUp = function () {};
fuelAvgHtml = function () { return ''; };
VIEWS.food = function () { return VIEWS.plan(); };
const _goTab27 = goTab;
goTab = function (tab) { return _goTab27(tab === 'food' ? 'plan' : tab); };
goalsHtml = function () {
  const st = S.settings, cur = (rolling7().slice(-1)[0] || {}).v, wt = waistTrend();
  const meta = [wt ? `Waist ${U.lOut(wt.last)} ${lu()}${wt.fk !== wt.k ? ` (${wt.last <= wt.first ? '▼' : '▲'} ${U.lOut(Math.abs(wt.first - wt.last))} since ${fmtDate(wt.fk)})` : ''}` : 'Log your waist at the Sunday check-in', `${U.wOut(st.startWeight)} → ~${U.wOut(st.goalWeight)} ${wu()} by Dec 31${cur ? ` · now ${U.wOut(cur)} ${wu()} (7-day avg)` : ''}`, 'Main lifts: fill the rep range, then add weight', 'Parked until after Dec 31'];
  return PLAN_GOALS.map((g, i) => `<div class="goalrow"><span class="chip ${i === 0 ? 'grad' : ''}">${g.ic}</span><div class="grow"><b>${esc(g.t)}</b><div class="muted">${esc(meta[i] || '')}</div><div class="xs dim">${esc(g.d)}</div></div></div>`).join('');
};

/* nightly log: training · check-offs · weight (no food totals) */
const _nightly26 = nightlyHtml;
nightlyHtml = function (k) {
  return _nightly26(k).replace(/<h4 class="nlsec">Food totals[\s\S]*?(<div class="field" style="margin-top:12px"><label>Weight)/, '<h4 class="nlsec">Body</h4>$1');
};
applyNlInputs = function (k) { /* weight only; food totals already stored stay as they are */
  const i = $('#nl-w'); if (!i) return true; const wv = i.value.trim(), b = S.body[k] = S.body[k] || {};
  if (wv !== '') { const lb = U.wIn(wv); if (!(lb >= 80 && lb <= 500)) { toast('Check that weight'); return false; } b.weight = +lb.toFixed(2); (S.habitLog[k] = S.habitLog[k] || {}).weigh = true; }
  else if (b.weight) delete b.weight;
  if (!Object.keys(b).length) delete S.body[k];
  save(); return true;
};

/* ---------- Today ---------- */
const _checkRow27 = checkRow27;
checkRow27 = function (k) { return _checkRow27(k).replace(/<span class="lb">No<\/span>/g, '<span class="lb">No sweets</span>'); };
growStrip27 = function (k) {
  const sk = nnStreak(), sw = sweetsStreak(), lw = liftWeek(k), tot = lw.done + lw.left;
  return `<div class="grow27 g28" id="growCard">
    <button class="g27 tap" data-a="goTab" data-tab="progress"><b>🔥 ${sk}</b><span>day streak</span></button>
    <button class="g27 tap" data-a="nnTog" data-id="nosweets" data-date="${k}"><b>🍬 ${sw}</b><span>no-sweets streak</span></button>
    <button class="g27 tap" data-a="goTab" data-tab="plan"><b>${lw.done}<small>/${Math.max(2, tot)}</small></b><span>lifts this week</span></button>
  </div>`;
};
const _hero27 = hero27;
hero27 = function (k, dp) {
  return _hero27(k, dp).replace(/Growth happens on rest days: protein, sleep, 10-min mobility\./, 'Growth happens on rest days: sleep and 10-min mobility.').replace(/Now grow: \d+ g protein, 8 h sleep\./, 'Now recover: 8 h sleep.');
};

/* ---------- Progress: workouts first, then weight (with an entry box) ---------- */
function weightEntry28() {
  const k = today(), b = S.body[k] || {}, lw = lastWeight();
  return `<div class="card we28" id="weighIn"><div class="grow"><div class="xs dim">${b.weight ? 'Logged today' : 'Weigh-in · today'}</div><input class="inp big28" id="q-weight" type="number" inputmode="decimal" step="0.1" placeholder="${lw ? esc(U.wOut(lw)) : wu()}" value="${b.weight ? esc(U.wOut(b.weight)) : ''}" aria-label="Weight in ${wu()}"></div><button class="btn tap we28b" data-a="saveWeight">${b.weight ? 'Update' : 'Save'}</button></div>`;
}
VIEWS.progress = function () {
  const k = today(), h0 = _progress26(), strip = x => x.replace(/^\s*<h2 class="sec[^"]*">[\s\S]*?<\/h2>/, '');
  const S2 = (a, b) => seg(h0, a, b);
  const weight = S2('<h2 class="sec">Weight trend', '<h2 class="sec">Bench press'), disc = S2('<h2 class="sec">Discipline', '<h2 class="sec">Waist'), waist = S2('<h2 class="sec">Waist', '<h2 class="sec">Estimated 1RM'), e1 = S2('<h2 class="sec">Estimated 1RM', '<h2 class="sec">Cardio per week'), cardio = S2('<h2 class="sec">Cardio per week', '<h2 class="sec">Habit completion'), habit = S2('<h2 class="sec">Habit completion', '<h2 class="sec">Knee pain'), knee = S2('<h2 class="sec">Knee pain', '<h2 class="sec">Test days'), tests = S2('<h2 class="sec">Test days', null);
  const nW = S.workouts.length;
  let h = hdr('Workouts first', 'Progress');
  h += `<h2 class="sec first">Workout history <button class="btn sm sec tap" data-a="goTab" data-tab="history">All ${nW}</button></h2><div class="card hist27c" id="histCard">${histRows27(5)}</div>`;
  h += weight.replace(/<h2 class="sec">Weight trend[\s\S]*?<\/h2>/, '<h2 class="sec">Weight</h2>' + weightEntry28()).replace('Log weight on Today', 'Log it above');
  h += waist;
  const ups = strongerRecap(k), lastUps = strongerRecap(addDays(weekStart(k), -1));
  h += `<h2 class="sec">Weekly recap</h2><div class="card" id="recap27">${[['This week', ups], ['Last week', lastUps]].map(([t, u]) => `<div class="rc27"><div class="xs dim">${t}</div>${u.length ? `<b>Stronger on ${u.length} lift${u.length > 1 ? 's' : ''}</b><div class="small muted">${u.slice(0, 3).map(x => `${esc(x.n)} ${U.wOut(x.last.w)}×${x.last.r} → ${U.wOut(x.now.w)}×${x.now.r}`).join(' · ')}</div>` : '<div class="small muted">No top set beaten yet.</div>'}</div>`).join('')}</div>`;
  h += e1.replace(/<h2 class="sec">Estimated 1RM[^<]*/, '<h2 class="sec">Lift trends · e1RM');
  h += `<h2 class="sec">More stats</h2>`;
  h += foldSec('p-wsets', '', 'Weekly sets per muscle', 'hard sets', weeklySetsHtml(k));
  h += foldSec('p-week', '', 'This week', `${liftWeek(k).done}/2 lifts`, noFood28(strip(weekSumCard(k, true))) + balanceHtml(k));
  h += foldSec('p-ci', '', 'Check-ins & streak', `🔥 ${nnStreak()}`, checkinCard(k) + strip(disc));
  h += foldSec('p-cardio', '', 'Cardio per week', '', strip(cardio));
  h += foldSec('p-hab', '', 'Habit completion', '', strip(habit));
  h += foldSec('p-knee', '', 'Knee pain', '', strip(knee));
  h += foldSec('p-tests', '', 'Test days', '', strip(tests).replace(/^\s*<button[^>]*data-a="testSheet"[^>]*>Enter results<\/button>\s*<\/h2>/, '') + `<button class="btn sm sec tap" style="margin-top:10px" data-a="testSheet" data-key="${currentTestKey()}">Enter test results</button>`);
  return h;
};
function noFood28(x) { return x.replace(/<div><b>[^<]*<\/b><span>protein days<\/span><\/div>/g, '').replace(/ · \d+\/\d+ protein days/g, '').replace(/<span class="dim">avg [^<]*kcal[^<]*<\/span>/g, '').replace(/ · avg [\d,]+ kcal/g, ''); }

/* ---------- More / Settings / Guide: no food ---------- */
const _more27 = VIEWS.more;
VIEWS.more = function () { return _more27().replace('Arnold Fit v2.7', 'Arnold Fit v2.8').replace(/<button class="more27 tap" data-a="goTab" data-tab="history">[\s\S]*?<\/button>/, '$&' + `<button class="more27 tap" data-a="goTab" data-tab="plan"><span class="grow">Week plan</span><span class="small dim">through Dec 31</span><span class="chev27">›</span></button>`); };
const _settings = VIEWS.settings;
VIEWS.settings = function () {
  return _settings().replace(/<div class="li"><span>Calories \(kcal\)<\/span>[\s\S]*?<\/div>/, '').replace(/<div class="li"><span>Protein \(g\/day\)<\/span>[\s\S]*?<\/div>/, '').replace(/<div class="li"><span class="small muted">Profile suggests[\s\S]*?<\/div><\/div>/, '</div>').replace(/Arnold Fit v2\.\d/, 'Arnold Fit v2.8');
};
const _guide27 = VIEWS.guide;
VIEWS.guide = function () { return _guide27().replace(/<details class="gsec" id="g-nutrition">[\s\S]*?<\/details>/, ''); };

/* ---------- Plan tab: this week Mon–Sun + weeks ahead ---------- */
const PLAN_NOTE28 = { '2026-10-30': 'Friday at the earliest — 48 h after the hard rides' };
const SHORT28 = { UA: 'Upper A', UB: 'Upper B', UC: 'Upper C', LOW: 'Lower', MTB: 'MTB', SAT: 'Run or MTB', HOCKEY: 'Hockey', TEST: 'Test day', SPIN: 'Easy spin', PUSH: 'Push', PULL: 'Pull', RUN: 'Run', SWIM: 'Swim', LONG: 'Long ride', REC: 'Recovery', RUN2: 'Run' };
const sName28 = s => { const r = sessStatus(s) === 'swapped' ? replacedBy(s.key) : null; return r ? String(r.title).replace(/ 🏒| 🏁/g, '') : SHORT28[s.code] || String(s.title).replace(/ 🏒| 🏁/g, ''); };
function dayStatus28(k, dp) {
  const t = today(), ss = dp && !dp.off ? dp.sessions : [], st = ss.map(sessStatus);
  const extra = S.workouts.filter(w => w.date === k && !ss.some(s => s.key === w.sessionKey) && !Object.values(S.schedule.replaced || {}).includes(w.id));
  if (dp && dp.off) return { cls: 'off', lbl: 'Off' };
  if (!ss.length) return extra.length ? { cls: 'done', lbl: '✓ Done' } : { cls: 'rest', lbl: k === t ? 'Today' : 'Rest' };
  if (st.every(x => x === 'done')) return { cls: 'done', lbl: '✓ Done' };
  if (st.every(x => x === 'done' || x === 'swapped')) return { cls: 'swap', lbl: '↪ Swapped' };
  if (k === t) return { cls: 'today', lbl: S.active && ss.some(s => s.key === S.active.sessionKey) ? 'In progress' : 'Today' };
  if (k < t) return st.some(x => x === 'done' || x === 'swapped') ? { cls: 'part', lbl: 'Partly' } : extra.length ? { cls: 'swap', lbl: '↪ Swapped' } : { cls: 'miss', lbl: st.includes('skipped') ? 'Skipped' : 'Missed' };
  return { cls: '', lbl: '' };
}
function weekLabel28(m) { return m.deload ? '<span class="pl28tag dl">Deload</span>' : m.finals ? '<span class="pl28tag lt">Lighter week</span>' : m.wk === 14 ? '<span class="pl28tag ts">Test week</span>' : ''; }
function weekRange28(ws) { const we = addDays(ws, 6) > PLAN_END ? PLAN_END : addDays(ws, 6); return `${fmtDate(ws)} – ${pkey(we).getMonth() === pkey(ws).getMonth() ? pkey(we).getDate() : fmtDate(we)}`; }
VIEWS.plan = function () {
  const t = today(), ws = weekStart(t);
  if (t > PLAN_END) return hdr('Program complete', 'Plan') + `<div class="card"><b>The Oct 5 → Dec 31 plan is done.</b></div>`;
  const cur = weekStart(t < PLAN_START ? PLAN_START : t), m = weekMeta(weekNum(cur));
  let h = hdr(`This week · ${weekRange28(cur)}`, 'Plan', `<button class="icon-btn round tap" data-a="goTab" data-tab="train" aria-label="Edit schedule (move, skip)">${CAL_ICON}</button>`);
  if (m.deload || m.finals || m.wk === 14) h += `<div class="pl28note">${weekLabel28(m)} <span class="small muted">${esc(m.note || '')}</span></div>`;
  h += `<div class="card pl28wk" id="planWeek">`;
  for (let i = 0; i < 7; i++) {
    const k = addDays(cur, i), dp = dayPlan(k), st = dayStatus28(k, dp), ss = dp && !dp.off ? dp.sessions : [];
    const name = !dp ? '—' : dp.off ? esc(dp.off) : ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : 'Rest';
    const sub = ss.length ? (PLAN_NOTE28[k] || ss.map(s => s.movedFrom ? `moved from ${DOW[dow(s.movedFrom)]}` : sessStatus(s) === 'swapped' ? `instead of ${SHORT28[s.code] || s.title}` : '').filter(Boolean).join(' · ') || (ss[0].kind === 'lift' ? `~${ss[0].min} min` : ss[0].kind === 'test' ? 'tests' : `${ss[0].min}′`)) : '';
    h += `<button class="pl28d tap ${k === t ? 'now' : ''} ${k < t ? 'past' : ''} ${ss.length ? '' : 'restd'}" data-a="planDay" data-date="${k}"><span class="pl28dw"><b>${DOW[i]}</b><span>${pkey(k).getDate()}</span></span><span class="grow"><b class="pl28n">${name}</b>${sub ? `<span class="xs dim">${esc(sub)}</span>` : ''}</span>${st.lbl ? `<span class="pl28s ${st.cls}">${st.lbl}</span>` : ''}<span class="chev27">›</span></button>`;
  }
  h += `</div><h2 class="sec">Weeks ahead <small>to Dec 31</small></h2>`;
  for (let w0 = addDays(cur, 7); w0 <= PLAN_END; w0 = addDays(w0, 7)) {
    const mm = weekMeta(weekNum(w0)), blk = mm.block || blockFor(w0);
    let days = '';
    for (let i = 0; i < 7; i++) { const k = addDays(w0, i); if (k > PLAN_END) break; const dp = dayPlan(k), ss = dp && !dp.off ? dp.sessions : []; days += `<button class="pl28c tap ${ss.length ? '' : 'restd'}" data-a="planDay" data-date="${k}"><span class="xs dim">${DOW[i]}</span><b>${dp && dp.off ? 'Off' : ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : 'Rest'}</b></button>`; }
    h += `<div class="card pl28ahead ${mm.deload ? 'isdl' : mm.finals ? 'islt' : ''}"><div class="row between pl28ah"><b>${weekRange28(w0)}</b><span class="row" style="gap:6px">${weekLabel28(mm)}<span class="xs dim">${blk ? esc(blk.name) : ''}</span></span></div><div class="pl28grid">${days}</div></div>`;
  }
  return h;
};
function planDaySheet28(k) {
  const t = today(), dp = dayPlan(k), ss = dp && !dp.off ? dp.sessions : [], m = inPlan(k) ? weekMeta(weekNum(k)) : null, st = dayStatus28(k, dp);
  let h = `<div class="pl28sh"><div class="row between"><div><div class="eyebrow">${k === t ? 'Today · ' : ''}${fmtLong(k)}</div><h3 style="margin:2px 0 0">${ss.length ? ss.map(s => esc(sName28(s))).join(' + ') : dp && dp.off ? esc(dp.off) : 'Rest day'}</h3></div>${st.lbl ? `<span class="pl28s ${st.cls}">${st.lbl}</span>` : ''}</div>`;
  if (m && (m.deload || m.finals)) h += `<div class="xs dim" style="margin-top:4px">${m.deload ? 'Deload week — lighter, leave reps in the tank.' : 'Lighter week — same intensity, less volume.'}</div>`;
  if (PLAN_NOTE28[k]) h += `<div class="xs" style="color:var(--warn);margin-top:4px">${esc(PLAN_NOTE28[k])}</div>`;
  ss.forEach(s => {
    const status = sessStatus(s), done = S.workouts.find(w => w.sessionKey === s.key) || (status === 'swapped' ? replacedBy(s.key) : null);
    h += `<div class="pl28sess"><div class="row between"><b>${esc(s.title)}</b><span class="small muted">~${s.min} min</span></div>${s.sub ? `<div class="xs dim">${esc(s.sub)}</div>` : ''}${exRows27(s, k)}`;
    if (done) h += `<button class="btn sec tap" data-a="viewSummary" data-id="${done.id}">${status === 'swapped' ? '↪ ' + esc(done.title) + ' · view' : 'View workout'}</button>`;
    else if (k === t && status !== 'done') h += s.kind === 'cardio' && s.cardio.mode === 'hockey' ? `<button class="btn big tap" data-a="quickDone" data-day="${k}" data-key="${s.key}">✓ Mark done</button>` : s.kind === 'test' ? `<button class="btn big tap" data-a="testSheet" data-key="${s.testKey}">Enter test results</button>` : `<button class="btn big tap" data-a="planStart" data-day="${k}" data-key="${s.key}">▶ Start workout</button>`;
    else if (k < t && status !== 'done' && canBackdate(k)) h += `<button class="btn sec tap" data-a="planLog" data-date="${k}">Log it for ${DOW[dow(k)]}</button>`;
    h += `</div>`;
  });
  const extra = S.workouts.filter(w => w.date === k && !ss.some(s => s.key === w.sessionKey) && !Object.values(S.schedule.replaced || {}).includes(w.id));
  extra.forEach(w => { h += `<button class="done27 tap" data-a="viewSummary" data-id="${w.id}"><div class="grow"><b>${esc(w.title)}</b><div class="xs dim">logged</div></div><span class="chev27">›</span></button>`; });
  if (!ss.length && !extra.length) h += `<div class="small muted" style="margin-top:8px">Recover: sleep, 10-min mobility. Hockey or a ride is fine if you feel good.</div>`;
  if (k > t && ss.length) h += `<div class="xs dim" style="margin-top:10px">Targets update after each workout you log.</div>`;
  return h + `</div>`;
}
ACT.planDay = (el, d) => { haptic(); openSheet(planDaySheet28(d.date), 'tall'); };
ACT.planStart = (el, d) => { closeSheet(); startSession(d.day, d.key); };
ACT.planLog = (el, d) => { closeSheet(); openNightly(d.date); };
