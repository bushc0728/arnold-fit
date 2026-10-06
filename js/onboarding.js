/* Onboarding quiz (first launch; retake from Settings). Answers drive the program, targets and rules. */
'use strict';
const OB_STEPS = ['welcome', 'style', 'goals', 'stats', 'equip', 'schedule', 'injury', 'diet', 'summary'];
let OB = null; // { step, P }
function getP(path) { return path.split('.').reduce((o, k) => o && o[k], OB.P); }
function setP(path, v) { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], OB.P)[last] = v; }
function opt(path, v, label, sub) { const on = getP(path) === v; return `<button class="obopt tap ${on ? 'on' : ''}" data-a="obSet" data-k="${path}" data-v="${esc(JSON.stringify(v))}"><div class="grow"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</div><span class="obck">${on ? CHECK : ''}</span></button>`; }
function tog(path, label, sub) { const on = !!getP(path); return `<button class="obopt tap ${on ? 'on' : ''}" data-a="obTog" data-k="${path}"><div class="grow"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</div><span class="obck sq">${on ? CHECK : ''}</span></button>`; }
function segRow(path, vals, fmt = v => v) { return `<div class="seg">${vals.map(v => `<button class="tap ${getP(path) === v ? 'on' : ''}" data-a="obSet" data-k="${path}" data-v="${esc(JSON.stringify(v))}">${fmt(v)}</button>`).join('')}</div>`; }
function num(path, label, unit, step = 1) { return `<div class="field"><label>${label}</label><div class="row"><input class="inp grow" type="number" inputmode="decimal" step="${step}" data-ob="${path}" value="${getP(path) ?? ''}">${unit ? `<span class="small muted">${unit}</span>` : ''}</div></div>`; }
function tplPreview(P) {
  const t = weeklyTemplate(P), slots = n => slotsFor(n, P).length;
  return `<div class="tplrow" id="obTpl">${t.map((c, i) => `<div class="tpl ${c ? 'on c-' + (c === 'UA' || c === 'UB' ? 'lift' : c === 'LOW' ? 'lower' : c === 'RUN' ? 'run' : c === 'SWIM' ? (P.pool ? 'swim' : 'bike') : c === 'HOCKEY' ? 'hockey' : 'bike') : ''}" data-code="${c || ''}"><span>${DOW[i]}</span><b>${c ? CODE_NAME[c].replace(' + ', '+').replace('Long aerobic', 'Long') : 'Rest'}</b></div>`).join('')}</div><div class="xs dim" style="margin-top:8px">${t.filter(Boolean).length} training days · lifts: Upper A ${slots('upperA')} / Upper B ${slots('upperB')} / Lower ${slots('lower')} exercises at ${P.sessionMin} min</div>`;
}
function obBody() {
  const P = OB.P, s = OB_STEPS[OB.step];
  if (s === 'welcome') return `<div class="obhero"><div class="oblogo">AF</div><h1>Let’s build your plan</h1><p class="muted">2 minutes. Your answers set the weekly template, exercise choices, knee rules, calories and protein. Defaults are your current 13-week hybrid plan — just tap Next to keep it.</p></div>`;
  if (s === 'style') return `<h2>Training style</h2>${opt('style', 'hybrid', 'Hybrid', 'Strength + run/swim/bike — your current plan')}${opt('style', 'strength', 'Strength-first', 'Same lifts, ~25% less cardio time')}${opt('style', 'endurance', 'Endurance-first', 'Same lifts, ~15% more cardio time')}<h3>How do you like to train?</h3>${segRow('intensity', ['intensity', 'volume'], v => v === 'intensity' ? 'Few hard sets' : 'More sets')}`;
  if (s === 'goals') return `<h2>Goals</h2><div class="small muted" style="margin-bottom:10px">Pick all that apply.</div>${Object.keys(GOAL_LABEL).map(g => `<button class="obopt tap ${P.goals.includes(g) ? 'on' : ''}" data-a="obGoal" data-v="${g}"><div class="grow"><b>${GOAL_LABEL[g]}</b></div><span class="obck sq">${P.goals.includes(g) ? CHECK : ''}</span></button>`).join('')}<h3>#1 priority</h3>${segRow('primary', P.goals.length ? P.goals : ['fatloss'], g => GOAL_LABEL[g])}`;
  if (s === 'stats') return `<h2>Your stats</h2><div class="grid2">${num('heightFt', 'Height (ft)', 'ft')}${num('heightInR', 'Height (in)', 'in')}</div><div class="grid2" style="margin-top:10px">${num('weight', 'Current weight', 'lb', 0.5)}${num('goalWeight', 'Goal weight', 'lb', 0.5)}</div><div class="grid2" style="margin-top:10px">${num('age', 'Age', 'yr')}<div class="field"><label>Sex</label>${segRow('sex', ['male', 'female'], v => v === 'male' ? 'M' : 'F')}</div></div>`;
  if (s === 'equip') return `<h2>Equipment</h2><h3>Gym</h3>${opt('gym', 'full', 'Full gym', 'Barbells, machines, cables')}${opt('gym', 'basic', 'Basic gym', 'Dumbbells, bench, pull-up bar — machine lifts get swapped')}<h3>Pool</h3>${opt('pool', true, 'Pool access', 'UREC pool')}${opt('pool', false, 'No pool', 'Swims become bike/row intervals')}<h3>Bike</h3>${opt('bike', 'mix', 'MTB + stationary', 'Your current setup')}${opt('bike', 'stationary', 'Stationary only')}${opt('bike', 'mtb', 'MTB only')}${opt('bike', 'none', 'No bike', 'Bike work becomes walks/hikes')}`;
  if (s === 'schedule') return `<h2>Schedule</h2><h3>Days per week</h3>${segRow('days', [3, 4, 5, 6, 7])}<h3>Session length</h3>${segRow('sessionMin', [30, 45, 60, 75], v => v + ' min')}<h3>Usual time</h3>${segRow('time', ['morning', 'midday', 'evening'], v => v[0].toUpperCase() + v.slice(1))}<h3>Your week</h3>${tplPreview(P)}`;
  if (s === 'injury') return `<h2>Injuries</h2><div class="small muted" style="margin-bottom:10px">Knee history turns on the knee rules (no run before hockey, no hard legs within 48 h, one new impact stressor a week, stop at 3/10) and knee-friendly exercise picks.</div>${tog('injuries.aclL', 'Left ACL tear (history)')}${tog('injuries.aclR', 'Right ACL tear (history)')}${tog('injuries.patella', 'Patella irritation', 'Heavy or high-rep knee work aggravates it')}${tog('injuries.flare', 'Knee is flared up right now', 'Jumps → med-ball throws, running → bike, split squats → step-ups')}<div class="field" style="margin-top:10px"><label>Anything else?</label><input class="inp" data-ob="injuries.other" value="${esc(P.injuries.other || '')}" placeholder="optional"></div>`;
  if (s === 'diet') return `<h2>Nutrition</h2><h3>Approach</h3>${opt('diet.approach', 'rules', 'Simple rules', 'Protein target + a few habits')}${opt('diet.approach', 'count', 'Count calories', 'Log meals in the Food tab')}<h3>Meals per day</h3>${segRow('diet.meals', [3, 4, 5])}<h3>Diet</h3>${segRow('diet.pref', ['omnivore', 'pescatarian', 'vegetarian', 'vegan'], v => v[0].toUpperCase() + v.slice(1, 5) + (v.length > 5 ? '.' : ''))}<h3>Alcohol nights / week (max)</h3>${segRow('diet.alcohol', [0, 1, 2])}`;
  const T = computeTargets(P);
  return `<h2>Your plan</h2><div class="card"><div class="grid3"><div class="stat"><b id="obKcal">${fmtNum(T.kcal)}</b><span>kcal/day</span></div><div class="stat"><b id="obProt">${T.protein} g</b><span>protein</span></div><div class="stat"><b>${P.weight}→${P.goalWeight}</b><span>lb</span></div></div><div class="xs dim" style="margin-top:8px">Mifflin-St Jeor TDEE ≈ ${fmtNum(T.tdee)} kcal${(P.primary === 'fatloss' || P.goals.includes('fatloss')) && P.primary !== 'muscle' ? ' − 22% for fat loss' : ''}. Calories auto-adjust weekly from your weigh-ins.</div></div>${tplPreview(P)}<ul class="clean" style="margin-top:12px">${nutritionRules(P, T).slice(0, 4).map(r => `<li>${esc(r)}</li>`).join('')}${hasKnee(P) ? '<li>Knee rules ON — enforced when you move sessions</li>' : ''}</ul>`;
}
function renderOnboard() {
  const o = $('#onboard'); if (!OB) return;
  const last = OB.step === OB_STEPS.length - 1;
  o.innerHTML = `<div class="obtop"><div class="obdots">${OB_STEPS.map((_, i) => `<i class="${i <= OB.step ? 'on' : ''}"></i>`).join('')}</div>${S.onboarded ? '<button class="icon-btn tap" data-a="obClose" aria-label="Close">✕</button>' : ''}</div><div class="obbody" data-step="${OB_STEPS[OB.step]}">${obBody()}</div><div class="obbot">${OB.step ? '<button class="btn sec tap" data-a="obBack" style="width:34%">Back</button>' : (!S.onboarded ? '<button class="btn ghost tap" data-a="obSkip" style="width:44%">Keep defaults</button>' : '')}<button class="btn tap" data-a="${last ? 'obFinish' : 'obNext'}" id="obNext">${last ? 'Build my plan' : OB.step ? 'Next' : 'Start'}</button></div>`;
}
function openOnboard() {
  const P = JSON.parse(JSON.stringify(S.profile || DEFAULT_PROFILE));
  P.heightFt = Math.floor(P.heightIn / 12); P.heightInR = Math.round(P.heightIn % 12);
  OB = { step: 0, P }; $('#onboard').classList.remove('hidden'); document.body.style.overflow = 'hidden'; renderOnboard();
}
function closeOnboard() { $('#onboard').classList.add('hidden'); $('#onboard').innerHTML = ''; OB = null; document.body.style.overflow = ''; }
function finishOnboard(P) {
  P = JSON.parse(JSON.stringify(P)); if (P.heightFt != null) P.heightIn = (+P.heightFt) * 12 + (+P.heightInR || 0); delete P.heightFt; delete P.heightInR;
  if (!P.goals.length) P.goals = ['fatloss']; if (!P.goals.includes(P.primary)) P.primary = P.goals[0];
  const T = computeTargets(P), st = S.settings;
  S.profile = P; S.onboarded = true; st.kcal = T.kcal; st.protein = T.protein; st.startWeight = P.weight; st.goalWeight = P.goalWeight;
  const ph = st.habits.find(h => h.id === 'protein'); if (ph && /^Protein \d+/.test(ph.label)) ph.label = `Protein ${T.protein}g`;
  invalidatePlan(); save(); closeOnboard(); render(); toast(`Plan built ✓ ${fmtNum(T.kcal)} kcal · ${T.protein} g protein`);
}
ACT.obNext = () => { if (OB.step < OB_STEPS.length - 1) { OB.step++; haptic(); renderOnboard(); $('#onboard').scrollTop = 0; } };
ACT.obBack = () => { if (OB.step > 0) { OB.step--; haptic(); renderOnboard(); } };
ACT.obSkip = () => finishOnboard(OB.P);
ACT.obFinish = () => finishOnboard(OB.P);
ACT.obClose = () => closeOnboard();
ACT.obSet = (el, d) => { setP(d.k, JSON.parse(d.v)); haptic(); renderOnboard(); };
ACT.obTog = (el, d) => { setP(d.k, !getP(d.k)); haptic(); renderOnboard(); };
ACT.obGoal = (el, d) => { const g = OB.P.goals, i = g.indexOf(d.v); if (i >= 0) g.splice(i, 1); else g.push(d.v); OB.P.goals = Object.keys(GOAL_LABEL).filter(x => g.includes(x)); if (!OB.P.goals.includes(OB.P.primary)) OB.P.primary = OB.P.goals[0] || 'fatloss'; haptic(); renderOnboard(); };
ACT.retakeQuiz = () => { closeSheet(); openOnboard(); };
document.addEventListener('input', ev => { const t = ev.target; if (t.dataset && t.dataset.ob && OB) { const v = t.value; setP(t.dataset.ob, t.dataset.ob === 'injuries.other' ? v : (v === '' ? null : +v)); } });
