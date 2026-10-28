/* Arnold Fit v2.5 — backdating (calendar + nightly log for the last 7 days), quick-add activities that replace the
   planned session (hockey / bike / run / swim / walk / other), top-set-only lift logging, week summary, training rule,
   collapsible sections. Loads after the views and before boot.js. Additive only: nothing here rewrites old records. */
'use strict';
const BACKDATE_DAYS = 7;
const CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const TRAIN_RULES = ['Hockey or a hard ride can replace a lift day — log it with ↪ Swap.', 'Keep at least 2 lifts every week (Upper A heavy bench + one more).', 'No heavy lower body within 48 h of hard hockey or a hard ride (effort ≥7).'];
const TRAIN_RULE = 'Training rule: hockey or a hard ride can replace a lift — but keep at least 2 lifts a week, and no heavy lower body within 48 h of hard hockey or a hard ride.';
const QA_TYPES = {
  hockey: { ic: '🏒', label: 'Hockey', mode: 'hockey', color: 'hockey', dur: 75, rpe: 8, dist: null },
  bike: { ic: '🚵', label: 'Bike', mode: 'bike', color: 'bike', dur: 60, rpe: 7, dist: 'd', subs: [['mtb', 'MTB'], ['stationary', 'Stationary']] },
  run: { ic: '🏃', label: 'Run', mode: 'run', color: 'run', dur: 30, rpe: 6, dist: 'd' },
  swim: { ic: '🏊', label: 'Swim', mode: 'swim', color: 'swim', dur: 30, rpe: 6, dist: 's' },
  walk: { ic: '🚶', label: 'Walk', mode: 'walk', color: 'bike', dur: 45, rpe: 3, dist: 'd' },
  other: { ic: '⚡', label: 'Other', mode: 'other', color: 'lift', dur: 45, rpe: 6, dist: null },
};
const QA_DURS = [30, 45, 60, 75, 90, 120];
const RPE_TXT = ['', 'very easy', 'easy', 'easy', 'moderate', 'moderate', 'somewhat hard', 'hard', 'very hard', 'very, very hard', 'max'];
MODE_LABEL.other = 'Activity';

const canBackdate = k => !!k && k <= today() && diffDays(k, today()) <= BACKDATE_DAYS;
function atTime(k, h, m = 0) { const d = pkey(k); d.setHours(h, m, 0, 0); return d.getTime(); }
const qaWorkouts = k => S.workouts.filter(w => w.date === k && w.quick && w.swap);
function qaExtras(k) { const rep = new Set(Object.values(S.schedule.replaced || {})); return qaWorkouts(k).filter(w => !rep.has(w.id)); }

/* ---------- collapsible sections (open state kept per session) ---------- */
function foldSec(id, ic, title, meta, body, defOpen = false) {
  const open = UI.fold[id] ?? defOpen;
  return `<details class="fold" data-fold="${id}" ${open ? 'open' : ''}><summary class="tap"><span class="fic">${ic}</span><b class="grow">${esc(title)}</b><span class="small dim fmeta">${meta || ''}</span><span class="chev" aria-hidden="true">›</span></summary><div class="fold-b">${body}</div></details>`;
}
document.addEventListener('toggle', ev => { const d = ev.target; if (d && d.dataset && d.dataset.fold) UI.fold[d.dataset.fold] = d.open; }, true);

/* ---------- training rule: hard hockey / hard ride vs heavy lower body ---------- */
function isHardAct(w) {
  const c = w && w.cardio; if (!c || w.kind === 'lift') return false;
  if (c.mode === 'hockey') return c.rpe == null || c.rpe >= 6;
  if (c.mode === 'bike') return c.rpe != null && c.rpe >= 7;
  return false;
}
function hardActsNear(k) { const from = addDays(k, -2); return S.workouts.filter(w => w.date >= from && w.date <= k && isHardAct(w)); }
function lowerRuleTips(k) {
  const d = dayPlan(k); if (!d || d.off) return '';
  const low = d.sessions.find(s => isLowerS(s) && sessStatus(s) === 'todo'); if (!low) return '';
  const acts = hardActsNear(k); if (!acts.length) return '';
  const a = acts.reduce((x, y) => (y.date > x.date ? y : x)), gap = diffDays(a.date, k), what = `${esc(a.title)}${a.cardio.rpe ? ' (effort ' + a.cardio.rpe + ')' : ''} ${gap === 0 ? 'today' : gap === 1 ? 'yesterday' : 'two days ago'}`;
  if (gap <= 1) return `<div class="tip bad"><div class="ic">🛑</div><div class="grow">${what} — <b>no heavy lower body within 48 h</b>. Move ${esc(low.title)} a day or two, or keep it very light.<div style="margin-top:8px"><button class="btn sm sec tap" data-a="moveSheet" data-key="${low.key}">Move ${esc(low.title)}</button></div></div></div>`;
  return `<div class="tip"><div class="ic">⚠️</div><div>${what} — right at the 48-h line. Keep ${esc(low.title)} crisp, not grinding.</div></div>`;
}
function lowerSoon(k) { // todo lower sessions in the next 2 days (for the quick-add warning)
  const out = []; for (let i = 0; i <= 2; i++) { const d = addDays(k, i), p = dayPlan(d); if (p && !p.off) p.sessions.forEach(s => { if (isLowerS(s) && sessStatus(s) === 'todo') out.push({ s, d }); }); } return out;
}

/* ---------- week summary + lift floor ---------- */
function liftWeek(k) {
  const ws = weekStart(k), we = addDays(ws, 6), t = today();
  const done = S.workouts.filter(w => w.kind === 'lift' && w.date >= ws && w.date <= we).length;
  let left = 0; for (let d = t > ws ? t : ws; d <= we; d = addDays(d, 1)) { const p = dayPlan(d); if (p && !p.off) left += p.sessions.filter(s => s.kind === 'lift' && sessStatus(s) === 'todo').length; }
  return { done, left };
}
function wsumStats(ws, endK) {
  const days = []; for (let d = ws; d <= endK && d <= addDays(ws, 6); d = addDays(d, 1)) days.push(d);
  const wos = S.workouts.filter(w => w.date >= ws && w.date <= endK);
  const mins = wos.reduce((a, w) => a + (w.kind === 'lift' ? ((w.summary && w.summary.durMin) || 0) : ((w.cardio && w.cardio.dur) || (w.summary && w.summary.durMin) || 0)), 0);
  const prot = days.filter(d => nnItem('protein', d).ok).length;
  const kc = days.map(kcalFor).filter(v => v != null);
  return { days: days.length, sessions: wos.length, mins: Math.round(mins), prot, kcal: kc.length ? Math.round(kc.reduce((a, b) => a + b, 0) / kc.length) : null, kcalN: kc.length };
}
function weekSumCard(k, withLast) {
  const ws = weekStart(k), st = wsumStats(ws, k), lw = liftWeek(k), sk = nnStreak();
  const liftCls = lw.done >= 2 ? 'ok' : lw.done + lw.left >= 2 ? '' : 'bad';
  let h = `<h2 class="sec">This week <small>${fmtDate(ws)}–${fmtDate(addDays(ws, 6))}</small></h2><div class="card wsum"><div class="wsum-g">
    <div><b>${st.sessions}</b><span>sessions</span></div><div><b>${st.mins}</b><span>minutes</span></div><div><b>${st.prot}/${st.days}</b><span>protein days</span></div><div class="${liftCls}"><b>${lw.done}/2</b><span>lifts (min)</span></div></div>
    <div class="row between small" style="margin-top:10px"><span>🔥 Streak <b>${sk} day${sk === 1 ? '' : 's'}</b> <span class="dim">(swaps count)</span></span>${st.kcal != null ? `<span class="dim">avg ${fmtNum(st.kcal)} kcal · ${st.kcalN}d</span>` : ''}</div>`;
  if (lw.done < 2 && lw.done + lw.left < 2) h += `<div class="tip bad" style="margin:10px 0 0"><div class="ic">🏋️</div><div>Only ${lw.done + lw.left} lift${lw.done + lw.left === 1 ? '' : 's'} left on the plan this week — keep at least 2. Move one instead of swapping it.</div></div>`;
  h += `<details class="rule"><summary class="tap small">🏒 Rule: hockey/ride can replace a lift · ≥2 lifts/wk · no heavy legs within 48 h of hard hockey/ride</summary><ul class="clean small">${TRAIN_RULES.map(r => `<li>• ${esc(r)}</li>`).join('')}</ul></details>`;
  if (withLast) { const p = addDays(ws, -7), l = wsumStats(p, addDays(p, 6)); h += `<div class="xs dim" style="margin-top:8px">Last week: ${l.sessions} sessions · ${l.mins} min · ${l.prot}/7 protein days${l.kcal != null ? ` · avg ${fmtNum(l.kcal)} kcal` : ''}</div>`; }
  return h + `</div>`;
}
function extraActsCard(k) {
  const ex = qaExtras(k);
  let h = ex.map(w => `<div class="card flat xact"><div class="row between"><div class="row" style="gap:8px"><span class="dot c-${w.color}"></span><b>${esc(w.title)}</b><span class="small muted">${w.cardio.dur || 0}′${w.cardio.rpe ? ' · effort ' + w.cardio.rpe : ''}</span></div><button class="btn sm sec tap" data-a="undoSwap" data-id="${w.id}">Remove</button></div></div>`).join('');
  return h + `<button class="btn sec tap addact" data-a="qaOpen" data-date="${k}" data-extra="1">＋ Log hockey, a ride or another activity</button>`;
}

/* ---------- calendar (backdate up to 7 days) ---------- */
function calDot(k) {
  if (k > today()) return '';
  if (k >= PLAN_START && inPlan(k) && nnDay(k).all) return 'full';
  const l = S.habitLog[k] || {}, b = S.body[k];
  const any = S.workouts.some(w => w.date === k) || Object.values(l).some(Boolean) || (b && (b.weight || b.knee != null || b.mfp)) || foodDay(k).length || (S.nightly || {})[k] || S.devo.done[k];
  return any ? 'part' : '';
}
function calHtml() {
  const t = today(), m = UI.calMonth || t.slice(0, 7), first = m + '-01', mm = +m.slice(5, 7);
  const lbl = pkey(first).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  let cells = ''; let d = weekStart(first);
  for (let i = 0; i < 42; i++, d = addDays(d, 1)) {
    if (i % 7 === 0 && i && +d.slice(5, 7) !== mm && d > first) break;
    const inM = +d.slice(5, 7) === mm, can = canBackdate(d), dot = calDot(d);
    cells += `<button class="cd tap ${inM ? '' : 'om'} ${d === t ? 'today' : ''} ${can ? 'can' : ''}" ${can ? `data-a="calPick" data-date="${d}"` : 'disabled'} aria-label="${fmtLong(d)}${dot ? ' · logged' : ''}"><span>${pkey(d).getDate()}</span><i class="cdot ${dot}"></i></button>`;
  }
  return `<div id="cal"><h3>Log a past day</h3><div class="small muted" style="margin-bottom:10px">Pick today or any of the last ${BACKDATE_DAYS} days to open its nightly log.</div>
  <div class="row between calnav"><button class="icon-btn tap" data-a="calMonth" data-v="-1" aria-label="Previous month">‹</button><b>${lbl}</b><button class="icon-btn tap" data-a="calMonth" data-v="1" aria-label="Next month">›</button></div>
  <div class="calg">${DOW.map(x => `<span class="cdh">${x[0]}</span>`).join('')}${cells}</div>
  <div class="row wrap small dim" style="gap:14px;margin-top:10px"><span><i class="cdot full"></i> all non-negotiables</span><span><i class="cdot part"></i> something logged</span><span>faded = outside the 7-day window</span></div></div>`;
}
ACT.calSheet = () => { UI.calMonth = null; openSheet(calHtml()); };
ACT.calMonth = (el, d) => { const m = UI.calMonth || today().slice(0, 7); const dt = pkey(m + '-01'); dt.setMonth(dt.getMonth() + +d.v); UI.calMonth = dkey(dt).slice(0, 7); $('#cal').outerHTML = calHtml(); };
ACT.calPick = (el, d) => openNightly(d.date);

/* ---------- nightly log (one screen, any of the last 7 days) ---------- */
function nlTrainRows(k) {
  const dp = dayPlan(k), ss = dp && !dp.off ? dp.sessions : [];
  let h = '';
  ss.forEach(s => {
    const st = sessStatus(s);
    if (s.kind === 'test') { h += `<div class="nlrow"><span class="dot c-${s.color}"></span><div class="grow"><b>${esc(s.title)}</b></div><button class="btn sm sec tap" data-a="testSheet" data-key="${s.testKey}">${testDone(s.testKey) ? 'Edit' : 'Results'}</button></div>`; return; }
    if (st === 'done') { const w = sessionDone(s.key); h += `<div class="nlrow ok"><span class="nlck">✓</span><div class="grow"><b>${esc(s.title)}</b><div class="xs dim">done${w.quickTop ? ' · top sets' : ''}</div></div><button class="btn sm sec tap" data-a="nlUndoDone" data-id="${w.id}" data-date="${k}">Undo</button></div>`; return; }
    if (st === 'swapped') { const r = s.replaced || replacedBy(s.key); h += `<div class="nlrow ok"><span class="nlck">↪</span><div class="grow"><b>${esc(s.title)}</b><div class="xs dim">swapped → ${esc(r.title)} · ${r.cardio.dur || 0}′${r.cardio.rpe ? ' · effort ' + r.cardio.rpe : ''}</div></div><button class="btn sm sec tap" data-a="undoSwap" data-id="${r.id}">Undo</button></div>`; return; }
    const did = s.kind === 'lift' ? `data-a="liftLog" data-day="${k}" data-key="${s.key}"` : `data-a="nlCardioDone" data-day="${k}" data-key="${s.key}"`;
    h += `<div class="nlrow"><span class="dot c-${s.color}"></span><div class="grow"><b>${esc(s.title)}</b><div class="xs dim">${st === 'skipped' ? 'skipped' : 'planned'} · ~${s.min}′</div></div></div><div class="row nlbtns"><button class="btn tap grow" ${did}>${s.kind === 'lift' ? 'Did it · log top sets' : 'Did it ✓'}</button><button class="btn sec tap grow" data-a="qaOpen" data-date="${k}" data-key="${s.key}">↪ Swapped</button></div>`;
  });
  qaExtras(k).forEach(w => { h += `<div class="nlrow ok"><span class="nlck">＋</span><div class="grow"><b>${esc(w.title)}</b><div class="xs dim">${w.cardio.dur || 0}′${w.cardio.rpe ? ' · effort ' + w.cardio.rpe : ''}</div></div><button class="btn sm sec tap" data-a="undoSwap" data-id="${w.id}">Undo</button></div>`; });
  if (!ss.length && !qaExtras(k).length) h += `<div class="small muted" style="margin:4px 0 8px">${dp && dp.off ? 'Day off (' + esc(dp.off) + ')' : 'Rest day'} — nothing planned.</div>`;
  return h + `<button class="btn sec tap" style="margin-top:8px" data-a="qaOpen" data-date="${k}" data-extra="1">＋ Add activity (hockey, ride, run…)</button>`;
}
function nlYNHtml(k) {
  const ans = ((S.nightly || {})[k] || {}).ans || {}, m = mfpFor(k) || {};
  return `<div id="nl-yn">` + nnIds().filter(id => id !== 'train').map(id => {
    const it = nnItem(id, k), no = !it.ok && ans[id] === false;
    const label = id === 'protein' ? `Protein ≥${S.settings.protein} g${m.p != null ? ` · <span class="${m.p >= S.settings.protein ? 'okc' : 'dim'}">${m.p} g</span>` : ''}` : esc(it.main || it.label);
    return `<div class="yn"><span class="ynic">${it.ic}</span><div class="grow"><b>${label}</b>${it.auto && it.ok && id !== 'protein' ? '<div class="xs dim">auto ✓</div>' : id === 'protein' && m.p != null && m.p >= S.settings.protein ? '<div class="xs dim">auto ✓ from grams</div>' : ''}</div><button class="tap ${it.ok ? 'on yes' : ''}" data-a="nlYN" data-date="${k}" data-id="${id}" data-v="1" aria-pressed="${it.ok}">Yes</button><button class="tap ${no ? 'on no' : ''}" data-a="nlYN" data-date="${k}" data-id="${id}" data-v="0" aria-pressed="${no}">No</button></div>`;
  }).join('') + `</div>`;
}
function nightlyHtml(k) {
  const t = today(), prev = addDays(k, -1), next = addDays(k, 1), b = S.body[k] || {}, m = mfpFor(k) || {}, saved = ((S.nightly || {})[k] || {}).ts;
  return `<div id="nightly" data-date="${k}"><div class="row nlhead"><button class="icon-btn tap" data-a="nlDay" data-date="${prev}" ${canBackdate(prev) ? '' : 'disabled'} aria-label="Previous day">‹</button><div class="grow" style="text-align:center;min-width:0"><div class="eyebrow">🌙 Nightly log${saved ? ' · saved' : ''}</div><b style="font-size:17px">${k === t ? 'Today · ' + fmtDate(k) : pkey(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b></div><button class="icon-btn tap" data-a="nlDay" data-date="${next}" ${next <= t ? '' : 'disabled'} aria-label="Next day">›</button><button class="icon-btn tap" data-a="calSheet" aria-label="Calendar">${CAL_ICON}</button></div>
  <h4 class="nlsec">Training</h4>${nlTrainRows(k)}
  <h4 class="nlsec">Non-negotiables</h4>${nlYNHtml(k)}
  <h4 class="nlsec">Food totals <small class="dim">optional · from MyFitnessPal</small></h4>
  <div class="grid2"><div class="field"><label>Calories</label><input class="inp" id="nl-kcal" data-nl="1" data-date="${k}" type="number" inputmode="numeric" min="0" max="10000" placeholder="2,500–2,600" value="${m.kcal ?? ''}"></div><div class="field"><label>Protein g</label><input class="inp" id="nl-p" data-nl="1" data-date="${k}" type="number" inputmode="numeric" min="0" max="600" placeholder="190" value="${m.p ?? ''}"></div></div>
  <div class="xs dim" style="margin-top:6px">Targets: 2,500–2,600 kcal · ${S.settings.protein} g protein. ${S.settings.protein} g or more marks protein ✓ automatically.</div>
  <div class="field" style="margin-top:12px"><label>Weight (${wu()}) <small class="dim">optional</small></label><input class="inp" id="nl-w" data-nl="1" data-date="${k}" type="number" inputmode="decimal" step="0.1" placeholder="${esc(U.wOut(lastWeight()))}" value="${b.weight ? esc(U.wOut(b.weight)) : ''}"></div>
  <button class="btn tap" style="margin-top:16px" data-a="nlDone" data-date="${k}">Save day ✓</button></div>`;
}
function openNightly(k) { if (!canBackdate(k)) return toast(`You can log the last ${BACKDATE_DAYS} days`); UI.nlK = k; openSheet(nightlyHtml(k), 'tall'); }
function refreshNightly(k) { const n = $('#nightly'); if (n) { const kk = k || n.dataset.date, sh = n.closest('.sheet'), y = sh ? sh.scrollTop : 0; n.outerHTML = nightlyHtml(kk); if (sh) sh.scrollTop = y; } }
function returnToNightly() { const k = UI.nlReturn; UI.nlReturn = null; if (k) { openNightly(k); return true; } return false; }
function applyNlInputs(k) { // returns false on invalid input
  const g = id => { const i = $('#' + id); return i ? i.value.trim() : null; };
  const kc = g('nl-kcal'), p = g('nl-p'), wv = g('nl-w'); if (kc == null) return true;
  if (kc !== '' && !(+kc >= 0 && +kc <= 10000)) { toast('Check the calories'); return false; }
  if (p !== '' && !(+p >= 0 && +p <= 600)) { toast('Check the protein grams'); return false; }
  const b = S.body[k] = S.body[k] || {};
  if (kc === '' && p === '') delete b.mfp; else b.mfp = { kcal: kc === '' ? null : Math.round(+kc), p: p === '' ? null : Math.round(+p) };
  if (wv !== '' && wv != null) { const lb = U.wIn(wv); if (!(lb >= 80 && lb <= 500)) { toast('Check that weight'); return false; } b.weight = +lb.toFixed(2); (S.habitLog[k] = S.habitLog[k] || {}).weigh = true; }
  else if (wv === '' && b.weight) delete b.weight;
  if (b.mfp && b.mfp.p != null && b.mfp.p >= S.settings.protein) { (S.habitLog[k] = S.habitLog[k] || {}).protein = true; const n = S.nightly[k] = S.nightly[k] || { ans: {} }; n.ans = n.ans || {}; n.ans.protein = true; }
  if (!Object.keys(b).length) delete S.body[k];
  save(); return true;
}
document.addEventListener('change', ev => { const i = ev.target; if (!i || !i.dataset || !i.dataset.nl) return; const k = i.dataset.date; if (applyNlInputs(k)) { const y = $('#nl-yn'); if (y) y.outerHTML = nlYNHtml(k); } });
ACT.nightly = (el, d) => openNightly(d.date || today());
ACT.nlDay = (el, d) => { const cur = ($('#nightly') || {}).dataset; if (cur && cur.date) applyNlInputs(cur.date); if (canBackdate(d.date)) { UI.nlK = d.date; refreshNightly(d.date); haptic(); } };
ACT.nlYN = (el, d) => {
  const k = d.date, on = d.v === '1'; applyNlInputs(k);
  nnToggle(k, d.id, on); const n = S.nightly[k] = S.nightly[k] || { ans: {} }; n.ans = n.ans || {}; n.ans[d.id] = on; save(); haptic(on ? 12 : 6);
  const y = $('#nl-yn'); if (y) y.outerHTML = nlYNHtml(k);
};
ACT.nlDone = (el, d) => {
  const k = d.date; if (!applyNlInputs(k)) return;
  const n = S.nightly[k] = S.nightly[k] || { ans: {} }; n.ts = Date.now(); save();
  closeSheet(); const nd = nnDay(k); haptic([15, 30, 15]);
  toast(`${k === today() ? 'Today' : fmtDate(k)} logged ✓ · ${nd.n}/${nd.total}${nd.all ? ' 🔥' : ''}`); if (nd.all) confetti(); rerenderKeep();
};
ACT.nlCardioDone = (el, d) => { quickDone(d.day, d.key); refreshNightly(d.day); };
ACT.nlUndoDone = (el, d) => { if (!confirm('Remove this logged session?')) return; S.workouts = S.workouts.filter(w => w.id !== d.id); save(); haptic(); refreshNightly(d.date); rerenderKeep(); };

/* ---------- quick add (replaces the planned session for that day) ---------- */
function qaTodo(k) { const dp = dayPlan(k); return dp && !dp.off ? dp.sessions.filter(s => s.kind !== 'test' && ['todo', 'skipped'].includes(sessStatus(s))) : []; }
function qaHtml() {
  const q = UI.qa, t = QA_TYPES[q.type], todo = qaTodo(q.k);
  const unit = t.dist === 's' ? su() : du();
  return `<div id="qa"><h3>Quick add · ${q.k === today() ? 'today' : fmtLong(q.k)}</h3>
  <div class="qa-types">${Object.entries(QA_TYPES).map(([id, x]) => `<button class="tap ${q.type === id ? 'on' : ''}" data-a="qaSet" data-f="type" data-v="${id}"><span>${x.ic}</span>${x.label}</button>`).join('')}</div>
  ${t.subs ? `<div class="seg qa-sub">${t.subs.map(([id, l]) => `<button class="tap ${q.sub === id ? 'on' : ''}" data-a="qaSet" data-f="sub" data-v="${id}">${l}</button>`).join('')}</div>` : ''}
  ${q.type === 'other' ? `<div class="field"><label>What was it?</label><input class="inp" id="qa-name" placeholder="e.g. Pickup basketball" value="${esc(q.name || '')}"></div>` : ''}
  <div class="field"><label>Duration (min)</label><div class="durs">${QA_DURS.map(m => `<button class="tap ${q.dur === m ? 'on' : ''}" data-a="qaSet" data-f="dur" data-v="${m}">${m}</button>`).join('')}</div><input class="inp" id="qa-dur" type="number" inputmode="numeric" min="1" max="600" placeholder="or type minutes" value="${QA_DURS.includes(q.dur) ? '' : q.dur || ''}"></div>
  ${t.dist ? `<div class="field"><label>Distance (${unit}) <small class="dim">optional</small></label><input class="inp" id="qa-dist" type="number" inputmode="decimal" step="any" value="${q.dist ?? ''}"></div>` : ''}
  <div class="field"><label>Effort 1–10 · <b id="qa-rpel">${q.rpe} — ${RPE_TXT[q.rpe]}</b></label><div class="rpe10">${[...Array(10)].map((_, i) => `<button class="tap ${q.rpe === i + 1 ? 'on' : ''}" data-a="qaSet" data-f="rpe" data-v="${i + 1}">${i + 1}</button>`).join('')}</div></div>
  ${todo.length ? `<div class="field"><label>Replaces the plan (counts as training)</label>${todo.map(s => `<label class="repl tap"><input type="checkbox" data-rk="${s.key}" ${q.rep[s.key] ? 'checked' : ''}><span class="dot c-${s.color}"></span><span class="grow">${esc(s.title)}</span></label>`).join('')}</div>` : '<div class="xs dim" style="margin:6px 0 0">Nothing left on the plan that day — this is logged as an extra session.</div>'}
  <div class="tip info" style="margin:12px 0 0"><div class="ic">🏒</div><div class="xs">${esc(TRAIN_RULE)}</div></div>
  <button class="btn tap" style="margin-top:14px" data-a="qaSave">Save ${esc(t.label.toLowerCase())} ✓</button></div>`;
}
function qaRead() { const q = UI.qa; if (!q) return; const v = id => { const i = $('#' + id); return i ? i.value.trim() : null; }; const dv = v('qa-dur'); if (dv) q.dur = +dv; const di = v('qa-dist'); if (di != null) q.dist = di === '' ? null : +di; const nm = v('qa-name'); if (nm != null) q.name = nm; $$('#qa [data-rk]').forEach(c => { q.rep[c.dataset.rk] = c.checked; }); }
ACT.qaOpen = (el, d) => {
  const k = d.date || today(); if (!canBackdate(k)) return toast(`You can log the last ${BACKDATE_DAYS} days`);
  UI.nlReturn = el && el.closest && el.closest('#nightly') ? k : null;
  const todo = qaTodo(k), rep = {};
  if (d.key) rep[d.key] = true; else todo.forEach(s => { rep[s.key] = true; }); // quick add replaces what's left on the plan that day (he can untick)
  const dow0 = dow(k), type = dow0 === 6 ? 'hockey' : 'bike';
  UI.qa = { k, type, sub: 'mtb', dur: QA_TYPES[type].dur, dist: null, rpe: QA_TYPES[type].rpe, name: '', rep };
  openSheet(qaHtml());
};
ACT.qaSet = (el, d) => {
  qaRead(); const q = UI.qa;
  if (d.f === 'type') { q.type = d.v; q.dur = QA_TYPES[d.v].dur; q.rpe = QA_TYPES[d.v].rpe; q.dist = null; }
  else if (d.f === 'sub') q.sub = d.v; else if (d.f === 'dur') { q.dur = +d.v; const i = $('#qa-dur'); if (i) i.value = ''; } else if (d.f === 'rpe') q.rpe = +d.v;
  haptic(6); const sh = $('#qa').closest('.sheet'), y = sh ? sh.scrollTop : 0; $('#qa').outerHTML = qaHtml(); if (sh) sh.scrollTop = y;
};
ACT.qaSave = () => {
  qaRead(); const q = UI.qa, t = QA_TYPES[q.type], k = q.k;
  if (!(q.dur > 0 && q.dur <= 600)) return toast('Enter the duration in minutes');
  const title = q.type === 'other' ? (q.name || 'Other activity') : q.type === 'bike' ? (q.sub === 'stationary' ? 'Stationary bike' : 'MTB ride') : t.label;
  const reps = Object.keys(q.rep).filter(x => q.rep[x] && qaTodo(k).some(s => s.key === x));
  const id = uid(), dp = dayPlan(k), end = k === today() ? Date.now() : atTime(k, 19);
  const w = { id, date: k, sessionKey: `${k}:QA-${id}`, title, kind: 'cardio', color: t.color, wk: dp ? dp.wk : null, mod: 'normal', startedAt: end - q.dur * 60000, endedAt: end, exercises: [], checklist: [], why: '',
    cardio: { mode: t.mode, sub: q.type === 'bike' ? q.sub : null, title, steps: [], min: q.dur, planDist: null, dur: q.dur, dist: q.dist == null || !t.dist ? null : (t.dist === 's' ? U.sIn(q.dist) : U.dIn(q.dist)), rpe: q.rpe, knee: null, notes: '' },
    quick: true, swap: true, replaces: reps };
  computeSummary(w); S.workouts.push(w);
  reps.forEach(key => { S.schedule.replaced[key] = id; });
  save(); haptic([15, 30, 15]); UI.lastSwap = id;
  let msg = reps.length ? `${title} logged · replaces ${reps.map(x => (qaTodo(k).find(s => s.key === x) || sessionByKey(x) || { title: 'session' }).title).join(' + ')}` : `${title} logged ✓`;
  if (isHardAct(w)) { const ls = lowerSoon(k).filter(x => x.d !== k || !reps.includes(x.s.key)); if (ls.length) msg += ` · ⚠️ ${ls[0].s.title} ${fmtDow(ls[0].d)} is within 48 h — move it or keep it light`; }
  const lw = liftWeek(k); if (lw.done + lw.left < 2) msg += ' · keep ≥2 lifts this week';
  if (!returnToNightly()) closeSheet();
  toast(msg, 'undoSwap'); rerenderKeep();
};
ACT.undoSwap = (el, d) => {
  const id = (d && d.id) || UI.lastSwap; if (!id) return;
  S.workouts = S.workouts.filter(w => w.id !== id);
  Object.keys(S.schedule.replaced || {}).forEach(key => { if (S.schedule.replaced[key] === id) delete S.schedule.replaced[key]; });
  if (UI.lastSwap === id) UI.lastSwap = null;
  save(); haptic(); toast('Removed — plan restored'); refreshNightly(); rerenderKeep();
};

/* ---------- lift: top set only (weight × reps), done by default ---------- */
function llHtml() {
  const { k, w } = UI.ll;
  return `<div id="ll"><h3>${esc(w.title)} · top sets</h3><div class="small muted" style="margin-bottom:12px">${k === today() ? 'Today' : fmtLong(k)} · one line per exercise: your best set. Everything is ✓ done — tap ✓ to drop an exercise you didn’t do.</div>
  ${w.exercises.map((e, i) => { const ex = EX[e.ex], ti = Math.max(0, e.sets.findIndex(s => s.tag === 'Top')), top = e.sets[ti] || {}, hold = ex.kind === 'hold', pow = ex.kind === 'power', wt = ex.kind === 'w';
    return `<div class="ll ${e.skipped ? 'off' : ''}" data-i="${i}"><button class="ck tap ${e.skipped ? '' : 'on'}" data-a="llTog" data-i="${i}" aria-label="Done">✓</button><div class="grow llname"><b>${esc(ex.n)}</b><div class="xs dim">${e.reps[0]}–${e.reps[1]} ${hold ? 's' : 'reps'}${e.role === 'bench' ? ' · heavy top set' : ''}</div></div>${wt ? `<input class="inp llw" id="ll-w-${i}" type="number" inputmode="decimal" step="any" value="${top.w ? U.wOut(top.w) : ''}" aria-label="Weight ${wu()}" placeholder="${wu()}"><span class="llx">×</span>` : ''}<input class="inp llr" id="ll-r-${i}" type="number" inputmode="numeric" value="${top.r ?? e.reps[0]}" aria-label="${hold ? 'Seconds' : 'Reps'}" placeholder="${hold ? 's' : pow ? 'reps' : 'reps'}"></div>`; }).join('')}
  <button class="btn tap" style="margin-top:14px" data-a="llSave">Save ✓</button><div class="xs dim" style="margin-top:8px">Want every set? Use “Start workout” instead — the full logger is unchanged.</div></div>`;
}
ACT.liftLog = (el, d) => {
  const k = d.day, key = d.key, dp = dayPlan(k); if (!dp) return;
  if (sessionDone(key)) return toast('Already logged');
  UI.nlReturn = el && el.closest && el.closest('#nightly') ? k : null;
  const w = S.active && S.active.sessionKey === key ? JSON.parse(JSON.stringify(S.active)) : createWorkout(k, key);
  w.exercises.forEach(e => { e.skipped = false; });
  UI.ll = { k, key, w }; openSheet(llHtml());
};
ACT.llTog = (el, d) => { const r = el.closest('.ll'); const off = r.classList.toggle('off'); el.classList.toggle('on', !off); haptic(6); };
ACT.llSave = () => {
  const { k, key, w } = UI.ll; let n = 0;
  for (let i = 0; i < w.exercises.length; i++) {
    const e = w.exercises[i], ex = EX[e.ex], row = $(`#ll [data-i="${i}"]`);
    if (row.classList.contains('off')) { e.skipped = true; continue; }
    const wi = $('#ll-w-' + i), ri = $('#ll-r-' + i), r = ri ? +ri.value : 0, wv = wi ? U.wIn(wi.value) : null;
    if (!(r > 0)) return toast(`${ex.n}: enter ${ex.kind === 'hold' ? 'seconds' : 'reps'} (or tap ✓ to drop it)`);
    if (ex.kind === 'w' && wi && wi.value !== '' && !(wv > 0 && wv < 2000)) return toast(`${ex.n}: check the weight`);
    const ti = Math.max(0, e.sets.findIndex(s => s.tag === 'Top')), top = e.sets[ti] || {};
    e.sets = [{ ...top, w: ex.kind === 'w' ? (wv == null ? null : +wv.toFixed(2)) : (top.w ?? null), r, rpe: null, done: true, tag: 'Top' }];
    e.planned = 1; e.quickTop = true; e.skipped = false; n++;
  }
  if (!n) return toast('Tap ✓ on at least one exercise');
  const dp = dayPlan(k), s = dp && dp.sessions.find(x => x.key === key), min = (s && s.min) || 50;
  w.endedAt = k === today() ? Date.now() : atTime(k, 13); w.startedAt = w.endedAt - min * 60000; w.quick = w.quickTop = true;
  computeSummary(w); S.workouts.push(w);
  delete S.schedule.skips[key]; if (S.schedule.replaced) delete S.schedule.replaced[key];
  if (S.active && S.active.sessionKey === key) S.active = null;
  UNDO_QUICK = w.id; save(); haptic([15, 30, 15]);
  const prs = (w.summary && w.summary.prs) || [];
  if (!returnToNightly()) closeSheet();
  toast(`${w.title} ✓ logged · ${n} top set${n > 1 ? 's' : ''}${prs.length ? ' · PR 🏆' : ''}`, 'undoQuick'); if (prs.length) confetti(); rerenderKeep();
};

/* ---------- goals (new plan, through Dec 31) ---------- */
function waistTrend() { const ks = Object.keys(S.body).filter(k => S.body[k].waist).sort(); if (!ks.length) return null; const f = S.body[ks[0]].waist, l = S.body[ks[ks.length - 1]].waist; return { first: f, last: l, k: ks[ks.length - 1], fk: ks[0] }; }
function goalsHtml() {
  const st = S.settings, cur = (rolling7().slice(-1)[0] || {}).v, wt = waistTrend(), bn = benchNow(), top = (benchSessions().slice(-1)[0] || null);
  const reps225 = bn ? Math.max(0, Math.floor(30 * (bn.v / 225 - 1))) : null; // Epley inverted: reps at 225 from the current e1RM
  const meta = [
    wt ? `Waist ${U.lOut(wt.last)} ${lu()}${wt.fk !== wt.k ? ` (${wt.last <= wt.first ? '▼' : '▲'} ${U.lOut(Math.abs(wt.first - wt.last))} since ${fmtDate(wt.fk)})` : ''} · measure at the Sunday check-in` : 'No waist yet — log it at the Sunday check-in',
    `${U.wOut(st.startWeight)} → ~${U.wOut(st.goalWeight)} ${wu()} by Dec 31${cur ? ` · now ${U.wOut(cur)} ${wu()} (7-day avg)` : ''}`,
    bn ? `Bench e1RM ${U.wOut(bn.v, 0)} ${wu()}${top ? ` · last top set ${U.wOut(top.top.w)}×${top.top.r}` : ''} · 225 for reps needs e1RM ≥ ~240 (${reps225 ? '≈' + reps225 + ' rep' + (reps225 > 1 ? 's' : '') + ' at 225 now' : 'not yet'})` : 'Baseline set by your first heavy top set',
    'Parked until after Dec 31',
  ];
  return PLAN_GOALS.map((g, i) => `<div class="goalrow"><span class="chip ${i === 0 ? 'grad' : ''}">${g.ic}</span><div class="grow"><b>${esc(g.t)}</b><div class="muted">${esc(meta[i])}</div><div class="xs dim">${esc(g.d)}</div></div></div>`).join('') + `<div class="goalrow"><span class="chip">🍳</span><div class="grow"><b>Food plan</b><ul class="clean xs muted" style="margin-top:4px">${FOOD_PLAN.map(x => `<li>• ${esc(x)}</li>`).join('')}</ul></div></div>`;
}

/* ---------- Progress: 7-day food averages next to the weight trend ---------- */
function fuelAvgHtml() {
  const f = fuelAvg7(today()), st = S.settings;
  const kOk = f.kcal != null && f.kcal >= 2500 && f.kcal <= 2600, pOk = f.p != null && f.p >= st.protein;
  return `<div class="fuelavg" id="fuelAvg"><div><span class="xs dim">Calories · 7-day avg</span><b class="${f.kcal == null ? 'dim' : kOk ? 'okc' : 'warnc'}">${f.kcal == null ? '—' : fmtNum(f.kcal)}</b><span class="xs dim">target 2,500–2,600${f.kcalN ? ` · ${f.kcalN}/7 days` : ''}</span></div><div><span class="xs dim">Protein · 7-day avg</span><b class="${f.p == null ? 'dim' : pOk ? 'okc' : 'warnc'}">${f.p == null ? '—' : f.p + ' g'}</b><span class="xs dim">target ${st.protein} g${f.pN ? ` · ${f.pN}/7 days` : ''}</span></div></div>${f.kcalN || f.pN ? '' : '<div class="xs dim" style="margin-top:6px">Enter the day’s MyFitnessPal totals in the nightly log (🌙) to see these.</div>'}`;
}
