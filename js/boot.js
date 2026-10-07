/* boot */
'use strict';
render(); netState();
if (!S.onboarded) openOnboard();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadCtl = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtl && !reloaded && !S.active) { reloaded = true; location.reload(); } }); // pick up a new version once
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW register failed', e)));
}
