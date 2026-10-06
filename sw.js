/* Arnold Fit service worker — offline-first app shell */
const CACHE = 'arnoldfit-v2.2.0';
const ASSETS = ['./', './index.html', './manifest.json', './css/app.css', 
  './js/data.js', './js/verses.js', './js/devotionals.js', './js/devo.js', './js/foods.js', './js/store.js', './js/charts.js', './js/ui-core.js', './js/view-today.js', './js/view-train.js', './js/workout.js', './js/coach.js', './js/view-food.js', './js/view-fuel.js', './js/view-progress.js', './js/view-settings.js', './js/onboarding.js', './js/boot.js',
 
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // stale-while-revalidate: instant from cache, refresh in background
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net; if (r) return r;
    if (req.mode === 'navigate') return c.match('./index.html');
    return new Response('', { status: 504 });
  }));
});
