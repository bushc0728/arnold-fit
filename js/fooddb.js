/* Arnold Fit v2.6 — food database: starter whole foods (USDA) + Open Food Facts / USDA FoodData Central clients */
'use strict';
/* Starter foods. Values are per 100 g from USDA FoodData Central, SR Legacy (published 2019-04-01),
   pulled 2026-10-27 from api.nal.usda.gov/fdc/v1/foods?fdcIds=…&nutrients=208,203,205,204
   (208 energy kcal · 203 protein · 205 carbohydrate by difference · 204 total fat).
   Row: [id, name, FDC id, kcal, protein, carbs, fat, default serving g, serving label, group] */
const STARTER = [
  ['s_chicken', 'Chicken breast, cooked (roasted)', 171477, 165, 31.0, 0, 3.57, 227, '8 oz cooked', 'Protein'], // FDC 171477 Chicken, broilers or fryers, breast, meat only, cooked, roasted
  ['s_beef93', 'Ground beef 93% lean, raw', 0, 152, 20.85, 0, 7.0, 113, '4 oz raw', 'Protein'], // USDA SR Legacy "Beef, ground, 93% lean meat / 7% fat, raw" (152 kcal · 20.85 P · 7 F per 100 g); matches the usual package label 4 oz = 170 kcal · 23 g P · 8 g F
  ['s_beef90', 'Ground beef 90% lean, raw', 174030, 176, 20.0, 0, 10.0, 113, '4 oz raw', 'Protein'], // FDC 174030 Beef, ground, 90% lean meat / 10% fat, raw
  ['s_beef95c', 'Ground beef 95% lean, cooked crumbles', 174028, 193, 29.2, 0, 7.58, 85, '3 oz cooked', 'Protein'], // FDC 174028 Beef, ground, 95% lean / 5% fat, crumbles, cooked, pan-browned
  ['s_beef80', 'Ground beef 80/20, raw', 174036, 254, 17.2, 0, 20.0, 113, '4 oz raw', 'Protein'], // FDC 174036 Beef, ground, 80% lean / 20% fat, raw
  ['s_turkey', 'Ground turkey, raw', 171505, 148, 19.7, 0, 7.66, 113, '4 oz raw', 'Protein'], // FDC 171505 Turkey, ground, raw
  ['s_turkeyc', 'Ground turkey, cooked', 171506, 203, 27.4, 0, 10.4, 85, '3 oz cooked', 'Protein'], // FDC 171506 Turkey, ground, cooked
  ['s_egg', 'Egg, whole (large)', 171287, 143, 12.6, 0.72, 9.51, 50, '1 large egg', 'Protein'], // FDC 171287 Egg, whole, raw, fresh
  ['s_egghb', 'Egg, hard-boiled (large)', 173424, 155, 12.6, 1.12, 10.6, 50, '1 large egg', 'Protein'], // FDC 173424 Egg, whole, cooked, hard-boiled
  ['s_eggwhite', 'Egg whites', 172183, 52, 10.9, 0.73, 0.17, 33, '1 large white', 'Protein'], // FDC 172183 Egg, white, raw, fresh
  ['s_salmon', 'Salmon, Atlantic, cooked', 175168, 206, 22.1, 0, 12.4, 170, '6 oz cooked', 'Protein'], // FDC 175168 Fish, salmon, Atlantic, farmed, cooked, dry heat
  ['s_tuna', 'Tuna, light, canned in water (drained)', 171986, 116, 25.5, 0, 0.82, 113, '1 can drained (4 oz)', 'Protein'], // FDC 171986 Fish, tuna, light, canned in water, drained solids
  ['s_jerky', 'Beef jerky', 167536, 410, 33.2, 11.0, 25.6, 28, '1 oz', 'Protein'], // FDC 167536 Snacks, beef jerky, chopped and formed (brands vary — scan the bag for exact numbers)
  ['s_greek', 'Greek yogurt, plain nonfat', 170894, 59, 10.2, 3.6, 0.39, 170, '1 cup / container (170 g)', 'Dairy'], // FDC 170894 Yogurt, Greek, plain, nonfat
  ['s_cottage', 'Cottage cheese 1%', 173417, 72, 12.4, 2.72, 1.02, 226, '1 cup', 'Dairy'], // FDC 173417 Cheese, cottage, lowfat, 1% milkfat
  ['s_milk2', 'Milk 2%', 171267, 50, 3.3, 4.8, 1.98, 244, '1 cup', 'Dairy'], // FDC 171267 Milk, reduced fat, fluid, 2% milkfat
  ['s_cheddar', 'Cheddar cheese', 173414, 403, 22.9, 3.37, 33.3, 28, '1 oz', 'Dairy'], // FDC 173414 Cheese, cheddar
  ['s_rice', 'White rice, cooked', 168878, 130, 2.69, 28.2, 0.28, 158, '1 cup cooked', 'Carbs'], // FDC 168878 Rice, white, long-grain, regular, enriched, cooked
  ['s_potato', 'Potato, baked (with skin)', 170093, 93, 2.5, 21.2, 0.13, 173, '1 medium', 'Carbs'], // FDC 170093 Potatoes, baked, flesh and skin
  ['s_sweetpot', 'Sweet potato, baked', 168483, 90, 2.01, 20.7, 0.15, 114, '1 medium', 'Carbs'], // FDC 168483 Sweet potato, cooked, baked in skin, flesh
  ['s_oats', 'Oats, dry', 169705, 389, 16.9, 66.3, 6.9, 40, '½ cup dry', 'Carbs'], // FDC 169705 Cereals, oats, regular and quick, not fortified, dry
  ['s_quinoa', 'Quinoa, cooked', 168917, 120, 4.4, 21.3, 1.92, 185, '1 cup cooked', 'Carbs'], // FDC 168917 Quinoa, cooked
  ['s_bread', 'Whole-wheat bread', 172688, 252, 12.4, 42.7, 3.5, 32, '1 slice', 'Carbs'], // FDC 172688 Bread, whole-wheat, commercially prepared
  ['s_tortilla', 'Flour tortilla', 175037, 306, 8.2, 49.4, 7.99, 45, '1 tortilla (8″)', 'Carbs'], // FDC 175037 Tortillas, ready-to-bake or -fry, flour
  ['s_banana', 'Banana', 173944, 89, 1.09, 22.8, 0.33, 118, '1 medium', 'Fruit & veg'], // FDC 173944 Bananas, raw
  ['s_apple', 'Apple', 171688, 52, 0.26, 13.8, 0.17, 182, '1 medium', 'Fruit & veg'], // FDC 171688 Apples, raw, with skin
  ['s_blueb', 'Blueberries', 171711, 57, 0.74, 14.5, 0.33, 148, '1 cup', 'Fruit & veg'], // FDC 171711 Blueberries, raw
  ['s_avocado', 'Avocado', 171705, 160, 2.0, 8.53, 14.7, 50, '⅓ avocado', 'Fruit & veg'], // FDC 171705 Avocados, raw, all commercial varieties
  ['s_broccoli', 'Broccoli, cooked', 169967, 35, 2.38, 7.18, 0.41, 156, '1 cup', 'Fruit & veg'], // FDC 169967 Broccoli, cooked, boiled, drained
  ['s_pb', 'Peanut butter', 172470, 598, 22.2, 22.3, 51.4, 32, '2 tbsp', 'Fats'], // FDC 172470 Peanut butter, smooth style
  ['s_almonds', 'Almonds', 170567, 579, 21.2, 21.6, 49.9, 28, '1 oz (~23)', 'Fats'], // FDC 170567 Nuts, almonds
  ['s_oil', 'Olive oil', 171413, 884, 0, 0, 100, 13.5, '1 tbsp', 'Fats'], // FDC 171413 Oil, olive, salad or cooking
].map(([id, n, fdc, kcal, p, c, f, srvG, srvLbl, cat]) => ({ id, n, fdc, cat, per100: { kcal, p, c, f }, srvG, srvLbl, src: 'starter' }));
const STARTER_CATS = ['Protein', 'Dairy', 'Carbs', 'Fruit & veg', 'Fats'];

/* ---------- serving math ---------- */
const G_PER_OZ = 28.3495;
const r1 = v => Math.round(v * 10) / 10;
/* macros for amt of unit ('g' | 'oz' | 'srv') given a food ref { per100, perSrv, srvG } */
function macrosFor(ref, amt, unit) {
  amt = +amt || 0;
  if (unit === 'srv') {
    if (ref.perSrv) return scaleM(ref.perSrv, amt);
    if (ref.per100 && ref.srvG) return scaleM(ref.per100, amt * ref.srvG / 100);
    return scaleM(ref.per100 || { kcal: 0, p: 0, c: 0, f: 0 }, amt); // no size known: 1 srv = 100 g
  }
  const g = unit === 'oz' ? amt * G_PER_OZ : amt;
  if (ref.per100) return scaleM(ref.per100, g / 100);
  if (ref.perSrv && ref.srvG) return scaleM(ref.perSrv, g / ref.srvG);
  return { kcal: 0, p: 0, c: 0, f: 0 };
}
function scaleM(m, x) { return { kcal: Math.round((m.kcal || 0) * x), p: r1((m.p || 0) * x), c: r1((m.c || 0) * x), f: r1((m.f || 0) * x) }; }
function amtLabel(amt, unit, ref) { const a = +(+amt).toFixed(2); if (unit === 'g') return a + ' g'; if (unit === 'oz') return a + ' oz'; return (a === 1 ? '' : a + ' × ') + ((ref && ref.srvLbl) || 'serving'); }

/* ---------- network: Open Food Facts + USDA FoodData Central ---------- */
const FOOD_CACHE_KEY = 'arnoldfit.foodcache'; // separate from app data, safe to clear
const OFF_UA = 'ArnoldFit/2.6 (https://bushc0728.github.io/arnold-fit/)';
const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity';
const USDA_KEY = 'DEMO_KEY'; // public demo key: ~30 requests/hour per IP — every result is cached on the phone
let FC = null;
function fcLoad() { if (FC) return FC; try { FC = JSON.parse(localStorage.getItem(FOOD_CACHE_KEY)) || {}; } catch (e) { FC = {}; } FC.q = FC.q || {}; FC.bc = FC.bc || {}; return FC; }
function fcSave() { try { const c = fcLoad(); const trim = o => { const ks = Object.keys(o); if (ks.length > 150) ks.sort((a, b) => (o[a].t || 0) - (o[b].t || 0)).slice(0, ks.length - 150).forEach(k => delete o[k]); }; trim(c.q); trim(c.bc); localStorage.setItem(FOOD_CACHE_KEY, JSON.stringify(c)); } catch (e) {} }
const isOffline = () => navigator.onLine === false;
async function fetchJSON(url, opt = {}, ms = 9000) {
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, t = ac ? setTimeout(() => ac.abort(), ms) : 0;
  try { const r = await fetch(url, { ...opt, signal: ac ? ac.signal : undefined }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
async function offFetch(url) { // identify the app as OFF asks; fall back without the custom header if a browser refuses it
  try { return await fetchJSON(url, { headers: { 'X-User-Agent': OFF_UA } }); }
  catch (e) { if (String(e && e.message).startsWith('HTTP')) throw e; return fetchJSON(url); }
}
const offNum = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
function offToFood(p, code) {
  if (!p) return null;
  const n = p.nutriments || {}, k100 = offNum(n['energy-kcal_100g']) ?? (offNum(n['energy_100g']) != null ? offNum(n['energy_100g']) / 4.184 : null);
  const per100 = k100 == null && offNum(n.proteins_100g) == null ? null : { kcal: Math.round(k100 || 0), p: r1(offNum(n.proteins_100g) || 0), c: r1(offNum(n.carbohydrates_100g) || 0), f: r1(offNum(n.fat_100g) || 0) };
  const ks = offNum(n['energy-kcal_serving']);
  const perSrv = ks != null ? { kcal: Math.round(ks), p: r1(offNum(n.proteins_serving) || 0), c: r1(offNum(n.carbohydrates_serving) || 0), f: r1(offNum(n.fat_serving) || 0) } : null;
  const srvG = offNum(p.serving_quantity);
  if (!per100 && !perSrv) return null;
  const brand = Array.isArray(p.brands) ? p.brands[0] : (p.brands || '').split(',')[0];
  const name = (p.product_name || '').trim() || 'Unnamed product';
  return { id: 'off_' + (code || p.code), n: name, brand: (brand || '').trim(), code: String(code || p.code || ''), per100, perSrv, srvG: srvG || null, srvLbl: p.serving_size ? String(p.serving_size).slice(0, 40) : (srvG ? srvG + ' g' : null), src: 'off' };
}
async function offBarcode(code) {
  code = String(code).replace(/\D/g, ''); if (!code) throw new Error('bad code');
  const c = fcLoad(); if (c.bc[code]) return c.bc[code].v;
  if (isOffline()) throw new Error('offline');
  const j = await offFetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}&app_name=ArnoldFit&app_version=2.6`);
  const f = j && j.status === 1 ? offToFood(j.product, code) : null;
  c.bc[code] = { t: Date.now(), v: f }; fcSave(); return f; // null = not in the database (cached so we don't re-ask)
}
async function offSearch(q) {
  const enc = encodeURIComponent(q);
  try { // classic search API
    const j = await offFetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${enc}&search_simple=1&action=process&json=1&page_size=15&fields=${OFF_FIELDS}&app_name=ArnoldFit`);
    return (j.products || []).map(p => offToFood(p)).filter(Boolean);
  } catch (e) { // newer search service (when the classic one is down)
    const j = await fetchJSON(`https://search.openfoodfacts.org/search?q=${enc}&page_size=15&fields=${OFF_FIELDS}`);
    return (j.hits || []).map(p => offToFood(p)).filter(Boolean);
  }
}
function usdaNutr(fn, ids, nums) { const x = (fn || []).find(n => ids.includes(n.nutrientId) || nums.includes(String(n.nutrientNumber))); return x ? +(x.value ?? x.amount ?? 0) : null; }
function usdaToFood(f) {
  const fn = f.foodNutrients || [];
  let kcal = usdaNutr(fn, [1008, 2047, 2048], ['208', '957', '958']);
  if (kcal == null) { const kj = usdaNutr(fn, [1062], ['268']); kcal = kj != null ? kj / 4.184 : null; }
  const p = usdaNutr(fn, [1003], ['203']), c = usdaNutr(fn, [1005, 1050], ['205', '205.2']), fat = usdaNutr(fn, [1004], ['204']);
  if (kcal == null && p == null) return null;
  const name = String(f.description || '').replace(/\b([A-Z]{2,})\b/g, w => w.charAt(0) + w.slice(1).toLowerCase());
  return { id: 'usda_' + f.fdcId, n: name.charAt(0) + name.slice(1).toLowerCase(), fdc: f.fdcId, per100: { kcal: Math.round(kcal || 0), p: r1(p || 0), c: r1(c || 0), f: r1(fat || 0) }, srvG: null, srvLbl: null, src: 'usda' };
}
async function usdaSearch(q) {
  const j = await fetchJSON(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(q)}&dataType=${encodeURIComponent('Foundation,SR Legacy')}&pageSize=12`);
  return (j.foods || []).map(usdaToFood).filter(Boolean);
}
/* online search: USDA (whole foods) + OFF (brands). Cached per query for 30 days. Never throws. */
async function foodSearchOnline(q) {
  q = q.trim().toLowerCase(); if (q.length < 2) return { items: [], err: null };
  const c = fcLoad(), hit = c.q[q];
  if (hit && Date.now() - hit.t < 30 * 864e5) return { items: hit.v, err: null, cached: true };
  if (isOffline()) return { items: hit ? hit.v : [], err: 'offline' };
  const [u, o] = await Promise.allSettled([usdaSearch(q), offSearch(q)]);
  const items = [...(u.status === 'fulfilled' ? u.value : []), ...(o.status === 'fulfilled' ? o.value : [])];
  const err = u.status === 'rejected' && o.status === 'rejected' ? 'failed' : u.status === 'rejected' ? 'usda' : o.status === 'rejected' ? 'off' : null;
  if (items.length) { c.q[q] = { t: Date.now(), v: items }; fcSave(); }
  return { items, err };
}
