/* Progress: weight trend + projection, calorie check, waist, e1RM, cardio vs plan, habits, knee, tests */
'use strict';
/* ======================= PROGRESS ======================= */
const xT = k => diffDays(PLAN_START, k);
const monthTicks = [{ x: xT('2026-10-05'), label: 'Oct 5' }, { x: xT('2026-11-01'), label: 'Nov 1' }, { x: xT('2026-12-01'), label: 'Dec 1' }, { x: xT('2026-12-31'), label: 'Dec 31' }];
function weekAgg() {
  const t = today();
  return WEEKS.map(m => {
    const r = { wk: m.wk, run: 0, swim: 0, bike: 0, hockey: 0, prun: 0, pswim: 0, pbike: 0, phockey: 0, hab: 0, habN: 0 };
    for (let i = 0; i < 7; i++) {
      const k = addDays(m.start, i); if (k > PLAN_END) break; const dp = dayPlan(k); if (!dp || dp.off) { if (k <= t) { r.hab += habitPct(k); r.habN++; } continue; }
      dp.sessions.forEach(s => { if (s.skipped) return; if (s.kind === 'cardio') { const c = s.cardio; if (c.mode === 'swim') r.pswim += c.dist || 0; else if (r['p' + c.mode] != null) r['p' + c.mode] += c.min || 0; } if (s.kind === 'lift' && s.finisher && r['p' + s.finisher.mode] != null) r['p' + s.finisher.mode] += s.finisher.min || 0; });
      if (k <= t) { r.hab += habitPct(k); r.habN++; }
    }
    S.workouts.filter(w => w.date >= m.start && w.date <= m.end && w.cardio).forEach(w => { const c = w.cardio; if (c.mode === 'swim') r.swim += c.dist || 0; else if (r[c.mode] != null) r[c.mode] += +c.dur || 0; });
    return r;
  });
}
VIEWS.progress = function () {
  const t = today(), ws = weights(), r7 = rolling7(), pj = projection(), goal = S.settings.goalWeight;
  let h = hdr(`Goal ${U.wOut(goal)} ${wu()} by Dec 31`, 'Progress');
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
  h += benchCard();
  const cs = calorieSuggestion();
  h += `<h2 class="sec">Calorie check <small>${fmtNum(S.settings.kcal)} kcal now</small></h2><div class="card" id="kcalcard">`;
  if (cs.status === 'need') h += `<div class="row"><div style="font-size:22px">🍽️</div><div class="small muted">Needs ≥3 weigh-ins in each of the last two 7-day windows to compare weekly averages.${cs.cur ? ` This week: ${cs.cur.n}.` : ''}</div></div>`;
  else h += `<div class="row between"><div><div class="small muted">Prior 7d → last 7d avg</div><div style="font-weight:800;font-size:20px">${U.wOut(cs.prev.v)} → ${U.wOut(cs.cur.v)} ${wu()}</div></div><span class="chip ${cs.status === 'hold' ? 'ok' : 'test'}">${cs.status === 'hold' ? 'Hold' : cs.status === 'down' ? '−150 kcal' : '+150 kcal'}</span></div><div class="small muted" style="margin:10px 0">${esc(cs.msg)}</div>${cs.status !== 'hold' ? `<button class="btn sm tap" data-a="applyKcal" data-v="${cs.to}">Apply ${fmtNum(cs.to)} kcal</button>` : ''}`;
  h += `<div class="xs dim" style="margin-top:10px">Rule: weekly avg drops &lt;0.5 lb → −150 kcal · &gt;1.5 lb → +150 kcal. Keep protein ≥${S.settings.protein} g.</div></div>`;
  const wa = Object.keys(S.body).filter(k => S.body[k].waist).sort().map(k => ({ x: xT(k), y: U.lOut(S.body[k].waist) }));
  TESTS.forEach(ts => { const v = S.tests[ts.key].waist; if (v && !wa.find(p => p.x === xT(ts.date))) wa.push({ x: xT(ts.date), y: U.lOut(v) }); });
  wa.sort((a, b) => a.x - b.x);
  h += `<h2 class="sec">Waist <small>${wa.length ? wa[wa.length - 1].y + ' ' + lu() : ''}</small></h2><div class="card">${Charts.line({ series: [{ pts: wa, color: '#3DA9FC', r: 3.5 }], xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Measure at the navel, morning, relaxed.' })}<div class="row" style="margin-top:12px"><input class="inp grow" id="waist-in" type="number" inputmode="decimal" step="0.1" placeholder="Waist today (${lu()})" value="${S.body[t] && S.body[t].waist ? U.lOut(S.body[t].waist) : ''}"><button class="btn sm tap" style="height:48px" data-a="saveWaist">Log</button></div></div>`;
  const lifts = ['flat_bench', 'paused_bench', 'weighted_pullup', 'lat_pulldown', 'rdl', 'leg_press'];
  const short = { flat_bench: 'Bench', paused_bench: 'Paused', weighted_pullup: 'Pull-up', lat_pulldown: 'Pulldown', rdl: 'RDL', leg_press: 'Leg Press' };
  if (!lifts.includes(UI.liftSel)) UI.liftSel = 'flat_bench';
  const lh = exHistory(UI.liftSel);
  h += `<h2 class="sec">Estimated 1RM <small>${lh.length ? 'Best ' + U.wOut(Math.max(...lh.map(x => x.best)), 0) + ' ' + wu() : ''}</small></h2><div class="card"><div class="seg" style="margin-bottom:12px">${lifts.map(l => `<button class="${UI.liftSel === l ? 'on' : ''}" data-a="liftSel" data-v="${l}">${short[l]}</button>`).join('')}</div>${Charts.line({ series: [{ pts: lh.map(x => ({ x: xT(x.date), y: U.wOut(x.best, 0) })), color: '#FF7A3D', r: 3.5 }], xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Finish a workout with this lift to chart e1RM (Epley).' })}${EX[UI.liftSel].added ? '<div class="xs dim" style="margin-top:6px">Pull-up e1RM uses added load.</div>' : ''}</div>`;
  const wa2 = weekAgg(), cur2 = WEEKS.findIndex(m => t >= m.start && t <= m.end), sel = UI.cardioSel;
  h += `<h2 class="sec">Cardio per week <small>${sel === 'swim' ? su() : 'min'} · ghost = plan</small></h2><div class="card"><div class="seg" style="margin-bottom:12px">${['run', 'swim', 'bike', 'hockey'].map(m => `<button class="${sel === m ? 'on' : ''}" data-a="cardioSel" data-v="${m}">${MODE_LABEL[m]}</button>`).join('')}</div>${Charts.bars({ id: 'cv', labels: wa2.map(r => 'W' + r.wk), values: wa2.map(r => sel === 'swim' ? U.sOut(r.swim) : r[sel]), ghost: wa2.map(r => sel === 'swim' ? U.sOut(r.pswim) : r['p' + sel]), color: { run: '#2EE6A6', swim: '#3DA9FC', bike: '#FFC145', hockey: '#B98CFF' }[sel], hi: cur2 })}</div>`;
  h += `<h2 class="sec">Habit completion</h2><div class="card">${Charts.bars({ id: 'hb', labels: wa2.map(r => 'W' + r.wk), values: wa2.map(r => r.habN ? r.hab / r.habN * 100 : 0), color: '#FF7A3D', color2: '#FF2E63', fmt: v => Math.round(v) + '%', hi: cur2 })}</div>`;
  const kn = Object.keys(S.body).filter(k => S.body[k].knee != null).sort().map(k => ({ x: xT(k), y: S.body[k].knee }));
  h += `<h2 class="sec">Knee pain</h2><div class="card">${Charts.line({ series: [{ pts: kn, color: '#FFC145', r: 3, area: false, width: 1.5 }], hlines: [{ y: 3, label: 'Swap ≥3', color: '#FF4D5E' }], yMin: 0, yMax: 10, xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Log knee pain daily on Today.' })}</div>`;
  h += `<h2 class="sec">Test days <button class="btn sm tap" data-a="testSheet" data-key="${currentTestKey()}">Enter results</button></h2><div class="card" style="overflow-x:auto"><table class="tests"><tr><th>Test</th>${TESTS.map(x => `<th>${x.short}</th>`).join('')}<th>Δ</th></tr>${TEST_FIELDS.map(f => { const vals = TESTS.map(x => testVal(x.key, f.id)); const nn = vals.filter(v => v != null); let dl = ''; if (nn.length >= 2) { const d = nn[nn.length - 1] - nn[0]; const good = f.better === 'down' ? d < 0 : d > 0; dl = `<span class="delta ${d === 0 ? '' : good ? 'good' : 'bad'}">${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtTest(f, Math.abs(d))}</span>`; } return `<tr><td>${f.label}</td>${vals.map(v => `<td>${v == null ? '<span class="dim">—</span>' : fmtTest(f, v)}</td>`).join('')}<td>${dl || '<span class="dim">—</span>'}</td></tr>`; }).join('')}</table><div class="xs dim" style="margin-top:8px">Weight auto-fills from that week's average weigh-ins.</div></div>`;
  return h;
};
/* goal #2: get stronger — bench press focus */
function benchCard() {
  const g = benchGoal(), ss = benchSessions(), tests = benchTests(), xMax = xT(PLAN_END) + 3, nt = nextTarget('flat_bench', { role: 'bench' });
  const up = (() => { for (let i = 0; i < 14; i++) { const k = addDays(today(), i), dp = dayPlan(k); const s = dp && !dp.off && dp.sessions.find(x => x.kind === 'lift' && x.tpl === 'upperA' && !x.skipped && !sessionDone(x.key)); if (s) return k; } return null; })();
  const ntk = up ? nextTarget('flat_bench', { role: 'bench', k: up }) : nt;
  let h = `<h2 class="sec">Bench press · e1RM <small>Goal #2 · get stronger</small></h2><div class="card" id="benchCard">`;
  if (g) {
    const pct = Math.max(0, Math.min(1, (g.now - g.base) / (g.hi - g.base || 1)));
    h += `<div class="row between"><div><div class="small muted">Estimated 1RM now</div><div class="kpi" id="benchNow">${U.wOut(g.now, 0)}<small>${wu()}</small></div></div><div style="text-align:right"><div class="delta ${g.pct >= 0 ? 'good' : 'bad'}">${g.pct >= 0 ? '▲' : '▼'} ${Math.abs(g.pct).toFixed(1)}% from ${U.wOut(g.base, 0)}</div><div class="small muted" id="benchTarget">Dec 31 target: <b>${U.wOut(g.lo, 0)}–${U.wOut(g.hi, 0)} ${wu()}</b> (+5–10%)</div></div></div><div class="pbar" style="margin-top:10px"><i style="width:${pct * 100}%;background:linear-gradient(90deg,#FF7A3D,#FFC145)"></i></div><div class="xs dim" style="margin-top:6px">Baseline = ${esc(g.src)}.</div>`;
  } else h += `<div class="small muted">Log a heavy top set on Upper A (or the bench AMRAP on a test day) to set your bench baseline. Target: +5–10% by Dec 31.</div>`;
  const series = [{ pts: ss.filter(x => x.heavy || x.mod !== 'deload').map(x => ({ x: xT(x.k), y: U.wOut(x.e1, 0) })), color: '#FF7A3D', r: 3.5 }, { pts: tests.map(t => ({ x: xT(t.k), y: U.wOut(t.v, 0) })), color: '#FFC145', line: false, area: false, r: 5.5 }];
  const hl = g ? [{ y: U.wOut(g.hi, 0), label: '+10% ' + U.wOut(g.hi, 0), color: '#2EE6A6' }, { y: U.wOut(g.lo, 0), label: '+5% ' + U.wOut(g.lo, 0), color: 'rgba(46,230,166,.55)' }] : [];
  if (g && ss.length) { const last = ss[ss.length - 1]; series.push({ pts: [{ x: xT(last.k), y: U.wOut(g.now, 0) }, { x: xT(PLAN_END), y: U.wOut((g.lo + g.hi) / 2, 0) }], color: '#2EE6A6', dash: '4 5', width: 1.6, dots: false, area: false, opacity: .7 }); }
  h += `<div style="margin-top:12px" id="benchChart">${Charts.line({ series, hlines: hl, xMin: xT('2026-10-01'), xMax, xTicks: monthTicks, empty: 'Your bench e1RM trend appears after your first heavy top set.' })}</div><div class="legend"><span><i style="background:#FF7A3D"></i>Top-set e1RM</span><span><i style="background:#FFC145;height:8px;width:8px;border-radius:50%"></i>Test day</span><span><i style="background:#2EE6A6"></i>+5–10% target</span></div>`;
  if (ntk) h += `<div class="sugg" style="margin-top:10px">🎯 <span>Next Upper A${up ? ` (${fmtDow(up)})` : ''}: <b>${esc(targetText('flat_bench', { role: 'bench', k: up || today() }))}</b> — ${esc(ntk.note)}</span></div>`;
  h += `<div class="xs dim" style="margin-top:8px">Phases: Base 5–6 · Build 3–4 · Sharpen 2–3 + heavy single. On a calorie deficit bench gains are modest — keep protein ≥${S.settings.protein} g and fat loss stays priority #1.</div></div>`;
  return h;
}
function currentTestKey() { const t = today(); const up = TESTS.find(x => weekStart(x.date) <= t && t <= addDays(weekStart(x.date), 6)) || TESTS.find(x => x.date >= t) || TESTS[TESTS.length - 1]; return up.key; }
function testWeekAvg(key) { const ts = TESTS.find(x => x.key === key); const w0 = weekStart(ts.date); const vs = weights().filter(p => p.k >= w0 && p.k <= addDays(w0, 6)).map(p => p.v); return vs.length ? vs.reduce((a, b) => a + b) / vs.length : null; }
function testVal(key, f) { const v = (S.tests[key] || {})[f]; if (v != null && v !== '') return +v; if (f === 'weight') return testWeekAvg(key); if (f === 'bench') return benchTestE1(key); return null; }
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
  <div class="small" style="margin:14px 0 6px;font-weight:700">Bench test · AMRAP @ ~85%${benchNow() ? ` <span class="dim">(≈ ${U.wOut(roundLoad(benchNow().v * 0.85))} ${wu()})</span>` : ''}</div><div class="grid2"><div class="field"><label>Load (${wu()})</label><input class="inp" id="t-benchW" type="number" inputmode="decimal" step="any" value="${tv.benchW != null ? U.wOut(tv.benchW) : ''}" placeholder="${benchNow() ? U.wOut(roundLoad(benchNow().v * 0.85)) : 'e.g. 185'}"></div><div class="field"><label>Reps to failure</label><input class="inp" id="t-benchR" type="number" inputmode="numeric" value="${tv.benchR ?? ''}" placeholder="3–8"></div></div><div class="xs dim" style="margin-top:6px">e1RM = load × (1 + reps/30). Leave blank to use the best top set logged that week${benchTestE1(key) && tv.bench == null ? ` (${U.wOut(benchTestE1(key), 0)} ${wu()})` : ''}.</div>
  <div class="small dim" style="margin-top:10px">Test date: ${fmtLong(ts.date)}. Leave weight blank to use that week's average${avg ? ` (${U.wOut(avg)} ${wu()})` : ''}.</div><button class="btn tap" style="margin-top:16px" data-a="saveTests">Save results</button>`);
}

ACT.testSheet = (el, d) => testSheet(d.key);
ACT.saveTests = () => {
  const key = UI.testSel, tv = {}; const g = id => $('#t-' + id).value.trim();
  if (g('weight')) tv.weight = U.wIn(g('weight')); if (g('waist')) tv.waist = U.lIn(g('waist'));
  if (g('mile')) { const s = parseTime(g('mile')); if (s == null) return toast('Mile time as mm:ss'); tv.mile = s; }
  if (g('swim100')) { const s = parseTime(g('swim100')); if (s == null) return toast('Swim time as mm:ss'); tv.swim100 = s; }
  if (g('pullups')) tv.pullups = +g('pullups'); if (g('broad')) tv.broad = U.lIn(g('broad'));
  if (g('benchW') || g('benchR')) { const bw = U.wIn(g('benchW')), br = +g('benchR'); if (!bw || !br) return toast('Bench test: enter load and reps'); if (br > 12) return toast('Use a load you can do ≤12 reps with (~85%)'); tv.benchW = bw; tv.benchR = br; tv.bench = +e1rm(bw, br).toFixed(1); }
  S.tests[key] = tv; save(); closeSheet(); haptic(15); toast('Test results saved ✓'); rerenderKeep();
};
ACT.applyKcal = (el, d) => { S.kcalLog.push({ date: today(), from: S.settings.kcal, to: +d.v }); S.settings.kcal = +d.v; save(); haptic(15); toast('Target → ' + fmtNum(S.settings.kcal) + ' kcal'); rerenderKeep(); };
ACT.saveWaist = () => { const k = today(), v = $('#waist-in').value; if (!v) return toast('Enter waist first'); (S.body[k] = S.body[k] || {}).waist = +U.lIn(v).toFixed(2); save(); haptic(15); toast('Waist logged ✓'); rerenderKeep(); };
ACT.liftSel = (el, d) => { UI.liftSel = d.v; haptic(); rerenderKeep(); };
ACT.cardioSel = (el, d) => { UI.cardioSel = d.v; haptic(); rerenderKeep(); };
