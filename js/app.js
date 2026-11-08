/* Arnold Fit v3 — phone workout planner. */
'use strict';
(function () {
  const AF = window.AF;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const UI = { tab: 'today', logging: false, mode: null, editDate: null, edit: null, swapEi: null, summaryId: null, sessionId: null, chart: null };
  let S, PE, unit = 'lb', rest = null, undoId = null, saveTimer = null, audioCtx = null, badStore = false;

  const $ = sel => document.querySelector(sel);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function firstName() { return ((S.settings && S.settings.name) || 'Christopher').split(/\s+/)[0]; }
  function hello() {
    const h = new Date().getHours();
    if (h < 5) return 'Hey';
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }
  function haptic(p) {
    if (S.settings && S.settings.haptics === false) return;
    try { if (navigator.vibrate) navigator.vibrate(p || 12); } catch (e) {}
  }
  function beep() {
    if (S.settings && S.settings.sound === false) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 740; g.gain.value = 0.03;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
      o.stop(audioCtx.currentTime + 0.24);
    } catch (e) {}
  }
  function toast(msg, undo) {
    const el = $('#toast');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button data-a="undo">Undo</button>' : '');
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 3400);
  }
  function saveStore() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(AF.STORE_KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save on this phone'); }
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveStore, 350); }
  function savePlan() {
    try { PE.updated = Date.now(); localStorage.setItem(AF.PLAN_KEY, JSON.stringify(PE)); }
    catch (e) { toast('Could not save the plan'); }
  }

  function exId(e) { return e.ex || e.id; }
  function exMode(e) { return e.mode || (AF.resolveEx(exId(e), PE).mode) || 'sets'; }
  function exLo(e) { return e.lo != null ? e.lo : (e.reps ? e.reps[0] : 5); }
  function exHi(e) { return e.hi != null ? e.hi : (e.reps ? e.reps[1] : 8); }
  function exName(e) { return e.name || AF.resolveEx(exId(e), PE).n; }
  function loggedOn(k) {
    return (S.workouts || []).filter(w => w && w.date === k && w.endedAt).sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))[0] || null;
  }
  function progress(w) {
    let t = 0, d = 0;
    (w.exercises || []).forEach(e => (e.sets || []).forEach(s => { t++; if (s.done) d++; }));
    return { t: t, d: d, p: t ? d / t : 0 };
  }

  function buildEx(it) {
    const lib = AF.resolveEx(it.id, PE);
    const last = AF.lastPerf(S.workouts, it.id);
    const filled = AF.prefill(it, last, unit, PE);
    return {
      ex: it.id, id: it.id, name: lib.n, muscle: lib.m, mode: it.mode || lib.mode || 'sets',
      reps: [it.lo, it.hi], lo: it.lo, hi: it.hi, planned: filled.sets.length,
      rest: lib.rest || 90, cue: lib.cue || '', sets: filled.sets, sug: filled.sug || null,
    };
  }
  function buildWorkout(k, day) {
    return {
      id: AF.uid(), date: k, sessionKey: k + ':' + (day.code || 'X'),
      title: day.title, kind: day.kind, code: day.code, place: day.place || null, note: day.note || '',
      startedAt: Date.now(), endedAt: null,
      exercises: (day.items || []).map(buildEx),
      optional: (day.optional || []).map(buildEx),
    };
  }
  function dayByCode(code) {
    const t = (PE.fit.template || []).find(d => d && d.code === code);
    return t ? AF.normalizeDay(AF.clone(t), PE) : null;
  }

  function openLog() { UI.logging = true; UI.tab = 'today'; render(); }
  function startDay(k, day) {
    if (!day || day.kind === 'rest') return;
    if (day.kind === 'hockey') return logHockey(k, day);
    if (S.active && S.active.date === k) return openLog();
    if (S.active && !confirm('Discard the open workout and start this one?')) return;
    const done = loggedOn(k);
    if (done && !confirm('You already logged ' + done.title + '. Start another?')) return;
    S.active = buildWorkout(k, day);
    saveStore();
    haptic(15);
    openLog();
  }
  function startToday() {
    const k = AF.today();
    if (S.active && S.active.date === k) return openLog();
    startDay(k, AF.dayFor(PE, k));
  }
  function logHockey(k, day) {
    if (loggedOn(k) && loggedOn(k).code === 'HK') { toast('Hockey is already logged'); return; }
    if (S.active && !confirm('Discard the open workout and log hockey?')) return;
    S.active = null;
    const w = {
      id: AF.uid(), date: k, sessionKey: k + ':HK', title: day.title || 'Hockey', kind: 'hockey', code: 'HK', place: 'off',
      startedAt: Date.now(), endedAt: Date.now(), exercises: [], summary: { durMin: 0, sets: 0 },
    };
    S.workouts.push(w);
    undoId = w.id;
    saveStore();
    haptic([16, 30, 16]);
    render();
    toast('Hockey logged', true);
  }

  function readLogInputs() {
    document.querySelectorAll('#log input[data-f]').forEach(applyLogInput);
  }
  function applyLogInput(t) {
    if (!S.active) return;
    const e = S.active.exercises[+t.dataset.ei];
    const s = e && e.sets[+t.dataset.si];
    if (!s) return;
    if (t.dataset.f === 'w') s.w = AF.wIn(t.value, unit);
    if (t.dataset.f === 'r') s.r = t.value === '' ? null : +t.value;
  }
  function unfinished(w) {
    return (w.exercises || []).some(e => (e.sets || []).some(s => !s.done));
  }
  function startRest(sec) {
    if (!sec) return;
    rest = { total: sec, end: Date.now() + sec * 1000, fired: false };
    paintRest();
  }
  function paintRest() {
    const host = $('#rest');
    if (!host) return;
    if (!rest) { host.innerHTML = ''; host.classList.add('off'); return; }
    host.classList.remove('off');
    const rem = Math.max(0, (rest.end - Date.now()) / 1000);
    host.innerHTML = '<div><div class="eyebrow">Rest</div><div class="tm" id="tm">' + (rem > 0 ? AF.fmtTime(Math.ceil(rem)) : 'Go') + '</div></div>'
      + '<button data-a="restAdj" data-v="-15">−15</button><button data-a="restAdj" data-v="15">+15</button><button class="go tiny" data-a="restSkip">Skip</button>';
  }
  function tick() {
    const el = $('#elapsed');
    if (el && S.active) el.textContent = AF.fmtTime((Date.now() - S.active.startedAt) / 1000);
    if (!rest) return;
    const rem = (rest.end - Date.now()) / 1000;
    const tm = $('#tm');
    if (tm) tm.textContent = rem > 0 ? AF.fmtTime(Math.ceil(rem)) : 'Go';
    const host = $('#rest');
    if (host) host.classList.toggle('go-now', rem <= 0);
    if (rem <= 0 && !rest.fired) { rest.fired = true; beep(); haptic([200, 80, 200]); setTimeout(() => { if (rest && rest.fired) { rest = null; paintRest(); } }, 2500); }
  }

  function finish() {
    readLogInputs();
    const w = S.active;
    if (!w) return;
    const any = (w.exercises || []).some(e => (e.sets || []).some(s => s.done));
    if (!any && !confirm('Nothing checked yet. Finish anyway?')) return;
    w.endedAt = Date.now();
    const sets = (w.exercises || []).reduce((n, e) => n + (e.sets || []).filter(s => s.done).length, 0);
    const mins = Math.round((w.endedAt - w.startedAt) / 60000);
    w.summary = { durMin: mins > 0 ? mins : 0, sets: sets };
    S.workouts.push(w);
    S.active = null;
    rest = null;
    UI.logging = false;
    saveStore();
    UI.mode = 'summary';
    UI.summaryId = w.id;
    haptic([18, 40, 18]);
    render();
  }

  function hintsFor(w) {
    const out = [];
    (w.exercises || []).forEach(e => {
      if (exMode(e) !== 'sets') return;
      const item = { id: exId(e), sets: e.planned || (e.sets || []).filter(s => s.done).length, lo: exLo(e), hi: exHi(e), mode: 'sets' };
      const sug = AF.suggest(item, { date: w.date, end: w.endedAt, sets: (e.sets || []).filter(s => s.done) }, unit, PE);
      if (sug) out.push(exName(e) + ': ' + sug.text);
    });
    return out;
  }

  function crunchCard(k) {
    const n = AF.crunchSet(S, AF.weekStart(k)).size;
    const goal = AF.CRUNCH_GOAL;
    const pips = Array.from({ length: goal }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('');
    const line = n >= goal ? 'Week made.' : n ? n + ' down, ' + (goal - n) + ' to go.' : 'Five gym days. The week is open.';
    const counted = AF.crunchSet(S, AF.weekStart(k)).has(k);
    return '<section class="card crunch"><div class="row"><h3>Crunch</h3><b>' + n + ' of ' + goal + '</b></div><div class="pips" aria-label="' + n + ' of ' + goal + ' Crunch visits">' + pips + '</div><p>' + line + (counted ? '' : ' <button class="inline" data-a="crunchVisit">I went</button>') + '</p></section>';
  }
  function recoveryCard(k) {
    const rows = AF.recoveryMap(liveList(), k, PE);
    const body = rows.length
      ? '<div class="chips">' + rows.map(r => '<span class="chip ago' + Math.min(r.ago, 4) + '">' + esc(r.m) + '<small>' + (r.ago === 0 ? 'today' : r.ago + 'd') + '</small></span>').join('') + '</div>'
      : '<p>Nothing in the last few days. You are fresh.</p>';
    return '<section class="card"><h3>Recovery</h3>' + body + '</section>';
  }
  function liveList() {
    const list = (S.workouts || []).slice();
    if (S.active && (S.active.exercises || []).some(e => (e.sets || []).some(s => s.done))) list.push(Object.assign({}, S.active, { endedAt: Date.now() }));
    return list;
  }

  function hero(k) {
    const day = AF.dayFor(PE, k);
    const done = loggedOn(k);
    const active = S.active && S.active.date === k;
    if (done && !active) {
      const sm = done.summary || {};
      const meta = [done.title, sm.durMin ? sm.durMin + ' min' : '', sm.sets ? sm.sets + ' sets' : ''].filter(Boolean).join(' · ');
      const line = AF.loggedLine(done, unit, PE);
      return '<section class="hero ' + esc(done.kind || day.kind) + ' done"><div class="eyebrow">Done</div><h2>' + esc(done.title || day.title) + '</h2><p class="lede">' + esc(meta) + '</p>' + (line ? '<p class="did">' + esc(line) + '</p>' : '') + '</section>';
    }
    const kind = day.kind;
    let list = '';
    if (day.items && day.items.length) {
      list = '<ul class="planlist">' + day.items.map(it => {
        const lib = AF.resolveEx(it.id, PE);
        return '<li><span>' + esc(lib.n) + '</span><b>' + esc(AF.prescript(it, unit, PE)) + '</b></li>';
      }).join('') + '</ul>';
    }
    const kicker = active ? 'In progress' : 'Today';
    return '<section class="hero ' + esc(kind) + '"><div class="eyebrow">' + kicker + '</div><h2>' + esc(day.title) + '</h2>'
      + (day.note ? '<p class="lede">' + esc(day.note) + '</p>' : '') + list
      + (kind === 'rest' ? '<button class="texty" data-a="trainAnyway">Train anyway</button>' : '')
      + '</section>';
  }
  function dock() {
    if (UI.logging || UI.tab !== 'today') return '';
    const k = AF.today();
    const day = AF.dayFor(PE, k);
    if (S.active && S.active.date === k) return '<button class="go" data-a="resume">Resume workout</button>';
    if (loggedOn(k) && !(S.active && S.active.date === k)) return '';
    if (day.kind === 'rest') return '';
    if (day.kind === 'hockey') return '<button class="go" data-a="start">Log hockey</button>';
    return '<button class="go" data-a="start">Start workout</button>';
  }

  function viewToday() {
    const k = AF.today();
    let h = '<header class="top"><div><p class="kicker">' + esc(AF.fmtLong(k)) + '</p><h1>' + esc(hello() + ', ' + firstName()) + '</h1></div></header>';
    if (badStore) h += '<div class="banner">Saved data could not be read. A copy is still on this phone.</div>';
    if (S.active && S.active.date !== k) h += '<button class="banner tap" data-a="resume">' + esc(S.active.title) + ' is still open · Resume</button>';
    h += recoveryStrip(k) + hero(k) + crunchCard(k) + habitsCard(k);
    return h;
  }
  function habitsCard(k) {
    const hs = (S.settings && S.settings.habits) || [];
    if (!hs.length) return '';
    const log = (S.habitLog && S.habitLog[k]) || {};
    const done = hs.filter(h => log[h.id]).length;
    return '<section class="card" id="habits"><div class="row"><h3>Habits</h3><b>' + done + '/' + hs.length + '</b></div><div class="habitlist">'
      + hs.map(h => '<button class="habit ' + (log[h.id] ? 'on' : '') + '" data-a="habit" data-id="' + esc(h.id) + '" aria-pressed="' + (log[h.id] ? 'true' : 'false') + '"><span class="chk ' + (log[h.id] ? 'on' : '') + '" aria-hidden="true">' + CHECK + '</span><span class="grow">' + (h.ic ? esc(h.ic) + ' ' : '') + esc(h.label) + '</span></button>').join('')
      + '</div></section>';
  }
  function recoveryStrip(k) {
    const rows = AF.recoveryMap(liveList(), k, PE);
    if (!rows.length) return '<p class="recover-line">Recovery · all fresh</p>';
    return '<div class="recover-line"><span>Recovery</span>' + rows.map(r => '<span class="chip ago' + Math.min(r.ago, 4) + '">' + esc(r.m) + '<small>' + (r.ago === 0 ? 'today' : r.ago + 'd') + '</small></span>').join('') + '</div>';
  }

  function viewPlan() {
    const k = AF.today(), ws = AF.weekStart(k);
    let h = '<header class="top"><div><p class="kicker">Plan</p><h1>' + esc(AF.fmtRange(ws)) + '</h1></div></header>';
    h += '<h2>This week</h2><div class="stack">';
    for (let i = 0; i < 7; i++) h += dayRow(AF.addDays(ws, i), true);
    h += '</div>';
    for (let n = 1; n <= 4; n++) {
      const w0 = AF.addDays(ws, n * 7);
      h += '<h2>' + esc(AF.fmtRange(w0)) + '</h2><div class="stack compact">';
      for (let i = 0; i < 7; i++) h += dayRow(AF.addDays(w0, i), false);
      h += '</div>';
    }
    h += '<p class="fine">Edits stay on this phone. History is never rewritten.</p>';
    return h;
  }
  function dayRow(k, big) {
    const day = AF.dayFor(PE, k);
    const done = loggedOn(k);
    const now = k === AF.today();
    const active = S.active && S.active.date === k;
    const sub = active ? 'In progress' : done ? 'Logged · ' + (done.title || day.title) : (day.items[0] ? AF.resolveEx(day.items[0].id, PE).n + (day.items.length > 1 ? ' · ' + (day.items.length - 1) + ' more' : '') : (day.note || 'Open'));
    return '<button class="dayrow ' + (now ? 'now' : '') + (done ? ' did' : '') + '" data-a="openDay" data-date="' + k + '"><span class="datebox"><b>' + AF.DOW[AF.dowMon(k)] + '</b><span>' + AF.pkey(k).getDate() + '</span></span><span class="grow"><b>' + esc(day.title) + '</b><small>' + esc(sub) + '</small></span>' + (done ? '<span class="tick">' + CHECK + '</span>' : '<span class="chev">›</span>') + '</button>';
  }

  function exerciseOptions() {
    const ids = [];
    const seen = {};
    (S.workouts || []).forEach(w => {
      if (!w.endedAt) return;
      (w.exercises || []).forEach(e => {
        const id = exId(e);
        if (!id || seen[id]) return;
        if (!(e.sets || []).some(s => s && s.done)) return;
        seen[id] = w.date;
      });
    });
    return Object.keys(seen).sort((a, b) => seen[a] < seen[b] ? 1 : seen[a] > seen[b] ? -1 : a.localeCompare(b));
  }
  function chartSVG(pts, mode) {
    const W = 320, H = 168, L = 36, R = 12, T = 18, B = 28;
    const ys = pts.map(p => mode === 'w' ? +p.w : +p.r);
    const xs = pts.map(p => +AF.pkey(p.date));
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (minY === maxY) { minY -= mode === 'w' ? 5 : 1; maxY += mode === 'w' ? 5 : 1; }
    const y0 = minY - (maxY - minY) * 0.18, y1 = maxY + (maxY - minY) * 0.22;
    const X = t => L + (maxX === minX ? (W - L - R) / 2 : (t - minX) / (maxX - minX) * (W - L - R));
    const Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ',' + Y(ys[i]).toFixed(1)).join(' ');
    const dots = pts.map((p, i) => '<circle cx="' + X(xs[i]).toFixed(1) + '" cy="' + Y(ys[i]).toFixed(1) + '" r="5"><title>' + esc(AF.fmtMon(p.date)) + ' · ' + esc(mode === 'w' ? AF.wOut(p.w, unit) + ' ' + AF.unitLabel(unit) : p.r + ' reps') + '</title></circle>').join('');
    const yTop = mode === 'w' ? AF.wOut(maxY, unit) : String(maxY);
    const yBot = mode === 'w' ? AF.wOut(minY, unit) : String(minY);
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Top ' + (mode === 'w' ? 'weight' : 'reps') + ' over time"><text class="yl" x="2" y="' + (Y(y1) + 4) + '">' + esc(yTop) + '</text><text class="yl" x="2" y="' + Y(y0) + '">' + esc(yBot) + '</text><path d="' + d + '"/><g>' + dots + '</g><text class="xl" x="' + L + '" y="' + (H - 6) + '">' + esc(AF.fmtMon(pts[0].date)) + '</text><text class="xl" x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(AF.fmtMon(pts[pts.length - 1].date)) + '</text></svg>';
  }
  function viewHistory() {
    const ids = exerciseOptions();
    if (!UI.chart || ids.indexOf(UI.chart) < 0) UI.chart = ids[0] || null;
    let h = '<header class="top"><div><p class="kicker">History</p><h1>Your lifts</h1></div></header>';
    if (!ids.length) {
      h += '<section class="card empty"><h2>No workouts yet</h2><p>Finish one and the chart starts here.</p></section>';
      return h;
    }
    const id = UI.chart, pts = AF.topSeries(S.workouts, id), mode = AF.chartValue(pts);
    const lib = AF.resolveEx(id, PE);
    h += '<section class="card chartcard"><div class="chips scroll">' + ids.map(x => '<button data-a="pickChart" data-id="' + esc(x) + '" class="' + (x === id ? 'on' : '') + '">' + esc(AF.resolveEx(x, PE).n) + '</button>').join('') + '</div>';
    h += '<h2>' + esc(lib.n) + '</h2><p class="fine">' + (mode === 'r' ? 'Top reps each day.' : 'Top weight each day.') + '</p>';
    h += pts.length && mode ? chartSVG(pts, mode) : '<p>No numbers for this one yet.</p>';
    h += '</section>';
    const recent = (S.workouts || []).filter(w => w.endedAt).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (b.endedAt || 0) - (a.endedAt || 0)).slice(0, 8);
    if (recent.length) {
      h += '<h2>Recent</h2><div class="stack">';
      recent.forEach(w => {
        const line = AF.loggedLine(w, unit, PE) || (w.kind === 'hockey' ? 'Logged' : 'Logged');
        h += '<button class="dayrow" data-a="openSession" data-id="' + esc(w.id) + '"><span class="datebox"><b>' + AF.DOW[AF.dowMon(w.date)] + '</b><span>' + AF.pkey(w.date).getDate() + '</span></span><span class="grow"><b>' + esc(w.title || 'Workout') + '</b><small>' + esc(line) + '</small></span><span class="chev">›</span></button>';
      });
      h += '</div>';
    }
    return h;
  }

  function render() {
    const y = window.scrollY;
    const view = $('#view');
    view.innerHTML = UI.tab === 'plan' ? viewPlan() : UI.tab === 'history' ? viewHistory() : viewToday();
    window.scrollTo(0, UI.tab === view._tab ? y : 0);
    view._tab = UI.tab;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
    const dockEl = $('#dock');
    const html = dock();
    dockEl.innerHTML = html ? '<div class="in">' + html + '</div>' : '';
    dockEl.classList.toggle('hidden', !html);
    document.body.classList.toggle('has-dock', !!html && !UI.logging);
    document.body.classList.toggle('logging', !!UI.logging);
    paintLog();
    if (UI.mode) paintSheet(); else closeSheet(true);
  }

  function paintLog() {
    const log = $('#log');
    if (!UI.logging || !S.active) {
      log.classList.add('hidden');
      log.innerHTML = '';
      return;
    }
    const sc = log.querySelector('.logscroll');
    const y = sc ? sc.scrollTop : 0;
    const w = S.active;
    const pr = progress(w);
    let body = '<header class="loghead"><button class="icon" data-a="minLog" aria-label="Close logger"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><div class="grow"><div class="logtitle">' + esc(w.title) + '</div><div class="logmeta"><span id="elapsed">' + AF.fmtTime((Date.now() - w.startedAt) / 1000) + '</span> · ' + pr.d + '/' + pr.t + ' sets</div></div><button class="icon" data-a="discard" aria-label="Discard workout"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></header>';
    body += '<div class="bar"><i style="width:' + (pr.p * 100) + '%"></i></div>';
    if (w.note) body += '<p class="lognote">' + esc(w.note) + '</p>';
    (w.exercises || []).forEach((e, ei) => { body += exerciseCard(e, ei); });
    if (w.optional && w.optional.length) body += '<button class="addset wide" data-a="addOptional">Add optional arms</button>';
    log.classList.remove('hidden');
    log.innerHTML = '<div class="logscroll">' + body + '</div><div class="logdock"><div id="rest" class="rest off"></div><button class="go" data-a="finish">Finish workout</button></div>';
    const sc2 = log.querySelector('.logscroll');
    if (sc2) sc2.scrollTop = y;
    paintRest();
  }
  function exerciseCard(e, ei) {
    const mode = exMode(e);
    const lib = AF.resolveEx(exId(e), PE);
    const last = AF.lastPerf(S.workouts, exId(e));
    const all = (e.sets || []).length && (e.sets || []).every(s => s.done);
    let h = '<article class="ex ' + (all ? 'all' : '') + '" id="ex-' + ei + '"><div class="exhead"><div class="grow"><h3>' + esc(exName(e)) + '</h3><p>' + esc(lib.m || e.muscle || '') + (mode === 'sets' ? ' · ' + (e.planned || e.sets.length) + ' sets · ' + exLo(e) + '–' + exHi(e) : mode === 'min' ? ' · minutes' : '') + '</p></div>';
    if (mode === 'sets') h += '<button class="swap" data-a="openSwap" data-ei="' + ei + '">Swap</button>';
    h += '</div>';
    const line = AF.lastLine(last, mode, unit);
    if (line) h += '<p class="last">' + esc(line) + '</p>';
    else if (e.cue || lib.cue) h += '<p class="cue">' + esc(e.cue || lib.cue) + '</p>';
    if (e.sug && e.sug.text) h += '<p class="sug">' + esc(e.sug.text) + '</p>';
    if (mode === 'check') {
      const on = e.sets[0] && e.sets[0].done;
      h += '<button class="checkbig ' + (on ? 'on' : '') + '" data-a="toggleSet" data-ei="' + ei + '" data-si="0">' + (on ? CHECK + ' Done' : 'Mark done') + '</button>';
    } else if (mode === 'min') {
      const s = e.sets[0] || { r: '', done: false };
      h += '<div class="setgrid one"><input inputmode="numeric" data-f="r" data-ei="' + ei + '" data-si="0" value="' + (s.r == null ? '' : esc(s.r)) + '" aria-label="Minutes"><button class="chk ' + (s.done ? 'on' : '') + '" data-a="toggleSet" data-ei="' + ei + '" data-si="0" aria-label="Complete">' + CHECK + '</button></div>';
    } else {
      h += '<div class="setgrid head"><span></span><span>' + AF.unitLabel(unit) + '</span><span>Reps</span><span></span></div>';
      (e.sets || []).forEach((s, si) => {
        h += '<div class="setgrid ' + (s.done ? 'done' : '') + '"><span class="sn">' + (si + 1) + '</span>'
          + '<input inputmode="decimal" data-f="w" data-ei="' + ei + '" data-si="' + si + '" value="' + esc(AF.wOut(s.w, unit)) + '" aria-label="Weight set ' + (si + 1) + '">'
          + '<input inputmode="numeric" data-f="r" data-ei="' + ei + '" data-si="' + si + '" value="' + (s.r == null ? '' : esc(s.r)) + '" aria-label="Reps set ' + (si + 1) + '">'
          + '<button class="chk ' + (s.done ? 'on' : '') + '" data-a="toggleSet" data-ei="' + ei + '" data-si="' + si + '" aria-label="Complete set ' + (si + 1) + '">' + CHECK + '</button></div>';
      });
      h += '<button class="addset" data-a="addSet" data-ei="' + ei + '">Add set</button>';
    }
    return h + '</article>';
  }

  function paintSheet() {
    const root = $('#sheet');
    const prev = root.querySelector('.sheet');
    const y = prev ? prev.scrollTop : 0;
    const html = sheetHTML();
    if (!html) { closeSheet(true); return; }
    root.classList.add('on');
    document.body.classList.add('sheet-open');
    root.innerHTML = '<div class="backdrop" data-a="closeSheet"></div><div class="sheet" role="dialog">' + html + '</div>';
    const sc = root.querySelector('.sheet');
    if (sc) sc.scrollTop = y;
  }
  function hideSheet() {
    const root = $('#sheet');
    root.classList.remove('on');
    root.innerHTML = '';
    document.body.classList.remove('sheet-open');
  }
  function closeSheet(silent) {
    UI.mode = null;
    hideSheet();
    if (!silent) render();
  }
  function sheetHTML() {
    if (UI.mode === 'summary') return summaryHTML();
    if (UI.mode === 'session') return sessionHTML();
    if (UI.mode === 'swap') return swapHTML();
    if (UI.mode === 'planSwap') return planSwapHTML();
    if (UI.mode === 'train') return trainHTML();
    if (UI.mode === 'day') return dayHTML();
    if (UI.mode === 'move') return moveHTML();
    if (UI.mode === 'add') return addHTML();
    if (UI.mode === 'item') return itemHTML();
    return '';
  }
  function summaryHTML() {
    const w = (S.workouts || []).find(x => x.id === UI.summaryId);
    if (!w) return '';
    const sm = w.summary || {};
    const hints = hintsFor(w);
    let h = '<div class="grab"></div><p class="eyebrow">Saved</p><h3>' + esc(w.title || 'Workout') + '</h3><p class="lede">' + [sm.durMin ? sm.durMin + ' min' : '', sm.sets ? sm.sets + ' sets' : 'Logged'].filter(Boolean).join(' · ') + '</p>';
    if (hints.length) h += '<div class="sugblock">' + hints.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>';
    h += sessionBody(w);
    h += '<button class="go" data-a="closeSheet">Done</button>';
    return h;
  }
  function sessionHTML() {
    const w = (S.workouts || []).find(x => x.id === UI.sessionId);
    if (!w) return '';
    return '<div class="grab"></div><p class="eyebrow">' + esc(AF.fmtLong(w.date)) + '</p><h3>' + esc(w.title || 'Workout') + '</h3>' + sessionBody(w) + '<button class="go" data-a="closeSheet">Close</button>';
  }
  function sessionBody(w) {
    if (!(w.exercises || []).length) return '<p class="lede">Logged.</p>';
    return '<ul class="recap">' + w.exercises.map(e => {
      const done = (e.sets || []).filter(s => s.done);
      let detail = 'Not logged';
      if (done.length && exMode(e) === 'check') detail = 'Done';
      else if (done.length && exMode(e) === 'min') detail = done[0].r + ' min';
      else if (done.length) detail = done.map(s => (s.w ? AF.wOut(s.w, unit) : 'BW') + '×' + (s.r == null ? '—' : s.r)).join(' · ');
      return '<li><b>' + esc(exName(e)) + '</b><span>' + esc(detail) + '</span></li>';
    }).join('') + '</ul>';
  }
  function swapHTML() {
    const e = S.active && S.active.exercises[UI.swapEi];
    if (!e) return '';
    const day = { code: S.active.code };
    const ids = AF.alternatives(exId(e), day, PE).filter(id => id !== exId(e));
    let h = '<div class="grab"></div><h3>Swap ' + esc(exName(e)) + '</h3><p class="fine">Same muscle. Sets and reps stay.</p>';
    if (!ids.length) h += '<p>No alternatives saved for this one.</p>';
    ids.forEach(id => {
      const lib = AF.LIB[id] || AF.resolveEx(id, PE);
      h += '<button class="choice" data-a="doSwap" data-id="' + esc(id) + '"><b>' + esc(lib.n) + '</b><small>' + esc([lib.m, lib.eq].filter(Boolean).join(' · ')) + '</small></button>';
    });
    return h + '<button class="texty" data-a="sheetBack">Cancel</button>';
  }
  function trainHTML() {
    const codes = ['UA', 'UB', 'LA', 'LB', 'REC', 'HK'];
    let h = '<div class="grab"></div><h3>Train anyway</h3><p class="fine">Today only. The weekly plan stays put.</p>';
    codes.forEach(code => {
      const d = dayByCode(code);
      if (!d) return;
      h += '<button class="choice" data-a="trainCode" data-code="' + code + '"><b>' + esc(d.title) + '</b><small>' + esc(d.note || '') + '</small></button>';
    });
    return h;
  }
  function ensureEdit() {
    if (!UI.edit || UI.edit.date !== UI.editDate) UI.edit = AF.dayFor(PE, UI.editDate);
  }
  function dayHTML() {
    ensureEdit();
    const day = UI.edit, k = UI.editDate;
    let h = '<div class="grab"></div><p class="eyebrow">' + esc(AF.fmtLong(k)) + '</p><h3>' + esc(day.title) + '</h3>';
    if (day.kind === 'rest' || day.kind === 'hockey') h += '<p class="lede">' + esc(day.note || '') + '</p>';
    h += '<div class="stack">';
    day.items.forEach((it, i) => {
      const lib = AF.resolveEx(it.id, PE);
      h += '<div class="editrow"><button class="grow" data-a="editItem" data-i="' + i + '"><b>' + esc(lib.n) + '</b><small>' + esc(AF.prescript(it, unit, PE)) + '</small></button><span class="nudges"><button data-a="moveItem" data-i="' + i + '" data-dir="-1" aria-label="Move up"' + (i ? '' : ' disabled') + '>↑</button><button data-a="moveItem" data-i="' + i + '" data-dir="1" aria-label="Move down"' + (i < day.items.length - 1 ? '' : ' disabled') + '>↓</button></span></div>';
    });
    h += '</div>';
    if (day.kind !== 'rest' && day.kind !== 'hockey') h += '<button class="addset wide" data-a="openAdd">Add exercise</button>';
    h += '<button class="choice" data-a="openMove"><b>Move this day</b><small>Swap with another day</small></button>';
    h += '<button class="go" data-a="applyEvery">Use this every ' + AF.DOW[AF.dowMon(k)] + '</button>';
    h += '<button class="texty danger" data-a="resetDay">Reset this day to the 5-day plan</button>';
    return h;
  }
  function itemHTML() {
    ensureEdit();
    const it = UI.edit.items[UI.item];
    if (!it) return '';
    const lib = AF.resolveEx(it.id, PE);
    const step = lib.small || lib.inc === 2.5 ? 2.5 : 5;
    let h = '<div class="grab"></div><button class="texty left" data-a="sheetDay">‹ Day</button><h3>' + esc(lib.n) + '</h3>';
    if ((it.mode || 'sets') === 'sets') {
      h += stepper('Sets', it.sets, 'sets', 1);
      h += '<div class="split"><div>' + stepper('Reps from', it.lo, 'lo', 1) + '</div><div>' + stepper('Reps to', it.hi, 'hi', 1) + '</div></div>';
      h += '<label class="field">Target ' + AF.unitLabel(unit) + '<input inputmode="decimal" data-planw="1" data-i="' + UI.item + '" value="' + esc(AF.wOut(it.w, unit)) + '" placeholder="Optional"></label>';
      h += '<p class="fine">Stepper jumps ' + step + '. Typing a number is fine too.</p>';
    } else if (it.mode === 'min') {
      h += stepper('Minutes from', it.lo, 'lo', 5) + stepper('Minutes to', it.hi, 'hi', 5);
    } else h += '<p class="lede">Tap to complete. Nothing to count.</p>';
    h += '<button class="choice" data-a="openSwapPlan"><b>Swap exercise</b><small>Same muscle</small></button>';
    h += '<button class="texty danger" data-a="removeItem">Remove</button>';
    return h;
  }
  function stepper(label, val, key, by) {
    return '<div class="stepper"><span>' + label + '</span><button data-a="step" data-key="' + key + '" data-by="-' + by + '" aria-label="Decrease ' + label + '">−</button><b>' + esc(val) + '</b><button data-a="step" data-key="' + key + '" data-by="' + by + '" aria-label="Increase ' + label + '">+</button></div>';
  }
  function moveHTML() {
    const k = UI.editDate;
    const ws = AF.weekStart(k);
    let h = '<div class="grab"></div><button class="texty left" data-a="sheetDay">‹ Day</button><h3>Swap ' + AF.DOW[AF.dowMon(k)] + '</h3>';
    h += '<div class="seg"><button class="' + (UI.every ? '' : 'on') + '" data-a="scope" data-v="0">This week</button><button class="' + (UI.every ? 'on' : '') + '" data-a="scope" data-v="1">Every week</button></div>';
    for (let i = 0; i < 7; i++) {
      const d = AF.addDays(ws, i);
      if (d === k) continue;
      const day = AF.dayFor(PE, d);
      h += '<button class="choice" data-a="doMove" data-date="' + d + '"><b>' + AF.DOW[i] + ' ' + AF.pkey(d).getDate() + '</b><small>' + esc(day.title) + '</small></button>';
    }
    return h;
  }
  function addHTML() {
    ensureEdit();
    if (UI.pickMuscle) {
      const g = AF.libraryGroups(UI.edit).find(x => x.m === UI.pickMuscle);
      let h = '<div class="grab"></div><button class="texty left" data-a="addBack">‹ Muscles</button><h3>' + esc(UI.pickMuscle) + '</h3>';
      (g ? g.ids : []).forEach(id => {
        const lib = AF.LIB[id];
        h += '<button class="choice" data-a="addEx" data-id="' + id + '"><b>' + esc(lib.n) + '</b><small>' + esc(lib.eq || '') + '</small></button>';
      });
      return h;
    }
    let h = '<div class="grab"></div><button class="texty left" data-a="sheetDay">‹ Day</button><h3>Add exercise</h3>';
    AF.libraryGroups(UI.edit).forEach(g => {
      h += '<button class="choice" data-a="pickMuscle" data-m="' + esc(g.m) + '"><b>' + esc(g.m) + '</b><small>' + g.ids.length + '</small></button>';
    });
    return h;
  }
  function planSwapHTML() {
    ensureEdit();
    const it = UI.edit.items[UI.item];
    if (!it) return '';
    const ids = AF.alternatives(it.id, UI.edit, PE);
    let h = '<div class="grab"></div><button class="texty left" data-a="editItemBack">‹ Exercise</button><h3>Swap</h3>';
    ids.forEach(id => {
      const lib = AF.LIB[id];
      h += '<button class="choice' + (id === it.id ? ' cur' : '') + '" data-a="swapPlan" data-id="' + id + '"><b>' + esc(lib.n) + '</b><small>' + esc(lib.eq || lib.m) + '</small></button>';
    });
    return h;
  }

  function commitDay() {
    AF.setDay(PE, UI.editDate, UI.edit);
    savePlan();
  }
  function refreshEditSheets() { render(); }

  const actions = {
    tab(el) { UI.tab = el.dataset.tab; UI.logging = false; UI.mode = null; render(); },
    start() { startToday(); },
    resume() { if (S.active) openLog(); },
    minLog() { readLogInputs(); saveStore(); UI.logging = false; rest = null; render(); toast('Saved. Resume any time.'); },
    discard() {
      if (!S.active) return;
      if (!confirm('Discard this workout?')) return;
      S.active = null; rest = null; UI.logging = false; saveStore(); render(); toast('Discarded');
    },
    finish() { finish(); },
    toggleSet(el) {
      readLogInputs();
      const e = S.active && S.active.exercises[+el.dataset.ei];
      const s = e && e.sets[+el.dataset.si];
      if (!s) return;
      s.done = !s.done;
      if (s.done && exMode(e) === 'sets') {
        if (s.r == null) s.r = exLo(e);
        if (unfinished(S.active)) startRest(e.rest || AF.resolveEx(exId(e), PE).rest || 90);
        else rest = null;
      }
      haptic(s.done ? 18 : 8);
      saveSoon();
      paintLog();
    },
    addSet(el) {
      readLogInputs();
      const e = S.active.exercises[+el.dataset.ei];
      const prev = e.sets[e.sets.length - 1];
      e.sets.push({ w: prev ? prev.w : null, r: exLo(e), done: false });
      saveSoon(); paintLog();
    },
    addOptional() {
      if (!S.active || !S.active.optional) return;
      S.active.exercises = S.active.exercises.concat(S.active.optional);
      S.active.optional = [];
      saveSoon(); paintLog();
    },
    openSwap(el) { readLogInputs(); UI.swapEi = +el.dataset.ei; UI.mode = 'swap'; paintSheet(); },
    doSwap(el) {
      const e = S.active && S.active.exercises[UI.swapEi];
      if (!e) return;
      const id = el.dataset.id;
      const item = { id: id, sets: e.planned || e.sets.length, lo: exLo(e), hi: exHi(e), mode: 'sets' };
      const fresh = buildEx(item);
      fresh.sets.forEach((s, i) => { if (e.sets[i] && e.sets[i].done) fresh.sets[i] = e.sets[i]; });
      S.active.exercises[UI.swapEi] = fresh;
      saveSoon();
      UI.mode = null;
      render();
      toast('Swapped');
    },
    restAdj(el) { if (!rest) return; rest.end += (+el.dataset.v) * 1000; rest.fired = false; paintRest(); },
    restSkip() { rest = null; paintRest(); },
    habit(el) {
      const id = el.dataset.id;
      if (!id) return;
      const k = AF.today();
      if (!S.habitLog || typeof S.habitLog !== 'object') S.habitLog = {};
      const day = S.habitLog[k] = S.habitLog[k] || {};
      if (day[id]) delete day[id]; else day[id] = true;
      saveStore();
      haptic(12);
      render();
      const card = document.getElementById('habits');
      if (card) card.scrollIntoView({ block: 'nearest' });
    },
    crunchVisit() {
      const k = AF.today();
      S.fit3.crunch[k] = true;
      saveStore(); haptic(12); render(); toast('Crunch visit counted');
    },
    undo() {
      if (!undoId) return;
      const i = S.workouts.findIndex(w => w.id === undoId);
      if (i >= 0) S.workouts.splice(i, 1);
      undoId = null; saveStore(); render(); toast('Undone');
    },
    trainAnyway() { UI.mode = 'train'; paintSheet(); },
    trainCode(el) {
      const d = dayByCode(el.dataset.code);
      UI.mode = null; closeSheet(true);
      if (d) startDay(AF.today(), d);
    },
    openDay(el) {
      UI.editDate = el.dataset.date;
      UI.edit = AF.dayFor(PE, UI.editDate);
      UI.mode = 'day'; UI.every = false; UI.pickMuscle = null;
      paintSheet();
    },
    editItem(el) { UI.item = +el.dataset.i; UI.mode = 'item'; paintSheet(); },
    editItemBack() { UI.mode = 'item'; paintSheet(); },
    sheetDay() { UI.mode = 'day'; paintSheet(); },
    sheetBack() { UI.mode = null; closeSheet(true); paintLog(); },
    closeSheet() { UI.mode = null; hideSheet(); render(); },
    step(el) {
      const it = UI.edit.items[UI.item];
      const key = el.dataset.key;
      it[key] = Math.max(1, (+it[key] || 1) + (+el.dataset.by));
      if (key === 'sets') it.sets = Math.min(10, it.sets);
      if (it.hi < it.lo) { if (key === 'lo') it.hi = it.lo; else it.lo = it.hi; }
      commitDay(); paintSheet();
    },
    moveItem(el) {
      const i = +el.dataset.i, dir = +el.dataset.dir, items = UI.edit.items;
      const j = i + dir;
      if (j < 0 || j >= items.length) return;
      const tmp = items[i]; items[i] = items[j]; items[j] = tmp;
      commitDay(); paintSheet();
    },
    openAdd() { UI.mode = 'add'; UI.pickMuscle = null; paintSheet(); },
    pickMuscle(el) { UI.pickMuscle = el.dataset.m; paintSheet(); },
    addBack() { UI.pickMuscle = null; paintSheet(); },
    addEx(el) {
      const lib = AF.LIB[el.dataset.id];
      const small = lib.small;
      const mode = lib.mode || 'sets';
      UI.edit.items.push(AF.normalizeDay({ items: [{ id: el.dataset.id, mode: mode, sets: mode === 'sets' ? (small ? 2 : 3) : 1, lo: mode === 'min' ? 20 : mode === 'check' ? 10 : (small ? 10 : 8), hi: mode === 'min' ? 30 : mode === 'check' ? 10 : (small ? 15 : 12), w: null }] }, PE).items[0]);
      commitDay();
      UI.mode = 'day'; paintSheet(); render();
    },
    removeItem() {
      if (!confirm('Remove this exercise from the day?')) return;
      UI.edit.items.splice(UI.item, 1);
      commitDay(); UI.mode = 'day'; render();
    },
    openSwapPlan() { UI.mode = 'planSwap'; paintSheet(); },
    swapPlan(el) {
      const it = UI.edit.items[UI.item];
      it.id = el.dataset.id;
      const lib = AF.resolveEx(it.id, PE);
      it.mode = lib.mode || 'sets';
      commitDay(); UI.mode = 'item'; render();
    },
    openMove() { UI.mode = 'move'; paintSheet(); },
    scope(el) { UI.every = el.dataset.v === '1'; paintSheet(); },
    doMove(el) {
      AF.swapDays(PE, UI.editDate, el.dataset.date, !!UI.every);
      savePlan();
      toast(UI.every ? 'Swapped every week' : 'Swapped this week');
      UI.mode = null; closeSheet(true); render();
    },
    applyEvery() {
      AF.setTemplateDay(PE, UI.editDate, UI.edit);
      const ws = AF.weekStart(UI.editDate), i = String(AF.dowMon(UI.editDate));
      if (PE.fit.weeks[ws]) {
        delete PE.fit.weeks[ws][i];
        if (!Object.keys(PE.fit.weeks[ws]).length) delete PE.fit.weeks[ws];
      }
      savePlan();
      toast('Every ' + AF.DOW[AF.dowMon(UI.editDate)] + ' updated');
      render();
    },
    resetDay() {
      if (!confirm('Reset this weekday to the 5-day plan? Other weeks you already changed stay. Logged workouts stay.')) return;
      const fresh = AF.defaultWeek()[AF.dowMon(UI.editDate)];
      UI.edit = AF.normalizeDay(AF.clone(fresh), PE);
      AF.setTemplateDay(PE, UI.editDate, UI.edit);
      const ws = AF.weekStart(UI.editDate), i = String(AF.dowMon(UI.editDate));
      if (PE.fit.weeks[ws]) { delete PE.fit.weeks[ws][i]; if (!Object.keys(PE.fit.weeks[ws]).length) delete PE.fit.weeks[ws]; }
      savePlan();
      toast('Day reset');
      UI.mode = 'day'; render();
    },
    pickChart(el) {
      UI.chart = el.dataset.id;
      render();
      const b = document.querySelector('.chips button.on');
      if (b && b.parentElement) b.parentElement.scrollLeft = Math.max(0, b.offsetLeft - 12);
    },
    openSession(el) { UI.sessionId = el.dataset.id; UI.mode = 'session'; paintSheet(); },
  };

  document.body.addEventListener('click', ev => {
    const t = ev.target.closest('[data-a]');
    if (!t || t.disabled) return;
    const fn = actions[t.dataset.a];
    if (!fn) return;
    fn(t);
  });
  document.body.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.f && S.active) { applyLogInput(t); saveSoon(); }
    if (t.dataset.planw && UI.edit) {
      const it = UI.edit.items[+t.dataset.i];
      if (!it) return;
      it.w = AF.wIn(t.value, unit);
      if (it.w == null) delete it.wAt; else it.wAt = Date.now();
      commitDay();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveStore(); });

  function boot() {
    const q = new URLSearchParams(location.search).get('date');
    if (q) AF.setToday(q);
    const loaded = AF.load(localStorage);
    S = loaded.S; PE = loaded.PE;
    badStore = !!loaded.badStore;
    unit = AF.unitOf(S);
    render();
    setInterval(tick, 250);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      const had = !!navigator.serviceWorker.controller;
      let once = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (had && !once && !(S && S.active)) { once = true; location.reload(); }
      });
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
  }

  boot();
})();
