/* Arnold Fit v2.4 — discipline layer: daily non-negotiables (customizable), honest streak, never-miss-twice,
   evening check-off, Sunday check-in + history, coach commands */
'use strict';
const NN_DEFAULT = ['train', 'protein', 'mobility', 'devo', 'sleep'];
function discState() { if (!S.disc) S.disc = { commit: {}, checkin: {} }; S.disc.commit = S.disc.commit || {}; S.disc.checkin = S.disc.checkin || {}; return S.disc; }
const nnHabitId = id => id === 'devo' ? 'bible' : id;
function nnChoices() { // everything that can be a non-negotiable: training + each habit (devotional habit = 'devo')
  return [{ id: 'train', ic: '🏋️', label: 'Training (auto from your plan)' }].concat(S.settings.habits.map(h => ({ id: h.id === 'bible' ? 'devo' : h.id, ic: h.ic || '✅', label: h.label })));
}
function nnIds() {
  const valid = new Set(nnChoices().map(c => c.id)), ids = (Array.isArray(S.settings.nn) ? S.settings.nn : NN_DEFAULT).filter(i => valid.has(i));
  return ids.length ? ids : ['train'];
}
function nnItem(id, k) {
  const l = S.habitLog[k] || {};
  if (id === 'train') {
    const d = dayPlan(k), ss = d && !d.off ? d.sessions : [], sOk = s => sessStatus(s) === 'done' || !!(S.schedule.moves || {})[s.key];
    const meta = ss.length ? `${ss.filter(sOk).length}/${ss.length} session${ss.length > 1 ? 's' : ''}` : 'rest day';
    return { id, ic: '🏋️', label: `Training · ${ss.length ? meta : 'rest day (recover)'}`, short: 'Training', meta, ok: !ss.length || ss.every(sOk), auto: true };
  }
  if (id === 'protein') { const p = proteinFor(k); return { id, ic: '🥩', label: `Protein ≥${S.settings.protein} g · ${p} g`, short: 'Protein', main: `Protein ≥${S.settings.protein} g`, meta: `${p} g`, ok: p >= S.settings.protein || !!l.protein }; }
  if (id === 'devo') return { id, ic: '📖', label: 'Devotional', short: 'Devotional', meta: S.devo.done[k] ? 'auto' : '', ok: !!(S.devo.done[k] || l.bible), auto: !!S.devo.done[k] };
  const h = S.settings.habits.find(x => x.id === id) || { label: id, ic: '✅' };
  const label = id === 'sleep' ? '8 h sleep (last night)' : id === 'mobility' ? '10-min mobility' : h.label;
  return { id, ic: h.ic || '✅', label, short: label.split(' (')[0], main: id === 'sleep' ? '8 h sleep' : label, meta: id === 'sleep' ? 'last night' : '', ok: !!l[id] };
}
function nnDay(k) { const items = nnIds().map(id => nnItem(id, k)), n = items.filter(i => i.ok).length; return { items, n, total: items.length, all: n === items.length }; }
function nnStreak() { const t = today(); let k = nnDay(t).all ? t : addDays(t, -1), n = 0; while (k >= PLAN_START && nnDay(k).all && n < 999) { n++; k = addDays(k, -1); } return n; }
function nnBest() { let best = 0, run = 0; for (let k = PLAN_START; k <= today() && k <= PLAN_END; k = addDays(k, 1)) { if (nnDay(k).all) { run++; best = Math.max(best, run); } else run = 0; } return best; }
function nnMisses() { const t = today(), y = addDays(t, -1), y2 = addDays(t, -2); const m1 = y >= PLAN_START && !nnDay(y).all, m2 = m1 && y2 >= PLAN_START && !nnDay(y2).all; return { m1, m2, y }; }
function nnBanner() {
  const m = nnMisses(); if (!m.m1 || nnDay(today()).all) return '';
  const miss = nnDay(m.y).items.filter(i => !i.ok).map(i => i.short).join(', ');
  return m.m2 ? `<div class="nmt bad" id="nmtBanner"><b>🚨 Missed 2 days in a row.</b> No guilt, just a reset: hit all ${nnIds().length} non-negotiables today and the streak starts again.</div>`
    : `<div class="nmt" id="nmtBanner"><b>⚠️ Never miss twice.</b> Yesterday missed: ${esc(miss)}. Today is non-negotiable.</div>`;
}
function reminderMin() { const r = S.settings.reminder || {}; if (r.on === false) return 99 * 60; const [h, m] = String(r.time || '20:00').split(':').map(Number); return h * 60 + (m || 0); }
const TIME_OVERRIDE = (new URLSearchParams(location.search).get('time') || '').match(/^(\d{1,2}):(\d{2})$/); // ?time=07:30 for testing/screenshots
function nowMin() { if (TIME_OVERRIDE) return +TIME_OVERRIDE[1] * 60 + +TIME_OVERRIDE[2]; const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function isEvening() { return nowMin() >= reminderMin(); }
function nnPips(nn) { return `<span class="pips" aria-label="${nn.n} of ${nn.total} done">${nn.items.map(i => `<i class="${i.ok ? 'on' : ''}"></i>`).join('')}<b>${nn.n}/${nn.total}</b></span>`; }
function doNowCard(k) {
  const day = dayPlan(k), nn = nnDay(k), D = discState(), eve = isEvening();
  const todo = day && !day.off ? day.sessions.filter(s => sessStatus(s) === 'todo' && !(S.schedule.moves || {})[s.key]) : [];
  let ic = '✅', t = 'All non-negotiables done', sub = 'Day won. Protect sleep tonight.', act = '', extra = '';
  if (S.active) { ic = '⏱️'; t = `Finish ${esc(S.active.title)}`; sub = 'Workout in progress — pick up where you left off.'; act = `<button class="btn tap" data-a="resume">Resume workout</button>`; }
  else if (eve && !nn.all) {
    const open = nn.items.filter(i => !i.ok); ic = '🌙'; t = 'Evening check-off'; sub = `${open.length} left — close out the day honestly.`;
    extra = `<div class="dn-chips">${open.map(i => i.id === 'train' ? (todo[0] ? `<button class="chip tap" data-a="nnGoSess" data-key="${todo[0].key}">${i.ic} ${esc(todo[0].title)}</button>` : '') : i.id === 'devo' ? `<button class="chip tap" data-a="openDevo" data-k="${k}">${i.ic} Devotional</button>` : `<button class="chip tap" data-a="nnTog" data-id="${i.id}" data-date="${k}">${i.ic} ${esc(i.short)} ✓</button>`).join('')}</div>`;
  }
  else if (!D.commit[k] && !nn.all) { ic = '🤝'; t = 'Commit to today'; sub = `${nn.total - nn.n} non-negotiable${nn.total - nn.n === 1 ? '' : 's'} to hit${todo.length ? ` · first up: ${esc(todo[0].title)}` : ''}.`; act = `<button class="btn tap" data-a="nnCommit">I commit to today</button>`; }
  else if (todo.length) { ic = todo[0].kind === 'lift' ? '🏋️' : todo[0].kind === 'test' ? '📋' : { run: '🏃', swim: '🏊', bike: '🚴', hockey: '🏒', walk: '🚶' }[todo[0].cardio && todo[0].cardio.mode] || '🏋️'; t = esc(todo[0].title); sub = `~${todo[0].min} min${todo.length > 1 ? ` · +${todo.length - 1} more today` : ''}`; act = `<button class="btn tap" data-a="nnGoSess" data-key="${todo[0].key}">Let’s go</button>`; }
  else if (!nn.all) { const i = nn.items.find(x => !x.ok); ic = i.ic; t = esc(i.short); sub = 'Next non-negotiable.'; act = nnBtn(i, k); }
  return `<section class="card donow" id="doNow" aria-label="Do now"><div class="row between"><span class="chip grad">Do now</span>${nnPips(nn)}</div>${nnBanner()}<div class="dn-main"><div class="dn-ic" aria-hidden="true">${ic}</div><div class="grow"><div class="dn-t">${t}</div><div class="dn-s">${sub}</div></div></div>${extra}${act ? `<div class="dn-act">${act}</div>` : ''}</section>`;
}
function nnBtn(i, k) {
  if (i.id === 'train') return `<button class="btn tap" data-a="goTab" data-tab="train">Open Train</button>`;
  if (i.id === 'devo') return `<button class="btn tap" data-a="openDevo" data-k="${k}">Open devotional</button>`;
  if (i.id === 'mobility') return `<button class="btn tap" data-a="mobSheet">Start 10-min mobility</button>`;
  if (i.id === 'protein') return `<button class="btn tap" data-a="goTab" data-tab="food">Log food</button>`;
  return `<button class="btn tap" data-a="nnTog" data-id="${i.id}" data-date="${k}">Mark done ✓</button>`;
}
function nnCard(k) {
  const nn = nnDay(k), st = nnStreak(), D = discState(), eve = isEvening();
  const head = eve ? 'Evening check-off' : D.commit[k] ? 'Committed ✓ — now execute' : 'Morning: commit, then execute';
  return `<div class="card" id="nnCard"><div class="row between" style="align-items:flex-start"><div class="grow"><div class="card-t">Daily non-negotiables</div><div class="xs dim">${head}</div></div><div style="text-align:right"><div class="streak sm" id="nnStreak">🔥 ${st} day${st === 1 ? '' : 's'}</div><div class="xs dim">all ${nn.total} met · honest</div></div></div><div class="nnlist">${nn.items.map(i => `<button class="habit nn ${i.ok ? 'on' : ''}" data-a="${i.id === 'train' ? 'goTab' : i.id === 'devo' ? 'openDevo' : 'nnTog'}" data-tab="train" data-k="${k}" data-id="${i.id}" data-date="${k}" aria-pressed="${i.ok}" aria-label="${esc(i.label)}"><span class="ck">${CHECK}</span><span class="nn-ic" aria-hidden="true">${i.ic}</span><span class="grow">${esc(i.main || i.short)}</span>${i.meta ? `<span class="nn-meta">${esc(i.meta)}</span>` : ''}</button>`).join('')}</div></div>`;
}
/* ---------- Sunday weekly check-in ---------- */
function weekAdh(ws, upto) { let full = 0, items = 0, days = 0; for (let i = 0; i < 7; i++) { const dk = addDays(ws, i); if (dk > upto || dk < PLAN_START) continue; const nn = nnDay(dk); days++; items += nn.n / nn.total; if (nn.all) full++; } return { full, days, score: days ? Math.round(items / days * 100) : 0 }; }
function weekStats(ws, k) {
  const endK = addDays(ws, 6) < k ? addDays(ws, 6) : k, av = avgWeight(endK), prev = avgWeight(addDays(endK, -7));
  const knees = [...Array(7)].map((_, i) => (S.body[addDays(ws, i)] || {}).knee).filter(v => v != null);
  return { endK, av, prev, kAvg: knees.length ? knees.reduce((a, b) => a + b, 0) / knees.length : null, a: weekAdh(ws, endK) };
}
function checkinWs(k) { const d = dow(k); return d === 6 ? weekStart(k) : d === 0 ? weekStart(addDays(k, -1)) : null; }
function checkinVerdict(score) { return score >= 85 ? 'Strong week. Keep the plan exactly as is.' : score >= 65 ? 'Decent. Pick the one non-negotiable you missed most and pre-plan it.' : 'Rough week. Shrink the target: just hit every non-negotiable tomorrow.'; }
function checkinCard(k) {
  const D = discState(), ws = checkinWs(k);
  if (!ws || ws < weekStart(PLAN_START)) return '';
  const done = D.checkin[ws]; if (done && dow(k) !== 6) return '';
  const { av, prev, kAvg, a } = weekStats(ws, k);
  return `<div class="card goldbox" id="checkin"><div class="row between"><span class="chip gold">🗓️ Weekly check-in</span>${done ? `<span class="sbadge">${CHECK}</span>` : `<span class="xs dim">2 min</span>`}</div><div class="ci-grid"><div><div class="xs dim">Weight 7-day avg</div><b id="ciW">${av ? U.wOut(av.v.toFixed(1)) + ' ' + wu() : '—'}</b>${av && prev ? `<div class="xs dim">${(av.v - prev.v >= 0 ? '+' : '') + U.wOut((av.v - prev.v).toFixed(1))} vs last wk</div>` : ''}</div><div><div class="xs dim">Adherence</div><b id="ciA">${a.score}%</b><div class="xs dim">${a.full}/${a.days} perfect days</div></div><div><div class="xs dim">Knee avg</div><b id="ciK">${kAvg == null ? '—' : kAvg.toFixed(1) + '/10'}</b></div><div><label class="xs dim" for="ci-waist">Waist (${lu()})</label><input class="inp" id="ci-waist" type="number" inputmode="decimal" step="0.25" value="${done && done.waist != null ? U.lOut(done.waist) : ''}" placeholder="${lu() === 'cm' ? 'e.g. 88' : 'e.g. 34.5'}"></div></div><div class="small muted" style="margin-top:12px">${checkinVerdict(a.score)}</div><button class="btn sm tap" style="margin-top:12px" data-a="saveCheckin" data-ws="${ws}">${done ? 'Update check-in' : 'Save check-in'}</button></div>`;
}
function saveCheckinRec(ws, waistIn) {
  const k = today(), { av, kAvg, a } = weekStats(ws, k), D = discState(), old = D.checkin[ws] || {};
  D.checkin[ws] = { ts: Date.now(), waist: waistIn != null ? +(+waistIn).toFixed(2) : (old.waist ?? null), avg: av ? +av.v.toFixed(2) : null, knee: kAvg == null ? null : +kAvg.toFixed(1), adh: a.score, full: a.full };
  if (waistIn != null) (S.body[k] = S.body[k] || {}).waist = +(+waistIn).toFixed(2);
  save(); return D.checkin[ws];
}
function checkinRows() { const C = discState().checkin; return Object.keys(C).sort().reverse().map(ws => ({ ws, ...C[ws] })); }
/* ---------- mobility sheet + evening reminder calendar file ---------- */
function mobSheetHtml() {
  const k = today(), on = !!(S.habitLog[k] || {}).mobility;
  return `<h3>🧘 10-min mobility</h3><div class="small muted" style="margin-bottom:12px">Knee-friendly. Pain stays ≤3/10.</div><ul class="clean steps-list">${MOBILITY.map((x, i) => `<li><span class="num">${i + 1}</span>${esc(x)}</li>`).join('')}</ul><button class="btn ${on ? 'ghost' : 'markdone'} tap" style="margin-top:16px" data-a="mobDone">${on ? '✓ Done today — tap to undo' : 'Mark mobility done ✓'}</button>`;
}
const REMINDER_TIMES = ['18:00', '19:00', '20:00', '20:30', '21:00', '21:30', '22:00'];
const fmtClock = t => { const [h, m] = t.split(':').map(Number); return `${(h + 11) % 12 + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const reminderIcs = t => `reminders/evening-${t.replace(':', '')}.ics`;
/* ---------- actions ---------- */
ACT.nnCommit = () => { discState().commit[today()] = Date.now(); save(); haptic(15); toast('Committed. Now execute. 🤝'); rerenderKeep(); };
function nnToggle(k, id, force) { const l = S.habitLog[k] = S.habitLog[k] || {}, hid = nnHabitId(id); const on = force == null ? !l[hid] : force; if (on) l[hid] = true; else delete l[hid]; save(); return on; }
ACT.nnTog = (el, d) => { const k = d.date || today(), on = nnToggle(k, d.id); haptic(on ? 12 : 6); rerenderKeep(); if (on && nnDay(k).all) { toast(`All ${nnIds().length} non-negotiables done 🔥`); confetti(); } };
ACT.nnGoSess = (el, d) => { const c = document.querySelector(`[data-sess="${d.key}"]`); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1200); } };
ACT.saveCheckin = (el, d) => { const w = $('#ci-waist').value; saveCheckinRec(d.ws, w === '' ? null : U.lIn(w)); haptic(15); toast('Weekly check-in saved ✓'); rerenderKeep(); };
ACT.mobSheet = () => openSheet(mobSheetHtml());
ACT.mobDone = () => { const k = today(), on = nnToggle(k, 'mobility'); haptic(on ? 15 : 6); closeSheet(); rerenderKeep(); toast(on ? 'Mobility done ✓' : 'Mobility unchecked'); if (on && nnDay(k).all) confetti(); };
/* ---------- coach commands (wired in coach.js) ---------- */
const NN_WORDS = [[/mobility|stretch(?:ing|ed)?/, 'mobility'], [/sleep|slept/, 'sleep'], [/protein/, 'protein'], [/devotional|devo|bible|quiet time|scripture/, 'devo'], [/steps/, 'steps'], [/creatine/, 'creatine'], [/water|hydrat/, 'water'], [/alcohol|sober|drink/, 'noalc'], [/weigh/, 'weigh'], [/workout|training|trained|lift(?:ed)?|session/, 'train']];
function nnFromText(t) { for (const [re, id] of NN_WORDS) if (re.test(t)) return id; const h = S.settings.habits.find(x => t.includes(x.label.toLowerCase())); return h ? (h.id === 'bible' ? 'devo' : h.id) : null; }
function cmdNNStatus() {
  const k = today(), nn = nnDay(k), m = nnMisses(), st = nnStreak();
  let txt = `**Non-negotiables today: ${nn.n}/${nn.total}**\n` + nn.items.map(i => `${i.ok ? '✅' : '⬜'} ${i.label}`).join('\n');
  txt += `\nHonest streak: **${st} day${st === 1 ? '' : 's'}** (best ${nnBest()}).`;
  if (nn.all) txt += '\nDay won. 🔥'; else if (m.m2) txt += '\n🚨 Two misses in a row — reset today: hit every item.'; else if (m.m1) txt += '\n⚠️ You missed yesterday. Never miss twice — today counts double.';
  if (!discState().commit[k] && !nn.all) txt += '\nSay **commit** to lock in today.';
  return { text: txt };
}
function cmdNNMark(t, on) {
  const id = nnFromText(t), k = today(); if (!id) return null;
  if (id === 'train') return { text: 'Training checks itself off when you finish (or mark done) today’s session on Today or Train — nothing to tick here.' };
  if (id === 'devo' && on === false && S.devo.done[k]) { delete S.devo.done[k]; }
  const has = id === 'devo' || S.settings.habits.some(h => h.id === id); if (!has) return { text: `“${id}” isn’t one of your habits. Add it in Settings → Habits.` };
  nnToggle(k, id, on); const it = nnItem(id, k), nn = nnDay(k), isNN = nnIds().includes(id);
  return { text: `${on ? '✅ Marked' : '↶ Unmarked'} **${it.short}** for today.${isNN ? ` Non-negotiables: **${nn.n}/${nn.total}**${nn.all ? ' — day won 🔥' : ''}.` : ''}` };
}
function cmdCommit() { discState().commit[today()] = Date.now(); save(); const nn = nnDay(today()); return { text: `🤝 Committed. ${nn.total - nn.n} to go today: ${nn.items.filter(i => !i.ok).map(i => i.short).join(', ') || 'nothing — day already won'}.` }; }
function cmdCheckin() {
  const k = today(), ws = checkinWs(k) || weekStart(k), { av, prev, kAvg, a } = weekStats(ws, k), done = discState().checkin[ws];
  let txt = `**Weekly check-in · week of ${fmtDate(ws)}**\n• Weight 7-day avg: ${av ? `**${U.wOut(av.v.toFixed(1))} ${wu()}**${prev ? ` (${av.v - prev.v >= 0 ? '+' : ''}${U.wOut((av.v - prev.v).toFixed(1))} vs last week)` : ''}` : 'no weigh-ins yet'}\n• Adherence: **${a.score}%** · ${a.full}/${a.days} perfect days\n• Knee avg: ${kAvg == null ? '—' : kAvg.toFixed(1) + '/10'}\n• Waist: ${done && done.waist != null ? U.lOut(done.waist) + ' ' + lu() : 'not logged — say “waist 34.5”'}\n${checkinVerdict(a.score)}`;
  if (av && prev) { const drop = prev.v - av.v; txt += drop < 0.5 ? '\nFat loss is #1: weekly drop under 0.5 lb — tighten food logging before cutting calories.' : drop > 1.5 ? '\nDropping fast (>1.5 lb/wk) — eat a bit more to protect bench strength.' : '\nRate is in the 0.5–1.5 lb sweet spot. Hold.'; }
  return { text: txt };
}
function cmdWaist(v) { const inch = U.lIn(+v); if (!(inch > 15 && inch < 80)) return { text: 'That waist number looks off — try e.g. “waist 34.5”.' }; const ws = checkinWs(today()) || weekStart(today()); saveCheckinRec(ws, inch); return { text: `📏 Waist **${U.lOut(inch)} ${lu()}** logged for today and saved to this week’s check-in.` }; }
