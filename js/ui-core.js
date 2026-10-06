/* Arnold Fit v2 — UI core: helpers, sheets, header, tab routing, action registry */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.8A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
const MODE_LABEL = { run: 'Run', swim: 'Swim', bike: 'Bike', hockey: 'Hockey', walk: 'Walk' };
const UI = { tab: 'today', liftSel: 'incline_bench', cardioSel: 'run', testSel: null, habDate: null, foodDate: null, foodMeal: null, foodCat: 'All', foodQ: '', fuelCat: 'All', trainWeek: null };
const ACT = {}; // action registry: ACT[name] = (el, data, ev) => {}

function haptic(ms = 8) { if (S.settings.haptics && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }
let toastT; function toast(msg, undoAct) {
  const t = $('#toast'); t.innerHTML = esc(msg) + (undoAct ? ` <button class="toast-undo" data-a="${undoAct}">Undo</button>` : '');
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), undoAct ? 4500 : 2200);
}
let actx; function beep() { if (!S.settings.sound) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); [0, 0.18].forEach(t => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination); g.gain.setValueAtTime(0.0001, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.15); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.16); }); } catch (e) {} }
function confetti() { const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#FF7A3D', '#FF2E63', '#2EE6A6', '#3DA9FC', '#FFC145', '#B98CFF']; for (let i = 0; i < 60; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length]; p.style.animationDelay = Math.random() * 0.5 + 's'; p.style.animationDuration = 1.4 + Math.random() * 1.2 + 's'; c.appendChild(p); } document.body.appendChild(c); setTimeout(() => c.remove(), 3200); }
const painColor = v => v <= 2 ? '#2EE6A6' : v <= 4 ? '#FFC145' : '#FF4D5E';
const wu = () => U.w(), du = () => U.d(), su = () => U.s(), lu = () => U.len();
const modOf = dp => dp.meta.deload ? 'deload' : dp.meta.finals ? 'reduced' : 'normal';

/* sheets */
function openSheet(html, cls = '') { closeSheet(); $('#sheet-root').innerHTML = `<div class="scrim" data-a="closeSheet"></div><div class="sheet ${cls}" role="dialog"><div class="grab"></div><button class="icon-btn tap sheet-x" data-a="closeSheet" aria-label="Close">✕</button>${html}</div>`; haptic(); }
function closeSheet() { $('#sheet-root').innerHTML = ''; }
ACT.closeSheet = () => closeSheet();

function hdr(eyebrow, title) {
  return `<div class="hdr"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="row" style="gap:8px"><button class="icon-btn round tap" data-a="openCoach" aria-label="Coach chat">${CHAT}</button><button class="icon-btn round tap" data-a="goSettings" aria-label="Settings">${GEAR}</button></div></div>`;
}
const VIEWS = {};
function render() {
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  $('#view').innerHTML = (VIEWS[UI.tab] || VIEWS.today)();
}
function rerenderKeep() { const y = scrollY; render(); scrollTo(0, y); }
function goTab(tab) { UI.tab = tab; render(); window.scrollTo(0, 0); }
ACT.goSettings = () => { haptic(); goTab('settings'); };
ACT.goTab = (el, d) => goTab(d.tab);

/* delegation */
document.addEventListener('click', ev => {
  const tb = ev.target.closest('#tabbar button'); if (tb) { haptic(); goTab(tb.dataset.tab); return; }
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) { if (el.tagName === 'A' && !el.getAttribute('href')) ev.preventDefault(); fn(el, el.dataset, ev); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeSheet(); });
