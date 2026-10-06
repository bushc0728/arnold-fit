/* Daily devotional: rotation (no repeats until all 60 used), full-screen reader, journaling, offline "talk it through" responder, history */
'use strict';
function devoState() { return S.devo; }
function devoFor(k) {
  const v = S.devo; let id = v.byDate[k];
  if (!id || !DEVOS.find(x => x.id === id)) {
    let next = DEVOS.find(d => !v.seen.includes(d.id));
    if (!next) { const last = v.seen[v.seen.length - 1]; v.seen = []; v.cycle = (v.cycle || 1) + 1; next = DEVOS.find(d => d.id !== last); }
    v.seen.push(next.id); v.byDate[k] = next.id; id = next.id; save();
  }
  return DEVOS.find(x => x.id === id);
}
const devoJ = k => S.devo.journal[k] = S.devo.journal[k] || {};
const devoT = (k, qi) => { const t = S.devo.talk[k] = S.devo.talk[k] || {}; return t[qi] = t[qi] || []; };
function devoProgress(k) { const j = S.devo.journal[k] || {}, n = [0, 1, 2].filter(i => (j[i] || '').trim()).length; return { j: n, done: !!S.devo.done[k], sec: Math.round(S.devo.time[k] || 0) }; }
const fmtMS = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ---------- offline responder ---------- */
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const DEVO_THEME_MAP = { 'Discipline': 'discipline', 'Strength': 'tired', 'Purpose': 'career', 'Perseverance': 'fail', 'Body as a Temple': 'body', 'School & Career Pressure': 'school', 'Brotherhood & Leadership': 'team' };
function kwHit(t, w) { return w.includes(' ') || w.length > 4 ? t.includes(w) : new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(t); }
function devoRespond(text, d, k) {
  const t = ' ' + String(text).toLowerCase().replace(/[’]/g, "'") + ' ';
  const used = new Set(); Object.values(S.devo.talk[k] || {}).forEach(th => th.forEach(m => { if (m.role === 'bot') { if (m.ref) used.add(m.ref); if (m.q) used.add(m.q); if (m.o) used.add(m.o); } }));
  const crisis = DEVO_LEX.find(x => x.k === 'crisis');
  if (crisis.w.some(w => t.includes(w))) return { text: "I'm really glad you wrote that down, and I want to be straight with you: what you're feeling matters, and you shouldn't carry it alone. Please reach out right now — call or text 988 (Suicide & Crisis Lifeline, 24/7), or tell a friend, coach, pastor, or family member today.\n\nIs there one person you could reach out to in the next hour?", ref: 'Psalm 34:18', vt: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.', k: 'crisis' };
  const scored = DEVO_LEX.filter(x => x.k !== 'crisis').map(x => ({ x, n: x.w.filter(w => kwHit(t, w)).length })).filter(o => o.n).sort((a, b) => b.n - a.n);
  const words = t.trim().split(/\s+/).filter(Boolean).length, h = hashStr(t + used.size);
  const pick = (arr, salt = 0) => { if (!arr.length) return null; for (let i = 0; i < arr.length; i++) { const c = arr[(h + salt + i) % arr.length]; if (!used.has(c)) return c; } return arr[(h + salt) % arr.length]; };
  let lex = scored.length ? scored[0].x : DEVO_LEX.find(x => x.k === DEVO_THEME_MAP[d.th]);
  let opener, q;
  if (words < 4) { opener = 'Say a little more — even one more sentence helps.'; q = pick(DEVO_GENQ, 1); }
  else if (!scored.length) { opener = pick(['Thanks for writing that out.', 'Good — that’s honest.', 'I hear you.'], 2); q = pick(DEVO_GENQ.concat(lex.q), 3); }
  else { opener = pick(lex.o, 4); q = pick(lex.q, 5); }
  // related verse: theme library first, then today's supporting verses
  const refs = lex.v.slice(); let ref = pick(refs, 6), vt = DEVO_LIB[ref];
  if (!scored.length && d.s.length && !used.has(d.s[0].ref)) { ref = d.s[0].ref; vt = d.s[0].v.map(x => x[1]).join(' '); }
  return { text: `${opener}\n\n${q}`, ref, vt, k: lex.k, q, o: opener };
}

/* ---------- Today card ---------- */
function devoCard(k) {
  const d = devoFor(k), p = devoProgress(k), v1 = d.pv[0];
  const ref1 = d.p.replace(/:(.*)$/, ':' + v1[0]);
  const btn = p.done ? '✓ Done · Revisit' : (p.j || p.sec > 20) ? 'Continue ▸' : 'Start ▸';
  return `<div class="card verse devocard tap" id="devoCard" data-a="openDevo" data-k="${k}" data-did="${d.id}" role="button" aria-label="Open today's devotional"><div class="row between"><span class="chip gold">📖 Daily devotional · ${esc(d.th)}</span>${p.done ? `<span class="sbadge" title="Completed">${CHECK}</span>` : `<span class="xs dim">⏱ ~${d.min} min</span>`}</div><div class="dv-ttl">${esc(d.t)}</div><div class="small muted">${esc(d.p)} (KJV) · Day ${S.devo.seen.indexOf(d.id) + 1} of ${DEVOS.length}</div><blockquote>“${esc(v1[1])}”</blockquote><div class="vref">— ${esc(ref1)}</div><div class="row between" style="margin-top:12px;gap:8px"><span class="xs dim">${p.j}/3 reflections${p.sec ? ` · ${fmtMS(p.sec)} spent` : ''}</span><span class="btn sm ${p.done ? 'ghost' : ''}">${btn}</span></div></div>`;
}

/* ---------- reader ---------- */
let devoTick = null, devoOpenAt = 0, devoK = null;
function devoFlushTime() { if (devoK && devoOpenAt) { S.devo.time[devoK] = (S.devo.time[devoK] || 0) + (Date.now() - devoOpenAt) / 1000; devoOpenAt = Date.now(); save(); } }
function talkHtml(k, qi) {
  return devoT(k, qi).map(m => m.role === 'me' ? `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>` : `<div class="msg bot"><div class="bub">${esc(m.text).replace(/\n/g, '<br>')}${m.vt ? `<div class="dv-tv">📖 “${esc(m.vt)}”<span>— ${esc(m.ref)} (KJV)</span></div>` : ''}</div></div>`).join('');
}
function renderDevo() {
  const o = $('#devo'); if (!o || o.classList.contains('hidden')) return;
  const k = devoK, d = devoFor(k), j = devoJ(k), p = devoProgress(k), isToday = k === today();
  if (devoOpenAt) p.sec = Math.round((S.devo.time[k] || 0) + (Date.now() - devoOpenAt) / 1000);
  const fav = (S.devo.favs || []).includes(d.id);
  const sup = d.s.map(s => `<blockquote class="dv-sup">“${esc(s.v.map(x => x[1]).join(' '))}”<span class="vref">— ${esc(s.ref)} (KJV)</span></blockquote>`).join('');
  const qs = d.q.map((q, i) => { const th = devoT(k, i); return `<div class="dv-q" id="dvq${i}"><div class="dv-qn">${i + 1}</div><div class="grow"><div class="dv-qt">${esc(q)}</div><textarea class="inp dv-j" data-qi="${i}" rows="3" placeholder="Write honestly — this stays on your phone.">${esc(j[i] || '')}</textarea><div class="dv-talk" id="dvt${i}">${talkHtml(k, i)}</div>${th.length ? `<div class="row dv-reply"><input class="inp" id="dvr${i}" placeholder="Reply…" autocomplete="off"><button class="btn sm sec tap" data-a="devoTalk" data-qi="${i}" data-mode="reply">Send</button></div>` : `<button class="btn sm sec tap dv-tbtn" data-a="devoTalk" data-qi="${i}">💬 Talk it through</button>`}</div></div>`; }).join('');
  o.innerHTML = `<div class="wk-top"><button class="icon-btn tap" data-a="closeDevo" aria-label="Close devotional">✕</button><div><div class="tt">Devotional</div><div class="el small"><span id="dvTimer">${fmtMS(p.sec)}</span> · ~${d.min} min · ${isToday ? 'Today' : esc(fmtDate(k))}</div></div><button class="icon-btn tap" data-a="devoHistory" aria-label="Devotional history" title="History">🗂</button></div><div class="dv-prog"><i id="dvBar"></i></div>
  <div class="dv-body"><div class="row between"><span class="chip gold">${esc(d.th)}</span><span class="xs dim">Day ${S.devo.seen.indexOf(d.id) + 1} of ${DEVOS.length}${(S.devo.cycle || 1) > 1 ? ` · cycle ${S.devo.cycle}` : ''}</span></div>
  <h1 class="dv-h1">${esc(d.t)}</h1>
  <div class="dv-sec"><div class="dv-lbl">Scripture <button class="icon-btn tap dv-fav ${fav ? 'fav' : ''}" data-a="devoFav" data-id="${d.id}" aria-label="Save passage">${fav ? '♥' : '♡'}</button></div><div class="dv-ref">${esc(d.p)} <small>KJV</small></div><div class="dv-pass">${d.pv.map(v => `<sup>${v[0]}</sup>${esc(v[1])} `).join('')}</div><a class="xs dim" href="${bibleGatewayUrl(d.p)}" target="_blank" rel="noopener">Read the full chapter ↗</a></div>
  <div class="dv-sec"><div class="dv-lbl">Reading</div><div class="dv-read">${d.r.split(/\n\s*\n/).map(x => `<p>${esc(x.trim())}</p>`).join('')}</div></div>
  <div class="dv-sec"><div class="dv-lbl">Keep these close</div>${sup}</div>
  <div class="dv-sec"><div class="dv-lbl">Reflect · talk it through</div><div class="xs dim" style="margin:-4px 0 10px">Journal each answer (saved automatically for ${isToday ? 'today' : esc(fmtDate(k))}). Tap “Talk it through” and I’ll reply with a follow-up and a verse — all offline.</div>${qs}</div>
  <div class="dv-sec"><div class="dv-lbl">Prayer</div><div class="dv-pr">${esc(d.pr)}</div></div>
  <div class="dv-sec dv-carry"><div class="dv-lbl">Carry it today</div><div class="dv-act">➜ ${esc(d.a)}</div></div>
  ${p.done ? `<div class="card dv-donecard"><span class="sbadge">${CHECK}</span><div class="grow"><b>Completed</b><div class="xs dim">${new Date(S.devo.done[k]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${fmtMS(p.sec)} · ${p.j}/3 reflections</div></div><button class="btn sm ghost tap" data-a="devoUndone">Undo</button></div>` : `<button class="btn block markdone tap" id="dvDone" data-a="devoDone">Mark complete ✓</button>`}
  <div style="height:40px"></div></div>`;
  o.querySelectorAll('.dv-j').forEach(ta => ta.addEventListener('input', () => { devoJ(k)[ta.dataset.qi] = ta.value; clearTimeout(ta._t); ta._t = setTimeout(save, 300); }));
  o.querySelectorAll('.dv-reply input').forEach(inp => inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); ACT.devoTalk(inp, { qi: inp.id.slice(3), mode: 'reply' }); } }));
  o.onscroll = () => { const b = $('#dvBar'); if (b) b.style.width = Math.min(100, o.scrollTop / Math.max(1, o.scrollHeight - o.clientHeight) * 100) + '%'; };
}
function openDevo(k) {
  devoK = k || today(); devoFor(devoK);
  const o = $('#devo'); o.classList.remove('hidden'); o.scrollTop = 0; document.body.style.overflow = 'hidden';
  S.devo.started[devoK] = S.devo.started[devoK] || Date.now(); devoOpenAt = Date.now(); save(); renderDevo(); haptic();
  clearInterval(devoTick); devoTick = setInterval(() => { const el = $('#dvTimer'); if (!el) return; const s = (S.devo.time[devoK] || 0) + (Date.now() - devoOpenAt) / 1000; el.textContent = fmtMS(s); if (Math.floor(s) % 15 === 0) devoFlushTime(); }, 1000);
}
function closeDevo() { devoFlushTime(); clearInterval(devoTick); devoTick = null; devoOpenAt = 0; devoK = null; const o = $('#devo'); o.classList.add('hidden'); o.innerHTML = ''; document.body.style.overflow = ''; rerenderKeep(); }
function rerenderDevoKeep() { const o = $('#devo'), y = o.scrollTop; renderDevo(); o.scrollTop = y; }
document.addEventListener('visibilitychange', () => { if (document.hidden) devoFlushTime(); else if (devoK) devoOpenAt = Date.now(); });
ACT.openDevo = (el, d) => { closeSheet(); if (devoK) devoFlushTime(); openDevo(d.k || today()); };
ACT.closeDevo = () => closeDevo();
ACT.devoTalk = (el, dd) => {
  const k = devoK, qi = +dd.qi, d = devoFor(k), th = devoT(k, qi);
  let text;
  if (dd.mode === 'reply') { const inp = $('#dvr' + qi); text = (inp && inp.value || '').trim(); if (!text) return toast('Type a reply first'); }
  else { text = (devoJ(k)[qi] || '').trim(); if (!text) { toast('Write a sentence or two first'); const ta = $(`.dv-j[data-qi="${qi}"]`); if (ta) ta.focus(); return; } }
  th.push({ role: 'me', text, t: Date.now() });
  const r = devoRespond(text, d, k); th.push({ role: 'bot', text: r.text, ref: r.ref, vt: r.vt, q: r.q, o: r.o, k: r.k, t: Date.now() });
  save(); haptic(10); rerenderDevoKeep();
  const box = $('#dvq' + qi); if (box && box.scrollIntoView) { const t = $('#dvt' + qi); (t.lastElementChild || box).scrollIntoView({ block: 'center', behavior: 'smooth' }); }
};
ACT.devoDone = () => { const k = devoK; devoFlushTime(); S.devo.done[k] = Date.now(); const l = S.habitLog[k] = S.habitLog[k] || {}; if (S.settings.habits.find(h => h.id === 'bible')) l.bible = true; save(); haptic(20); confetti(); toast('Devotional complete ✓ — carry it today'); rerenderDevoKeep(); };
ACT.devoUndone = () => { const k = devoK; delete S.devo.done[k]; const l = S.habitLog[k]; if (l) delete l.bible; save(); rerenderDevoKeep(); };
ACT.devoFav = (el, d) => { const f = S.devo.favs = S.devo.favs || [], id = +d.id, i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); save(); toast(i >= 0 ? 'Removed from saved' : 'Passage saved ♥ (Fuel tab)'); rerenderDevoKeep(); };
ACT.devoHistory = () => {
  const ks = Object.keys(S.devo.byDate).filter(k => k <= today() || k === devoK).sort().reverse();
  openSheet(`<h3 style="margin:4px 0 4px">Devotional history</h3><div class="xs dim" style="margin-bottom:10px">${Object.keys(S.devo.done).length} completed · ${S.devo.seen.length}/${DEVOS.length} in this cycle</div>${ks.map(k => { const d = DEVOS.find(x => x.id === S.devo.byDate[k]), p = devoProgress(k), tc = Object.values(S.devo.talk[k] || {}).reduce((a, t) => a + t.filter(m => m.role === 'me').length, 0); return d ? `<button class="dv-hrow tap" data-a="openDevo" data-k="${k}"><span class="${p.done ? 'sbadge' : 'dv-hdot'}">${p.done ? CHECK : ''}</span><span class="grow" style="text-align:left"><b>${esc(d.t)}</b><span class="xs dim">${esc(fmtDate(k))} · ${esc(d.p)} · ${p.j}/3 journaled${tc ? ` · ${tc} talk${tc > 1 ? 's' : ''}` : ''}</span></span><span class="dim">›</span></button>` : ''; }).join('') || '<div class="muted small">Nothing yet.</div>'}`);
};
ACT.devoFavFuel = (el, d) => { const f = S.devo.favs || [], i = f.indexOf(+d.id); if (i >= 0) f.splice(i, 1); save(); rerenderKeep(); };
