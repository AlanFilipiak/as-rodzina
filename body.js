'use strict';
/* AS Rodzina – sylwetki ludzkie (niemowlę, dziecko, nastolatek, dorosły; kobieta / mężczyzna), przód i tył */
const BODY_T = {
  baby: { r: 4.3, hw: .47, ear: .075, nW: .22, nH: .04, sw: .64, ap: .36, cb: .72, wa: 1.0, hi: 1.25, cr: 1.45, apW: .6, chW: .64, waW: .65, hiW: .64, at: .27, ft: .24, el: .6, wr: 1.08, hand: .36, an: .3, kneeAt: .5, eyeY: .56, L: { cr: [.62, .02], kn: [.47, .1], ca: [.46, .08], an: [.31, .12], ft: [.38, .07] } },
  child: { r: 5.6, hw: .44, ear: .07, nW: .2, nH: .12, sw: .76, ap: .45, cb: .9, wa: 1.25, hi: 1.6, cr: 1.85, apW: .62, chW: .62, waW: .56, hiW: .6, at: .24, ft: .2, el: .85, wr: 1.55, hand: .5, an: .3, kneeAt: .48, eyeY: .54, L: { cr: [.6, .02], kn: [.41, .09], ca: [.43, .08], an: [.27, .11], ft: [.34, .07] } },
  man: { r: 7.6, hw: .4, ear: .07, nW: .25, nH: .26, sw: 1.06, ap: .55, cb: 1.05, wa: 1.55, hi: 2.0, cr: 2.35, apW: .8, chW: .79, waW: .64, hiW: .7, at: .34, ft: .27, el: 1.42, wr: 2.35, hand: .72, an: .32, kneeAt: .48, eyeY: .5, L: { cr: [.7, .02], kn: [.5, .1], ca: [.55, .08], an: [.31, .13], ft: [.42, .09] } },
  woman: { r: 7.5, hw: .38, ear: .065, nW: .2, nH: .27, sw: .9, ap: .55, cb: 1.0, wa: 1.5, hi: 2.05, cr: 2.4, apW: .72, chW: .76, waW: .53, hiW: .84, at: .28, ft: .23, el: 1.38, wr: 2.32, hand: .68, an: .3, kneeAt: .47, eyeY: .5, L: { cr: [.82, .02], kn: [.47, .1], ca: [.5, .08], an: [.27, .12], ft: [.36, .08] } }
};
function mixT(a, b, t) {
  const o = {};
  Object.keys(a).forEach(k => { o[k] = k === 'L' ? Object.fromEntries(Object.keys(a.L).map(j => [j, a.L[j].map((v, i) => v + (b.L[j][i] - v) * t)])) : a[k] + (b[k] - a[k]) * t; });
  return o;
}
const BODY_KINDS = [['auto', 'Automatycznie (wiek i płeć)'], ['baby', 'Niemowlę / maluch'], ['child_f', 'Dziewczynka'], ['child_m', 'Chłopiec'], ['teen_f', 'Nastolatka'], ['teen_m', 'Nastolatek'], ['woman', 'Kobieta'], ['man', 'Mężczyzna']];
function bodyKind(k) {
  if (k && k.bodyT && k.bodyT !== 'auto') return k.bodyT;
  const a = k && k.birth ? (ageOf(k.birth) || {}).yf : null, f = k && k.sex === 'd', m = k && k.sex === 'c';
  if (a != null && a < 3) return 'baby';
  if (a != null && a < 12) return f ? 'child_f' : 'child_m';
  if (a != null && a < 16) return f ? 'teen_f' : 'teen_m';
  return f ? 'woman' : m ? 'man' : (a == null ? 'child_m' : 'man');
}
function bodyParams(kind) {
  const T = BODY_T;
  if (kind === 'baby') return [T.baby, 0];
  if (kind === 'child_f') return [mixT(T.child, T.woman, .08), 2];
  if (kind === 'child_m') return [T.child, 1];
  if (kind === 'teen_f') return [Object.assign(mixT(T.child, T.woman, .7), { r: 6.9 }), 2];
  if (kind === 'teen_m') return [Object.assign(mixT(T.child, T.man, .7), { r: 7.0 }), 1];
  if (kind === 'woman') return [T.woman, 2];
  return [T.man, 1];
}
// gładki kontur (Catmull-Rom), punkty narożne oznaczone c:1
function smoothPath(P) {
  const n = P.length, g = i => P[(i + n) % n];
  let d = `M${g(0)[0].toFixed(1)},${g(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = p1[2] ? p1 : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = p2[2] ? p2 : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const poly = P => 'M' + P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';

function bodyGeom(kind) {
  const [B, hair] = bodyParams(kind), CX = 100, top = 6, bottom = 398, h = (bottom - top) / B.r;
  const chin = top + h, sy = chin + B.nH * h, Y = v => sy + v * h;
  const apY = Y(B.ap), cbY = Y(B.cb), waY = Y(B.wa), hiY = Y(B.hi), crY = Y(B.cr);
  const elY = Y(B.el), wrY = Y(B.wr), handY = wrY + B.hand * h;
  const anY = bottom - B.an * h, knY = crY + (anY - crY) * B.kneeAt, caY = knY + (anY - knY) * .3;
  const L = B.L, x = v => v * h;
  // ręka: wewnętrzna krawędź poza tułowiem
  const inEl = Math.max(x(B.waW) + .13 * h, x(B.apW) - .02 * h), inWr = Math.max(x(B.hiW), x(L.cr[0])) + .17 * h;
  const outSh = Math.max(x(B.sw), x(B.apW) + x(B.at)), outEl = inEl + x(B.at) * .95, outWr = inWr + x(B.ft) * .78;
  const R = [
    [0, top], [x(B.hw) * .72, top + .1 * h], [x(B.hw), top + .4 * h], [x(B.hw + B.ear), top + .48 * h], [x(B.hw + B.ear * .55), top + .66 * h],
    [x(B.hw) * .9, top + .74 * h], [x(B.hw) * .52, top + .95 * h], [x(B.nW), chin + .03 * h, 1], [x(B.nW) * 1.02, sy - .02 * h],
    [(x(B.nW) + x(B.sw)) / 2, sy + .05 * h], [x(B.sw) * .98, sy + .16 * h], [outSh + .02 * h, sy + .4 * h], [outEl, elY], [outWr, wrY],
    [outWr + .03 * h, wrY + B.hand * .5 * h], [(outWr + inWr) / 2 + .01 * h, handY], [inWr - .02 * h, wrY + B.hand * .5 * h], [inWr, wrY], [inEl, elY],
    [x(B.apW), apY, 1], [x(B.chW), cbY], [x(B.waW), waY], [x(B.hiW), hiY], [x(L.cr[0]), crY + .15 * h], [x(L.kn[0]), knY], [x(L.ca[0]), caY],
    [x(L.an[0]), anY], [x(L.ft[0]), bottom - .07 * h], [x(L.ft[0]) * .9, bottom], [x(L.ft[1]), bottom], [x(L.an[1]), anY], [x(L.ca[1]), caY],
    [x(L.kn[1]), knY], [x(L.cr[1]) + .04 * h, crY + .12 * h], [0, crY, 1]
  ];
  const right = R.slice(1, -1), outline = [R[0]].concat(right).concat([R[R.length - 1]]).concat(right.slice().reverse().map(p => [-p[0], p[1], p[2]]))
    .map(p => [CX + p[0], p[1], p[2]]);
  const W = 110, sx = s => p => [CX + s * p[0], p[1]];
  const torsoR = [[0, sy - .3 * h], [x(B.nW) + .1 * h, sy - .3 * h], [x(B.sw) * .8, sy - .1 * h], [x(B.apW), apY], [x(B.chW) + .04 * h, cbY], [x(B.waW) + .04 * h, waY], [x(B.hiW) + .05 * h, hiY], [0, crY]];
  const torso = torsoR.map(sx(1)).concat(torsoR.slice().reverse().map(sx(-1)));
  const armR = [[x(B.sw) * .8, sy - .1 * h], [W, sy - .1 * h], [W, bottom], [inWr - .05 * h, handY + 10], [inWr - .05 * h, wrY], [inEl - .05 * h, elY], [x(B.apW), apY]];
  const legR = [[x(B.hiW) + .05 * h, hiY], [W, hiY], [W, bottom + 10], [0, bottom + 10], [0, crY]];
  return { B, hair, h, top, bottom, chin, sy, apY, cbY, waY, hiY, crY, elY, wrY, handY, knY, anY, caY, x, outline: smoothPath(outline), torso: poly(torso), armP: [poly(armR.map(sx(1))), poly(armR.map(sx(-1)))], legP: [poly(legR.map(sx(1))), poly(legR.map(sx(-1)))] };
}

// regiony: [klucz, etykieta, x0, y0, x1, y1, część]  (część: h=głowa, t=tułów, a0/a1=ręce, l0/l1=nogi, b=całe ciało)
function bodyRegions(G, view) {
  const f = view === 'f', side = s => f ? (s > 0 ? ['l', 'lewe', 'lewa', 'lewy'] : ['p', 'prawe', 'prawa', 'prawy']) : (s > 0 ? ['p', 'prawe', 'prawa', 'prawy'] : ['l', 'lewe', 'lewa', 'lewy']);
  const h = G.h, W = 110, t = f ? '' : ' (tył)', Rg = [];
  if (f) Rg.push(['glowa', 'Głowa', -W, 0, W, G.chin + .02 * h, 'b'], ['szyja', 'Szyja / gardło', -W, G.chin + .02 * h, W, G.sy + .06 * h, 'b'],
    ['klatka', 'Klatka piersiowa', -W, 0, W, G.cbY + .1 * h, 't'], ['brzuch', 'Brzuch', -W, G.cbY + .1 * h, W, G.hiY + (G.crY - G.hiY) * .3, 't'], ['krocze', 'Krocze / pieluszka', -W, G.hiY + (G.crY - G.hiY) * .3, W, 420, 't']);
  else Rg.push(['glowa_t', 'Tył głowy', -W, 0, W, G.chin + .02 * h, 'b'], ['kark', 'Kark', -W, G.chin + .02 * h, W, G.sy + .06 * h, 'b'],
    ['plecy_g', 'Plecy (góra)', -W, 0, W, G.waY - .1 * h, 't'], ['plecy_d', 'Plecy (dół)', -W, G.waY - .1 * h, W, G.hiY, 't']);
  [1, -1].forEach((s, i) => {
    const sd = side(s), X = (a, b) => s > 0 ? [a, b] : [-b, -a], [ax0, ax1] = X(0, W);
    Rg.push(['ramie_' + sd[0], 'Ramię ' + sd[1] + t, ax0, 0, ax1, G.elY - .04 * h, 'a' + i], ['przed_' + sd[0], 'Przedramię ' + sd[1] + t, ax0, G.elY - .04 * h, ax1, G.wrY + .02 * h, 'a' + i], ['dlon_' + sd[0], 'Dłoń ' + sd[2], ax0, G.wrY + .02 * h, ax1, 420, 'a' + i]);
    Rg.push(['udo_' + sd[0], 'Udo ' + sd[1] + t, ax0, 0, ax1, G.knY - .14 * h, 'l' + i], [(f ? 'kolano_' : 'kolano_') + sd[0], (f ? 'Kolano ' : 'Pod kolanem ') + sd[1], ax0, G.knY - .14 * h, ax1, G.knY + .16 * h, 'l' + i],
      [(f ? 'podudzie_' : 'lydka_') + sd[0], (f ? 'Podudzie ' : 'Łydka ') + sd[1], ax0, G.knY + .16 * h, ax1, G.anY - .02 * h, 'l' + i], ['stopa_' + sd[0], 'Stopa ' + sd[2], ax0, G.anY - .02 * h, ax1, 420, 'l' + i]);
  });
  if (!f) Rg.push(['posladki', 'Pośladki', -(G.x(G.B.hiW) + .06 * h), G.hiY, G.x(G.B.hiW) + .06 * h, G.crY + .28 * h, 'b']);
  return Rg;
}

let bodyN = 0;
function bodyMarkup(k, view, marks) {
  const u = 'b' + (++bodyN);
  const kind = bodyKind(k), G = bodyGeom(kind), B = G.B, h = G.h, CX = 100, f = view === 'f';
  const hw = G.x(B.hw), top = G.top, long = G.hair === 2;
  const clip = { b: `url(#${u}B)`, t: `url(#${u}T)`, a0: `url(#${u}A0)`, a1: `url(#${u}A1)`, l0: `url(#${u}L0)`, l1: `url(#${u}L1)` };
  const rg = bodyRegions(G, view).map(([k2, l, x0, y0, x1, y1, part]) => {
    const r = `<rect data-r="${k2}" data-l="${esc(l)}" x="${(CX + x0).toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}"><title>${esc(l)}</title></rect>`;
    return part === 'b' ? r : `<g clip-path="${clip[part]}">${r}</g>`;
  }).join('');
  const hairC = 'class="hair"';
  let hairBack = '', hairTop = '';
  if (G.hair && long) hairBack = `<path ${hairC} d="M${CX - hw * 1.12},${top + .45 * h}Q${CX - hw * 1.2},${top - .06 * h} ${CX},${top - .05 * h}Q${CX + hw * 1.2},${top - .06 * h} ${CX + hw * 1.12},${top + .45 * h}L${CX + hw * 1.22},${G.sy + .45 * h}Q${CX},${G.sy + .6 * h} ${CX - hw * 1.22},${G.sy + .45 * h}Z"/>`;
  if (G.hair) {
    const d = f ? (long ? .42 : .3) : (long ? .95 : .7);
    hairTop = `<path ${hairC} d="M${CX - hw * 1.03},${top + d * h}Q${CX - hw * 1.08},${top - .07 * h} ${CX},${top - .06 * h}Q${CX + hw * 1.08},${top - .07 * h} ${CX + hw * 1.03},${top + d * h}` + (f ? `Q${CX + hw * .55},${top + .16 * h} ${CX},${top + .2 * h}Q${CX - hw * .55},${top + .16 * h} ${CX - hw * 1.03},${top + d * h}Z"/>` : `Q${CX},${top + (d + .08) * h} ${CX - hw * 1.03},${top + d * h}Z"/>`);
    if (!f && long) hairTop += `<path ${hairC} d="M${CX - hw * 1.05},${top + .6 * h}L${CX - hw * 1.18},${G.sy + .45 * h}Q${CX},${G.sy + .62 * h} ${CX + hw * 1.18},${G.sy + .45 * h}L${CX + hw * 1.05},${top + .6 * h}Z"/>`;
  } else if (f) hairTop = `<path ${hairC} d="M${CX - hw * .5},${top + .08 * h}Q${CX},${top - .04 * h} ${CX + hw * .5},${top + .08 * h}Q${CX},${top + .05 * h} ${CX - hw * .5},${top + .08 * h}Z"/>`;
  let face = '';
  const ey = top + B.eyeY * h, ex = .38 * hw, er = .075 * h, earX = hw + G.x(B.ear) * .45, earY = top + .56 * h;
  const ears = [1, -1].map(s => { const k2 = (f ? s > 0 : s < 0) ? 'ucho_l' : 'ucho_p'; return `<ellipse data-r="${k2}" data-l="${k2 === 'ucho_l' ? 'Ucho lewe' : 'Ucho prawe'}" class="ear" cx="${CX + s * earX}" cy="${earY}" rx="${G.x(B.ear) * .85}" ry="${.15 * h}"><title>${k2 === 'ucho_l' ? 'Ucho lewe' : 'Ucho prawe'}</title></ellipse>`; }).join('');
  if (f) face = ears + [1, -1].map(s => `<ellipse data-r="${s > 0 ? 'oko_l' : 'oko_p'}" data-l="${s > 0 ? 'Oko lewe' : 'Oko prawe'}" class="eye" cx="${CX + s * ex}" cy="${ey}" rx="${er * 1.25}" ry="${er * .8}"><title>${s > 0 ? 'Oko lewe' : 'Oko prawe'}</title></ellipse>`).join('')
    + `<path data-r="nos" data-l="Nos" class="feat" d="M${CX},${ey + .05 * h}Q${CX - .07 * h},${ey + .2 * h} ${CX - .05 * h},${ey + .23 * h}L${CX + .05 * h},${ey + .23 * h}Q${CX + .07 * h},${ey + .2 * h} ${CX},${ey + .05 * h}Z"><title>Nos</title></path>`
    + `<path data-r="usta" data-l="Usta / zęby" class="feat" d="M${CX - .12 * h},${ey + .33 * h}Q${CX},${ey + .43 * h} ${CX + .12 * h},${ey + .33 * h}Q${CX},${ey + .37 * h} ${CX - .12 * h},${ey + .33 * h}Z"><title>Usta / zęby</title></path>`;
  else face = ears;
  return `<defs><clipPath id="${u}B"><path d="${G.outline}"/></clipPath><clipPath id="${u}T"><path d="${G.torso}"/></clipPath>
  <clipPath id="${u}A0"><path d="${G.armP[0]}"/></clipPath><clipPath id="${u}A1"><path d="${G.armP[1]}"/></clipPath><clipPath id="${u}L0"><path d="${G.legP[0]}"/></clipPath><clipPath id="${u}L1"><path d="${G.legP[1]}"/></clipPath></defs>
  ${hairBack}<path class="skin" d="${G.outline}"/><g clip-path="${clip.b}">${rg}</g><path class="outl" d="${G.outline}"/>${hairTop}${face}${marks || ''}`;
}
