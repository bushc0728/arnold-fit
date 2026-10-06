/* Food tracker: quick-add college foods, custom foods, meal checklist, targets, past days */
'use strict';
function autoMeal() { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack'; }
function addFood(k, f, meal) {
  const l = S.food.log[k] = S.food.log[k] || [];
  const same = l.find(x => x.name === f.name && x.meal === meal && x.kcal === f.kcal && x.p === f.p);
  if (same) same.qty = +(same.qty + 1).toFixed(2); else l.push({ id: uid(), name: f.name, kcal: +f.kcal || 0, p: +f.p || 0, qty: 1, meal, fid: f.id || null });
  const m = S.food.meals[k] = S.food.meals[k] || {}; m[meal] = true;
  syncProteinHabit(k); save(); haptic(10);
}
function foodK() { return UI.foodDate || today(); }
VIEWS.food = function () {
  const k = foodK(), T = S.settings, tot = foodTotals(k), isT = k === today(), meal = UI.foodMeal || autoMeal(), mchk = S.food.meals[k] || {}, log = foodDay(k);
  const kp = Math.min(100, tot.kcal / T.kcal * 100), pp = Math.min(100, tot.p / T.protein * 100), over = tot.kcal > T.kcal;
  let h = hdr('Fuel the engine', 'Food');
  h += `<div class="card" id="foodDay"><div class="row between"><button class="icon-btn tap" data-a="foodDay" data-v="-1" aria-label="Previous day">‹</button><div style="text-align:center"><div style="font-weight:750" id="foodDateLbl">${isT ? 'Today' : fmtDow(k)}</div><div class="xs dim">${log.length} item${log.length === 1 ? '' : 's'} logged</div></div><button class="icon-btn tap" data-a="foodDay" data-v="1" aria-label="Next day" ${isT ? 'disabled style="opacity:.3"' : ''}>›</button></div>
  <div class="row between small" style="margin-top:14px"><span>Calories</span><b id="kcalTot">${fmtNum(tot.kcal)} / ${fmtNum(T.kcal)}</b></div><div class="pbar"><i style="width:${kp}%;${over ? 'background:var(--bad)' : ''}"></i></div><div class="xs dim" style="margin-top:4px">${over ? `${fmtNum(tot.kcal - T.kcal)} over target` : `${fmtNum(T.kcal - tot.kcal)} left`}</div>
  <div class="row between small" style="margin-top:12px"><span>Protein</span><b id="protTot">${Math.round(tot.p)} / ${T.protein} g</b></div><div class="pbar"><i class="pgreen" style="width:${pp}%"></i></div><div class="xs dim" style="margin-top:4px">${tot.p >= T.protein ? 'Protein target hit ✓' : `${Math.round(T.protein - tot.p)} g to go · ~${Math.round(T.protein / (S.profile.diet.meals || 4))} g per meal`}</div>
  <div class="mealchk">${MEALS.map(([id, n, ic]) => `<button class="mchk tap ${mchk[id] ? 'on' : ''}" data-a="mealChk" data-m="${id}"><span class="ck">${CHECK}</span>${ic} ${n}</button>`).join('')}</div></div>`;
  h += `<h2 class="sec">Logged</h2>`;
  const byMeal = MEALS.map(([id, n, ic]) => ({ id, n, ic, items: log.filter(x => x.meal === id) })).filter(g => g.items.length);
  h += byMeal.length ? byMeal.map(g => { const gt = g.items.reduce((a, x) => ({ kcal: a.kcal + x.kcal * x.qty, p: a.p + x.p * x.qty }), { kcal: 0, p: 0 }); return `<div class="card foodgrp"><div class="row between"><b>${g.ic} ${g.n}</b><span class="small muted">${fmtNum(gt.kcal)} kcal · ${Math.round(gt.p)} g</span></div>${g.items.map(x => `<div class="frow" data-fid="${x.id}"><div class="grow"><div class="fn">${esc(x.name)}</div><div class="xs dim">${fmtNum(x.kcal * x.qty)} kcal · ${Math.round(x.p * x.qty)} g protein</div></div><div class="qty"><button class="tap" data-a="fqty" data-id="${x.id}" data-v="-1" aria-label="Less">−</button><span>${+x.qty.toFixed(2)}</span><button class="tap" data-a="fqty" data-id="${x.id}" data-v="1" aria-label="More">+</button></div><button class="icon-btn tap fdel" data-a="fdel" data-id="${x.id}" aria-label="Delete">✕</button></div>`).join('')}</div>`; }).join('') : `<div class="empty card">Nothing logged ${isT ? 'yet today' : 'for this day'}. Tap foods below to add them.</div>`;
  h += `<h2 class="sec">Add food <button class="btn sm sec tap" data-a="customFood">+ Custom</button></h2>`;
  h += `<div class="card"><div class="seg" id="mealSeg">${MEALS.map(([id, n, ic]) => `<button class="tap ${meal === id ? 'on' : ''}" data-a="foodMeal" data-m="${id}">${ic} ${n}</button>`).join('')}</div>
  <input class="inp" id="foodQ" placeholder="Search foods…" value="${esc(UI.foodQ)}" style="margin-top:12px" autocomplete="off">
  <div class="chips" style="margin-top:10px">${['All', 'My foods', ...FOOD_CATS].map(c => `<button class="chip tap ${UI.foodCat === c ? 'grad' : ''}" data-a="foodCat" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div id="foodList">${foodListHtml()}</div>
  <details class="why" style="margin-top:12px"><summary>Quick add calories / protein</summary><div class="grid2" style="margin-top:8px"><input class="inp" id="qaName" placeholder="Name (optional)"><span></span><input class="inp" id="qaK" type="number" inputmode="numeric" placeholder="kcal"><input class="inp" id="qaP" type="number" inputmode="numeric" placeholder="protein g"></div><button class="btn sm" style="margin-top:10px" data-a="quickAdd">Add</button></details></div>`;
  h += `<div class="small dim" style="margin:8px 4px">Calories are estimates for typical portions — edit custom foods to match your dining hall. Targets come from your profile (Settings).</div>`;
  return h;
};
function foodListHtml() {
  const q = UI.foodQ.trim().toLowerCase(), c = UI.foodCat;
  const list = allFoods().filter(f => (c === 'All' || f.cat === c) && (!q || f.n.toLowerCase().includes(q)));
  if (!list.length) return `<div class="empty">${c === 'My foods' && !S.food.custom.length ? 'No custom foods yet — tap “+ Custom” to save your go-to meals.' : 'No matches. Add it as a custom food.'}</div>`;
  return list.slice(0, 80).map(f => `<div class="frow"><button class="grow tap fadd" data-a="addFood" data-id="${esc(f.id)}"><div class="fn">${esc(f.n)} ${f.custom ? '<span class="chip gold" style="font-size:9px;padding:2px 6px">Mine</span>' : ''}</div><div class="xs dim">${fmtNum(f.kcal)} kcal · ${f.p} g protein</div></button>${f.custom ? `<button class="icon-btn tap" data-a="customFood" data-id="${esc(f.id)}" aria-label="Edit">✎</button>` : ''}<button class="icon-btn tap plus" data-a="addFood" data-id="${esc(f.id)}" aria-label="Add">+</button></div>`).join('');
}
function customSheet(id) {
  const f = id ? S.food.custom.find(x => x.id === id) : null;
  openSheet(`<h3>${f ? 'Edit custom food' : 'New custom food'}</h3><div class="field"><label>Name</label><input class="inp" id="cfN" value="${esc(f ? f.n : '')}" placeholder="e.g. Chipotle bowl (double chicken)"></div><div class="grid2" style="margin-top:10px"><div class="field"><label>Calories</label><input class="inp" id="cfK" type="number" inputmode="numeric" value="${f ? f.kcal : ''}"></div><div class="field"><label>Protein (g)</label><input class="inp" id="cfP" type="number" inputmode="numeric" value="${f ? f.p : ''}"></div></div><button class="btn" style="margin-top:14px" data-a="saveCustom" data-id="${f ? f.id : ''}">${f ? 'Save changes' : 'Save food'}</button>${f ? `<button class="btn ghost" style="margin-top:8px" data-a="delCustom" data-id="${f.id}">Delete</button>` : ''}`);
}
ACT.foodDay = (el, d) => { const k = addDays(foodK(), +d.v); if (k > today()) return; UI.foodDate = k === today() ? null : k; haptic(); rerenderKeep(); };
ACT.foodMeal = (el, d) => { UI.foodMeal = d.m; haptic(); rerenderKeep(); };
ACT.foodCat = (el, d) => { UI.foodCat = d.c; haptic(); $('#foodList').innerHTML = foodListHtml(); $$('[data-a="foodCat"]').forEach(b => b.classList.toggle('grad', b.dataset.c === d.c)); };
ACT.addFood = (el, d) => { const f = allFoods().find(x => x.id === d.id); if (!f) return; addFood(foodK(), { id: f.id, name: f.n, kcal: f.kcal, p: f.p }, UI.foodMeal || autoMeal()); toast(`Added ${f.n}`); rerenderKeep(); };
ACT.fqty = (el, d) => { const l = foodDay(foodK()), x = l.find(z => z.id === d.id); if (!x) return; x.qty = +(x.qty + (+d.v) * (x.qty <= 1 && +d.v < 0 ? 0.5 : x.qty < 1 ? 0.5 : 1)).toFixed(2); if (x.qty <= 0) l.splice(l.indexOf(x), 1); syncProteinHabit(foodK()); save(); haptic(); rerenderKeep(); };
let UNDO_FOOD = null;
ACT.fdel = (el, d) => { const k = foodK(), l = foodDay(k), i = l.findIndex(z => z.id === d.id); if (i < 0) return; UNDO_FOOD = { k, i, x: l[i] }; l.splice(i, 1); save(); haptic(); toast('Removed', 'undoFood'); rerenderKeep(); };
ACT.undoFood = () => { if (!UNDO_FOOD) return; const { k, i, x } = UNDO_FOOD; (S.food.log[k] = S.food.log[k] || []).splice(i, 0, x); UNDO_FOOD = null; save(); rerenderKeep(); };
ACT.mealChk = (el, d) => { const k = foodK(), m = S.food.meals[k] = S.food.meals[k] || {}; m[d.m] = !m[d.m]; if (!m[d.m]) delete m[d.m]; save(); haptic(10); rerenderKeep(); };
ACT.customFood = (el, d) => customSheet(d.id);
ACT.saveCustom = (el, d) => {
  const n = $('#cfN').value.trim(), kc = +$('#cfK').value, p = +$('#cfP').value;
  if (!n) return toast('Give it a name'); if (!(kc >= 0) || $('#cfK').value === '') return toast('Enter calories');
  if (d.id) { const f = S.food.custom.find(x => x.id === d.id); Object.assign(f, { n, kcal: kc, p: p || 0 }); }
  else S.food.custom.unshift({ id: 'c' + uid(), n, kcal: kc, p: p || 0 });
  save(); closeSheet(); toast(d.id ? 'Food updated' : 'Saved to My foods'); UI.foodCat = 'My foods'; rerenderKeep();
};
ACT.delCustom = (el, d) => { if (!confirm('Delete this custom food? (Past logs keep their numbers.)')) return; S.food.custom = S.food.custom.filter(x => x.id !== d.id); save(); closeSheet(); toast('Deleted'); rerenderKeep(); };
ACT.quickAdd = () => { const kc = +$('#qaK').value || 0, p = +$('#qaP').value || 0; if (!kc && !p) return toast('Enter calories or protein'); addFood(foodK(), { name: $('#qaName').value.trim() || 'Quick add', kcal: kc, p }, UI.foodMeal || autoMeal()); toast('Added'); rerenderKeep(); };
document.addEventListener('input', ev => { if (ev.target.id === 'foodQ') { UI.foodQ = ev.target.value; $('#foodList').innerHTML = foodListHtml(); } });
