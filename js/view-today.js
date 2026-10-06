/* Today tab */
'use strict';
function sessionLines(s, mod, k) {
  if (s.kind === 'lift') {
    const P = S.profile, edits = S.planEdits[k || s.date] || {};
    return slotsFor(s.tpl, P).map(sl => {
      const ed = edits[sl.id] || {}, exId = ed.ex || S.swapPrefs[sl.id] || profileExercise(sl, P), ex = EX[exId], sets = buildSets(sl, mod, P);
      let pres;
      if (sl.role === 'main') pres = `1 top @RPE ${sets[0].rpeT} + ${sets.length - 1} back-off · ${sl.reps[0]}–${sl.reps[1]}`;
      else if (sl.role === 'power') pres = `${sets.length}×${sl.reps[0]} · max intent`;
      else if (sl.role === 'hold') pres = `${sets.length}×${sl.reps[0]}–${sl.reps[1]}s/side`;
      else pres = `${sets.length} hard × ${sl.reps[0]}–${sl.reps[1]} @RPE ${sets[0].rpeT}`;
      const tt = targetText(exId);
      const ini = ex.n.split(' ').filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join('');
      return `<div class="exrow ${ed.skip ? 'skipped' : ''}"><div class="exthumb ${sl.role === 'main' ? 'main' : ''}">${ini}</div><div class="grow"><div class="nm">${esc(ex.n)}${sl.ss ? ' <span class="ss-tag">SS</span>' : ''}${ed.skip ? ' <span class="chip">Skip today</span>' : ''}</div><div class="small muted">${pres}</div>${tt && !ed.skip ? `<div class="target">🎯 Next: ${esc(tt)}</div>` : ''}</div></div>`;
    }).join('') + (s.finisher ? `<div class="exrow"><div class="exthumb" style="color:var(--bike)">${s.finisher.mode === 'walk' ? 'W' : 'B'}</div><div class="grow"><div class="nm">${esc(s.finisher.title)}</div><div class="small muted">${s.finisher.min}′ finisher · RPE 3–4</div></div></div>` : '');
  }
  if (s.kind === 'cardio') return `<div class="steps">${s.cardio.steps.map(st => `<div class="step"><div class="bul c-${s.color}"></div><div><b>${esc(st[0])}</b><span>${esc(st[1])}</span></div></div>`).join('')}</div>${s.cardio.tip ? `<div class="small" style="color:var(--warn);margin-top:6px">⚠️ ${esc(s.cardio.tip)}</div>` : ''}`;
  if (s.kind === 'test') return `<ul class="clean">${TEST_FIELDS.map(f => `<li>${f.label}</li>`).join('')}</ul>`;
  return '';
}
function whyBlock(s) { return s.why ? `<details class="why"><summary>🧪 Why this works</summary><div>${esc(s.why)}</div></details>` : ''; }
function sessionActions(s) {
  const st = sessStatus(s), act = S.active && S.active.sessionKey === s.key, k = s.date;
  if (s.kind === 'test') return `<button class="btn ${st === 'done' ? 'sec' : ''} tap" data-a="testSheet" data-key="${s.testKey}">${st === 'done' ? 'Edit test results' : 'Enter test results'}</button>`;
  if (act) return `<button class="btn tap" data-a="resume">▶ Resume workout</button>`;
  if (st === 'done' && s.kind === 'cardio') { const w = sessionDone(s.key), c = w.cardio || {}; return `<div class="row between"><div class="done-badge">${CHECK.replace('<svg', '<svg width="20" height="20"')} Done${c.dur ? ' · ' + c.dur + ' min' : ''}${c.dist ? ' · ' + (c.mode === 'swim' ? U.sOut(c.dist) + ' ' + su() : U.dOut(c.dist) + ' ' + du()) : ''}</div><div class="row"><button class="btn sm sec tap" data-a="cardioDetails" data-id="${w.id}">Details</button><button class="btn sm ghost tap" data-a="unmarkDone" data-id="${w.id}">Undo</button></div></div>`; }
  if (st === 'done') { const w = sessionDone(s.key); return `<div class="row between"><div class="done-badge">${CHECK.replace('<svg', '<svg width="20" height="20"')} Done${w.summary ? ' · ' + w.summary.durMin + ' min' : ''}</div><div class="row"><button class="btn sm sec tap" data-a="viewSummary" data-id="${w.id}">Summary</button><button class="btn sm ghost tap" data-a="start" data-day="${k}" data-key="${s.key}">Redo</button></div></div>`; }
  if (st === 'skipped') return `<div class="row between"><span class="chip">Skipped${S.schedule.skips[s.key].reason ? ' · ' + esc(S.schedule.skips[s.key].reason) : ''}</span><div class="row"><button class="btn sm tap" data-a="moveSheet" data-key="${s.key}">Move</button><button class="btn sm ghost tap" data-a="unskip" data-key="${s.key}">Unskip</button></div></div>`;
  if (s.kind === 'cardio') return `<button class="btn tap markdone" data-a="quickDone" data-day="${k}" data-key="${s.key}">Mark done ✓</button><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm sec tap grow" data-a="start" data-day="${k}" data-key="${s.key}">Log details</button><button class="btn sm sec tap" data-a="moveSheet" data-key="${s.key}">Move</button><button class="btn sm sec tap" data-a="skip" data-key="${s.key}">Skip</button></div>`;
  return `<div class="row" style="gap:8px"><button class="btn tap grow" data-a="start" data-day="${k}" data-key="${s.key}">${s.kind === 'lift' ? 'Start workout' : 'Start ' + (MODE_LABEL[s.cardio.mode] || 'session').toLowerCase()}</button><button class="btn sec tap" style="width:auto;padding:0 16px" data-a="moveSheet" data-key="${s.key}" aria-label="Move session">Move</button><button class="btn sec tap" style="width:auto;padding:0 14px" data-a="skip" data-key="${s.key}" aria-label="Skip session">Skip</button></div>`;
}
function sessionCard(day, s, hero) {
  const chip = s.kind === 'lift' ? 'Strength' : s.kind === 'test' ? 'Test' : MODE_LABEL[s.cardio.mode];
  return `<div class="card ${hero ? 'hero' : ''}" data-sess="${s.key}"><div class="row between"><span class="chip"><span class="dot c-${s.color}"></span>${hero ? chip : 'Also today · ' + chip}</span><span class="row" style="gap:8px"><span class="small muted">~${s.min} min</span>${sessBadge(s)}</span></div>${s.movedFrom ? `<div class="small" style="color:var(--swim);margin-top:8px">↪ Moved from ${fmtDow(s.movedFrom)}</div>` : ''}<div class="${hero ? 'ttl' : 'ttl2'}">${esc(s.title)}</div><div class="muted small">${esc(s.sub)}</div><div class="exlist" style="margin-top:12px">${sessionLines(s, modOf(day), day.k)}</div>${whyBlock(s)}${sessionActions(s)}</div>`;
}
function contextTips(k) {
  if (!hasKnee(S.profile)) return '';
  const tips = [], d = dayPlan(k), tom = dayPlan(addDays(k, 1)), yest = dayPlan(addDays(k, -1));
  if (tom && tom.sessions.some(isHockeyS)) tips.push(['⛸️', 'Hockey tomorrow — <b>no running today</b>, keep the legs easy.', '']);
  if (d && d.sessions.some(isHockeyS)) tips.push(['🏒', 'Hockey day. Warm up hips & groin, log knee pain after the skate.', 'info']);
  if (yest && yest.sessions.some(isHockeyS) || (dayPlan(addDays(k, -2)) || { sessions: [] }).sessions.some(isHockeyS)) tips.push(['🦵', 'Within 48 h of hockey — <b>no hard lower work</b> today.', 'info']);
  const kb = [0, 1, 2].map(i => S.body[addDays(k, -i)]).find(b => b && b.knee != null);
  if (kb && kb.knee >= 3) tips.unshift(['🛑', `Knee pain ${kb.knee}/10 logged. Stop anything ≥3/10 and <b>swap to a knee-friendly option</b> (⇄ in the workout, or tell the coach).`, 'bad']);
  if (S.profile.injuries.flare) tips.unshift(['🧊', 'Knee flare mode is on: runs → bike, jumps/leg press/split squats → knee-friendly swaps.', 'bad']);
  return tips.map(t => `<div class="tip ${t[2]}"><div class="ic">${t[0]}</div><div>${t[1]}</div></div>`).join('');
}
function scheduleBanners(k) {
  const ws = weekStart(k), out = [];
  for (let i = 0; i < 7; i++) {
    const dk = addDays(ws, i), dp = dayPlan(dk); if (!dp) continue;
    dp.sessions.forEach(s => {
      const sk = S.schedule.skips[s.key];
      if (sk && sk.needsMove && !S.schedule.moves[s.key] && dk <= k) out.push(`<div class="tip warnbox" data-banner="${s.key}"><div class="ic">↪️</div><div class="grow"><b>${esc(s.title)}</b> (${fmtDow(dk)}) was skipped. Move it to another day this week?<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm tap" data-a="moveSheet" data-key="${s.key}">Move it</button><button class="btn sm ghost tap" data-a="dropSkip" data-key="${s.key}">Let it go</button></div></div></div>`);
      if (dp.off && dk >= k && sessStatus(s) === 'todo') out.push(`<div class="tip warnbox" data-banner="${s.key}"><div class="ic">📅</div><div class="grow"><b>${fmtDow(dk)}</b> is a day off (${esc(dp.off)}). <b>${esc(s.title)}</b> needs a new day — or drop it if things slip.<div class="row" style="margin-top:8px;gap:8px"><button class="btn sm tap" data-a="moveSheet" data-key="${s.key}">Move it</button><button class="btn sm ghost tap" data-a="skip" data-key="${s.key}" data-reason="Day off">Drop it</button></div></div></div>`);
    });
  }
  return out.join('');
}
function verseCard(k) {
  const v = verseFor(k), fav = S.verse.favs.includes(v.id), read = (S.habitLog[k] || {}).bible;
  return `<div class="card verse" id="verse" data-vid="${v.id}"><div class="row between"><span class="chip gold">📖 ${esc(v.theme)}</span><button class="icon-btn tap ${fav ? 'fav' : ''}" data-a="favVerse" data-id="${v.id}" aria-label="Bookmark verse">${fav ? '♥' : '♡'}</button></div><blockquote>“${esc(v.text)}”</blockquote><div class="vref">— ${esc(v.ref)} (KJV)</div><div class="vnote">${esc(v.note)}</div><div class="row" style="gap:8px;margin-top:12px"><a class="btn sm sec tap" href="${bibleGatewayUrl(v.ref)}" target="_blank" rel="noopener">Read more ↗</a>${S.settings.habits.find(h => h.id === 'bible') ? `<button class="btn sm ${read ? 'ghost' : ''} tap" data-a="readVerse">${read ? '✓ Read' : 'Mark read'}</button>` : ''}<span class="xs dim grow" style="text-align:right">${S.verse.seen.length}/${VERSES.length} this cycle</span></div></div>`;
}
function habitsCard() {
  const k = UI.habDate || today(), hs = S.settings.habits, log = S.habitLog[k] || {}, pct = habitPct(k), st = streak(), isT = k === today();
  return `<div class="card" id="habits"><div class="row between" style="margin-bottom:12px"><button class="icon-btn tap" data-a="habDay" data-v="-1" aria-label="Previous day">‹</button><div style="text-align:center"><div style="font-weight:750" id="habDateLbl">${isT ? 'Today' : fmtDow(k)}</div><div class="xs dim">${hs.filter(x => log[x.id]).length}/${hs.length} done</div></div><button class="icon-btn tap" data-a="habDay" data-v="1" aria-label="Next day" ${isT ? 'disabled style="opacity:.3"' : ''}>›</button></div><div class="ringwrap"><div class="ring">${Charts.ring(pct)}<div class="ctr"><div><b>${Math.round(pct * 100)}%</b><span>${isT ? 'today' : fmtDate(k)}</span></div></div></div><div><div class="streak" id="streak">🔥 ${st} day${st === 1 ? '' : 's'}</div><div class="small muted">Streak · days with ≥75% habits</div></div></div><div class="habits">${hs.map(x => { const hsx = habitStreak(x.id); return `<button class="habit ${log[x.id] ? 'on' : ''}" data-a="habit" data-id="${esc(x.id)}" data-date="${k}"><span class="ck">${CHECK}</span><span class="grow">${esc(x.ic || '')} ${esc(x.label)}</span>${hsx > 1 ? `<span class="hs">${hsx}🔥</span>` : ''}</button>`; }).join('')}</div>${heatmap(k)}</div>`;
}
function heatmap(sel) {
  const start = weekStart(PLAN_START), t = today(); let cols = '';
  for (let w = 0; w < 13; w++) { let c = ''; for (let d = 0; d < 7; d++) { const k = addDays(start, w * 7 + d); const p = k <= t ? habitPct(k) : -1; const lvl = p < 0 ? 'f' : p === 0 ? 0 : p < .34 ? 1 : p < .67 ? 2 : p < 1 ? 3 : 4; c += `<button class="hm l${lvl} ${k === sel ? 'sel' : ''}" data-a="habGo" data-date="${k}" ${p < 0 ? 'disabled' : ''} title="${k}"></button>`; } cols += `<div class="hmcol">${c}</div>`; }
  return `<div class="hmwrap"><div class="row between xs dim" style="margin:14px 0 6px"><span>History · Oct 5 → Dec 31</span><span class="row" style="gap:3px">less <i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i> more</span></div><div class="heatmap">${cols}</div></div>`;
}
VIEWS.today = function () {
  const k = today(), day = dayPlan(k), b = S.body[k] || {}, ft = foodTotals(k), prot = proteinFor(k), T = S.settings;
  let h = hdr(fmtLong(k), 'Today');
  if (S.active && (!day || !day.sessions.some(s => s.key === S.active.sessionKey))) h += `<div class="tip info"><div class="ic">⏱️</div><div class="grow">Workout in progress: <b>${esc(S.active.title)}</b><div style="margin-top:8px"><button class="btn sm tap" data-a="resume">Resume</button></div></div></div>`;
  h += scheduleBanners(k);
  if (day) {
    const m = day.meta, tot = diffDays(PLAN_START, PLAN_END) + 1, dn = diffDays(PLAN_START, k) + 1;
    h += `<div class="card" style="padding:14px 16px"><div class="row between"><div class="row wrap" style="gap:6px"><span class="chip grad">Block ${day.block.n} · ${day.block.name}</span><span class="chip">Week ${day.wk}</span>${m.deload ? '<span class="chip deload">Deload</span>' : ''}${m.test ? '<span class="chip test">Test week</span>' : ''}${m.finals ? '<span class="chip finals">Finals</span>' : ''}</div><div class="small dim">Day ${dn}/${tot}</div></div>${m.note ? `<div class="small muted" style="margin-top:10px">${esc(m.note)}</div>` : ''}<div class="pbar"><i style="width:${dn / tot * 100}%"></i></div></div>`;
  }
  h += devoCard(k);
  if (!day) h += `<div class="card hero"><span class="chip grad">${k < PLAN_START ? 'Starts Oct 5' : 'Plan complete'}</span><div class="ttl">${k < PLAN_START ? 'Plan starts Monday, Oct 5' : '🏁 Program complete!'}</div></div>`;
  else {
    h += contextTips(k);
    if (day.off) h += `<div class="card"><span class="chip">Day off</span><div class="ttl2">📅 ${esc(day.off)}</div><div class="small muted">No training planned. Move today's sessions from the banner above if you want to make them up.</div></div>`;
    if (day.meta.test && day.meta.testKey && !day.sessions.some(s => s.kind === 'test')) h += `<div class="tip goldbox"><div class="ic">📋</div><div class="grow">Test week (${TESTS.find(t => t.key === day.meta.testKey).label}). Fit the mile, 100 yd swim, pull-ups & broad jump into this week.<div style="margin-top:8px"><button class="btn sm sec tap" data-a="testSheet" data-key="${day.meta.testKey}">${testDone(day.meta.testKey) ? 'Edit results' : 'Enter results'}</button></div></div></div>`;
    const ss = day.off ? [] : day.sessions;
    if (!ss.length && !day.off) h += `<div class="card hero"><span class="chip">Rest day</span><div class="ttl">Recover 💤</div><div class="small muted">Sleep 8h+, hit protein, do the 10-min mobility routine. Recovery is when you adapt.</div></div>`;
    ss.forEach((s, i) => h += sessionCard(day, s, i === 0));
  }
  h += `<h2 class="sec">Daily habits</h2>` + habitsCard();
  h += `<h2 class="sec">Fuel today <button class="btn sm sec tap" data-a="goTab" data-tab="food">Open Food</button></h2><div class="card"><div class="row between small"><span>Calories</span><b>${fmtNum(ft.kcal)} / ${fmtNum(T.kcal)}</b></div><div class="pbar"><i style="width:${Math.min(100, ft.kcal / T.kcal * 100)}%"></i></div><div class="row between small" style="margin-top:12px"><span>Protein</span><b>${prot} / ${T.protein} g</b></div><div class="pbar"><i class="pgreen" style="width:${Math.min(100, prot / T.protein * 100)}%"></i></div><div class="qadd" style="margin-top:12px"><button class="tap" data-a="quickProt" data-v="25">+25 g protein</button><button class="tap" data-a="quickProt" data-v="40">+40 g</button><button class="tap" data-a="quickProt" data-v="50">+50 g</button></div></div>`;
  h += `<h2 class="sec">Quick log</h2><div class="card"><div class="field"><label>Weight (${wu()})</label><div class="row"><input class="inp grow" id="q-weight" type="number" inputmode="decimal" step="0.1" placeholder="${esc(U.wOut(lastWeight()))}" value="${esc(U.wOut(b.weight))}"><button class="btn sm tap" style="height:48px" data-a="saveWeight">Save</button></div></div>${hasKnee(S.profile) || b.knee != null ? `<div class="field" style="margin-top:14px"><label>Knee pain (0–10) ${b.knee != null ? `· <span style="color:${painColor(b.knee)}">${b.knee}/10</span>` : ''}</label><div class="pain" id="q-knee">${[...Array(11)].map((_, i) => `<button class="tap ${b.knee === i ? 'on' : ''}" style="${b.knee === i ? `background:${painColor(i)}` : ''}" data-a="knee" data-v="${i}">${i}</button>`).join('')}</div></div>` : ''}</div>`;
  h += `<h2 class="sec">Daily 10-min mobility</h2><div class="card"><ul class="clean">${MOBILITY.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  h += `<h2 class="sec">Nutrition rules</h2><div class="card"><ul class="clean">${nutritionRules(S.profile, { kcal: T.kcal, protein: T.protein, perMeal: Math.round(T.protein / (S.profile.diet.meals || 4)) }).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  if (hasKnee(S.profile)) h += `<h2 class="sec">Knee rules</h2>${KNEE_RULES.map((r, i) => `<div class="tip ${i ? 'info' : 'bad'}"><div class="ic">${['🛑', '🏃', '⏱️', '☝️'][i]}</div><div>${esc(r)}</div></div>`).join('')}`;
  h += `<div class="tip good"><div class="ic">🛡️</div><div>${esc(SLIP_RULE)}</div></div>`;
  return h;
};
function lastWeight() { const w = weights(); return w.length ? w[w.length - 1].v : S.settings.startWeight; }

ACT.habit = (el, d) => { const k = d.date || today(), l = S.habitLog[k] = S.habitLog[k] || {}; if (l[d.id]) delete l[d.id]; else l[d.id] = true; save(); haptic(l[d.id] ? 12 : 6); rerenderKeep(); if (l[d.id] && habitPct(k) === 1) { toast('All habits done 🔥'); confetti(); } };
ACT.habDay = (el, d) => { const k = addDays(UI.habDate || today(), +d.v); if (k > today()) return; UI.habDate = k === today() ? null : k; haptic(); const card = $('#habits'); card.outerHTML = habitsCard(); };
ACT.habGo = (el, d) => { UI.habDate = d.date === today() ? null : d.date; haptic(); $('#habits').outerHTML = habitsCard(); };
ACT.knee = (el, d) => { const b = S.body[today()] = S.body[today()] || {}; b.knee = +d.v; save(); haptic(); rerenderKeep(); };
ACT.saveWeight = () => { const k = today(), v = $('#q-weight').value; if (v === '') return toast('Enter your weight'); const lb = U.wIn(v); if (!(lb >= 80 && lb <= 500)) return toast('Check that weight'); (S.body[k] = S.body[k] || {}).weight = +lb.toFixed(2); (S.habitLog[k] = S.habitLog[k] || {}).weigh = true; save(); haptic(15); toast('Weight logged ✓'); rerenderKeep(); };
ACT.quickProt = (el, d) => { addFood(today(), { name: `Quick protein (${d.v} g)`, kcal: Math.round(+d.v * 4.5), p: +d.v }, autoMeal()); toast(`+${d.v} g protein`); rerenderKeep(); };
ACT.favVerse = (el, d) => { const id = +d.id, f = S.verse.favs; const i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); save(); haptic(12); toast(i >= 0 ? 'Removed from saved verses' : 'Saved verse ♥'); rerenderKeep(); };
ACT.readVerse = () => { const k = today(), l = S.habitLog[k] = S.habitLog[k] || {}; l.bible = !l.bible; if (!l.bible) delete l.bible; save(); haptic(12); rerenderKeep(); };

/* ---------- session check marks: ✓ badge when done, progress ring when partly done ---------- */
function sessProgress(s) {
  const w = S.active && S.active.sessionKey === s.key ? S.active : null; if (!w) return null;
  if (w.exercises.length) { const ex = w.exercises.filter(e => !e.skipped); return { done: ex.filter(e => e.sets.length && e.sets.every(x => x.done)).length, total: ex.length, unit: 'exercises' }; }
  return { done: (w.cardio && w.cardio.dur ? 1 : 0) + w.checklist.filter(c => c.done).length, total: 1 + w.checklist.length, unit: 'items' };
}
function miniRing(done, total, size = 34) {
  const r = (size - 5) / 2, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2EE6A6" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
function sessBadge(s) {
  const st = sessStatus(s);
  if (st === 'done') return `<span class="sbadge ok" title="Done" aria-label="Done">${CHECK}</span>`;
  const p = sessProgress(s);
  if (p) return `<span class="sring" title="${p.done}/${p.total} ${p.unit}" aria-label="${p.done} of ${p.total} ${p.unit} done">${miniRing(p.done, p.total)}<b>${p.done}/${p.total}</b><small>${p.unit}</small></span>`;
  return '';
}
let UNDO_QUICK = null;
function quickDone(k, key) {
  const s = (dayPlan(k) || { sessions: [] }).sessions.find(x => x.key === key) || sessionByKey(key); if (!s || s.kind !== 'cardio') return;
  let w;
  if (S.active && S.active.sessionKey === key) { w = S.active; S.active = null; } else w = createWorkout(k, key);
  const c = w.cardio; if (c.dur == null) c.dur = c.min || null; if (c.dist == null && c.planDist) c.dist = c.planDist;
  w.checklist.forEach(x => x.done = true); w.quick = true;
  w.endedAt = Date.now(); w.startedAt = Math.min(w.startedAt, w.endedAt - (c.dur || 0) * 60000); computeSummary(w);
  S.workouts.push(w); delete S.schedule.skips[key]; UNDO_QUICK = w.id; save(); haptic([15, 30, 15]);
  toast(`${s.title} ✓ done`, 'undoQuick'); rerenderKeep();
}
function cardioDetails(id) {
  const w = S.workouts.find(x => x.id === id); if (!w || !w.cardio) return; const c = w.cardio, sw = c.mode === 'swim', hk = c.mode === 'hockey';
  openSheet(`<h3>${esc(w.title)}</h3><div class="small muted" style="margin-bottom:12px">Optional details — leave anything blank.</div><div class="grid2"><div class="field"><label>Duration (min)</label><input class="inp" id="cd-dur" type="number" inputmode="decimal" value="${c.dur ?? ''}"></div>${hk ? '<span></span>' : `<div class="field"><label>Distance (${sw ? su() : du()})</label><input class="inp" id="cd-dist" type="number" inputmode="decimal" step="any" value="${c.dist == null ? '' : sw ? U.sOut(c.dist) : U.dOut(c.dist)}"></div>`}<div class="field"><label>Effort RPE (1–10)</label><input class="inp" id="cd-rpe" type="number" inputmode="numeric" min="1" max="10" value="${c.rpe ?? ''}"></div><div class="field"><label>Knee pain (0–10)</label><input class="inp" id="cd-knee" type="number" inputmode="numeric" min="0" max="10" value="${c.knee ?? ''}"></div></div><div class="field" style="margin-top:10px"><label>Notes</label><input class="inp" id="cd-notes" value="${esc(c.notes || '')}"></div><button class="btn tap" style="margin-top:14px" data-a="saveCardioDetails" data-id="${w.id}">Save</button>`);
}
ACT.quickDone = (el, d) => quickDone(d.day, d.key);
ACT.undoQuick = () => { if (!UNDO_QUICK) return; S.workouts = S.workouts.filter(w => w.id !== UNDO_QUICK); UNDO_QUICK = null; save(); toast('Unmarked'); rerenderKeep(); };
ACT.unmarkDone = (el, d) => { if (!confirm('Unmark this session as done?')) return; S.workouts = S.workouts.filter(w => w.id !== d.id); save(); haptic(); rerenderKeep(); };
ACT.cardioDetails = (el, d) => cardioDetails(d.id);
ACT.saveCardioDetails = (el, d) => {
  const w = S.workouts.find(x => x.id === d.id), c = w.cardio, g = id => { const i = $('#cd-' + id); return i ? i.value.trim() : ''; };
  c.dur = g('dur') === '' ? null : +g('dur'); if ($('#cd-dist')) c.dist = g('dist') === '' ? null : (c.mode === 'swim' ? U.sIn(g('dist')) : U.dIn(g('dist')));
  c.rpe = g('rpe') === '' ? null : Math.min(10, Math.max(1, +g('rpe'))); c.knee = g('knee') === '' ? null : Math.min(10, Math.max(0, +g('knee'))); c.notes = g('notes');
  if (c.knee != null) { const b = S.body[w.date] = S.body[w.date] || {}; b.knee = Math.max(b.knee ?? 0, c.knee); }
  computeSummary(w); save(); closeSheet(); toast('Details saved ✓'); rerenderKeep();
};
