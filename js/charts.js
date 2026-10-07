/* Arnold Fit — tiny inline-SVG chart kit (no deps, offline) */
'use strict';
const Charts = {
  line(o) {
    const W = o.w || 350, H = o.h || 180, P = { l: 34, r: 10, t: 12, b: 22 };
    const all = o.series.flatMap(s => s.pts); const hl = o.hlines || [];
    if (!all.length) return `<div class="empty">${o.empty || 'No data yet'}</div>`;
    let x0 = o.xMin ?? Math.min(...all.map(p => p.x)), x1 = o.xMax ?? Math.max(...all.map(p => p.x));
    if (x1 === x0) { x0 -= 1; x1 += 1; }
    const ys = all.map(p => p.y).concat(hl.map(h => h.y));
    let y0 = o.yMin ?? Math.min(...ys), y1 = o.yMax ?? Math.max(...ys);
    const pad = (y1 - y0) * 0.12 || 1; if (o.yMin == null) y0 -= pad; if (o.yMax == null) y1 += pad;
    const raw = (y1 - y0) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= raw) || raw;
    if (o.yMin == null) y0 = Math.floor(y0 / step) * step; if (o.yMax == null) y1 = Math.ceil(y1 / step) * step;
    const X = x => P.l + (x - x0) / (x1 - x0) * (W - P.l - P.r), Y = y => H - P.b - (y - y0) / (y1 - y0) * (H - P.t - P.b);
    const gid = 'g' + Math.random().toString(36).slice(2, 8);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.series[0].color}" stop-opacity=".28"/><stop offset="1" stop-color="${o.series[0].color}" stop-opacity="0"/></linearGradient></defs>`;
    const tv = []; for (let v = Math.ceil(y0 / step - 1e-9) * step; v <= y1 + 1e-9; v += step) tv.push(v);
    for (const v of tv) { const y = Y(v); s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.05)"/><text x="${P.l - 6}" y="${y + 3}" text-anchor="end">${(o.yFmt || (v => +v.toFixed(step < 1 ? 1 : 0)))(v)}</text>`; }
    (o.xTicks || []).forEach(t => { const x = X(t.x); if (x >= P.l - 1 && x <= W - P.r + 1) s += `<text x="${x}" y="${H - 6}" text-anchor="middle">${t.label}</text>`; });
    hl.forEach(h => { const y = Y(h.y); s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="${h.color}" stroke-dasharray="4 4" stroke-width="1.2"/><text x="${W - P.r}" y="${y - 4}" text-anchor="end" style="fill:${h.color};font-weight:700">${h.label}</text>`; });
    o.series.forEach((sr, si) => {
      const pts = sr.pts.slice().sort((a, b) => a.x - b.x); if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
      if (si === 0 && sr.area !== false && pts.length > 1) s += `<path d="${d} L${X(pts[pts.length - 1].x)} ${H - P.b} L${X(pts[0].x)} ${H - P.b} Z" fill="url(#${gid})"/>`;
      if (sr.line !== false && pts.length > 1) s += `<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="${sr.width || 2.5}" stroke-linecap="round" stroke-linejoin="round" ${sr.dash ? `stroke-dasharray="${sr.dash}"` : ''} opacity="${sr.opacity || 1}"/>`;
      if (sr.dots !== false) pts.forEach(p => s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${sr.r || 3}" fill="${sr.dotFill || sr.color}" opacity="${sr.dotOpacity || 1}"/>`);
    });
    return s + '</svg>';
  },
  bars(o) {
    const W = o.w || 350, H = o.h || 160, P = { l: 30, r: 6, t: 14, b: 22 };
    const n = o.labels.length; if (!n) return `<div class="empty">No data yet</div>`;
    const mx = o.max || Math.max(1, ...o.values, ...(o.ghost || [0])) * 1.1;
    const bw = (W - P.l - P.r) / n, Y = v => H - P.b - v / mx * (H - P.t - P.b);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="bg-${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}"/><stop offset="1" stop-color="${o.color2 || o.color}" stop-opacity=".55"/></linearGradient></defs>`;
    for (let i = 0; i <= 3; i++) { const v = mx * i / 3, y = Y(v); s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.05)"/><text x="${P.l - 5}" y="${y + 3}" text-anchor="end">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }
    o.labels.forEach((l, i) => {
      const x = P.l + i * bw + bw * 0.18, w = bw * 0.64;
      if (o.ghost) { const g = o.ghost[i] || 0; s += `<rect x="${x}" y="${Y(g)}" width="${w}" height="${Math.max(0, H - P.b - Y(g))}" rx="4" fill="rgba(255,255,255,.07)"/>`; }
      const v = o.values[i] || 0; s += `<rect x="${x}" y="${Y(v)}" width="${w}" height="${Math.max(0, H - P.b - Y(v))}" rx="4" fill="url(#bg-${o.id})"><title>${l}: ${Math.round(v)}</title></rect>`;
      if (o.hi === i) s += `<rect x="${x - 2}" y="${P.t - 6}" width="${w + 4}" height="${H - P.b - P.t + 6}" rx="5" fill="none" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 3"/>`;
      s += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${l}</text>`;
    });
    return s + '</svg>';
  },
  ring(pct, size = 96, stroke = 10, id = 'rg') {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A3D"/><stop offset="1" stop-color="#FF2E63"/></linearGradient></defs><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="rgba(255,255,255,.07)" stroke-width="${stroke}" fill="none"/><circle class="prog" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="url(#${id})" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}"/></svg>`;
  },
};
