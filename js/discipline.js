/* Arnold Fit v2.3 — discipline layer: daily non-negotiables, honest streak, never-miss-twice, Sunday check-in */
function discState() { if (!S.disc) S.disc = { commit: {}, checkin: {} }; S.disc.commit = S.disc.commit || {}; S.disc.checkin = S.disc.checkin || {}; return S.disc; }
function nnDay(k) {
  const d = dayPlan(k), l = S.habitLog[k] || {}, ss = d && !d.off ? d.sessions : [];
  const sOk = s => sessStatus(s) === 'done' || !!(S.schedule.moves || {})[s.key];
  const trainOk = !ss.length || ss.every(sOk);
  const items = [
    { id: 'train', ic: '🏋️', label: ss.length ? `Training · ${ss.filter(sOk).length}/${ss.length} session${ss.length > 1 ? 's' : ''}` : 'Training · rest day (recover)', ok: trainOk, auto: true },
    { id: 'protein', ic: '🥩', label: `Protein ≥${S.settings.protein} g · ${proteinFor(k)} g`, ok: proteinFor(k) >= S.settings.protein || !!l.protein, auto: false },
    { id: 'mobility', ic: '🧘', label: '10-min mobility', ok: !!l.mobility },
    { id: 'devo', ic: '📖', label: 'Devotional', ok: !!(S.devo.done[k] || l.bible) },
    { id: 'sleep', ic: '😴', label: '8 h sleep (last night)', ok: !!l.sleep },
  ];
  const n = items.filter(i => i.ok).length;
  return { items, n, total: items.length, all: n === items.length };
}
function nnStreak() { const t = today(); let k = nnDay(t).all ? t : addDays(t, -1), n = 0; while (k >= PLAN_START && nnDay(k).all && n < 999) { n++; k = addDays(k, -1); } return n; }
function nnMisses() { const t = today(), y = addDays(t, -1), y2 = addDays(t, -2); const m1 = y >= PLAN_START && !nnDay(y).all, m2 = m1 && y2 >= PLAN_START && !nnDay(y2).all; return { m1, m2, y }; }
function nnBanner() {
  const m = nnMisses(); if (!m.m1 || nnDay(today()).all) return '';
  const miss = nnDay(m.y).items.filter(i => !i.ok).map(i => i.label.split(' · ')[0]).join(', ');
  return m.m2 ? `<div class="tip bad" id="nmtBanner"><div class="ic">🚨</div><div><b>Missed 2 days in a row.</b> No guilt, just a reset: hit all 5 non-negotiables today and the streak starts again.</div></div>`
    : `<div class="tip warnbox" id="nmtBanner"><div class="ic">⚠️</div><div><b>Never miss twice.</b> Yesterday missed: ${esc(miss)}. Today is non-negotiable.</div></div>`;
}
function doNowCard(k) {
  const day = dayPlan(k), nn = nnDay(k), hr = new Date().getHours(), D = discState();
  let ic = '✅', t = 'All non-negotiables done', sub = 'Day won. Protect sleep tonight.', btn = '';
  const todo = day && !day.off ? day.sessions.filter(s => sessStatus(s) === 'todo' && !(S.schedule.moves || {})[s.key]) : [];
  if (S.active) { ic = '⏱️'; t = `Finish ${esc(S.active.title)}`; sub = 'Workout in progress.'; btn = `<button class="btn tap" data-a="resume">Resume</button>`; }
  else if (!D.commit[k] && hr < 18 && !nn.all) { ic = '🤝'; t = 'Commit to today'; sub = `${nn.total - nn.n} non-negotiable${nn.total - nn.n === 1 ? '' : 's'} left${todo.length ? ` · ${esc(todo[0].title)}` : ''}.`; btn = `<button class="btn tap" data-a="nnCommit">I commit</button>`; }
  else if (todo.length) { ic = '🏋️'; t = esc(todo[0].title); sub = `~${todo[0].min} min · details below`; btn = `<button class="btn tap" data-a="nnGoSess" data-key="${todo[0].key}">Go</button>`; }
  else if (!nn.all) { const i = nn.items.find(x => !x.ok); ic = i.ic; t = esc(i.label.split(' · ')[0]); sub = hr >= 18 ? 'Evening check-off: close out the day.' : 'Next non-negotiable.'; btn = nnBtn(i, k, 'Do it'); }
  return `<div class="card hero donow" id="doNow"><div class="row between"><span class="chip grad">Do now</span><span class="small dim">${nn.n}/${nn.total} non-negotiables</span></div><div class="row" style="gap:12px;margin-top:10px"><div style="font-size:30px">${ic}</div><div class="grow"><div class="ttl2" style="margin:0">${t}</div><div class="small muted">${sub}</div></div>${btn}</div></div>`;
}
function nnBtn(i, k, lbl) {
  if (i.id === 'train') return `<button class="btn sm tap" data-a="goTab" data-tab="train">${lbl || 'Train'}</button>`;
  if (i.id === 'devo') return `<button class="btn sm tap" data-a="openDevo" data-k="${k}">${lbl || 'Open'}</button>`;
  return `<button class="btn sm tap" data-a="nnTog" data-id="${i.id}" data-date="${k}">${lbl || 'Done'}</button>`;
}
function nnCard(k) {
  const nn = nnDay(k), st = nnStreak(), D = discState(), hr = new Date().getHours();
  const head = hr >= 18 ? 'Evening check-off' : D.commit[k] ? 'Committed ✓ — now execute' : 'Morning: commit, then execute';
  return `<div class="card" id="nnCard"><div class="row between"><div><div style="font-weight:750">Daily non-negotiables</div><div class="xs dim">${head}</div></div><div style="text-align:right"><div class="streak" id="nnStreak">🔥 ${st} day${st === 1 ? '' : 's'}</div><div class="xs dim">all 5 met · honest streak</div></div></div><div class="habits" style="margin-top:12px">${nn.items.map(i => `<button class="habit nn ${i.ok ? 'on' : ''}" data-a="${i.id === 'train' ? 'goTab' : i.id === 'devo' ? 'openDevo' : 'nnTog'}" data-tab="train" data-k="${k}" data-id="${i.id}" data-date="${k}"><span class="ck">${CHECK}</span><span class="grow">${i.ic} ${esc(i.label)}</span>${i.auto ? '<span class="xs dim">auto</span>' : ''}</button>`).join('')}</div></div>`;
}
/* ---------- Sunday weekly check-in ---------- */
function checkinWeek(k) { return weekStart(k); } // keyed by the Monday of the week being reviewed
function weekAdh(ws, upto) { let full = 0, items = 0, days = 0; for (let i = 0; i < 7; i++) { const dk = addDays(ws, i); if (dk > upto || dk < PLAN_START) continue; const nn = nnDay(dk); days++; items += nn.n / nn.total; if (nn.all) full++; } return { full, days, score: days ? Math.round(items / days * 100) : 0 }; }
function checkinCard(k) {
  const isSun = dow(k) === 6, isMon = dow(k) === 0, D = discState();
  const ws = isSun ? weekStart(k) : isMon ? weekStart(addDays(k, -1)) : null;
  if (!ws || ws < weekStart(PLAN_START)) return '';
  const done = D.checkin[ws], endK = addDays(ws, 6) < k ? addDays(ws, 6) : k, av = avgWeight(endK), prev = avgWeight(addDays(endK, -7));
  const knees = [...Array(7)].map((_, i) => (S.body[addDays(ws, i)] || {}).knee).filter(v => v != null), kAvg = knees.length ? (knees.reduce((a, b) => a + b, 0) / knees.length) : null;
  const a = weekAdh(ws, endK);
  if (done && !isSun) return '';
  return `<div class="card goldbox" id="checkin"><div class="row between"><span class="chip gold">🗓️ Weekly check-in</span>${done ? `<span class="sbadge">${CHECK}</span>` : `<span class="xs dim">2 min</span>`}</div><div class="kpis" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><div><div class="xs dim">Weight 7-day avg</div><b id="ciW">${av ? U.wOut(av.v.toFixed(1)) + ' ' + wu() : '—'}</b>${av && prev ? `<div class="xs dim">${(av.v - prev.v >= 0 ? '+' : '') + (av.v - prev.v).toFixed(1)} vs last wk</div>` : ''}</div><div><div class="xs dim">Adherence</div><b id="ciA">${a.score}%</b><div class="xs dim">${a.full}/${a.days} perfect days</div></div><div><div class="xs dim">Knee avg</div><b id="ciK">${kAvg == null ? '—' : kAvg.toFixed(1) + '/10'}</b></div><div><div class="xs dim">Waist (in)</div><input class="inp" id="ci-waist" type="number" inputmode="decimal" step="0.25" value="${done && done.waist != null ? done.waist : ''}" placeholder="e.g. 34.5"></div></div><div class="small muted" style="margin-top:10px">${a.score >= 85 ? 'Strong week. Keep the plan exactly as is.' : a.score >= 65 ? 'Decent. Pick the one non-negotiable you missed most and pre-plan it.' : 'Rough week. Shrink the target: just hit all 5 tomorrow.'}</div><button class="btn sm tap" style="margin-top:10px" data-a="saveCheckin" data-ws="${ws}">${done ? 'Update check-in' : 'Save check-in'}</button></div>`;
}
ACT.nnCommit = () => { discState().commit[today()] = Date.now(); save(); haptic(15); toast('Committed. Now execute. 🤝'); rerenderKeep(); };
ACT.nnTog = (el, d) => { const k = d.date || today(), l = S.habitLog[k] = S.habitLog[k] || {}; const id = d.id === 'devo' ? 'bible' : d.id; if (l[id]) delete l[id]; else l[id] = true; save(); haptic(l[id] ? 12 : 6); rerenderKeep(); if (nnDay(k).all) { toast('All 5 non-negotiables done 🔥'); confetti(); } };
ACT.nnGoSess = (el, d) => { const c = document.querySelector(`[data-sess="${d.key}"]`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
ACT.saveCheckin = (el, d) => { const ws = d.ws, k = today(), w = $('#ci-waist').value, endK = addDays(ws, 6) < k ? addDays(ws, 6) : k, av = avgWeight(endK), a = weekAdh(ws, endK); const knees = [...Array(7)].map((_, i) => (S.body[addDays(ws, i)] || {}).knee).filter(v => v != null);
  discState().checkin[ws] = { ts: Date.now(), waist: w === '' ? null : +w, avg: av ? +av.v.toFixed(2) : null, knee: knees.length ? +(knees.reduce((x, y) => x + y, 0) / knees.length).toFixed(1) : null, adh: a.score, full: a.full };
  if (w !== '') (S.body[k] = S.body[k] || {}).waist = +w; save(); haptic(15); toast('Weekly check-in saved ✓'); rerenderKeep(); };
