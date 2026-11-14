'use strict';
/* AS Rodzina – PESEL, urodziny w kalendarzu, ciśnienie krwi i glukoza */

// ---------- PESEL ----------
function peselInfo(p) {
  p = String(p || '').replace(/\D/g, ''); if (p.length !== 11) return null;
  const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]; let s = 0; for (let i = 0; i < 10; i++) s += w[i] * +p[i];
  if ((10 - s % 10) % 10 !== +p[10]) return { err: 'zła cyfra kontrolna – sprawdź numer' };
  let y = +p.slice(0, 2), m = +p.slice(2, 4); const d = +p.slice(4, 6);
  y += m > 80 ? 1800 : m > 60 ? 2200 : m > 40 ? 2100 : m > 20 ? 2000 : 1900; m = m % 20;
  const dt = new Date(y, m - 1, d); if (!m || dt.getMonth() !== m - 1 || dt.getDate() !== d) return { err: 'zła data w numerze' };
  return { birth: y + '-' + pad(m) + '-' + pad(d), sex: (+p[9]) % 2 ? 'c' : 'd' };
}

// ---------- urodziny ----------
function nextBday(birth) {
  if (!birth) return null; const b = toDate(birth); if (isNaN(b)) return null;
  const n = new Date(); n.setHours(0, 0, 0, 0);
  let d = new Date(n.getFullYear(), b.getMonth(), b.getDate()); if (d < n) d = new Date(n.getFullYear() + 1, b.getMonth(), b.getDate());
  return { date: d, days: Math.round((d - n) / 864e5), age: d.getFullYear() - b.getFullYear() };
}
function bdayRows() {
  return kids().map(k => ({ k, b: nextBday(k.birth) })).filter(x => x.b && x.b.days <= 30).sort((a, b) => a.b.days - b.b.days)
    .map(({ k, b }) => `<div class="it" onclick="openP({t:'child',id:'${k.id}'})"><div style="font-size:22px">🎂</div><div class="grow"><b>${b.days === 0 ? 'Dziś' : b.days === 1 ? 'Jutro' : esc(fmtD(dstr(b.date)))}</b> · ${esc(k.name)}<div class="mut">kończy ${b.age} ${b.age === 1 ? 'rok' : [2, 3, 4].includes(b.age % 10) && ![12, 13, 14].includes(b.age % 100) ? 'lata' : 'lat'}${b.days > 1 ? ' · za ' + b.days + ' dni' : ''}</div></div>${b.days === 0 ? '<span class="tag yel">🎉</span>' : ''}</div>`).join('');
}
const bdTitle = k => '🎂 Urodziny: ' + k.name + ' (' + k.birth.slice(0, 4) + ')';
function bdaySync(k, quiet) {
  if (!N || !N.calBirthday || !S.bdCal || !k || !k.birth) return false;
  if (!N.calHasPerm() || !S.calId) { if (!quiet) toast('Urodziny: wybierz kalendarz w Więcej → Kalendarz'); return false; }
  const [y, m, d] = k.birth.split('-').map(Number);
  const id = N.calBirthday(String(S.calId), String(EV['bd' + k.id] || ''), bdTitle(k), 'Ur. ' + fmtD(k.birth) + ' · AS Rodzina', Date.UTC(y, m - 1, d));
  if (id) { EV['bd' + k.id] = id; ST.set('evmap', EV); return true; }
  return false;
}
function bdayDel(id) { if (N && EV['bd' + id]) { N.calDelete(String(EV['bd' + id])); delete EV['bd' + id]; ST.set('evmap', EV); } }
function bdayAll() {
  if (N) { S.bdCal = true; saveAll(); const n = kids().filter(k => bdaySync(k, true)).length; toast(n ? 'Urodziny w kalendarzu: ' + n : 'Wybierz kalendarz i zezwól na dostęp'); return; }
  const z = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alan Solutions//AS Rodzina//PL'];
  kids().filter(k => k.birth).forEach(k => { const s = new Date(k.birth + 'T00:00Z'), e = new Date(s.getTime() + 864e5); L.push('BEGIN:VEVENT', 'UID:bd' + k.id + '@as-rodzina', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), 'DTSTART;VALUE=DATE:' + z(s), 'DTEND;VALUE=DATE:' + z(e), 'RRULE:FREQ=YEARLY', 'SUMMARY:' + bdTitle(k), 'END:VEVENT'); });
  L.push('END:VCALENDAR');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar' })); a.download = 'urodziny.ics'; document.body.appendChild(a); a.click(); a.remove();
}
// ustawienie w Więcej → Kalendarz
const vMore0 = vMore;
vMore = function () {
  let h = vMore0();
  const box = N ? `<div class="card"><h2>🎂 Urodziny</h2><label class="row"><input type="checkbox" id="sBd"${S.bdCal ? ' checked' : ''} onchange="S.bdCal=this.checked;saveAll();if(this.checked)bdayAll()"> Wpisuj urodziny rodziny do wybranego kalendarza (co roku)</label><div class="btns"><button class="b" onclick="bdayAll()">Zsynchronizuj teraz</button></div><div class="mut">Zmiana daty lub imienia poprawi wydarzenie. Włącz tylko na jednym telefonie, żeby nie było podwójnych wpisów.</div></div>`
    : `<div class="card"><h2>🎂 Urodziny</h2><p class="mut">Plik z urodzinami całej rodziny (powtarzane co roku) do kalendarza iPhone lub Google. Jeśli urodziny wpisuje już telefon z Androidem do wspólnego kalendarza, nie importuj drugi raz.</p><button class="b" onclick="bdayAll()">📅 Urodziny do kalendarza (.ics)</button></div>`;
  return h.replace('<div class="card"><h2>Sklepy</h2>', box + '<div class="card"><h2>Sklepy</h2>');
};

// ---------- ciśnienie i glukoza ----------
const VCTX = ['na czczo', 'przed posiłkiem', 'po posiłku (2 h)', 'przed snem', 'w nocy', 'losowo'];
const vits = (id, t) => live('vitals').filter(v => v.child === id && v.t === t).sort((a, b) => b.dt.localeCompare(a.dt));
const rng = k => k.rng || {};
function vitBad(v, k) {
  const r = rng(k);
  if (v.t === 'bp') return (r.sysMax && v.sys > r.sysMax) || (r.diaMax && v.dia > r.diaMax) || (r.sysMin && v.sys < r.sysMin) || (r.diaMin && v.dia < r.diaMin);
  const max = v.ctx === 'na czczo' && r.fastMax ? r.fastMax : r.gluMax;
  return (r.gluMin && v.val < r.gluMin) || (max && v.val > max);
}
const vitTxt = v => v.t === 'bp' ? `${v.sys}/${v.dia} mmHg${v.pulse ? ' · tętno ' + v.pulse : ''}` : `${fmtN(v.val)} mg/dl${v.ctx ? ' · ' + v.ctx : ''}`;
function vitDlg(child, t, id) {
  const k = byId('children', child), ex = id ? byId('vitals', id) : null, v = ex || { child, t, dt: nowLocal() };
  const F = t === 'bp' ? [{ k: 'dt', l: 'Kiedy', t: 'datetime-local', req: 1 }, { k: 'sys', l: 'Skurczowe – górne (mmHg)', t: 'number', req: 1 }, { k: 'dia', l: 'Rozkurczowe – dolne (mmHg)', t: 'number', req: 1 }, { k: 'pulse', l: 'Tętno (/min)', t: 'number' },
  { k: 'arm', l: 'Ręka', t: 'sel', o: [['', '—'], 'lewa', 'prawa'] }, { k: 'pos', l: 'Pozycja', t: 'sel', o: [['', '—'], 'siedząca', 'leżąca', 'stojąca'] }, { k: 'note', l: 'Uwagi (np. po lekach, po wysiłku, stres)' }]
    : [{ k: 'dt', l: 'Kiedy', t: 'datetime-local', req: 1 }, { k: 'val', l: 'Glukoza (mg/dl)', t: 'number', req: 1 }, { k: 'ctx', l: 'Względem posiłku', t: 'sel', o: [['', '—']].concat(VCTX) }, { k: 'note', l: 'Uwagi (np. co jedzone, lek, insulina)' }];
  form((t === 'bp' ? 'Ciśnienie' : 'Glukoza') + ' – ' + k.name, F, v, val => {
    if (t === 'bp') {
      if (!(val.sys > val.dia)) { toast('Górne ciśnienie musi być większe od dolnego'); return false; }
      if ((val.sys < 50 || val.sys > 300 || val.dia < 25 || val.dia > 200) && !confirm('Nietypowa wartość – na pewno dobrze wpisana?')) return false;
    } else if ((val.val < 10 || val.val > 800) && !confirm('Nietypowa wartość – na pewno w mg/dl?')) return false;
    const r = put('vitals', Object.assign(v, val));
    if (vitBad(r, k)) setTimeout(() => toast('Poza zakresem ustawionym od lekarza'), 300);
  }, ex ? { del: () => del('vitals', id) } : {});
}
function rngDlg(child, t) {
  const k = byId('children', child), r = Object.assign({}, rng(k));
  const F = t === 'bp' ? [{ k: 'sysMax', l: 'Górne – maksymalnie', t: 'number' }, { k: 'diaMax', l: 'Dolne – maksymalnie', t: 'number' }, { k: 'sysMin', l: 'Górne – minimalnie', t: 'number' }, { k: 'diaMin', l: 'Dolne – minimalnie', t: 'number' }]
    : [{ k: 'gluMin', l: 'Glukoza – minimalnie (mg/dl)', t: 'number' }, { k: 'gluMax', l: 'Glukoza – maksymalnie (mg/dl)', t: 'number' }, { k: 'fastMax', l: 'Na czczo – maksymalnie (mg/dl)', t: 'number' }];
  form('Zakresy od lekarza – ' + k.name, F, r, v => { k.rng = Object.assign(r, v); put('children', k); }, { top: '<p class="mut">Wpisz wartości zalecone przez lekarza. Pomiary poza nimi zaznaczą się na czerwono. Puste pole = bez sprawdzania.</p>' });
}
function vitBtns(k) {
  return (k.bpOn ? `<button class="b sm" onclick="vitDlg('${k.id}','bp')">🩺 Ciśnienie</button>` : '') + (k.gluOn ? `<button class="b sm" onclick="vitDlg('${k.id}','glu')">🩸 Cukier</button>` : '');
}
function vitAvg(list, f) { const a = list.map(f).filter(x => x !== '' && x != null && !isNaN(x)); return a.length ? Math.round(a.reduce((s, x) => s + +x, 0) / a.length) : ''; }
function vitCard(k) {
  if (!k.bpOn && !k.gluOn) return '';
  let h = `<div class="card"><h2>Ciśnienie i glukoza</h2><div class="list">`;
  [['bp', k.bpOn, '🩺 Ciśnienie'], ['glu', k.gluOn, '🩸 Glukoza']].forEach(([t, on, lab]) => {
    if (!on) return;
    const l = vits(k.id, t), last = l[0], w = l.filter(v => Date.now() - toDate(v.dt).getTime() < 7 * 864e5);
    const avg = t === 'bp' ? (w.length ? vitAvg(w, v => v.sys) + '/' + vitAvg(w, v => v.dia) : '') : vitAvg(w, v => v.val);
    h += `<div class="it"><div class="grow" onclick="openP({t:'vit',id:'${k.id}',v:'${t}'})"><b>${lab}</b>${last ? `: ${esc(vitTxt(last))} ${vitBad(last, k) ? '<span class="tag red">poza zakresem</span>' : ''}<div class="mut">${esc(fmtDT(last.dt))}${avg !== '' ? ' · średnia 7 dni: ' + avg + (t === 'bp' ? '' : ' mg/dl') + ' (' + w.length + ')' : ''}</div>` : '<div class="mut">brak pomiarów</div>'}</div><button class="b sm pri" onclick="vitDlg('${k.id}','${t}')">＋</button></div>`;
  });
  return h + '</div></div>';
}
let vitP = 30;
function vitChart(list, t, k) {
  const p = list.slice().sort((a, b) => a.dt.localeCompare(b.dt)); if (p.length < 2) return '';
  const W = 340, H = 170, pl = 32, pr = 8, pt = 8, pb = 20, r = rng(k);
  const t0 = toDate(p[0].dt).getTime(), t1 = toDate(p[p.length - 1].dt).getTime(), X = v => pl + (t1 === t0 ? 0 : (toDate(v.dt).getTime() - t0) / (t1 - t0)) * (W - pl - pr);
  const S = t === 'bp' ? [['sys', '#dc2626'], ['dia', '#2b7a9e']] : [['val', '#7c3aed']];
  const lines = t === 'bp' ? [r.sysMax, r.diaMax, r.sysMin, r.diaMin] : [r.gluMin, r.gluMax, r.fastMax];
  const vals = p.flatMap(v => S.map(s => +v[s[0]])).concat(lines.filter(Boolean).map(Number));
  const lo = Math.min(...vals), hi = Math.max(...vals), sp = (hi - lo) || 10, Y = v => pt + (hi + sp * .08 - v) / (sp * 1.16) * (H - pt - pb);
  let g = lines.filter(Boolean).map(v => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#16a34a" stroke-dasharray="4 3"/><text x="${W - pr}" y="${Y(v) - 2}" font-size="9" fill="#16a34a" text-anchor="end">${v}</text>`).join('');
  g += `<text x="2" y="${Y(hi) + 4}" font-size="10" fill="currentColor" opacity=".6">${Math.round(hi)}</text><text x="2" y="${Y(lo) + 4}" font-size="10" fill="currentColor" opacity=".6">${Math.round(lo)}</text>`;
  S.forEach(([f, c]) => { g += `<polyline points="${p.map(v => X(v).toFixed(1) + ',' + Y(+v[f]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="2" opacity=".85"/>` + p.map(v => `<circle cx="${X(v)}" cy="${Y(+v[f])}" r="3.2" fill="${vitBad(v, k) ? '#dc2626' : c}"/>`).join(''); });
  g += `<text x="${pl}" y="${H - 5}" font-size="10" fill="currentColor" opacity=".6">${esc(fmtD(p[0].dt))}</text><text x="${W - pr}" y="${H - 5}" font-size="10" fill="currentColor" opacity=".6" text-anchor="end">${esc(fmtD(p[p.length - 1].dt))}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${g}</svg>` + (t === 'bp' ? '<div class="mut"><span style="color:#dc2626">●</span> górne <span style="color:#2b7a9e">●</span> dolne · zielone linie: zakres od lekarza</div>' : '');
}
function vitStats(list, t, k) {
  if (!list.length) return '<div class="mut">Brak pomiarów w tym okresie.</div>';
  const bad = list.filter(v => vitBad(v, k)).length, mm = (f, fn) => fn(...list.map(f));
  if (t === 'bp') return `<div class="kv"><b>Pomiarów</b><span>${list.length}${bad ? ` · <span style="color:var(--bad)">poza zakresem: ${bad}</span>` : ''}</span><b>Średnio</b><span>${vitAvg(list, v => v.sys)}/${vitAvg(list, v => v.dia)} mmHg${vitAvg(list, v => v.pulse) !== '' ? ' · tętno ' + vitAvg(list, v => v.pulse) : ''}</span><b>Najwyższe</b><span>${mm(v => v.sys, Math.max)}/${mm(v => v.dia, Math.max)}</span><b>Najniższe</b><span>${mm(v => v.sys, Math.min)}/${mm(v => v.dia, Math.min)}</span></div>`;
  const byC = VCTX.map(c => [c, list.filter(v => v.ctx === c)]).filter(x => x[1].length);
  return `<div class="kv"><b>Pomiarów</b><span>${list.length}${bad ? ` · <span style="color:var(--bad)">poza zakresem: ${bad}</span>` : ''}</span><b>Średnio</b><span>${vitAvg(list, v => v.val)} mg/dl</span><b>Zakres</b><span>${fmtN(mm(v => v.val, Math.min))} – ${fmtN(mm(v => v.val, Math.max))} mg/dl</span>${byC.map(([c, l]) => `<b>${esc(c)}</b><span>śr. ${vitAvg(l, v => v.val)} (${l.length})</span>`).join('')}</div>`;
}
const vitInP = (id, t, days) => vits(id, t).filter(v => !days || Date.now() - toDate(v.dt).getTime() < days * 864e5);
function pVit(id, t) {
  const k = byId('children', id); if (!k) { pages.pop(); setTimeout(render, 0); return ''; }
  const l = vitInP(id, t, vitP), r = rng(k);
  let h = `<div class="btns"><button class="b pri" onclick="vitDlg('${id}','${t}')">＋ Pomiar</button><button class="b" onclick="rngDlg('${id}','${t}')">⚙ Zakresy od lekarza</button><button class="b" onclick="vitPrint('${id}','${t}')">🖨 Dzienniczek</button></div>`;
  h += `<div class="chips">${[[7, '7 dni'], [30, '30 dni'], [90, '3 mies.'], [0, 'Wszystko']].map(([d, n]) => `<button class="chip${vitP === d ? ' on' : ''}" onclick="vitP=${d};render()">${n}</button>`).join('')}</div>`;
  const rs = t === 'bp' ? [r.sysMax && 'górne ≤ ' + r.sysMax, r.diaMax && 'dolne ≤ ' + r.diaMax, r.sysMin && 'górne ≥ ' + r.sysMin, r.diaMin && 'dolne ≥ ' + r.diaMin] : [r.gluMin && '≥ ' + r.gluMin, r.gluMax && '≤ ' + r.gluMax, r.fastMax && 'na czczo ≤ ' + r.fastMax];
  h += `<div class="card">${vitStats(l, t, k)}<div class="mut" style="margin-top:6px">Zakres od lekarza: ${esc(rs.filter(Boolean).join(', ') || 'nie ustawiony')}</div>${vitChart(l, t, k)}</div><div class="card list">`;
  let day = '';
  l.forEach(v => { const d = v.dt.slice(0, 10); if (d !== day) { day = d; h += `<div class="grp">${esc(fmtD(d))}</div>`; } h += `<div class="it" onclick="vitDlg('${id}','${t}','${v.id}')"><div class="grow"><b>${esc(vitTxt(v))}</b> ${vitBad(v, k) ? '<span class="tag red">poza zakresem</span>' : ''}<div class="mut">${esc(v.dt.slice(11, 16))}${v.arm ? ' · ręka ' + esc(v.arm) : ''}${v.pos ? ' · ' + esc(v.pos) : ''}${v.note ? ' · ' + esc(v.note) : ''}</div></div></div>`; });
  return h + (l.length ? '' : '<div class="empty">Brak pomiarów.</div>') + '</div>';
}
function vitTable(id, t, days) {
  const k = byId('children', id), l = vitInP(id, t, days).slice().reverse();
  return `<h3>${t === 'bp' ? 'Ciśnienie krwi' : 'Glukoza'} – ${days ? 'ostatnie ' + days + ' dni' : 'wszystkie pomiary'}</h3><style>.kv{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:4px 0 8px}.kv b{font-weight:600}</style>${vitStats(l, t, k)}
  <table><tr><th>Kiedy</th><th>Wynik</th><th>Uwagi</th></tr>${l.map(v => `<tr${vitBad(v, k) ? ' style="color:#b91c1c;font-weight:600"' : ''}><td>${esc(fmtDT(v.dt))}</td><td>${esc(vitTxt(v))}</td><td>${esc([v.arm && 'ręka ' + v.arm, v.pos, v.note].filter(Boolean).join(', '))}</td></tr>`).join('')}</table>`;
}
function vitPrint(id, t) { const k = byId('children', id); printHtml(`<!doctype html><meta charset="utf-8"><style>${PRINT_CSS}</style><h1 style="font-size:20px;margin:0">Dzienniczek – ${esc(k.name)}</h1><div class="mut">${esc(fmtD(k.birth))}${k.pesel ? ' · PESEL ' + esc(k.pesel) : ''} · wydruk ${esc(fmtD(today()))}</div>${vitTable(id, t, vitP)}`, 'Dzienniczek ' + k.name); }

// raport i lista dla lekarza: 30 dni ciśnienia / glukozy
const repHtml0 = repHtml;
repHtml = function (r) {
  let h = repHtml0(r); const k = r.k;
  [['bp', k.bpOn], ['glu', k.gluOn]].forEach(([t, on]) => { if (on && vitInP(k.id, t, 30).length) h += vitTable(k.id, t, 30); });
  return h;
};
const visitItems0 = visitItems;
visitItems = function (v) {
  const o = visitItems0(v), k = byId('children', v.child) || {};
  if (k.bpOn) { const l = vitInP(k.id, 'bp', 30); if (l.length) o.I.push(['vbp', `Ciśnienie (30 dni): śr. ${vitAvg(l, x => x.sys)}/${vitAvg(l, x => x.dia)} mmHg, ${l.length} pomiarów${l.filter(x => vitBad(x, k)).length ? ', poza zakresem: ' + l.filter(x => vitBad(x, k)).length : ''}`]); }
  if (k.gluOn) { const l = vitInP(k.id, 'glu', 30); if (l.length) o.I.push(['vglu', `Glukoza (30 dni): śr. ${vitAvg(l, x => x.val)} mg/dl, ${l.length} pomiarów${l.filter(x => vitBad(x, k)).length ? ', poza zakresem: ' + l.filter(x => vitBad(x, k)).length : ''}`]); }
  return o;
};
PAGES.vit = { r: p => pVit(p.id, p.v), title: p => (p.v === 'bp' ? 'Ciśnienie – ' : 'Glukoza – ') + kidName(p.id) };

