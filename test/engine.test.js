'use strict';
const assert = require('assert');
const AF = require('../js/engine.js');

function mem() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

function sets(w, r, n) {
  return Array.from({ length: n }, () => ({ w: w, r: r, done: true }));
}

const food = { log: { '2026-11-01': [{ name: 'keep me', kcal: 400 }] }, custom: [{ id: 'c1' }] };
const verse = { seen: [3, 9], favs: ['a'] };
const rawStore = {
  v: 5,
  settings: { name: 'Christopher Bush', units: { w: 'lb' }, kcal: 2550, protein: 190, habits: [{ id: 'bible' }] },
  workouts: [{
    id: 'old-bench', date: '2026-11-02', sessionKey: '2026-11-02:UA', title: 'Upper A', kind: 'lift',
    startedAt: 1, endedAt: 2,
    exercises: [{ ex: 'flat_bench', reps: [5, 8], planned: 3, sets: sets(135, 8, 3) }],
  }],
  food: food,
  verse: verse,
  devo: { journal: { '2026-11-01': 'keep' } },
  habitLog: { '2026-11-01': { protein: true } },
  active: null,
};
const rawPlan = { v: 1, rules: [{ id: 'keep-rule', type: 'day', spec: { t: 'rest' } }], customSess: { mine: { title: 'Old session' } }, customEx: { mine: { n: 'My lift', m: 'Chest' } } };

const store = mem();
store.setItem(AF.STORE_KEY, JSON.stringify(rawStore));
store.setItem(AF.PLAN_KEY, JSON.stringify(rawPlan));
const loaded = AF.load(store);
const S = loaded.S, PE = loaded.PE;

assert.strictEqual(S.food.log['2026-11-01'][0].name, 'keep me', 'food log kept');
assert.strictEqual(S.verse.seen.length, 2, 'verses kept');
assert.strictEqual(S.devo.journal['2026-11-01'], 'keep', 'devotional kept');
assert.strictEqual(S.habitLog['2026-11-01'].protein, true, 'habits kept');
assert.strictEqual(S.workouts[0].id, 'old-bench', 'workouts kept');
assert.strictEqual(S.workouts.length, 1);
assert.strictEqual(S.settings.kcal, 2550, 'old settings kept');
assert.strictEqual(S.v, 6);
assert.ok(S.fit3 && S.fit3.crunch);
assert.strictEqual(PE.rules[0].id, 'keep-rule', 'plan rules kept');
assert.strictEqual(PE.customSess.mine.title, 'Old session');
assert.strictEqual(PE.customEx.mine.n, 'My lift');
assert.ok(PE.fit && PE.fit.template.length === 7, 'default week seeded');
assert.ok(store.getItem(AF.PLAN_KEY + '.backup-pre-fit'), 'plan backed up before fit was added');
const backup = JSON.parse(store.getItem(AF.PLAN_KEY + '.backup-pre-fit'));
assert.ok(!backup.fit, 'backup is the pre-fit plan');
assert.strictEqual(backup.rules[0].id, 'keep-rule');
assert.ok(store.getItem(AF.STORE_KEY + '.backup-v2.9'), 'store backed up');
const savedPlan = JSON.parse(store.getItem(AF.PLAN_KEY));
assert.strictEqual(savedPlan.rules[0].id, 'keep-rule', 'saved plan still has rules');
assert.strictEqual(savedPlan.customEx.mine.n, 'My lift');

const again = AF.load(store);
assert.strictEqual(again.PE.fit.template[0].title, 'Upper A');
const backupOnce = store.getItem(AF.PLAN_KEY + '.backup-pre-fit');
AF.load(store);
assert.strictEqual(store.getItem(AF.PLAN_KEY + '.backup-pre-fit'), backupOnce, 'backup is not overwritten');

// Re-run backup idempotence with a listing store.
function mem2() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    keys: () => [...m.keys()],
  };
}
const st = mem2();
st.setItem(AF.STORE_KEY, JSON.stringify(rawStore));
st.setItem(AF.PLAN_KEY, JSON.stringify(rawPlan));
AF.load(st);
AF.load(st);
const planBackups = st.keys().filter(k => k.indexOf('.backup-pre-fit') >= 0);
assert.strictEqual(planBackups.length, 1);
const storeBackups = st.keys().filter(k => k.indexOf('.backup-v2.9') >= 0);
assert.strictEqual(storeBackups.length, 1);
assert.strictEqual(JSON.parse(st.getItem(AF.STORE_KEY)).food.log['2026-11-01'][0].kcal, 400, 'original store key not rewritten on load');

assert.strictEqual(AF.dowMon('2026-11-08'), 6, 'Nov 8 2026 is Sunday');
assert.strictEqual(AF.dowMon('2026-11-09'), 0, 'Nov 9 2026 is Monday');
assert.strictEqual(AF.weekStart('2026-11-08'), '2026-11-02');

const week = AF.defaultWeek();
assert.strictEqual(week[0].items[0].id, 'flat_bench');
assert.deepStrictEqual([week[0].items[0].sets, week[0].items[0].lo, week[0].items[0].hi], [3, 5, 8]);
assert.deepStrictEqual(week.map(d => d.code), ['UA', 'LA', 'REC', 'UB', 'LB', 'REST', 'HK']);
const lowerIds = week[1].items.concat(week[4].items).map(it => it.id).join(' ');
assert.ok(!/squat|lunge|deadlift|(^| )rdl($| )/.test(lowerIds), 'no squats, deadlifts, or lunges on lower days');
assert.ok(week[1].items.some(it => it.id === 'db_rdl'));
assert.ok(week[1].items.some(it => it.id === 'leg_press'));
assert.strictEqual(week[2].kind, 'recovery');
assert.strictEqual(week[4].items[0].sets, 2, 'lower B is reduced volume');
assert.strictEqual(week[5].kind, 'rest');
assert.strictEqual(week[6].kind, 'hockey');
assert.ok(week[0].items.length <= 8 && week[3].items.every(it => it.sets <= 3));

const fresh = AF.migratePlan({});
assert.strictEqual(AF.dayFor(fresh, '2026-11-09').title, 'Upper A');
assert.strictEqual(AF.dayFor(fresh, '2026-11-08').kind, 'hockey');
assert.strictEqual(AF.dayFor(fresh, '2026-11-11').code, 'REC');
assert.strictEqual(AF.dayFor(fresh, '2026-11-13').code, 'LB');

const last = { date: '2026-11-02', end: 2, sets: sets(135, 8, 3) };
const sug = AF.suggest({ id: 'flat_bench', sets: 3, lo: 5, hi: 8, mode: 'sets' }, last, 'lb', fresh);
assert.ok(sug && Math.abs(sug.w - 140) < 0.01, 'bench +5 lb');
assert.ok(/5 lb/.test(sug.text));
const small = AF.suggest({ id: 'lateral_raise', sets: 2, lo: 10, hi: 15, mode: 'sets' }, { date: '2026-11-02', end: 2, sets: sets(15, 15, 2) }, 'lb', fresh);
assert.ok(small && Math.abs(small.w - 17.5) < 0.01, 'lateral +2.5 lb');
assert.strictEqual(AF.suggest({ id: 'flat_bench', sets: 3, lo: 5, hi: 8, mode: 'sets' }, { date: '2026-11-02', end: 2, sets: sets(135, 7, 3) }, 'lb', fresh), null);
assert.strictEqual(AF.suggest({ id: 'flat_bench', sets: 3, lo: 5, hi: 8, mode: 'sets' }, { date: '2026-11-02', end: 2, sets: sets(135, 8, 2) }, 'lb', fresh), null);

const hist = [
  { id: 'a', date: '2026-10-26', endedAt: 1, exercises: [{ ex: 'flat_bench', sets: sets(125, 5, 3) }] },
  { id: 'b', date: '2026-11-02', endedAt: 2, exercises: [{ ex: 'flat_bench', sets: [{ w: 135, r: 8, done: true }, { w: 130, r: 8, done: true }] }] },
];
const series = AF.topSeries(hist, 'flat_bench');
assert.deepStrictEqual(series.map(p => p.w), [125, 135]);
assert.strictEqual(AF.lastPerf(hist, 'flat_bench').date, '2026-11-02');

const crunchStore = {
  workouts: [
    { date: '2026-11-02', endedAt: 1, kind: 'lift', title: 'Upper A', place: 'crunch' },
    { date: '2026-11-02', endedAt: 2, kind: 'lift', title: 'Extra', place: 'crunch' },
    { date: '2026-11-03', endedAt: 1, kind: 'lift', title: 'Lower A', place: 'crunch' },
    { date: '2026-11-08', endedAt: 1, kind: 'hockey', title: 'Hockey', place: 'off' },
    { date: '2026-11-06', endedAt: 1, kind: 'cardio', title: 'Run' },
  ],
  fit3: { crunch: { '2026-11-07': true, '2026-11-03': false } },
};
const days = AF.crunchSet(crunchStore, '2026-11-02');
assert.ok(days.has('2026-11-02'));
assert.ok(!days.has('2026-11-03'), 'explicit false removes an inferred visit');
assert.ok(days.has('2026-11-07'));
assert.ok(!days.has('2026-11-08'), 'hockey is not a Crunch visit');
assert.strictEqual(days.size, 2);

AF.swapDays(fresh, '2026-11-09', '2026-11-10', false);
assert.strictEqual(AF.dayFor(fresh, '2026-11-09').code, 'LA');
assert.strictEqual(AF.dayFor(fresh, '2026-11-10').code, 'UA');
assert.strictEqual(fresh.fit.template[0].code, 'UA', 'this-week swap does not change the template');
assert.strictEqual(AF.dayFor(fresh, '2026-11-16').code, 'UA', 'next Monday still Upper A');

const kept = JSON.parse(JSON.stringify(S));
kept.workouts.push({ id: 'new', date: '2026-11-09', endedAt: 9, title: 'Upper A', kind: 'lift', place: 'crunch', exercises: [] });
const round = JSON.parse(JSON.stringify(kept));
assert.strictEqual(round.food.log['2026-11-01'][0].name, 'keep me');
assert.strictEqual(round.workouts.length, 2);

const alts = AF.alternatives('db_rdl', { code: 'LA' }, fresh);
assert.ok(alts.indexOf('hip_hinge') >= 0);
assert.ok(!alts.some(id => AF.KNEE_BAN[id]), 'lower-day swaps skip squats, deadlifts, and lunges');

const habitsIn = {
  v: 5,
  settings: {
    habits: [
      { id: 'protein', label: '180 g protein', ic: '🥩' },
      { id: 'water', label: 'Water', ic: '💧' },
      { id: 'noalc', label: 'No alcohol', ic: '🚫' },
      { id: 'sleep', label: '8h sleep', ic: '😴' },
    ],
    nn: ['protein', 'noalc', 'water'],
  },
  habitLog: { '2026-11-01': { protein: true, noalc: true, water: true }, '2026-11-02': { noalc: true } },
  workouts: [],
  food: { log: { keep: true } },
};
const habitsOut = AF.migrateStore(JSON.parse(JSON.stringify(habitsIn)));
assert.deepStrictEqual(habitsOut.settings.habits.map(h => h.label), ['Track macros', 'Water', '8h sleep']);
assert.strictEqual(habitsOut.settings.habits[0].id, 'protein');
assert.strictEqual(habitsOut.settings.habits[0].ic, '🥩');
assert.strictEqual(habitsOut.habitLog['2026-11-01'].protein, true, 'protein checks stay on the same id');
assert.strictEqual(habitsOut.habitLog['2026-11-01'].noalc, true, 'alcohol history is kept, just not shown');
assert.strictEqual(habitsOut.habitLog['2026-11-02'].noalc, true);
assert.ok(!habitsOut.settings.nn.includes('noalc'));
assert.strictEqual(habitsOut.food.log.keep, true);
const againHabits = AF.migrateStore(JSON.parse(JSON.stringify(habitsOut)));
assert.deepStrictEqual(againHabits.settings.habits.map(h => h.label), ['Track macros', 'Water', '8h sleep']);

const hidden = AF.migrateStore({
  v: 5,
  settings: { habits: [{ id: 'water', label: 'Water' }, { id: 'noalc', label: 'No alcohol' }] },
  v28: { hiddenHabits: [{ id: 'protein', label: 'Protein 190g', ic: '🥩', at: 0 }] },
  habitLog: { '2026-10-28': { protein: true } },
  workouts: [],
});
assert.strictEqual(hidden.settings.habits[0].label, 'Track macros');
assert.strictEqual(hidden.settings.habits[0].id, 'protein');
assert.ok(!hidden.settings.habits.some(h => /alcohol/i.test(h.label)));
assert.strictEqual(hidden.habitLog['2026-10-28'].protein, true);

console.log('engine tests passed');
