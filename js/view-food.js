/* Food tab v2.6 — calorie tracker: ring + macros, meals, search (starter · mine · USDA · Open Food Facts),
   barcode scan, servings (g / oz / serving), recent & frequent, copy meals, My Meals, quick add, weekly view.
   Log entries keep the v2 shape { id, name, kcal, p, qty, meal, fid } (+ optional c, f, amt, unit, ref, brand) so older data still adds up. */
'use strict';
function autoMeal() { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack'; }
function foodK() { return UI.foodDate || today(); }
const MEAL_BY = Object.fromEntries(MEALS.map(m => [m[0], m]));
const FMAP = {}; // id → food, filled as lists render (taps look foods up here)
function fTargets() { return { kcal: +S.settings.kcal || 2550, p: +S.settings.protein || 190 }; }
function fDayLbl(k) { const t = today(); return k === t ? 'Today' : k === addDays(t, -1) ? 'Yesterday' : fmtDow(k); }
const gR = v => Math.round(v || 0);

/* ---------- log writes ---------- */
function touchMeal(k, meal) { const m = S.food.meals[k] = S.food.meals[k] || {}; m[meal] = true; }
function pushEntries(k, es) { const l = S.food.log[k] = S.food.log[k] || []; es.forEach(e => { l.push(e); touchMeal(k, e.meal); }); syncProteinHabit(k); save(); haptic(10); }
function addFood(k, f, meal) { // v2 API (quick protein buttons etc.) — merges same item by qty
  const l = S.food.log[k] = S.food.log[k] || [];
  const same = l.find(x => x.name === f.name && x.meal === meal && x.kcal === f.kcal && x.p === f.p && !x.ref);
  if (same) same.qty = +(same.qty + 1).toFixed(2); else l.push({ id: uid(), name: f.name, kcal: +f.kcal || 0, p: +f.p || 0, c: +f.c || 0, f: +f.f || 0, qty: 1, meal, fid: f.id || null });
  touchMeal(k, meal); syncProteinHabit(k); save(); haptic(10);
}
function refOf(f) { return { src: f.src, per100: f.per100 || null, perSrv: f.perSrv || null, srvG: f.srvG || null, srvLbl: f.srvLbl || null, code: f.code || null, fdc: f.fdc || null }; }
function mkEntry(f, amt, unit, meal) { const m = macrosFor(f, amt, unit); return { id: uid(), name: f.n, brand: f.brand || '', kcal: m.kcal, p: m.p, c: m.c, f: m.f, qty: 1, meal, fid: f.id, amt: +amt, unit, ref: refOf(f) }; }
const eTot = e => { const q = e.qty || 1; return { kcal: (+e.kcal || 0) * q, p: (+e.p || 0) * q, c: (+e.c || 0) * q, f: (+e.f || 0) * q }; };
const sumT = es => es.reduce((a, e) => { const t = eTot(e); return { kcal: a.kcal + t.kcal, p: a.p + t.p, c: a.c + t.c, f: a.f + t.f }; }, { kcal: 0, p: 0, c: 0, f: 0 });
function eAmt(e) { return e.unit ? amtLabel(e.amt, e.unit, e.ref) : (e.qty && e.qty !== 1 ? '× ' + (+e.qty.toFixed(2)) : '1 serving'); }
let FUNDO = null;
function undoable(k, ids, msg) { FUNDO = { k, ids }; toast(msg, 'fUndo'); }
ACT.fUndo = () => { if (!FUNDO) return; const l = S.food.log[FUNDO.k] || []; S.food.log[FUNDO.k] = l.filter(e => !FUNDO.ids.includes(e.id)); FUNDO = null; save(); toast('Undone'); rerenderKeep(); if ($('#fa')) refreshFa(); };

/* ---------- food sources → one shape { id, n, brand, src, per100, perSrv, srvG, srvLbl } ---------- */
function reg(f) { FMAP[f.id] = f; return f; }
function customToFood(c) { return { id: c.id, n: c.n, src: 'custom', perSrv: { kcal: +c.kcal || 0, p: +c.p || 0, c: +c.c || 0, f: +c.f || 0 }, srvLbl: c.srvLbl || 'serving', srvG: c.srvG || null, per100: c.per100 || null, brand: c.brand || '' }; }
function listToFood(f) { return { id: f.id, n: f.n, src: 'list', perSrv: { kcal: f.kcal, p: f.p, c: 0, f: 0 }, srvLbl: 'serving', srvG: null, per100: null, cat: f.cat }; }
function entryToFood(e) { return e.ref ? { ...e.ref, id: e.fid || ('e_' + e.id), n: e.name, brand: e.brand || '' } : { id: e.fid || ('e_' + e.name), n: e.name, src: 'list', perSrv: { kcal: +e.kcal || 0, p: +e.p || 0, c: +e.c || 0, f: +e.f || 0 }, srvLbl: 'serving', srvG: null, per100: null }; }
function findFood(id) { if (FMAP[id]) return FMAP[id]; const s = STARTER.find(x => x.id === id); if (s) return reg(s); const c = S.food.custom.find(x => x.id === id); if (c) return reg(customToFood(c)); const l = FOODS.find(x => x.id === id); return l ? reg(listToFood(l)) : null; }
function defServing(f) { // last used amount for this food, else its serving, else 100 g
  const last = recentEntries(80).find(e => e.fid === f.id && e.unit);
  if (last) return { amt: last.amt, unit: last.unit };
  if (f.perSrv || f.srvG) return { amt: 1, unit: 'srv' };
  return { amt: 100, unit: 'g' };
}
function recentEntries(limit = 25) {
  const ks = Object.keys(S.food.log).sort().reverse().slice(0, 45), seen = new Set(), out = [];
  for (const k of ks) for (const e of [...(S.food.log[k] || [])].reverse()) { const key = (e.fid || '') + '|' + e.name; if (seen.has(key)) continue; seen.add(key); out.push(e); if (out.length >= limit) return out; }
  return out;
}
function freqEntries(limit = 20) {
  const from = addDays(today(), -60), m = {};
  Object.keys(S.food.log).filter(k => k >= from).sort().forEach(k => (S.food.log[k] || []).forEach(e => { const key = (e.fid || '') + '|' + e.name; m[key] = m[key] || { n: 0, e }; m[key].n++; m[key].e = e; }));
  return Object.values(m).filter(x => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, limit);
}
function allFoods() { const veg = ['vegetarian', 'vegan'].includes(S.profile.diet.pref), pesc = S.profile.diet.pref === 'pescatarian'; return S.food.custom.map(f => ({ ...f, cat: 'My foods', custom: true })).concat(FOODS.filter(f => !(veg && f.diet !== 'veg') && !(pesc && f.diet === 'meat'))); }
function localSearch(q) {
  const toks = q.toLowerCase().split(/\s+/).filter(Boolean), hit = n => toks.every(t => n.toLowerCase().includes(t)), out = [], seen = new Set();
  const add = f => { if (seen.has(f.n.toLowerCase())) return; seen.add(f.n.toLowerCase()); out.push(reg(f)); };
  S.food.custom.filter(c => hit(c.n)).forEach(c => add(customToFood(c)));
  recentEntries(60).filter(e => hit(e.name)).forEach(e => add(entryToFood(e)));
  STARTER.filter(s => hit(s.n)).forEach(add);
  allFoods().filter(f => !f.custom && hit(f.n)).forEach(f => add(listToFood(f)));
  return out.slice(0, 25);
}

/* ---------- rendering helpers ---------- */
const SRC_BADGE = { starter: ['USDA', 'usda'], usda: ['USDA', 'usda'], off: ['Scan DB', 'off'], custom: ['Mine', 'mine'], list: ['Quick', 'list'] };
function badge(src) { const b = SRC_BADGE[src] || ['', '']; return b[0] ? `<span class="fbadge ${b[1]}">${b[0]}</span>` : ''; }
function foodRow(f, opts = {}) {
  reg(f); const d = opts.e ? { amt: opts.e.amt, unit: opts.e.unit } : defServing(f);
  const m = opts.e ? eTot(opts.e) : macrosFor(f, d.amt, d.unit), lbl = opts.e ? eAmt(opts.e) : amtLabel(d.amt, d.unit, f);
  const ex = opts.e ? `data-eid="${opts.e.id}" data-ek="${opts.ek || ''}"` : '';
  return `<div class="frow2"><button class="grow tap fpick" data-a="fOpen" data-fid="${esc(f.id)}" ${ex}><div class="fn">${esc(f.n)} ${badge(f.src)}</div><div class="xs dim">${f.brand ? esc(f.brand) + ' · ' : ''}${esc(lbl)} · ${fmtNum(m.kcal)} kcal · ${gR(m.p)} g P${opts.n ? ` · ${opts.n}×` : ''}</div></button><button class="icon-btn tap plus" data-a="fPlus" data-fid="${esc(f.id)}" ${ex} aria-label="Add ${esc(f.n)}">+</button></div>`;
}
function ringSvg(v, tgt) {
  const r = 50, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, v / tgt)), over = v > tgt;
  return `<svg class="kring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="11"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${over ? 'var(--bad)' : 'url(#kgrad)'}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/><defs><linearGradient id="kgrad" x1="0" x2="1"><stop offset="0" stop-color="#FF7A3D"/><stop offset="1" stop-color="#FF2E63"/></linearGradient></defs></svg>`;
}

/* ---------- Food tab ---------- */
VIEWS.food = function () {
  const k = foodK();
  let h = hdr('Fuel the engine', 'Food', `<button class="icon-btn round tap" data-a="fCal" aria-label="Pick a day (calendar)">${CAL_ICON}</button>`);
  h += `<div class="seg fview" role="tablist">${[['day', 'Day'], ['week', 'Week']].map(([id, l]) => `<button class="tap ${(UI.foodView || 'day') === id ? 'on' : ''}" data-a="fView" data-v="${id}">${l}</button>`).join('')}</div>`;
  return h + (UI.foodView === 'week' ? foodWeekHtml() : foodDayHtml(k));
};
function foodDayHtml(k) {
  const T = fTargets(), log = foodDay(k), tot = sumT(log), isT = k === today(), man = mfpFor(k);
  const left = T.kcal - tot.kcal, pOk = tot.p >= T.p;
  let h = `<div class="card fdate"><button class="icon-btn tap" data-a="foodDay" data-v="-1" aria-label="Previous day">‹</button><div class="grow" style="text-align:center"><b id="foodDateLbl">${fDayLbl(k)}</b><div class="xs dim">${isT ? fmtDow(k) : log.length + ' item' + (log.length === 1 ? '' : 's')}</div></div><button class="icon-btn tap" data-a="foodDay" data-v="1" aria-label="Next day" ${isT ? 'disabled' : ''}>›</button></div>`;
  h += `<div class="card fsum" id="foodSum"><div class="fring">${ringSvg(tot.kcal, T.kcal)}<div class="fring-c"><b id="kcalTot">${fmtNum(tot.kcal)}</b><span>of ${fmtNum(T.kcal)} kcal</span></div></div>
    <div class="grow fmac"><div class="row between small"><span>🥩 Protein</span><b id="protTot" class="${pOk ? 'okc' : ''}">${gR(tot.p)} / ${T.p} g${pOk ? ' ✓' : ''}</b></div><div class="pbar"><i class="pgreen" style="width:${Math.min(100, tot.p / T.p * 100)}%"></i></div>
    <div class="fcf"><div><b>${gR(tot.c)} g</b><span>carbs</span></div><div><b>${gR(tot.f)} g</b><span>fat</span></div><div><b class="${left < 0 ? 'badc' : ''}">${fmtNum(Math.abs(left))}</b><span>${left < 0 ? 'kcal over' : 'kcal left'}</span></div></div></div></div>`;
  if (man && (man.kcal != null || man.p != null)) h += `<div class="tip info"><div class="ic">✍️</div><div class="grow small">Nightly log override for this day: ${man.kcal != null ? fmtNum(man.kcal) + ' kcal' : ''}${man.kcal != null && man.p != null ? ' · ' : ''}${man.p != null ? man.p + ' g protein' : ''}. That number counts for the streak and averages. <button class="btn sm sec tap" style="margin-top:8px" data-a="fUseLog" data-date="${k}">Use the food log instead</button></div></div>`;
  MEALS.forEach(([id, n, ic]) => {
    const es = log.filter(e => e.meal === id), mt = sumT(es), y = (S.food.log[addDays(k, -1)] || []).filter(e => e.meal === id), done = (S.food.meals[k] || {})[id];
    h += `<div class="card fmeal" data-meal="${id}"><div class="fmeal-h"><button class="mck tap ${done ? 'on' : ''}" data-a="mealChk" data-m="${id}" aria-label="${n} eaten">${CHECK}</button><b class="grow">${ic} ${n}</b><span class="small muted">${es.length ? `${fmtNum(mt.kcal)} kcal · ${gR(mt.p)} g P` : ''}</span></div>`;
    h += es.map(e => `<div class="fent"><button class="grow tap fpick" data-a="fEdit" data-id="${e.id}"><div class="fn">${esc(e.name)}</div><div class="xs dim">${esc(eAmt(e))} · ${fmtNum(eTot(e).kcal)} kcal · ${gR(eTot(e).p)} P · ${gR(eTot(e).c)} C · ${gR(eTot(e).f)} F</div></button>${e.unit ? '' : `<div class="qty"><button class="tap" data-a="fqty" data-id="${e.id}" data-v="-1" aria-label="Less">−</button><span>${+(e.qty || 1).toFixed(2)}</span><button class="tap" data-a="fqty" data-id="${e.id}" data-v="1" aria-label="More">+</button></div>`}<button class="icon-btn tap fdel" data-a="fdel" data-id="${e.id}" aria-label="Delete ${esc(e.name)}">✕</button></div>`).join('');
    h += `<div class="fmeal-a"><button class="btn sm tap fadd" data-a="faOpen" data-m="${id}">＋ Add food</button>${y.length ? `<button class="btn sm sec tap" data-a="fCopy" data-from="${addDays(k, -1)}" data-m="${id}">↺ Yesterday</button>` : ''}<button class="btn sm sec tap" data-a="fMealMore" data-m="${id}" aria-label="More for ${n}">⋯</button></div></div>`;
  });
  h += `<div class="row fqrow"><button class="btn sec tap grow" data-a="fQuick">⚡ Quick add kcal + protein</button><button class="btn sec tap grow" data-a="scanOpen" data-m="${autoMealFor(k)}">📷 Scan barcode</button></div>`;
  h += `<div class="small dim" style="margin:10px 4px 0">Day totals feed the nightly log, the protein ✓ (≥${T.p} g) and Progress averages automatically. Whole foods use USDA values; packaged foods come from Open Food Facts.</div>`;
  return h;
}
function autoMealFor(k) { return k === today() ? autoMeal() : 'dinner'; }
function foodWeekHtml() {
  const T = fTargets(), t = today(), ws = addDays(weekStart(t), 7 * (UI.foodWeek || 0)), days = [...Array(7)].map((_, i) => addDays(ws, i)).filter(d => d <= t);
  const rows = days.map(d => ({ d, kc: kcalFor(d), p: (foodDay(d).length || (mfpFor(d) && mfpFor(d).p != null)) ? proteinFor(d) : null, n: foodDay(d).length, man: !!mfpFor(d) }));
  const kv = rows.filter(r => r.kc != null), pv = rows.filter(r => r.p != null), avg = (a, f) => a.length ? Math.round(a.reduce((s, r) => s + f(r), 0) / a.length) : null;
  const ak = avg(kv, r => r.kc), ap = avg(pv, r => r.p), hit = rows.filter(r => r.p != null && r.p >= T.p).length, mx = Math.max(T.kcal * 1.25, ...kv.map(r => r.kc));
  let h = `<div class="card fdate"><button class="icon-btn tap" data-a="fWeek" data-v="-1" aria-label="Previous week">‹</button><div class="grow" style="text-align:center"><b>${UI.foodWeek ? 'Week of ' + fmtDate(ws) : 'This week'}</b><div class="xs dim">${fmtDate(ws)} – ${fmtDate(addDays(ws, 6))}</div></div><button class="icon-btn tap" data-a="fWeek" data-v="1" aria-label="Next week" ${!UI.foodWeek ? 'disabled' : ''}>›</button></div>`;
  h += `<div class="card fwk" id="foodWeek"><div class="fwk-g"><div><b>${ak == null ? '—' : fmtNum(ak)}</b><span>avg kcal${kv.length ? ` · ${kv.length}d` : ''}</span></div><div><b class="${ap != null && ap >= T.p ? 'okc' : ''}">${ap == null ? '—' : ap + ' g'}</b><span>avg protein</span></div><div><b class="${hit >= days.length && days.length ? 'okc' : ''}">${hit}/${days.length}</b><span>days ≥${T.p} g</span></div></div>`;
  h += `<div class="fwk-bars">${[...Array(7)].map((_, i) => { const d = addDays(ws, i), r = rows.find(x => x.d === d), fut = d > t; return `<button class="fwk-r tap" ${fut ? 'disabled' : `data-a="fGoDay" data-date="${d}"`}><span class="fwk-d">${DOW[i]}</span><span class="fwk-bar"><i style="width:${r && r.kc != null ? Math.min(100, r.kc / mx * 100) : 0}%" class="${r && r.kc > T.kcal * 1.08 ? 'over' : ''}"></i><em style="left:${T.kcal / mx * 100}%"></em></span><span class="fwk-k">${r && r.kc != null ? fmtNum(r.kc) : fut ? '' : '—'}</span><span class="fwk-p ${r && r.p != null && r.p >= T.p ? 'okc' : ''}">${r && r.p != null ? r.p + ' g' + (r.p >= T.p ? ' ✓' : '') : ''}</span></button>`; }).join('')}</div>
  <div class="xs dim" style="margin-top:8px">Line = ${fmtNum(T.kcal)} kcal target. Days with a nightly-log override use that number. Tap a day to open it.</div></div>`;
  return h;
}

/* ---------- Day navigation / view ---------- */
ACT.fView = (el, d) => { UI.foodView = d.v === 'week' ? 'week' : 'day'; haptic(); rerenderKeep(); };
ACT.fWeek = (el, d) => { UI.foodWeek = Math.min(0, (UI.foodWeek || 0) + +d.v); haptic(); rerenderKeep(); };
ACT.fGoDay = (el, d) => { if (d.date !== today() && !canBackdate(d.date)) return toast(`Food can be logged up to ${BACKDATE_DAYS} days back`); UI.foodDate = d.date === today() ? null : d.date; UI.foodView = 'day'; haptic(); goTab('food'); };
ACT.foodDay = (el, d) => { const k = addDays(foodK(), +d.v); if (k > today()) return; if (!canBackdate(k)) return toast(`Food can be logged up to ${BACKDATE_DAYS} days back`); UI.foodDate = k === today() ? null : k; haptic(); rerenderKeep(); };
ACT.fCal = () => { UI.calMonth = null; UI.calFor = 'food'; openSheet(calHtml()); };
ACT.fUseLog = (el, d) => { const b = S.body[d.date]; if (b) { delete b.mfp; if (!Object.keys(b).length) delete S.body[d.date]; } syncProteinHabit(d.date); save(); toast('Using the food log for this day'); rerenderKeep(); if ($('#nightly')) refreshNightly(d.date); };
ACT.mealChk = (el, d) => { const k = foodK(), m = S.food.meals[k] = S.food.meals[k] || {}; m[d.m] = !m[d.m]; if (!m[d.m]) delete m[d.m]; save(); haptic(10); rerenderKeep(); };
ACT.fqty = (el, d) => { const k = foodK(), l = foodDay(k), x = l.find(z => z.id === d.id); if (!x) return; x.qty = +((x.qty || 1) + (+d.v) * ((x.qty || 1) <= 1 ? 0.5 : 1)).toFixed(2); if (x.qty <= 0) l.splice(l.indexOf(x), 1); syncProteinHabit(k); save(); haptic(); rerenderKeep(); };
let UNDO_FOOD = null;
ACT.fdel = (el, d) => { const k = foodK(), l = foodDay(k), i = l.findIndex(z => z.id === d.id); if (i < 0) return; UNDO_FOOD = { k, i, x: l[i] }; l.splice(i, 1); save(); haptic(); toast('Removed ' + UNDO_FOOD.x.name, 'undoFood'); rerenderKeep(); };
ACT.undoFood = () => { if (!UNDO_FOOD) return; const { k, i, x } = UNDO_FOOD; (S.food.log[k] = S.food.log[k] || []).splice(i, 0, x); UNDO_FOOD = null; syncProteinHabit(k); save(); rerenderKeep(); };

/* ---------- copy meals ---------- */
function copyMeal(from, meal, toK, toMeal) {
  const src = (S.food.log[from] || []).filter(e => e.meal === meal); if (!src.length) return 0;
  const es = src.map(e => ({ ...JSON.parse(JSON.stringify(e)), id: uid(), meal: toMeal || meal })); pushEntries(toK, es);
  undoable(toK, es.map(e => e.id), `Copied ${es.length} item${es.length > 1 ? 's' : ''} from ${fDayLbl(from)} · ${fmtNum(sumT(es).kcal)} kcal`); return es.length;
}
ACT.fCopy = (el, d) => { closeSheet(); copyMeal(d.from, d.m, foodK(), d.to || d.m); rerenderKeep(); };
ACT.fMealMore = (el, d) => {
  const k = foodK(), m = MEAL_BY[d.m], es = foodDay(k).filter(e => e.meal === d.m);
  const days = [...Array(14)].map((_, i) => addDays(k, -(i + 1))).map(dk => ({ dk, es: (S.food.log[dk] || []).filter(e => e.meal === d.m) })).filter(x => x.es.length);
  openSheet(`<h3>${m[2]} ${m[1]} · ${fDayLbl(k)}</h3>
  ${es.length ? `<button class="btn sec tap" data-a="fSaveMealSheet" data-m="${d.m}">⭐ Save this meal to My Meals</button>` : ''}
  <h4 class="nlsec">Copy ${m[1].toLowerCase()} from another day</h4>${days.length ? days.map(x => `<button class="fcopy tap" data-a="fCopy" data-from="${x.dk}" data-m="${d.m}"><b>${fDayLbl(x.dk)}</b><span class="xs dim">${x.es.length} item${x.es.length > 1 ? 's' : ''} · ${fmtNum(sumT(x.es).kcal)} kcal · ${gR(sumT(x.es).p)} g P — ${esc(x.es.slice(0, 3).map(e => e.name).join(', '))}${x.es.length > 3 ? '…' : ''}</span></button>`).join('') : '<div class="empty">No other days with this meal in the last 2 weeks.</div>'}
  <h4 class="nlsec">Copy a different meal into ${m[1].toLowerCase()}</h4><div class="chips">${[...Array(3)].map((_, i) => addDays(k, -(i + 1))).flatMap(dk => MEALS.filter(([id]) => id !== d.m && (S.food.log[dk] || []).some(e => e.meal === id)).map(([id, n]) => `<button class="chip tap" data-a="fCopy" data-from="${dk}" data-m="${id}" data-to="${d.m}">${fDayLbl(dk)} ${n}</button>`)).join('') || '<span class="xs dim">Nothing in the last 3 days.</span>'}</div>`, 'tall');
};

/* ---------- My Meals ---------- */
ACT.fSaveMealSheet = (el, d) => {
  if (!foodDay(foodK()).some(e => e.meal === d.m)) return toast('Log something in this meal first, then save it');
  const es = foodDay(foodK()).filter(e => e.meal === d.m), nm = es.slice(0, 2).map(e => e.name.split(',')[0]).join(' + ');
  openSheet(`<h3>Save to My Meals</h3><div class="small muted">${es.length} items · ${fmtNum(sumT(es).kcal)} kcal · ${gR(sumT(es).p)} g protein</div><div class="field" style="margin-top:12px"><label>Name</label><input class="inp" id="mmN" value="${esc(nm)}" maxlength="60"></div><button class="btn tap" style="margin-top:14px" data-a="fSaveMeal" data-m="${d.m}">Save meal ⭐</button>`);
};
ACT.fSaveMeal = (el, d) => {
  const es = foodDay(foodK()).filter(e => e.meal === d.m), n = ($('#mmN').value || '').trim() || 'My meal';
  if (!es.length) return toast('Log something in this meal first, then save it');
  S.food.myMeals.unshift({ id: 'm' + uid(), n, items: es.map(e => { const x = JSON.parse(JSON.stringify(e)); delete x.id; delete x.meal; return x; }) });
  save(); closeSheet(); toast(`Saved “${n}” to My Meals`); haptic(12);
};
function logMyMeal(id, meal, k) { const mm = S.food.myMeals.find(x => x.id === id); if (!mm) return; const es = mm.items.map(it => ({ ...JSON.parse(JSON.stringify(it)), id: uid(), meal })); pushEntries(k, es); undoable(k, es.map(e => e.id), `Logged ${mm.n} · ${fmtNum(sumT(es).kcal)} kcal · ${gR(sumT(es).p)} g P`); }
ACT.fLogMeal = (el, d) => { logMyMeal(d.id, (UI.fa && UI.fa.meal) || autoMealFor(foodK()), foodK()); rerenderKeep(); if ($('#fa')) refreshFa(); };
ACT.fDelMeal = (el, d) => { const mm = S.food.myMeals.find(x => x.id === d.id); if (!mm || !confirm(`Delete “${mm.n}” from My Meals? (Days you logged it keep their numbers.)`)) return; S.food.myMeals = S.food.myMeals.filter(x => x.id !== d.id); save(); refreshFa(); };

/* ---------- add-food sheet ---------- */
const FA_TABS = [['recent', 'Recent'], ['freq', 'Frequent'], ['mine', 'My foods'], ['meals', 'My meals'], ['starter', 'Basics']];
ACT.faOpen = (el, d) => { UI.fa = { meal: d.m || autoMealFor(foodK()), tab: (UI.fa && UI.fa.tab) || 'recent', q: '', online: null }; if (UI.fa.tab === 'recent' && !recentEntries(1).length) UI.fa.tab = 'starter'; openSheet(faHtml(), 'tall'); };
function faHtml() {
  const a = UI.fa, k = foodK();
  return `<div id="fa"><h3>Add to ${MEAL_BY[a.meal][1]} <small class="dim">· ${fDayLbl(k)}</small></h3>
  <div class="seg" style="margin-top:8px">${MEALS.map(([id, n, ic]) => `<button class="tap ${a.meal === id ? 'on' : ''}" data-a="faMeal" data-m="${id}">${ic} ${n}</button>`).join('')}</div>
  <div class="fa-search"><input class="inp grow" id="faQ" type="search" enterkeyhint="search" placeholder="Search foods (e.g. chicken, Oikos)" autocomplete="off" value="${esc(a.q)}"><button class="btn sm tap scanbtn" data-a="scanOpen" data-m="${a.meal}" aria-label="Scan a barcode">📷 Scan</button></div>
  <div id="faBody">${faBody()}</div>
  <div class="row fqrow"><button class="btn sm sec tap grow" data-a="fQuick">⚡ Quick add</button><button class="btn sm sec tap grow" data-a="customFood">＋ Custom food</button></div></div>`;
}
function refreshFa() { const b = $('#faBody'); if (b) b.innerHTML = faBody(); }
function faBody() {
  const a = UI.fa; if (!a) return '';
  if (a.q.trim().length) { const loc = localSearch(a.q.trim()); return `${loc.length ? `<div class="fsec">Saved & basics</div>${loc.map(f => foodRow(f)).join('')}` : ''}<div id="faOnline">${faOnlineHtml()}</div>`; }
  let h = `<div class="seg fa-tabs">${FA_TABS.map(([id, l]) => `<button class="tap ${a.tab === id ? 'on' : ''}" data-a="faTab" data-t="${id}">${l}</button>`).join('')}</div><div class="fa-list">`;
  if (a.tab === 'recent') { const r = recentEntries(25); h += r.length ? r.map(e => foodRow(entryToFood(e), { e })).join('') : '<div class="empty">Nothing logged yet — search, scan, or try Basics.</div>'; }
  if (a.tab === 'freq') { const r = freqEntries(); h += r.length ? r.map(x => foodRow(entryToFood(x.e), { e: x.e, n: x.n })).join('') : '<div class="empty">Foods you log on 2+ days show up here.</div>'; }
  if (a.tab === 'mine') h += (S.food.custom.length ? S.food.custom.map(c => foodRow(customToFood(c))).join('') : '<div class="empty">No custom foods yet.</div>') + `<button class="btn sm sec tap" style="margin-top:10px" data-a="customFood">＋ New custom food</button>`;
  if (a.tab === 'meals') h += S.food.myMeals.length ? S.food.myMeals.map(mm => { const t = sumT(mm.items); return `<div class="frow2 mymeal"><button class="grow tap fpick" data-a="fLogMeal" data-id="${mm.id}"><div class="fn">⭐ ${esc(mm.n)}</div><div class="xs dim">${mm.items.length} items · ${fmtNum(t.kcal)} kcal · ${gR(t.p)} g P · ${esc(mm.items.map(i => i.name).slice(0, 3).join(', '))}</div></button><button class="icon-btn tap" data-a="fDelMeal" data-id="${mm.id}" aria-label="Delete ${esc(mm.n)}">✕</button><button class="icon-btn tap plus" data-a="fLogMeal" data-id="${mm.id}" aria-label="Log ${esc(mm.n)}">+</button></div>`; }).join('') : '<div class="empty">Log a meal, then tap ⋯ → “Save this meal” (e.g. chicken + rice) to re-log it in one tap.</div>';
  if (a.tab === 'starter') h += STARTER_CATS.map(c => `<div class="fsec">${c}</div>` + STARTER.filter(s => s.cat === c).map(s => foodRow(s)).join('')).join('');
  return h + '</div>';
}
function faOnlineHtml() {
  const a = UI.fa, o = a && a.online, q = a ? a.q.trim() : '';
  if (q.length < 2) return '';
  if (!o || o.q !== q.toLowerCase() || o.loading) return `<div class="fsec">Online</div><div class="fload">Searching USDA + Open Food Facts…</div>`;
  let h = `<div class="fsec">Online ${o.cached ? '<span class="xs dim">· saved results</span>' : ''}</div>`;
  if (o.err === 'offline') h += `<div class="ferr">📴 You're offline — showing saved foods only. Online search works once you're connected (quick add or a custom food work offline).</div>`;
  else if (o.err === 'failed') h += `<div class="ferr">Couldn't reach the food databases right now. <button class="btn sm sec tap" data-a="faRetry">Retry</button></div>`;
  else if (o.err === 'off' || o.err === 'usda') h += `<div class="xs dim" style="margin:4px 0">${o.err === 'off' ? 'Packaged-food search is busy — showing USDA whole foods. Barcode scan still works.' : 'USDA is busy (demo-key limit) — showing packaged foods.'}</div>`;
  h += o.items.length ? o.items.map(f => foodRow(f)).join('') : (o.err ? '' : '<div class="empty">No online matches. Try fewer words, scan the barcode, or add a custom food.</div>');
  return h;
}
let faT = 0;
function faSearchSoon() {
  clearTimeout(faT); const a = UI.fa; if (!a) return; const q = a.q.trim().toLowerCase(); if (q.length < 2) return;
  a.online = { q, loading: true, items: [] };
  faT = setTimeout(async () => { const r = await foodSearchOnline(q); if (!UI.fa || UI.fa.q.trim().toLowerCase() !== q) return; UI.fa.online = { q, loading: false, ...r }; const el = $('#faOnline'); if (el) el.innerHTML = faOnlineHtml(); }, 450);
}
document.addEventListener('input', ev => { if (ev.target.id === 'faQ' && UI.fa) { UI.fa.q = ev.target.value; refreshFa(); faSearchSoon(); } else if (ev.target.id === 'svAmt' && UI.sv) { UI.sv.amt = +ev.target.value || 0; svLive(); } });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'scanCode') { ev.preventDefault(); ACT.scanLookup(); } });
ACT.faTab = (el, d) => { UI.fa.tab = d.t; haptic(); refreshFa(); };
ACT.faMeal = (el, d) => { UI.fa.meal = d.m; haptic(); const sh = $('#fa').closest('.sheet'), y = sh ? sh.scrollTop : 0; $('#fa').outerHTML = faHtml(); if (sh) sh.scrollTop = y; };
ACT.faRetry = () => { const a = UI.fa; if (!a) return; const q = a.q.trim().toLowerCase(), c = fcLoad(); delete c.q[q]; fcSave(); faSearchSoon(); refreshFa(); };
ACT.faBack = () => { if (UI.fa) openSheet(faHtml(), 'tall'); else closeSheet(); };
ACT.fPlus = (el, d) => { // one tap: re-log the exact entry, or the food's last/default serving
  const k = foodK(), meal = (UI.fa && UI.fa.meal) || autoMealFor(k);
  let e; if (d.eid) { const src = recentEntries(80).find(x => x.id === d.eid); if (src) e = { ...JSON.parse(JSON.stringify(src)), id: uid(), meal }; }
  if (!e) { const f = findFood(d.fid); if (!f) return; const s = defServing(f); e = mkEntry(f, s.amt, s.unit, meal); }
  pushEntries(k, [e]); undoable(k, [e.id], `Added ${e.name} · ${fmtNum(eTot(e).kcal)} kcal · ${gR(eTot(e).p)} g P`); rerenderKeep();
  if (el && el.closest('.frow2')) { el.classList.add('added'); el.textContent = '✓'; setTimeout(() => { el.classList.remove('added'); el.textContent = '+'; }, 1200); }
};

/* ---------- serving picker ---------- */
const SV_STEP = { g: 10, oz: 0.5, srv: 0.5 }, SV_CHIPS = { g: [50, 100, 150, 200, 250], oz: [2, 4, 6, 8, 12], srv: [0.5, 1, 1.5, 2, 3] };
function svUnits(f) { const g = !!(f.per100 || f.srvG); return [g && 'g', g && 'oz', (f.perSrv || f.srvG) && 'srv'].filter(Boolean); }
ACT.fOpen = (el, d) => {
  const k = foodK(); let f = findFood(d.fid), amt, unit;
  if (d.eid) { const e = recentEntries(80).find(x => x.id === d.eid); if (e) { f = entryToFood(e); amt = e.unit ? e.amt : (e.qty || 1); unit = e.unit || 'srv'; } }
  if (!f) return; reg(f); if (amt == null) { const s = defServing(f); amt = s.amt; unit = s.unit; }
  UI.sv = { f, amt, unit, meal: (UI.fa && UI.fa.meal) || autoMealFor(k), k, editId: null, back: !!UI.fa }; openSheet(svHtml(), 'tall');
};
ACT.fEdit = (el, d) => {
  const k = foodK(), e = foodDay(k).find(x => x.id === d.id); if (!e) return;
  const f = e.ref ? entryToFood(e) : { id: e.fid || 'e_' + e.id, n: e.name, src: 'list', perSrv: { kcal: +e.kcal || 0, p: +e.p || 0, c: +e.c || 0, f: +e.f || 0 }, srvLbl: 'serving', srvG: null, per100: null };
  UI.fa = null; UI.sv = { f, amt: e.unit ? e.amt : (e.qty || 1), unit: e.unit || 'srv', meal: e.meal, k, editId: e.id, back: false }; openSheet(svHtml(), 'tall');
};
function svHtml() {
  const v = UI.sv, f = v.f, us = svUnits(f), m = macrosFor(f, v.amt, v.unit), src = f.src === 'starter' || f.src === 'usda' ? `USDA FoodData Central${f.fdc ? ' · FDC ' + f.fdc : ''}` : f.src === 'off' ? `Open Food Facts${f.code ? ' · ' + f.code : ''}` : f.src === 'custom' ? 'My foods' : 'Quick list';
  const p100 = f.per100 ? `Per 100 g: ${f.per100.kcal} kcal · ${f.per100.p} P · ${f.per100.c} C · ${f.per100.f} F` : f.perSrv ? `Per ${f.srvLbl || 'serving'}: ${f.perSrv.kcal} kcal · ${f.perSrv.p} P · ${f.perSrv.c} C · ${f.perSrv.f} F` : '';
  return `<div id="sv"><div class="eyebrow">${badge(f.src)} ${esc(src)}</div><h3 style="margin-top:4px">${esc(f.n)}</h3>${f.brand ? `<div class="small muted">${esc(f.brand)}</div>` : ''}
  <div class="svm"><div class="svk"><b id="svK">${fmtNum(m.kcal)}</b><span>kcal</span></div><div><b id="svP">${m.p}</b><span>protein g</span></div><div><b id="svC">${m.c}</b><span>carbs g</span></div><div><b id="svF">${m.f}</b><span>fat g</span></div></div>
  <div class="seg sv-units">${us.map(u => `<button class="tap ${v.unit === u ? 'on' : ''}" data-a="svUnit" data-u="${u}">${u === 'srv' ? esc(f.srvLbl || 'serving') : u}</button>`).join('')}</div>
  <div class="stepper"><button class="tap" data-a="svStep" data-v="-1" aria-label="Less">−</button><input class="inp" id="svAmt" type="number" inputmode="decimal" step="any" min="0" value="${+(+v.amt).toFixed(2)}" aria-label="Amount"><span class="sv-u">${v.unit === 'srv' ? '×' : v.unit}</span><button class="tap" data-a="svStep" data-v="1" aria-label="More">+</button></div>
  <div class="chips sv-chips">${SV_CHIPS[v.unit].map(c => `<button class="chip tap ${+v.amt === c ? 'grad' : ''}" data-a="svSet" data-v="${c}">${c}${v.unit === 'srv' ? '×' : ' ' + v.unit}</button>`).join('')}</div>
  <div class="seg" style="margin-top:12px">${MEALS.map(([id, n, ic]) => `<button class="tap ${v.meal === id ? 'on' : ''}" data-a="svMeal" data-m="${id}">${ic} ${n}</button>`).join('')}</div>
  <button class="btn tap" id="svGo" style="margin-top:14px" data-a="svSave">${v.editId ? 'Save changes' : 'Add to ' + MEAL_BY[v.meal][1]} · ${fmtNum(m.kcal)} kcal</button>
  ${v.editId ? `<button class="btn ghost tap" style="margin-top:8px" data-a="svDel">Delete entry</button>` : ''}
  ${!v.editId && (f.src === 'off' || f.src === 'usda') ? `<button class="btn sm sec tap" style="margin-top:10px" data-a="svKeep">☆ Save to My foods</button>` : ''}
  ${v.back ? `<button class="btn sm ghost tap" style="margin-top:8px" data-a="faBack">← Back to search</button>` : ''}
  ${p100 ? `<div class="xs dim" style="margin-top:12px">${esc(p100)}${f.src === 'off' ? ' · crowd-sourced label data, double-check the package' : ''}</div>` : ''}</div>`;
}
function svLive() { const v = UI.sv, m = macrosFor(v.f, v.amt, v.unit); const s = (id, x) => { const e = $('#' + id); if (e) e.textContent = x; }; s('svK', fmtNum(m.kcal)); s('svP', m.p); s('svC', m.c); s('svF', m.f); s('svGo', `${v.editId ? 'Save changes' : 'Add to ' + MEAL_BY[v.meal][1]} · ${fmtNum(m.kcal)} kcal`); $$('.sv-chips .chip').forEach(c => c.classList.toggle('grad', +c.dataset.v === +v.amt)); }
function svRedraw() { const sh = $('#sv') && $('#sv').closest('.sheet'), y = sh ? sh.scrollTop : 0; $('#sv').outerHTML = svHtml(); if (sh) sh.scrollTop = y; }
ACT.svUnit = (el, d) => { // keep the same amount of food when switching units
  const v = UI.sv, f = v.f, grams = v.unit === 'g' ? v.amt : v.unit === 'oz' ? v.amt * G_PER_OZ : (f.srvG ? v.amt * f.srvG : null);
  if (d.u === 'g') v.amt = grams != null ? Math.round(grams) : 100; else if (d.u === 'oz') v.amt = grams != null ? Math.round(grams / G_PER_OZ * 4) / 4 : 4; else v.amt = grams != null && f.srvG ? Math.round(grams / f.srvG * 4) / 4 || 1 : 1;
  v.unit = d.u; haptic(); svRedraw();
};
ACT.svStep = (el, d) => { const v = UI.sv, st = SV_STEP[v.unit]; v.amt = Math.max(0, +(Math.round((+v.amt + +d.v * st) / st) * st).toFixed(2)); if (v.amt === 0 && +d.v < 0) v.amt = st; const i = $('#svAmt'); if (i) i.value = v.amt; haptic(6); svLive(); };
ACT.svSet = (el, d) => { UI.sv.amt = +d.v; const i = $('#svAmt'); if (i) i.value = +d.v; haptic(6); svLive(); };
ACT.svMeal = (el, d) => { UI.sv.meal = d.m; if (UI.fa) UI.fa.meal = d.m; haptic(); svRedraw(); };
ACT.svSave = () => {
  const v = UI.sv, i = $('#svAmt'); if (i) v.amt = +i.value || 0; if (!(v.amt > 0)) return toast('Enter an amount');
  const e = mkEntry(v.f, v.amt, v.unit, v.meal);
  if (v.editId) { const l = foodDay(v.k), j = l.findIndex(x => x.id === v.editId); if (j >= 0) { e.id = v.editId; l[j] = e; touchMeal(v.k, v.meal); syncProteinHabit(v.k); save(); } closeSheet(); toast('Updated ✓'); UI.sv = null; rerenderKeep(); return; }
  pushEntries(v.k, [e]); rerenderKeep(); UI.sv = null;
  if (v.back && UI.fa) { openSheet(faHtml(), 'tall'); } else closeSheet();
  undoable(v.k, [e.id], `Added ${e.name} · ${fmtNum(e.kcal)} kcal · ${gR(e.p)} g P`);
};
ACT.svDel = () => { const v = UI.sv; closeSheet(); ACT.fdel(null, { id: v.editId }); UI.sv = null; };
ACT.svKeep = () => { const v = UI.sv, f = v.f, m = macrosFor(f, v.amt, v.unit); const c = { id: 'c' + uid(), n: f.n + (f.brand ? ` (${f.brand})` : ''), kcal: m.kcal, p: m.p, c: m.c, f: m.f, srvLbl: amtLabel(v.amt, v.unit, f), per100: f.per100 || null, srvG: v.unit === 'g' ? v.amt : v.unit === 'oz' ? Math.round(v.amt * G_PER_OZ) : (f.srvG ? f.srvG * v.amt : null) }; S.food.custom.unshift(c); save(); toast('Saved to My foods ⭐'); };

/* ---------- quick add + custom foods ---------- */
ACT.fQuick = () => { const meal = (UI.fa && UI.fa.meal) || autoMealFor(foodK()); UI.fqMeal = meal; openSheet(`<h3>Quick add · ${fDayLbl(foodK())}</h3><div class="seg">${MEALS.map(([id, n, ic]) => `<button class="tap ${meal === id ? 'on' : ''}" data-a="fqMeal" data-m="${id}">${ic} ${n}</button>`).join('')}</div><div class="grid2" style="margin-top:12px"><div class="field"><label>Calories</label><input class="inp" id="qaK" type="number" inputmode="numeric" placeholder="kcal"></div><div class="field"><label>Protein g</label><input class="inp" id="qaP" type="number" inputmode="numeric" placeholder="g"></div></div><div class="field" style="margin-top:10px"><label>Name <small class="dim">optional</small></label><input class="inp" id="qaName" placeholder="e.g. Dining hall dinner"></div><button class="btn tap" style="margin-top:14px" data-a="quickAdd">Add ✓</button>`); setTimeout(() => { const i = $('#qaK'); if (i) i.focus(); }, 60); };
ACT.fqMeal = (el, d) => { UI.fqMeal = d.m; $$('[data-a="fqMeal"]').forEach(b => b.classList.toggle('on', b.dataset.m === d.m)); haptic(); };
ACT.quickAdd = () => { const kc = +$('#qaK').value || 0, p = +$('#qaP').value || 0; if (!kc && !p) return toast('Enter calories or protein'); if (kc > 10000 || p > 600) return toast('Check those numbers'); const k = foodK(), e = { id: uid(), name: $('#qaName').value.trim() || 'Quick add', kcal: Math.round(kc), p: Math.round(p), c: 0, f: 0, qty: 1, meal: UI.fqMeal || autoMealFor(k), fid: null, quick: true }; pushEntries(k, [e]); closeSheet(); undoable(k, [e.id], `Added ${fmtNum(kc)} kcal · ${p} g protein`); rerenderKeep(); };
function customSheet(id) {
  const f = id ? S.food.custom.find(x => x.id === id) : null, v = (x, d = '') => f && f[x] != null ? f[x] : d;
  openSheet(`<h3>${f ? 'Edit custom food' : 'New custom food'}</h3><div class="field"><label>Name</label><input class="inp" id="cfN" value="${esc(v('n'))}" placeholder="e.g. Chipotle bowl (double chicken)"></div>
  <div class="field" style="margin-top:10px"><label>Serving</label><input class="inp" id="cfS" value="${esc(v('srvLbl', '1 serving'))}" placeholder="e.g. 1 bowl"></div>
  <div class="grid2" style="margin-top:10px"><div class="field"><label>Calories</label><input class="inp" id="cfK" type="number" inputmode="numeric" value="${v('kcal')}"></div><div class="field"><label>Protein g</label><input class="inp" id="cfP" type="number" inputmode="decimal" value="${v('p')}"></div><div class="field"><label>Carbs g</label><input class="inp" id="cfC" type="number" inputmode="decimal" value="${v('c')}"></div><div class="field"><label>Fat g</label><input class="inp" id="cfF" type="number" inputmode="decimal" value="${v('f')}"></div></div>
  <button class="btn tap" style="margin-top:14px" data-a="saveCustom" data-id="${f ? f.id : ''}">${f ? 'Save changes' : 'Save food'}</button>${f ? `<button class="btn ghost tap" style="margin-top:8px" data-a="delCustom" data-id="${f.id}">Delete</button>` : ''}`);
}
ACT.customFood = (el, d) => customSheet(d && d.id);
ACT.saveCustom = (el, d) => {
  const n = $('#cfN').value.trim(), kc = +$('#cfK').value, num0 = id => +($('#' + id).value) || 0;
  if (!n) return toast('Give it a name'); if (!(kc >= 0) || $('#cfK').value === '') return toast('Enter calories');
  const o = { n, kcal: Math.round(kc), p: num0('cfP'), c: num0('cfC'), f: num0('cfF'), srvLbl: $('#cfS').value.trim() || '1 serving' };
  if (d.id) Object.assign(S.food.custom.find(x => x.id === d.id), o); else S.food.custom.unshift({ id: 'c' + uid(), ...o });
  Object.keys(FMAP).forEach(k => { if (k === d.id) delete FMAP[k]; });
  save(); toast(d.id ? 'Food updated' : 'Saved to My foods ⭐');
  if (UI.fa) { UI.fa.tab = 'mine'; UI.fa.q = ''; openSheet(faHtml(), 'tall'); } else closeSheet(); rerenderKeep();
};
ACT.delCustom = (el, d) => { if (!confirm('Delete this custom food? (Past logs keep their numbers.)')) return; S.food.custom = S.food.custom.filter(x => x.id !== d.id); delete FMAP[d.id]; save(); toast('Deleted'); if (UI.fa) openSheet(faHtml(), 'tall'); else closeSheet(); rerenderKeep(); };

/* ---------- barcode scanner (camera via vendored ZXing, lazy-loaded; manual entry fallback) ---------- */
const ZX_SRC = 'vendor/zxing-library-0.21.3.min.js';
const SCAN = { reader: null, busy: false, loading: null };
function loadScriptOnce(src) { if (SCAN.loading) return SCAN.loading; SCAN.loading = new Promise((res, rej) => { if (window.ZXing) return res(); const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => { SCAN.loading = null; rej(new Error('load')); }; document.head.appendChild(s); }); return SCAN.loading; }
function stopScan() { try { if (SCAN.reader) SCAN.reader.reset(); } catch (e) {} SCAN.reader = null; const v = $('#scanV'); if (v && v.srcObject) { try { v.srcObject.getTracks().forEach(t => t.stop()); } catch (e) {} v.srcObject = null; } }
const _closeSheet0 = closeSheet;
closeSheet = function () { stopScan(); _closeSheet0(); };
function scanMsg(html, cls = '') { const m = $('#scanMsg'); if (m) { m.className = 'scanmsg ' + cls; m.innerHTML = html; } }
ACT.scanOpen = (el, d) => {
  if (!UI.fa) UI.fa = { meal: d.m || autoMealFor(foodK()), tab: 'recent', q: '', online: null };
  openSheet(`<div id="scan"><h3>Scan a barcode <small class="dim">· ${MEAL_BY[UI.fa.meal][1]}</small></h3><div class="scanbox" id="scanBox"><video id="scanV" playsinline muted autoplay></video><div class="scanframe"></div></div><div id="scanMsg" class="scanmsg">Starting camera…</div>
  <div class="field" style="margin-top:12px"><label>Or type the number under the barcode</label><div class="row" style="gap:8px"><input class="inp grow" id="scanCode" inputmode="numeric" pattern="[0-9]*" maxlength="14" placeholder="e.g. 041196910759" autocomplete="off"><button class="btn sm tap" data-a="scanLookup">Look up</button></div></div>
  <button class="btn sm ghost tap" style="margin-top:12px" data-a="faBack">← Back to search</button></div>`, 'tall');
  startScan();
};
async function startScan() {
  SCAN.busy = false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) { $('#scanBox') && $('#scanBox').classList.add('off'); return scanMsg('📷 Camera isn’t available here — type the barcode number below.', 'warn'); }
  try {
    await loadScriptOnce(ZX_SRC);
    if (!$('#scanV')) return; // sheet closed while loading
    const Z = window.ZXing, hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
    const reader = new Z.BrowserMultiFormatReader(hints, 250); SCAN.reader = reader;
    await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, 'scanV', res => { if (res && !SCAN.busy) { SCAN.busy = true; haptic([20, 40, 20]); onBarcode(res.getText()); } });
    scanMsg('Hold the barcode inside the frame…');
  } catch (e) {
    stopScan(); $('#scanBox') && $('#scanBox').classList.add('off');
    const n = e && e.name;
    scanMsg(n === 'NotAllowedError' ? '🚫 Camera permission is off — allow it (iPhone: Settings › Safari › Camera) or type the number below.' : n === 'NotFoundError' || n === 'OverconstrainedError' ? '📷 No camera found — type the barcode number below.' : e && e.message === 'load' ? '📴 Scanner couldn’t load (offline?) — type the number below.' : '📷 Camera didn’t start — type the barcode number below.', 'warn');
  }
}
async function onBarcode(raw) {
  const code = String(raw || '').replace(/\D/g, '');
  if (code.length < 6) { SCAN.busy = false; return scanMsg('That doesn’t look like a barcode — check the digits.', 'warn'); }
  stopScan(); scanMsg(`Looking up <b>${esc(code)}</b>…`);
  try {
    const f = await offBarcode(code);
    if (!$('#scan')) return;
    if (!f) return scanMsg(`Not in Open Food Facts yet (<b>${esc(code)}</b>). <button class="btn sm sec tap" data-a="customFood">＋ Add as custom food</button> <button class="btn sm ghost tap" data-a="scanAgain">Scan again</button>`, 'warn');
    reg(f); const s = defServing(f); UI.sv = { f, amt: s.amt, unit: s.unit, meal: UI.fa.meal, k: foodK(), editId: null, back: true }; openSheet(svHtml(), 'tall');
  } catch (e) {
    scanMsg(e && e.message === 'offline' ? '📴 You’re offline — the barcode lookup needs a connection. Use quick add for now.' : 'Couldn’t reach Open Food Facts. <button class="btn sm sec tap" data-a="scanLookup">Try again</button>', 'warn');
    const i = $('#scanCode'); if (i && !i.value) i.value = code; SCAN.busy = false;
  }
}
ACT.scanLookup = () => { const i = $('#scanCode'); const v = i ? i.value : ''; if (!v.replace(/\D/g, '')) return toast('Type the barcode digits'); stopScan(); SCAN.busy = true; onBarcode(v); };
ACT.scanAgain = () => { $('#scanBox') && $('#scanBox').classList.remove('off'); scanMsg('Starting camera…'); startScan(); };
