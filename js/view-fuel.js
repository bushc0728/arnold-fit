/* Fuel tab: curated motivation videos (YouTube links), categories, find-similar, saved verses */
'use strict';
const CAT_IC = { Discipline: '🪖', Hockey: '🏒', 'Triathlon/Ironman': '🏊', Faith: '✝️' };
const EMPTY_HINT = { Discipline: 'Try a Jocko or Goggins clip.', Hockey: 'Add a game-day speech or highlight reel.', 'Triathlon/Ironman': 'Add a race documentary or Kona finish-line video.', Faith: 'Add a sermon or worship song that fires you up.' };
VIEWS.fuel = function () {
  const cat = UI.fuelCat, cats = S.videoCats, vids = S.videos.filter(v => cat === 'All' || v.cat === cat).slice().sort((a, b) => b.added - a.added);
  let h = hdr('Motivation', 'Fuel');
  h += `<div class="card" id="addVid"><div style="font-weight:750;margin-bottom:8px">Add a YouTube video</div><input class="inp" id="ytUrl" placeholder="Paste a YouTube link…" autocomplete="off" inputmode="url"><div class="grid2" style="margin-top:10px"><select class="inp" id="ytCat">${cats.map(c => `<option ${c === (cat === 'All' ? cats[0] : cat) ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><button class="btn tap" style="height:48px" data-a="addVideo" id="addVideoBtn">Add</button></div><div class="xs dim" style="margin-top:8px">Works with youtube.com/watch, youtu.be, Shorts & live links. The title is fetched automatically when online — you can edit it.</div></div>`;
  h += `<div class="chips" id="fuelCats" style="margin:4px 0 12px">${['All', ...cats].map(c => `<button class="chip tap ${cat === c ? 'grad' : ''}" data-a="fuelCat" data-c="${esc(c)}">${CAT_IC[c] || (c === 'All' ? '⭐' : '🎬')} ${esc(c)} <span class="dim">${c === 'All' ? S.videos.length : S.videos.filter(v => v.cat === c).length}</span></button>`).join('')}<button class="chip tap" data-a="addVidCat">+ Category</button></div>`;
  if (!vids.length) h += `<div class="card empty" id="vidEmpty"><div style="font-size:34px">${CAT_IC[cat] || '🎬'}</div><div style="font-weight:700;margin-top:6px">No ${cat === 'All' ? '' : esc(cat) + ' '}videos yet</div><div class="small muted" style="margin-top:4px">Paste a YouTube link above to save one here. ${esc(EMPTY_HINT[cat] || '')}</div>${cat !== 'All' && !CAT_IC[cat] ? `<button class="btn sm ghost" style="margin-top:12px;width:auto" data-a="delVidCat" data-c="${esc(cat)}">Delete this category</button>` : ''}</div>`;
  h += `<div id="vidList">${vids.map(videoCard).join('')}</div>`;
  const fav = S.verse.favs.map(id => VERSES.find(v => v.id === id)).filter(Boolean);
  h += `<h2 class="sec">Saved verses <small>${fav.length}</small></h2>`;
  h += fav.length ? fav.map(v => `<div class="card verse sm"><blockquote>“${esc(v.text)}”</blockquote><div class="row between"><div class="vref">— ${esc(v.ref)}</div><div class="row" style="gap:6px"><a class="chip tap" href="${bibleGatewayUrl(v.ref)}" target="_blank" rel="noopener">Read ↗</a><button class="chip tap" data-a="favVerse" data-id="${v.id}">Remove</button></div></div></div>`).join('') : `<div class="card empty small muted">Tap ♡ on the daily verse to save it here.</div>`;
  return h;
};
function videoCard(v) {
  return `<div class="card vcard" data-vid="${esc(v.vid)}"><a class="vthumb tap" href="${ytWatch(v.vid)}" target="_blank" rel="noopener" aria-label="Open on YouTube"><img src="${ytThumb(v.vid)}" alt="" loading="lazy" onerror="this.style.display='none';this.parentNode.classList.add('noimg')"><span class="play">▶</span></a><div class="vmeta"><input class="vtitle" data-vt="${esc(v.id)}" value="${esc(v.title)}" aria-label="Video title"><div class="row between" style="margin-top:8px"><span class="chip">${CAT_IC[v.cat] || '🎬'} ${esc(v.cat)}</span><div class="row" style="gap:6px"><a class="chip tap" href="${ytWatch(v.vid)}" target="_blank" rel="noopener">Open ↗</a><a class="chip tap gold simlink" href="${ytSimilarUrl(v)}" target="_blank" rel="noopener">Find similar</a><button class="chip tap" data-a="delVideo" data-id="${esc(v.id)}" aria-label="Delete">✕</button></div></div></div></div>`;
}
async function fetchTitle(vid) {
  try { const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(ytWatch(vid))); if (!r.ok) return null; const j = await r.json(); return j && j.title ? { title: j.title, author: j.author_name } : null; } catch (e) { return null; }
}
ACT.fuelCat = (el, d) => { UI.fuelCat = d.c; haptic(); rerenderKeep(); };
ACT.addVideo = async () => {
  const url = $('#ytUrl').value, vid = parseYouTube(url), cat = $('#ytCat').value;
  if (!vid) return toast('That doesn’t look like a YouTube link');
  if (S.videos.some(v => v.vid === vid)) return toast('Already saved');
  const v = { id: uid(), vid, title: 'YouTube video', cat, tags: cat.toLowerCase(), added: Date.now() };
  S.videos.push(v); save(); UI.fuelCat = cat; haptic(15); rerenderKeep(); toast('Video added — fetching title…');
  const t = await fetchTitle(vid);
  const x = S.videos.find(z => z.id === v.id); if (!x) return;
  if (t) { x.title = t.title; if (t.author) x.tags = (cat + ' ' + t.author).toLowerCase(); save(); toast('Title fetched ✓'); } else toast('Couldn’t fetch the title — tap it to edit');
  if (UI.tab === 'fuel') rerenderKeep();
};
ACT.delVideo = (el, d) => { const i = S.videos.findIndex(v => v.id === d.id); if (i < 0) return; const v = S.videos.splice(i, 1)[0]; UNDO_VID = { i, v }; save(); haptic(); toast('Video removed', 'undoVid'); rerenderKeep(); };
let UNDO_VID = null; ACT.undoVid = () => { if (UNDO_VID) S.videos.splice(UNDO_VID.i, 0, UNDO_VID.v); UNDO_VID = null; save(); rerenderKeep(); };
ACT.addVidCat = () => { const n = (prompt('New category name') || '').trim(); if (!n) return; if (S.videoCats.includes(n)) return toast('Already exists'); S.videoCats.push(n); UI.fuelCat = n; save(); rerenderKeep(); };
ACT.delVidCat = (el, d) => { S.videoCats = S.videoCats.filter(c => c !== d.c); UI.fuelCat = 'All'; save(); rerenderKeep(); };
document.addEventListener('change', ev => { const t = ev.target; if (t.dataset && t.dataset.vt) { const v = S.videos.find(x => x.id === t.dataset.vt); if (v) { v.title = t.value.trim() || v.title; save(); const a = t.closest('.vcard').querySelector('.simlink'); if (a) a.href = ytSimilarUrl(v); toast('Title saved'); } } });
