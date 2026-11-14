'use strict';
/* AS Rodzina – dział zdrowia: mapa ciała, leki, kursy, apteczka, szczepienia, epizody, dokumenty */

document.head.insertAdjacentHTML('beforeend', `<style>
.ths{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.th{width:72px;height:72px;border-radius:10px;overflow:hidden;background:var(--chip);display:grid;place-items:center;position:relative;font-size:11px;text-align:center;color:var(--mut)}
.th img{width:100%;height:100%;object-fit:cover}.th i{position:absolute;right:3px;bottom:1px;font-style:normal}
.th .x{position:absolute;top:2px;right:2px;background:#000a;color:#fff;border:0;border-radius:50%;width:22px;height:22px;font-size:13px;padding:0}
.body{display:block;margin:0 auto;max-width:230px;width:100%;touch-action:manipulation}
.body .skin{fill:var(--chip)}
.body rect[data-r]{fill:transparent;stroke:var(--mut);stroke-opacity:.35;stroke-width:.7;stroke-dasharray:3 2;cursor:pointer}
.body [data-r]:active,.body [data-r]:hover{fill:#93c5fd88}
.body .outl{fill:none;stroke:var(--mut);stroke-width:1.6;pointer-events:none}
.body .hair{fill:var(--mut);opacity:.45;pointer-events:none}
.body .ear{fill:var(--chip);stroke:var(--mut);stroke-width:1;cursor:pointer}
.body .eye{fill:var(--card);stroke:var(--mut);stroke-width:1.1;cursor:pointer}
.body .feat{fill:var(--mut);opacity:.55;cursor:pointer}
.body .mk{stroke:#fff;stroke-width:2;cursor:pointer}
.warn{border-radius:10px;padding:10px;margin:8px 0;background:var(--chip);font-size:14px}.warn.bad{background:#fde2e2;color:#991b1b}
.kidbtn{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:none;color:var(--tx);font:inherit;font-size:13px;padding:4px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.slot{border:1px solid var(--ln);border-radius:8px;padding:6px 8px;font-size:14px;background:var(--card);color:var(--tx)}
.slot.ok{background:#dcfce7;border-color:#86efac;color:#166534}.slot.miss{background:#fde2e2;border-color:#fca5a5;color:#991b1b}
.sos{font-size:18px}.sos .alg{background:#dc2626;color:#fff;border-radius:12px;padding:12px;font-size:20px;font-weight:800;margin:8px 0}
.faces .chip{font-size:20px;padding:4px 9px}
.ep{background:#fef3c7;color:#78350f}@media (prefers-color-scheme:dark){.ep{background:#3b2f12;color:#fde68a}}
</style>`);

// ---------- słowniki ----------
const MG = ['Gorączka i ból', 'Nos', 'Kaszel i gardło', 'Alergia', 'Brzuch', 'Skóra i rany', 'Oczy', 'Witaminy', 'Inne'];
const UNITS = ['ml', 'mg', 'krople', 'tabl.', 'czopek', 'saszetka', 'dawka', 'aplikacja', 'kapsułka'];
// Baza bez dawek – dawkę, odstęp i limit dobowy wpisuje rodzic z ulotki lub zalecenia lekarza.
const MEDS0 = [
  ['Ibum', 'ibuprofen', 'zawiesina', 'Gorączka i ból', 'ml'], ['Nurofen dla dzieci', 'ibuprofen', 'zawiesina', 'Gorączka i ból', 'ml'],
  ['Ibufen dla dzieci', 'ibuprofen', 'zawiesina', 'Gorączka i ból', 'ml'], ['Ibuprofen czopki', 'ibuprofen', 'czopki', 'Gorączka i ból', 'czopek'],
  ['Ibuprofen tabletki', 'ibuprofen', 'tabletki', 'Gorączka i ból', 'tabl.'],
  ['Panadol dla dzieci', 'paracetamol', 'zawiesina', 'Gorączka i ból', 'ml'], ['Pedicetamol', 'paracetamol', 'roztwór', 'Gorączka i ból', 'ml'],
  ['Paracetamol czopki', 'paracetamol', 'czopki', 'Gorączka i ból', 'czopek'], ['Paracetamol tabletki', 'paracetamol', 'tabletki', 'Gorączka i ból', 'tabl.'],
  ['Sól fizjologiczna', 'chlorek sodu 0,9%', 'ampułki', 'Nos', 'ml'], ['Woda morska spray', 'woda morska', 'aerozol', 'Nos', 'dawka'],
  ['Nasivin', 'oksymetazolina', 'krople / aerozol', 'Nos', 'dawka'], ['Otrivin', 'ksylometazolina', 'aerozol', 'Nos', 'dawka'],
  ['Prospan', 'wyciąg z liści bluszczu', 'syrop', 'Kaszel i gardło', 'ml'], ['Mucosolvan', 'ambroksol', 'syrop', 'Kaszel i gardło', 'ml'],
  ['Syrop prawoślazowy', 'prawoślaz', 'syrop', 'Kaszel i gardło', 'ml'], ['Tantum Verde', 'benzydamina', 'aerozol do gardła', 'Kaszel i gardło', 'dawka'],
  ['Inhalacja – sól fizjologiczna', 'chlorek sodu 0,9%', 'do nebulizacji', 'Kaszel i gardło', 'ml'],
  ['Zyrtec', 'cetyryzyna', 'krople', 'Alergia', 'krople'], ['Aerius', 'desloratadyna', 'roztwór', 'Alergia', 'ml'],
  ['Fenistil krople', 'dimetynden', 'krople', 'Alergia', 'krople'], ['Fenistil żel', 'dimetynden', 'żel', 'Alergia', 'aplikacja'],
  ['Elektrolity (ORS)', 'elektrolity', 'saszetki', 'Brzuch', 'saszetka'], ['Probiotyk', 'probiotyk', 'krople / kapsułki', 'Brzuch', 'dawka'],
  ['Espumisan', 'symetykon', 'krople', 'Brzuch', 'krople'], ['Smecta', 'diosmektyt', 'saszetki', 'Brzuch', 'saszetka'],
  ['Octenisept', 'oktenidyna', 'płyn', 'Skóra i rany', 'aplikacja'], ['Bepanthen', 'dekspantenol', 'maść', 'Skóra i rany', 'aplikacja'],
  ['Pantenol pianka', 'dekspantenol', 'pianka', 'Skóra i rany', 'aplikacja'], ['Alantan', 'alantoina', 'maść', 'Skóra i rany', 'aplikacja'],
  ['Altacet żel', 'octanowinian glinu', 'żel', 'Skóra i rany', 'aplikacja'], ['Sudocrem', 'tlenek cynku', 'krem', 'Skóra i rany', 'aplikacja'],
  ['Sól fizjologiczna do oczu', 'chlorek sodu 0,9%', 'ampułki', 'Oczy', 'krople'],
  ['Witamina D', 'cholekalcyferol', 'krople / kapsułki', 'Witaminy', 'dawka']
].map(a => ({ n: a[0], s: a[1], f: a[2], g: a[3], mu: a[4] }));
const INJ = ['Przecięcie', 'Otarcie', 'Siniak', 'Guz', 'Oparzenie', 'Ugryzienie / użądlenie', 'Kleszcz', 'Drzazga', 'Skręcenie', 'Podejrzenie złamania', 'Uderzenie', 'Inne'];
const SKIN = ['Pieprzyk / znamię', 'Wysypka', 'Krostka', 'Zaczerwienienie', 'Swędzenie', 'Plamka', 'Brodawka', 'Ugryzienie owada', 'Inne'];
const PAINT = ['kłujący', 'tępy', 'pulsujący', 'piekący', 'ściskający', 'kolka', 'promieniuje'];
const FACES = [[0, '😀'], [2, '🙂'], [4, '😐'], [6, '😟'], [8, '😣'], [10, '😭']];
const KINDS = { sym: ['Objaw', '🤒', '#f59e0b'], pain: ['Ból', '😣', '#dc2626'], inj: ['Uraz', '🩹', '#7c3aed'], skin: ['Skóra', '🔍', '#0891b2'] };
const AGAINST = ['Gruźlica (BCG)', 'WZW typu B', 'Rotawirusy', 'Błonica, tężec, krztusiec', 'Polio', 'Hib', 'Pneumokoki', 'Odra, świnka, różyczka', 'Ospa wietrzna', 'Meningokoki B', 'Meningokoki ACWY', 'Meningokoki C', 'Grypa', 'Kleszczowe zapalenie mózgu', 'WZW typu A', 'HPV', 'COVID-19'];
const DOCT = ['Wynik badania', 'Recepta', 'Skierowanie', 'Wypis ze szpitala', 'Zaświadczenie', 'Opis RTG / USG', 'Inne'];
const RSYM = {
  glowa: ['Ból głowy', 'Zawroty głowy', 'Guz', 'Uderzenie'], ucho: ['Ból ucha', 'Wyciek z ucha', 'Zatkane ucho', 'Swędzenie ucha'],
  oko: ['Zaczerwienienie oka', 'Ropna wydzielina', 'Łzawienie', 'Swędzenie oka', 'Jęczmień', 'Obrzęk powieki'],
  nos: ['Katar wodnisty', 'Katar gęsty', 'Zatkany nos', 'Krwawienie z nosa'], usta: ['Ból zęba', 'Ząbkowanie', 'Afty / pleśniawki', 'Opryszczka', 'Ból przy przełykaniu'],
  szyja: ['Ból gardła', 'Chrypka', 'Powiększone węzły chłonne', 'Sztywność karku'], kark: ['Ból karku', 'Sztywność karku'],
  klatka: ['Kaszel suchy', 'Kaszel mokry', 'Duszność', 'Świszczący oddech', 'Ból w klatce'], brzuch: ['Ból brzucha', 'Nudności', 'Wymioty', 'Biegunka', 'Zaparcie', 'Wzdęcia'],
  krocze: ['Odparzenie', 'Pieczenie przy siusianiu', 'Częste siusianie', 'Swędzenie'], posladki: ['Odparzenie', 'Swędzenie', 'Ból'],
  plecy: ['Ból pleców', 'Wysypka'], konczyna: ['Ból', 'Obrzęk', 'Utykanie', 'Ograniczony ruch', 'Zaczerwienienie'], og: SYMPTOMS
};
const rg = k => k ? ({ glowa: 'glowa', ucho: 'ucho', oko: 'oko', nos: 'nos', usta: 'usta', szyja: 'szyja', kark: 'kark', klatka: 'klatka', brzuch: 'brzuch', krocze: 'krocze', posladki: 'posladki', plecy: 'plecy' }[k.split('_')[0]] || 'konczyna') : 'og';

// ---------- sylwetka ----------
const C = (k, l, cx, cy, r) => [k, l, `<circle cx="${cx}" cy="${cy}" r="${r}"`];
const E = (k, l, cx, cy, rx, ry) => [k, l, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"`];
const R = (k, l, x, y, w, h, r) => [k, l, `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"`];
function limbs(front) {
  const L = front ? ['p', 'prawe', 'prawa', 'prawy'] : ['l', 'lewe', 'lewa', 'lewy'], P = front ? ['l', 'lewe', 'lewa', 'lewy'] : ['p', 'prawe', 'prawa', 'prawy'];
  const t = front ? '' : ' (tył)';
  return [[L, 0], [P, 1]].flatMap(([s, i]) => {
    const m = i ? x => 200 - x : x => x;
    return [
      R('ramie_' + s[0], 'Ramię ' + s[1] + t, i ? m(62) : 40, 102, 22, 56, 10), R('przed_' + s[0], 'Przedramię ' + s[1] + t, i ? m(56) : 36, 158, 20, 54, 9),
      C('dlon_' + s[0], 'Dłoń ' + s[2], m(45), 224, 12), R('udo_' + s[0], 'Udo ' + s[1] + t, i ? m(98) : 72, 226, 26, 72, 11),
      C('kolano_' + s[0], (front ? 'Kolano ' : 'Pod kolanem ') + s[1], m(85), 306, 11),
      R((front ? 'podudzie_' : 'lydka_') + s[0], (front ? 'Podudzie ' : 'Łydka ') + s[1], i ? m(96) : 74, 316, 22, 60, 10),
      E('stopa_' + s[0], 'Stopa ' + s[2], m(83), 388, 15, 9)
    ];
  });
}
const BODY = {
  f: [C('glowa', 'Głowa', 100, 50, 34), E('ucho_p', 'Ucho prawe', 63, 52, 7, 12), E('ucho_l', 'Ucho lewe', 137, 52, 7, 12), C('oko_p', 'Oko prawe', 87, 45, 6.5), C('oko_l', 'Oko lewe', 113, 45, 6.5),
  E('nos', 'Nos', 100, 58, 5, 7), E('usta', 'Usta / zęby', 100, 71, 10, 4.5), R('szyja', 'Szyja / gardło', 88, 82, 24, 18, 4), R('klatka', 'Klatka piersiowa', 64, 98, 72, 58, 14),
  R('brzuch', 'Brzuch', 66, 154, 68, 52, 10), R('krocze', 'Krocze / pieluszka', 72, 204, 56, 24, 10)].concat(limbs(true)),
  b: [C('glowa_t', 'Tył głowy', 100, 50, 34), E('ucho_l', 'Ucho lewe', 63, 52, 7, 12), E('ucho_p', 'Ucho prawe', 137, 52, 7, 12), R('kark', 'Kark', 88, 82, 24, 18, 4),
  R('plecy_g', 'Plecy (góra)', 64, 98, 72, 58, 14), R('plecy_d', 'Plecy (dół)', 66, 154, 68, 52, 10), R('posladki', 'Pośladki', 70, 204, 60, 26, 10)].concat(limbs(false))
};
let bodyView = 'f';
function bodySvg(child) {
  const k = byId('children', child) || {};
  const act = activeEntries(child).filter(e => e.region && (e.view || 'f') === bodyView);
  const marks = act.map(e => `<circle class="mk" data-e="${e.id}" cx="${e.x}" cy="${e.y}" r="6.5" fill="${KINDS[e.kind || 'sym'][2]}"/>`).join('');
  return `<div class="row" style="justify-content:center;gap:6px;margin-bottom:4px"><button class="chip${bodyView === 'f' ? ' on' : ''}" onclick="bodyView='f';render()">Przód</button><button class="chip${bodyView === 'b' ? ' on' : ''}" onclick="bodyView='b';render()">Tył</button></div>
  <svg class="body" viewBox="0 0 200 404" onclick="bodyTap(event,'${child}')">${bodyMarkup(k, bodyView, marks)}</svg>
  <div class="mut" style="text-align:center">Stuknij miejsce na ciele · ${bodyView === 'f' ? 'widok z przodu (prawa strona osoby po lewej)' : 'widok z tyłu'}</div>`;
}
function bodyTap(ev, child) {
  const t = ev.target;
  if (t.dataset.e) { openP({ t: 'entry', id: t.dataset.e }); return; }
  if (!t.dataset.r) return;
  const svg = ev.currentTarget, pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  entryDlg({ child, region: t.dataset.r, rl: t.dataset.l, x: Math.round(p.x), y: Math.round(p.y), view: bodyView });
}

// ---------- zgłoszenia (objaw / ból / uraz / skóra) ----------
const ents = child => live('symptoms').filter(s => s.child === child);
function activeEntries(child) {
  const lim = Date.now() - 3 * 864e5;
  return ents(child).filter(e => (e.kind || 'sym') === 'sym' ? toDate(e.dt).getTime() > lim && !e.healed : !e.healed).sort((a, b) => b.dt.localeCompare(a.dt));
}
function entryMain(e) {
  const k = e.kind || 'sym';
  if (k === 'pain') return 'Ból' + ((e.ptype || []).length ? ' ' + e.ptype.join(', ') : '') + (e.lvl !== '' && e.lvl != null ? ' · ' + e.lvl + '/10' : '');
  if (k === 'inj') return (e.inj || 'Uraz') + (e.size ? ' · ' + e.size : '');
  if (k === 'skin') return (e.skin || 'Zmiana skórna') + (e.size ? ' · ' + e.size : '') + (e.mon ? ' · obserwowane' : '');
  return symTxt(e) + (e.temp ? ' · ' + fmtN(e.temp) + '°C' : '');
}
function entryRow(e) {
  const n = live('files').filter(f => f.ref === e.id || (e.fu || []).some(u => u.id === f.ref)).length;
  return `<div class="it" onclick="openP({t:'entry',id:'${e.id}'})"><div style="font-size:22px">${KINDS[e.kind || 'sym'][1]}</div><div class="grow"><b>${esc(entryMain(e))}</b>${e.temp >= 38 ? ' <span class="tag red">gorączka</span>' : ''}<div class="mut">${esc([e.rl, fmtDT(e.dt)].filter(Boolean).join(' · '))}${n ? ' · 📷 ' + n : ''}${e.healed ? ' · wyleczone ' + esc(fmtD(e.healed)) : ''}</div></div></div>`;
}
let sessFiles = [];
function entryDlg(o) {
  const ex = o.id ? byId('symptoms', o.id) : null;
  const e = ex ? JSON.parse(JSON.stringify(ex)) : Object.assign({ id: uid(), dt: nowLocal(), kind: o.kind || 'sym', sym: [] }, o);
  sessFiles = [];
  const ep = activeEp(e.child);
  const h = `<h2>${esc(kidName(e.child))} · ${esc(e.rl || 'Ogólne')}</h2>
  <div class="chips" id="e_kind">${Object.entries(KINDS).map(([k, v]) => `<button type="button" class="chip${k === (e.kind || 'sym') ? ' on' : ''}" data-k="${k}">${v[1]} ${v[0]}</button>`).join('')}</div>
  <div id="e_sec"></div>
  <label>Kiedy<input id="e_dt" type="datetime-local" value="${esc(e.dt)}"></label>
  <label>Opis / uwagi<textarea id="e_note" rows="2">${esc(e.note || '')}</textarea></label>
  <div class="lab">Zdjęcia</div><div id="e_ph"></div><button type="button" class="b" id="e_add">📷 Dodaj zdjęcie</button>
  ${ex ? `<label class="row" style="margin:12px 0"><input type="checkbox" id="e_healed"${e.healed ? ' checked' : ''}> Wyleczone / minęło</label>` : ''}
  ${!ex && !ep ? `<label class="row" style="margin:12px 0"><input type="checkbox" id="e_ep"> Rozpocznij epizod choroby (zbiera objawy, leki i wizyty do raportu)</label>` : ''}
  <div class="btns" style="margin-top:14px">${ex ? '<button class="b danger" id="e_del">Usuń</button>' : ''}<span style="flex:1"></span><button class="b" id="e_cancel">Anuluj</button><button class="b pri" id="e_save">Zapisz</button></div>`;
  sheet(h);
  const sec = k => {
    const grp = RSYM[rg(e.region)], extra = (e.sym || []).filter(x => !grp.includes(x)).join(', ');
    const ch = (id, arr, sel, multi) => `<div class="chips" id="${id}" data-multi="${multi ? 1 : 0}">${arr.map(x => `<button type="button" class="chip${(Array.isArray(sel) ? sel.includes(x) : sel === x) ? ' on' : ''}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
    let s = '';
    if (k === 'sym') s = `<div class="lab">Objawy</div>${ch('e_sym', grp, e.sym || [], 1)}<input id="e_symx" placeholder="inne (po przecinku)" value="${esc(extra)}"><label>Temperatura (°C)<input id="e_temp" inputmode="decimal" value="${esc(fmtN(e.temp))}"></label><label>Nasilenie<select id="e_sev">${opt([['', '—'], 'łagodne', 'umiarkowane', 'silne'], e.sev || '')}</select></label>`;
    if (k === 'pain') s = `<div class="lab">Jaki ból</div>${ch('e_ptype', PAINT, e.ptype || [], 1)}<div class="lab">Jak mocno (dziecko pokazuje buzię)</div><div class="chips faces" id="e_lvl" data-multi="0">${FACES.map(([v, f]) => `<button type="button" class="chip${String(e.lvl) === String(v) ? ' on' : ''}" data-v="${v}">${f} ${v}</button>`).join('')}</div><label>Jak często<select id="e_freq">${opt([['', '—'], 'stały', 'co jakiś czas', 'przy ruchu / dotyku', 'w nocy', 'po jedzeniu'], e.freq || '')}</select></label>`;
    if (k === 'inj') s = `<div class="lab">Rodzaj urazu</div>${ch('e_inj', INJ, e.inj || '', 0)}<label>Jak do tego doszło<input id="e_how" value="${esc(e.how || '')}"></label><label>Co zrobiono (opatrunek, chłodzenie…)<input id="e_done" value="${esc(e.done || '')}"></label><label>Wielkość<input id="e_size" placeholder="np. 2 cm" value="${esc(e.size || '')}"></label>`;
    if (k === 'skin') s = `<div class="lab">Rodzaj</div>${ch('e_skin', SKIN, e.skin || '', 0)}<label>Wielkość<input id="e_size" placeholder="np. 4 mm" value="${esc(e.size || '')}"></label><label>Kolor / wygląd<input id="e_color" value="${esc(e.color || '')}"></label><label class="row" style="margin:10px 0"><input type="checkbox" id="e_chg"${e.chg ? ' checked' : ''}> Zmienia się (kształt, kolor, wielkość)</label><label class="row"><input type="checkbox" id="e_mon"${e.mon ? ' checked' : ''}> Obserwuj (kontrole ze zdjęciem)</label>`;
    $('#e_sec').innerHTML = s;
  };
  sec(e.kind || 'sym');
  const ph = () => { $('#e_ph').innerHTML = thumbs(e.id, true); };
  ph();
  $('#e_kind').onclick = ev => { const c = ev.target.closest('.chip'); if (!c) return; $$('#e_kind .chip').forEach(x => x.classList.toggle('on', x === c)); e.kind = c.dataset.k; sec(e.kind); };
  $('#e_add').onclick = () => addFiles(e.id, e.child, 'image/*', ids => { sessFiles.push(...ids); ph(); });
  $('#e_cancel').onclick = () => { sessFiles.forEach(id => dropFile(id)); closeSheet(); render(); };
  if (ex) $('#e_del').onclick = () => { if (!confirm('Usunąć wpis razem ze zdjęciami?')) return; live('files').filter(f => f.ref === e.id || (e.fu || []).some(u => u.id === f.ref)).forEach(f => dropFile(f.id)); del('symptoms', e.id); closeSheet(); if (pages.length && pages[pages.length - 1].t === 'entry') pages.pop(); render(); };
  $('#e_save').onclick = () => {
    const on = id => $$('#' + id + ' .chip.on').map(x => x.dataset.v);
    const v = id => ($('#' + id) || {}).value || '';
    const k = e.kind || 'sym';
    const r = Object.assign(ex || {}, { id: e.id, child: e.child, region: e.region || '', rl: e.rl || '', x: e.x, y: e.y, view: e.view || 'f', kind: k, dt: v('e_dt') || nowLocal(), note: v('e_note').trim() });
    if (k === 'sym') { r.sym = on('e_sym').concat(v('e_symx').split(',').map(x => x.trim()).filter(Boolean)); r.temp = num(v('e_temp')); r.sev = v('e_sev'); if (!r.sym.length && r.temp === '') { toast('Wybierz objaw albo wpisz temperaturę'); return; } if (!r.sym.length) r.sym = ['Pomiar temperatury']; }
    if (k === 'pain') { r.ptype = on('e_ptype'); const l = on('e_lvl')[0]; r.lvl = l == null ? '' : +l; r.freq = v('e_freq'); }
    if (k === 'inj') { r.inj = on('e_inj')[0] || 'Inne'; r.how = v('e_how'); r.done = v('e_done'); r.size = v('e_size'); }
    if (k === 'skin') { r.skin = on('e_skin')[0] || 'Inne'; r.size = v('e_size'); r.color = v('e_color'); r.chg = $('#e_chg').checked ? 1 : 0; r.mon = $('#e_mon').checked ? 1 : 0; }
    if (ex) r.healed = $('#e_healed').checked ? (r.healed || today()) : '';
    if ($('#e_ep') && $('#e_ep').checked) put('episodes', { child: r.child, name: (r.sym && r.sym[0]) || entryMain(r), start: r.dt, end: '' });
    put('symptoms', r); closeSheet(); render(); toast('Zapisano');
  };
}
function pEntry(id) {
  const e = byId('symptoms', id); if (!e || e.del) { pages.pop(); setTimeout(render, 0); return ''; }
  const k = e.kind || 'sym', row = (l, v) => v ? `<b>${l}</b><span>${esc(v)}</span>` : '';
  let h = `<div class="card"><div class="row"><div style="font-size:34px">${KINDS[k][1]}</div><div class="grow"><div class="big">${esc(entryMain(e))}</div><div class="mut">${esc(kidName(e.child))} · ${esc(e.rl || 'ogólne')} · ${esc(fmtDT(e.dt))}</div></div><button class="b sm" onclick="entryDlg({id:'${id}'})">Edytuj</button></div>
  <div class="kv" style="margin-top:8px">${row('Jak doszło', e.how)}${row('Co zrobiono', e.done)}${row('Kolor', e.color)}${row('Jak często', e.freq)}${row('Nasilenie', e.sev)}${row('Podano', e.given)}${e.chg ? '<b>Uwaga</b><span>zmienia się</span>' : ''}${row('Uwagi', e.note)}${row('Wyleczone', e.healed && fmtD(e.healed))}</div>${thumbs(id)}</div>`;
  h += `<div class="card"><div class="row"><h2 style="flex:1">Kontrole</h2><button class="b sm pri" onclick="fuDlg('${id}')">＋ Kontrola</button></div>`;
  const fu = (e.fu || []).slice().sort((a, b) => b.dt.localeCompare(a.dt));
  h += fu.length ? fu.map(u => `<div class="it" style="display:block"><b>${esc(fmtDT(u.dt))}</b> ${esc(u.t || '')}${thumbs(u.id)}</div>`).join('') : `<div class="mut">${k === 'skin' ? 'Rób zdjęcie co jakiś czas w tym samym świetle – łatwo porównać zmiany.' : 'Dopisuj, jak się goi albo jak się zmienia.'}</div>`;
  h += '</div>';
  if (!e.healed && k !== 'sym') h += `<div class="btns"><button class="b" onclick="healEntry('${id}')">✓ Wyleczone</button></div>`;
  return h;
}
function healEntry(id) { const e = byId('symptoms', id); e.healed = today(); put('symptoms', e); render(); }
function fuDlg(id) {
  const e = byId('symptoms', id), u = { id: uid(), dt: nowLocal(), t: '' }; sessFiles = [];
  sheet(`<h2>Kontrola</h2><label>Kiedy<input id="u_dt" type="datetime-local" value="${u.dt}"></label><label>Jak wygląda / co się zmieniło<textarea id="u_t" rows="3"></textarea></label><div id="u_ph"></div><button class="b" id="u_add">📷 Dodaj zdjęcie</button><div class="btns" style="margin-top:14px"><span style="flex:1"></span><button class="b" id="u_c">Anuluj</button><button class="b pri" id="u_s">Zapisz</button></div>`);
  $('#u_add').onclick = () => addFiles(u.id, e.child, 'image/*', ids => { sessFiles.push(...ids); $('#u_ph').innerHTML = thumbs(u.id, true); });
  $('#u_c').onclick = () => { sessFiles.forEach(dropFile); closeSheet(); };
  $('#u_s').onclick = () => { u.dt = $('#u_dt').value || nowLocal(); u.t = $('#u_t').value.trim(); e.fu = (e.fu || []).concat([u]); put('symptoms', e); closeSheet(); render(); };
}
// stara funkcja „＋ Objaw” – teraz ogólne zgłoszenie
function editSym(id, child) {
  if (id) { openP({ t: 'entry', id }); return; }
  const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const cur = pages.length && pages[pages.length - 1].t === 'child' ? pages[pages.length - 1].id : null;
  entryDlg({ child: child || cur || ks[0].id, region: '', rl: 'Ogólne' });
}

// ---------- pliki i zdjęcia (Dysk Google przez skrypt) ----------
const BLOBS = {};
const FQ = new Set(ST.get('fileq', []));
const saveQ = () => ST.set('fileq', [...FQ]);
function blobSet(id, d) { BLOBS[id] = d; try { if (N) N.save('blob_' + id, JSON.stringify(d)); else localStorage.setItem('rd_blob_' + id, d); } catch (e) { } }
function blobGet(id) { if (BLOBS[id]) return BLOBS[id]; try { if (N) { const v = N.load('blob_' + id); return v ? JSON.parse(v) : null; } return localStorage.getItem('rd_blob_' + id); } catch (e) { return null; } }
function blobDel(id) { delete BLOBS[id]; try { if (N) N.save('blob_' + id, 'null'); else localStorage.removeItem('rd_blob_' + id); } catch (e) { } }
function pickFiles(accept, multi) {
  return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; if (multi) i.multiple = true; i.style.display = 'none'; i.onchange = () => { res([...i.files]); i.remove(); }; document.body.appendChild(i); i.click(); });
}
const readURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
async function imgPrep(f) {
  const url = await readURL(f);
  const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const sc = m => { const k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c; };
  return { full: sc(1600).toDataURL('image/jpeg', 0.82), th: sc(200).toDataURL('image/jpeg', 0.6) };
}
async function addFiles(ref, child, accept, after) {
  const fs = await pickFiles(accept || 'image/*', true), ids = [];
  for (const f of fs) {
    let d, th = '', mime = f.type || 'application/octet-stream';
    try {
      if (mime.startsWith('image/')) { const p = await imgPrep(f); d = p.full; th = p.th; mime = 'image/jpeg'; }
      else { if (f.size > 15e6) { toast('Plik za duży (max 15 MB)'); continue; } d = await readURL(f); }
    } catch (e) { toast('Nie udało się wczytać pliku'); continue; }
    const m = put('files', { ref, child, mime, name: f.name || 'plik', th, dt: nowLocal(), fid: '' });
    blobSet(m.id, d); FQ.add(m.id); ids.push(m.id);
  }
  saveQ(); uploadFiles(); if (after) after(ids);
}
let upBusy = false;
async function uploadFiles() {
  if (upBusy || !S.url || !S.key || !FQ.size) return; upBusy = true;
  try {
    for (const id of [...FQ]) {
      const m = byId('files', id), d = blobGet(id);
      if (!m || m.del || !d) { FQ.delete(id); continue; }
      const r = await post(S.url, { key: S.key, action: 'upload', id, mime: m.mime, name: m.name, data: d.split(',')[1] });
      if (!r || !r.ok) break;
      m.fid = r.fid; put('files', m); FQ.delete(id); if (!N) { BLOBS[id] = d; blobDel(id); BLOBS[id] = d; }
    }
  } finally { upBusy = false; saveQ(); }
}
function thumbs(ref, edit) {
  const fs = live('files').filter(f => f.ref === ref); if (!fs.length) return '';
  return `<div class="ths">${fs.map(f => `<div class="th"${edit ? '' : ` onclick="showFile('${f.id}')"`}>${f.th ? `<img src="${f.th}" alt="">` : `<span>📄<br>${esc((f.name || '').slice(0, 14))}</span>`}${!f.fid ? '<i title="czeka na wysłanie">⏳</i>' : ''}${edit ? `<button class="x" onclick="event.stopPropagation();dropFile('${f.id}');this.parentElement.remove()">✕</button>` : ''}</div>`).join('')}</div>`;
}
async function fileData(m) {
  let d = blobGet(m.id); if (d) return d;
  if (!m.fid || !S.url) return null;
  toast('Pobieram…');
  const r = await post(S.url, { key: S.key, action: 'file', fid: m.fid });
  if (!r || !r.ok) { toast('Nie udało się pobrać: ' + ((r && r.err) || '')); return null; }
  d = 'data:' + r.mime + ';base64,' + r.data; if (N) blobSet(m.id, d); else BLOBS[m.id] = d; return d;
}
async function showFile(id) {
  const m = byId('files', id); if (!m) return;
  const d = await fileData(m);
  if (!d) { if (!m.fid) toast('Plik jeszcze się nie wysłał z telefonu, który go dodał'); return; }
  if (m.mime.startsWith('image/')) sheet(`<img src="${d}" style="width:100%;border-radius:12px" alt=""><div class="mut">${esc(fmtDT(m.dt))}</div><div class="btns"><button class="b danger" onclick="if(confirm('Usunąć zdjęcie?')){dropFile('${id}');closeSheet();render()}">Usuń</button><span style="flex:1"></span><button class="b" onclick="closeSheet()">Zamknij</button></div>`);
  else openData(d, m.mime, m.name);
}
function openData(d, mime, name) {
  if (N && N.openData) { N.openData(d.split(',')[1], mime, name || 'plik'); return; }
  const b = atob(d.split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([u], { type: mime })); a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
}
function dropFile(id) { const m = byId('files', id); if (!m) return; if (m.fid && S.url) post(S.url, { key: S.key, action: 'trash', fid: m.fid }); blobDel(id); FQ.delete(id); saveQ(); del('files', id); }

// ---------- leki: baza ----------
function medsAll() {
  const m = {};
  MEDS0.forEach(x => m[x.n.toLowerCase()] = Object.assign({ builtin: 1 }, x));
  live('meds').forEach(x => { const k = x.n.toLowerCase(); if (x.hide) { delete m[k]; return; } m[k] = Object.assign({}, m[k] || {}, x, { rec: x.id }); });
  return Object.values(m).sort((a, b) => ((MG.indexOf(a.g) + 99) % 99 - (MG.indexOf(b.g) + 99) % 99) || a.n.localeCompare(b.n, 'pl'));
}
const medBy = n => medsAll().find(m => m.n.toLowerCase() === String(n || '').toLowerCase());
const subOf = d => String(d.sub || (medBy(d.med) || {}).s || d.med || '').toLowerCase();
function medEdit(name) {
  const m = name ? medBy(name) : { g: 'Inne', mu: 'ml' };
  form(name ? m.n : 'Nowy lek', [
    { k: 'n', l: 'Nazwa', req: 1 }, { k: 's', l: 'Substancja czynna (te same substancje liczą się razem)' }, { k: 'f', l: 'Postać' },
    { k: 'g', l: 'Grupa', t: 'sel', o: MG }, { k: 'conc', l: 'Stężenie (z opakowania)', ph: 'np. 100 mg / 5 ml' }, { k: 'mu', l: 'Jednostka dawki', t: 'sel', o: UNITS },
    { k: 'gap', l: 'Minimalny odstęp między dawkami (h) – z ulotki / od lekarza', t: 'number' }, { k: 'max', l: 'Maks. dawek na dobę – z ulotki / od lekarza', t: 'number' },
    { k: 'note', l: 'Uwagi (np. dawka zalecona przez lekarza dla którego dziecka)', t: 'area', r: 2 }
  ], m, v => {
    const ex = live('meds').find(x => x.n.toLowerCase() === (name || v.n).toLowerCase());
    if (name && v.n.toLowerCase() !== name.toLowerCase()) { if (ex) { ex.hide = 1; put('meds', ex); } else if (m.builtin) put('meds', { n: name, hide: 1 }); }
    const e2 = live('meds').find(x => x.n.toLowerCase() === v.n.toLowerCase());
    put('meds', Object.assign(e2 || {}, v, { hide: 0 }));
  }, name ? { del: () => { const ex = live('meds').find(x => x.n.toLowerCase() === name.toLowerCase()); if (ex) { ex.hide = 1; put('meds', ex); } else put('meds', { n: name, hide: 1 }); }, delMsg: 'Usunąć lek z bazy? Historia podań zostanie.' } : {});
}
function pMedBase() {
  const all = medsAll(); let g = '', h = `<div class="btns"><button class="b pri" onclick="medEdit()">＋ Własny lek</button></div><div class="card" style="font-size:14px">Baza zawiera nazwy i postacie leków, bez dawek. Dawkę, odstęp i limit dobowy wpisz przy leku z ulotki albo od lekarza – wtedy aplikacja ostrzeże przy zbyt wczesnym podaniu.</div><div class="card list">`;
  all.forEach(m => { if (m.g !== g) { g = m.g; h += `<div class="grp">${esc(g || 'Inne')}</div>`; } h += `<div class="it" onclick="medEdit(${esc(JSON.stringify(m.n))})"><div class="grow"><b>${esc(m.n)}</b>${m.builtin ? '' : ' <span class="tag">własny</span>'}<div class="mut">${esc([m.s, m.f, m.conc].filter(Boolean).join(' · '))}</div></div>${m.gap ? `<span class="tag grn">co ${fmtN(m.gap)} h</span>` : ''}</div>`; });
  return h + '</div>';
}

// ---------- leki: podania ----------
const ago = h => h < 1 ? Math.max(0, Math.round(h * 60)) + ' min' : Math.floor(h) + ' h ' + Math.round((h % 1) * 60) + ' min';
const fmtAmt = d => `${fmtN(d.amt)} ${d.unit || ''} ${d.med}`.trim();
function doseInfo(child, med, dtStr, exceptId) {
  if (!child || !med) return { bad: false, html: '' };
  const m0 = medBy(med) || {}, sub = String(m0.s || med).toLowerCase(), t = toDate(dtStr).getTime();
  // odstęp i limit: z tego leku albo z innego leku z tą samą substancją
  const same = medsAll().filter(x => String(x.s || x.n).toLowerCase() === sub);
  const m = Object.assign({}, m0, { gap: m0.gap || Math.max(0, ...same.map(x => +x.gap || 0)) || '', max: m0.max || Math.min(...same.map(x => +x.max || 99)) });
  if (m.max === 99) m.max = '';
  const prev = live('doses').filter(d => d.child === child && d.id !== exceptId && subOf(d) === sub).map(d => ({ d, t: toDate(d.dt).getTime() })).filter(x => x.t <= t).sort((a, b) => b.t - a.t);
  const last = prev[0], n24 = prev.filter(x => t - x.t < 864e5).length + 1, L = []; let bad = false;
  if (last) {
    const h = (t - last.t) / 36e5;
    L.push(`Ostatnio (${esc(m.s || med)}): ${esc(fmtAmt(last.d))}, ${esc(fmtDT(last.d.dt))} – ${ago(h)} wcześniej.`);
    if (m.gap && h < m.gap) { bad = true; L.push(`⚠️ Krócej niż ustawiony odstęp ${fmtN(m.gap)} h. Następna dawka od ${esc(fmtDT(msToLocal(last.t + m.gap * 36e5)))}.`); }
  } else L.push(`Brak wcześniejszych podań (${esc(m.s || med)}) u tego dziecka.`);
  if (m.max) { L.push(`To będzie dawka nr ${n24} w ciągu 24 h (ustawiony limit: ${m.max}).`); if (n24 > m.max) { bad = true; L[L.length - 1] = '⚠️ ' + L[L.length - 1]; } }
  else if (!m.gap) L.push('<span class="mut">Wpisz przy leku odstęp i limit z ulotki – aplikacja będzie pilnować.</span>');
  return { bad, html: L.join('<br>') };
}
function doseDlg(o) {
  o = o || {}; const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const ex = o.id ? byId('doses', o.id) : null;
  const d = ex ? Object.assign({}, ex) : Object.assign({ child: o.child || ks[0].id, med: o.med || '', amt: o.amt ?? '', unit: o.unit || '', dt: nowLocal(), why: o.why || '' }, {});
  const ms = medsAll(); let g = '';
  const medOpts = '<option value="">— wybierz lek —</option>' + ms.map(m => { const s = (m.g !== g ? (g ? '</optgroup>' : '') + `<optgroup label="${esc(m.g)}">` : '') + `<option value="${esc(m.n)}"${m.n === d.med ? ' selected' : ''}>${esc(m.n)}${m.conc ? ' (' + esc(m.conc) + ')' : ''}</option>`; g = m.g; return s; }).join('') + '</optgroup><option value="__new">＋ Inny lek…</option>';
  sheet(`<h2>${ex ? 'Podanie leku' : '💊 Podaj lek'}</h2>
  <label>Kto<select id="d_child">${opt(ks.map(k => [k.id, k.name]), d.child)}</select></label>
  <label>Lek<select id="d_med">${medOpts}</select></label><input id="d_new" placeholder="Nazwa nowego leku" style="display:none">
  <div class="grid2"><label>Dawka<input id="d_amt" inputmode="decimal" value="${esc(fmtN(d.amt))}" placeholder="np. 2,5"></label><label>Jednostka<select id="d_unit">${opt(UNITS, d.unit || 'ml')}</select></label></div>
  <label>Kiedy<input id="d_dt" type="datetime-local" value="${esc(d.dt)}"></label>
  <div class="lab">Powód</div><div class="chips" id="d_whyc" data-multi="0">${['gorączka', 'ból', 'kaszel', 'katar', 'alergia', 'zalecenie lekarza'].map(x => `<button type="button" class="chip${d.why === x ? ' on' : ''}" data-v="${x}">${x}</button>`).join('')}</div>
  <input id="d_why" placeholder="np. gorączka 38,9" value="${esc(d.why || '')}">
  <div id="d_warn" class="warn"></div>
  <div class="btns" style="margin-top:12px">${ex ? '<button class="b danger" id="d_del">Usuń</button>' : ''}<span style="flex:1"></span><button class="b" onclick="closeSheet()">Anuluj</button><button class="b pri" id="d_save">Zapisz</button></div>`);
  const med = () => $('#d_med').value === '__new' ? $('#d_new').value.trim() : $('#d_med').value;
  const upd = () => { const w = doseInfo($('#d_child').value, med(), $('#d_dt').value || nowLocal(), d.id); $('#d_warn').innerHTML = w.html || 'Wybierz lek.'; $('#d_warn').classList.toggle('bad', w.bad); return w; };
  const fill = () => {
    $('#d_new').style.display = $('#d_med').value === '__new' ? 'block' : 'none';
    const m = medBy(med()); if (m && m.mu && !ex) $('#d_unit').value = m.mu;
    const last = live('doses').filter(x => x.child === $('#d_child').value && x.med === med()).sort((a, b) => b.dt.localeCompare(a.dt))[0];
    if (last && !ex && !$('#d_amt').value) { $('#d_amt').value = fmtN(last.amt); $('#d_unit').value = last.unit; }
    upd();
  };
  $('#d_med').onchange = () => { if (!ex) $('#d_amt').value = ''; fill(); };
  $('#d_child').onchange = () => { if (!ex) $('#d_amt').value = ''; fill(); };
  $('#d_new').oninput = upd; $('#d_dt').onchange = upd;
  $('#d_whyc').onclick = ev => { const c = ev.target.closest('.chip'); if (c) setTimeout(() => { $('#d_why').value = c.classList.contains('on') ? c.dataset.v : ''; }, 0); };
  fill();
  if (ex) $('#d_del').onclick = () => { if (!confirm('Usunąć podanie?')) return; del('doses', ex.id); closeSheet(); render(); };
  $('#d_save').onclick = () => {
    const name = med(); if (!name) { toast('Wybierz lek'); return; }
    const amt = num($('#d_amt').value); if (amt === '') { toast('Wpisz dawkę'); return; }
    const w = upd(); if (w.bad && !confirm('Uwaga: ' + $('#d_warn').innerText + '\n\nZapisać mimo to?')) return;
    if (!medBy(name)) put('meds', { n: name, s: '', f: '', g: 'Inne', mu: $('#d_unit').value });
    const r = Object.assign(ex || {}, { child: $('#d_child').value, med: name, sub: String((medBy(name) || {}).s || name).toLowerCase(), amt, unit: $('#d_unit').value, dt: $('#d_dt').value || nowLocal(), why: $('#d_why').value.trim() });
    put('doses', r); closeSheet(); render(); toast('Zapisano podanie');
  };
}
function doseRow(d, withKid) {
  const m = medBy(d.med) || {}, next = m.gap ? toDate(d.dt).getTime() + m.gap * 36e5 : 0, h = (Date.now() - toDate(d.dt).getTime()) / 36e5;
  const k = byId('children', d.child) || {};
  return `<div class="it">${withKid ? avatar(k, 32) : ''}<div class="grow" onclick="doseDlg({id:'${d.id}'})"><b>${esc(fmtAmt(d))}</b>${withKid ? ' · ' + esc(k.name || '') : ''}<div class="mut">${esc(fmtDT(d.dt))}${h >= 0 && h < 48 ? ' · ' + ago(h) + ' temu' : ''}${d.why ? ' · ' + esc(d.why) : ''}${next > Date.now() ? ' · następna od ' + esc(fmtDT(msToLocal(next)).split(', ').pop()) : ''}</div></div><button class="b sm" title="Podaj ponownie" onclick="doseDlg({child:'${d.child}',med:${esc(JSON.stringify(d.med))},amt:${esc(JSON.stringify(d.amt))},unit:${esc(JSON.stringify(d.unit || ''))},why:${esc(JSON.stringify(d.why || ''))}})">↻</button></div>`;
}
let doseF = '*';
function pDoses() {
  const ks = kids(); const ds = live('doses').filter(d => doseF === '*' || d.child === doseF).sort((a, b) => b.dt.localeCompare(a.dt));
  let h = `<div class="chips"><button class="chip${doseF === '*' ? ' on' : ''}" onclick="doseF='*';render()">Wszystkie</button>${ks.map(k => `<button class="chip${doseF === k.id ? ' on' : ''}" onclick="doseF='${k.id}';render()">${esc(k.name)}</button>`).join('')}</div><div class="card list">`;
  let day = '';
  ds.slice(0, 200).forEach(d => { const dd = d.dt.slice(0, 10); if (dd !== day) { day = dd; h += `<div class="grp">${esc(fmtD(dd))}</div>`; } h += doseRow(d, true); });
  return h + (ds.length ? '' : '<div class="empty">Brak podań.</div>') + '</div>';
}

// ---------- kursy leków ----------
function slots(c) {
  const times = (c.times || []).slice().sort(), need = Math.max(1, +c.days || 1) * times.length, out = [];
  if (!times.length) return out;
  const d = toDate((c.start || nowLocal()).slice(0, 10)); let guard = 0;
  while (out.length < need && guard++ < 400) {
    const day = dstr(d);
    times.forEach(t => { const k = day + 'T' + t; if (out.length < need && k >= (c.start || '').slice(0, 16)) out.push(k); });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
const courseActive = c => !c.stop && slots(c).some(k => !(c.done || {})[k] && toDate(k).getTime() > Date.now() - 12 * 36e5);
function courseDlg(id, child) {
  const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const c = id ? byId('courses', id) : { child: child || ks[0].id, start: nowLocal(), days: 7, times: ['08:00', '20:00'], unit: 'ml', done: {} };
  const val = Object.assign({}, c, { times: (c.times || []).join(', ') });
  form(id ? 'Kurs leku' : 'Nowy kurs leku', [
    { k: 'child', l: 'Kto', t: 'sel', o: ks.map(k => [k.id, k.name]) }, { k: 'med', l: 'Lek', req: 1, list: medsAll().map(m => m.n) },
    { k: 'amt', l: 'Dawka (wg zalecenia lekarza)', t: 'number', req: 1 }, { k: 'unit', l: 'Jednostka', t: 'sel', o: UNITS },
    { k: 'times', l: 'Godziny podania (po przecinku)', ph: '08:00, 20:00', req: 1 }, { k: 'start', l: 'Początek kursu', t: 'datetime-local', req: 1 },
    { k: 'days', l: 'Ile dni', t: 'number', req: 1 }, { k: 'note', l: 'Uwagi (np. po jedzeniu, przechowywać w lodówce)', t: 'area', r: 2 }
  ], val, v => {
    const times = v.times.split(/[,; ]+/).map(x => x.trim().replace('.', ':')).filter(Boolean).map(x => { const [h, m] = x.split(':'); return pad(+h % 24) + ':' + pad(+(m || 0)); });
    if (!times.length) { toast('Wpisz godziny'); return false; }
    const r = put('courses', Object.assign(c, v, { times, days: Math.max(1, Math.round(+v.days || 1)), done: c.done || {} }));
    if (N && N.notifPerm) N.notifPerm();
    if (!id) setTimeout(() => openP({ t: 'course', id: r.id }), 0);
  }, id ? { del: () => del('courses', id), delMsg: 'Usunąć kurs? Zapisane podania zostaną w historii.' } : {});
}
function slotTog(cid, k) {
  const c = byId('courses', cid); c.done = c.done || {};
  if (c.done[k]) { const d = byId('doses', c.done[k]); if (d) del('doses', d.id); delete c.done[k]; }
  else {
    const st = toDate(k).getTime(), dt = Math.abs(Date.now() - st) < 3 * 36e5 ? nowLocal() : k;
    const d = put('doses', { child: c.child, med: c.med, sub: String((medBy(c.med) || {}).s || c.med).toLowerCase(), amt: c.amt, unit: c.unit, dt, why: 'kurs', course: cid });
    c.done[k] = d.id;
  }
  put('courses', c); render();
}
function pCourse(id) {
  const c = byId('courses', id); if (!c || c.del) { pages.pop(); setTimeout(render, 0); return ''; }
  const sl = slots(c), dn = sl.filter(k => (c.done || {})[k]).length, now = Date.now();
  let h = `<div class="card"><div class="row"><div class="grow"><div class="big">${esc(c.med)} · ${esc(fmtN(c.amt))} ${esc(c.unit)}</div><div class="mut">${esc(kidName(c.child))} · ${esc((c.times || []).join(', '))} · ${c.days} dni${c.stop ? ' · zakończony ' + esc(fmtD(c.stop)) : ''}</div>${c.note ? `<div class="mut">${esc(c.note)}</div>` : ''}</div><button class="b sm" onclick="courseDlg('${id}')">Edytuj</button></div>
  <div class="bar" style="margin-top:10px"><i style="width:${sl.length ? dn / sl.length * 100 : 0}%"></i></div><div class="mut">Podano ${dn} z ${sl.length}</div></div><div class="card">`;
  let day = '';
  sl.forEach(k => {
    const dd = k.slice(0, 10); if (dd !== day) { h += (day ? '</div>' : '') + `<div class="grp">${esc(fmtD(dd))}</div><div class="chips">`; day = dd; }
    const ok = (c.done || {})[k], miss = !ok && toDate(k).getTime() < now - 36e5;
    h += `<button class="slot${ok ? ' ok' : miss ? ' miss' : ''}" onclick="slotTog('${id}','${k}')">${ok ? '✓' : miss ? '!' : '○'} ${k.slice(11)}</button>`;
  });
  h += (day ? '</div>' : '') + '</div><div class="btns">';
  h += N ? '<span class="mut">Przypomnienia: powiadomienie na telefonie o każdej godzinie.</span>' : `<button class="b" onclick="courseIcs('${id}')">⏰ Przypomnienia do kalendarza (.ics)</button>`;
  if (!c.stop) h += `<button class="b" onclick="if(confirm('Zakończyć kurs wcześniej?')){const c=byId('courses','${id}');c.stop=today();put('courses',c);render()}">Zakończ wcześniej</button>`;
  return h + '</div>';
}
function icsFile(name, evs) {
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), e = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alan Solutions//AS Rodzina//PL'];
  evs.forEach(v => { L.push('BEGIN:VEVENT', 'UID:' + v.uid + '@as-rodzina', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(v.s), 'DTEND:' + z(v.e), 'SUMMARY:' + e(v.t), 'DESCRIPTION:' + e(v.d || '')); if (v.a != null) L.push('BEGIN:VALARM', 'TRIGGER:-PT' + v.a + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(v.t), 'END:VALARM'); L.push('END:VEVENT'); });
  L.push('END:VCALENDAR');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/calendar' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function courseIcs(id) {
  const c = byId('courses', id), now = Date.now();
  icsFile('kurs.ics', slots(c).filter(k => !(c.done || {})[k] && toDate(k).getTime() > now).map(k => { const s = toDate(k); return { uid: id + k.replace(/\W/g, ''), s, e: new Date(s.getTime() + 10 * 60000), t: '💊 ' + kidName(c.child) + ': ' + c.med + ' ' + fmtN(c.amt) + ' ' + c.unit, d: c.note || '', a: 0 }; }));
}
function reAlarms() {
  if (!N || !N.setAlarms) return;
  const now = Date.now(), L = [];
  live('courses').filter(c => !c.stop).forEach(c => slots(c).forEach(k => { const t = toDate(k).getTime(); if (!(c.done || {})[k] && t > now && t < now + 7 * 864e5) L.push({ id: c.id + k, t, ti: '💊 ' + kidName(c.child), tx: c.med + ' ' + fmtN(c.amt) + ' ' + c.unit + ' (kurs)' }); }));
  live('vaccines').filter(v => v.next && !v.nextDone).forEach(v => { const t = toDate(v.next + 'T09:00').getTime(); if (t > now && t < now + 60 * 864e5) L.push({ id: 'v' + v.id, t, ti: '💉 Szczepienie', tx: kidName(v.child) + ': ' + (v.vac || (v.against || []).join(', ')) }); });
  L.sort((a, b) => a.t - b.t);
  try { N.setAlarms(JSON.stringify(L.slice(0, 60))); } catch (e) { }
}

// ---------- apteczka ----------
const STQ = ['pełne', 'połowa', 'mało', 'brak'];
function stockEdit(id) {
  const s = id ? byId('stock', id) : { qty: 'pełne' };
  form(id ? s.name : 'Do apteczki', [{ k: 'name', l: 'Co', req: 1, list: medsAll().map(m => m.n).concat(['Plastry', 'Bandaż', 'Gaziki', 'Termometr', 'Inhalator', 'Aspirator do nosa']) }, { k: 'exp', l: 'Data ważności', t: 'date' }, { k: 'qty', l: 'Ile zostało', t: 'sel', o: STQ }, { k: 'where', l: 'Gdzie leży', ph: 'np. szafka w kuchni' }, { k: 'note', l: 'Uwagi', ph: 'np. po otwarciu ważny 6 mies.' }],
    s, v => { const r = put('stock', Object.assign(s, v)); if ((v.qty === 'mało' || v.qty === 'brak') && confirm('Dodać „' + v.name + '” do listy zakupów (Apteka)?')) toShop(r.id); },
    id ? { del: () => del('stock', id) } : {});
}
function toShop(id) {
  const s = byId('stock', id);
  if (live('shop').some(x => !x.done && x.name.toLowerCase() === s.name.toLowerCase())) { toast('Już jest na liście zakupów'); return; }
  put('shop', { name: s.name, qty: '', shop: 'Apteka', cat: 'Apteka', done: 0 }); toast('Dodano do zakupów: ' + s.name);
}
function stockStat(s) { if (!s.exp) return ['', 9e15]; const d = (toDate(s.exp).getTime() - Date.now()) / 864e5; return d < 0 ? ['<span class="tag red">przeterminowane</span>', d] : d < 30 ? [`<span class="tag yel">ważne ${Math.ceil(d)} dni</span>`, d] : ['', d]; }
function pStock() {
  const st = live('stock').sort((a, b) => stockStat(a)[1] - stockStat(b)[1]);
  let h = `<div class="btns"><button class="b pri" onclick="stockEdit()">＋ Dodaj</button></div><div class="card list">`;
  h += st.length ? st.map(s => `<div class="it"><div class="grow" onclick="stockEdit('${s.id}')"><b>${esc(s.name)}</b> ${stockStat(s)[0]} ${s.qty === 'mało' || s.qty === 'brak' ? `<span class="tag red">${esc(s.qty)}</span>` : ''}<div class="mut">${esc([s.exp && 'ważne do ' + fmtD(s.exp), s.qty, s.where].filter(Boolean).join(' · '))}</div></div><button class="b sm" title="Na zakupy" onclick="toShop('${s.id}')">🛒</button></div>`).join('') : '<div class="empty">Wpisz, co macie w domowej apteczce – aplikacja przypomni o datach ważności.</div>';
  return h + '</div>';
}

// ---------- szczepienia ----------
function vacEdit(id, child) {
  const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const v = id ? byId('vaccines', id) : { child: child || ks[0].id, date: today(), against: [] };
  form(id ? 'Szczepienie' : 'Nowe szczepienie', [
    { k: 'child', l: 'Kto', t: 'sel', o: ks.map(k => [k.id, k.name]) }, { k: 'date', l: 'Data', t: 'date', req: 1 },
    { k: 'vac', l: 'Nazwa szczepionki' }, { k: 'against', l: 'Przeciw', t: 'chips', o: AGAINST, extra: 'inne (po przecinku)' },
    { k: 'doseNo', l: 'Która dawka', ph: 'np. 2 z 3' }, { k: 'place', l: 'Gdzie' }, { k: 'reaction', l: 'Reakcja po szczepieniu', t: 'area', r: 2 },
    { k: 'next', l: 'Następna dawka (data)', t: 'date' }, { k: 'cal', l: 'Dodaj następną dawkę do kalendarza', t: 'chk' }
  ], v, val => { const c = val.cal; delete val.cal; const r = put('vaccines', Object.assign(v, val)); if (c && r.next) calEvent({ id: 'v' + r.id, title: '💉 Szczepienie: ' + kidName(r.child), desc: (r.vac || '') + ' ' + (r.against || []).join(', '), start: toDate(r.next + 'T09:00').getTime(), min: 30 }); },
    id ? { del: () => del('vaccines', id) } : {});
}
const vacTxt = v => [v.vac, (v.against || []).join(', ')].filter(Boolean).join(' – ') || 'Szczepienie';
function vacRow(v, withKid) { return `<div class="it" onclick="vacEdit('${v.id}')"><div style="font-size:22px">💉</div><div class="grow"><b>${esc(vacTxt(v))}</b>${withKid ? ' · ' + esc(kidName(v.child)) : ''}<div class="mut">${esc(fmtD(v.date))}${v.doseNo ? ' · dawka ' + esc(v.doseNo) : ''}${v.next ? ' · następna ' + esc(fmtD(v.next)) : ''}${v.reaction ? ' · reakcja: ' + esc(v.reaction) : ''}</div></div></div>`; }
function pVacc() {
  const vs = live('vaccines').sort((a, b) => b.date.localeCompare(a.date)), nx = vs.filter(v => v.next && v.next >= today()).sort((a, b) => a.next.localeCompare(b.next));
  let h = `<div class="btns"><button class="b pri" onclick="vacEdit()">＋ Szczepienie</button></div>`;
  if (nx.length) h += `<div class="card"><h2>Najbliższe dawki</h2><div class="list">${nx.map(v => `<div class="it"><div class="grow"><b>${esc(fmtD(v.next))}</b> · ${esc(kidName(v.child))}<div class="mut">${esc(vacTxt(v))}</div></div></div>`).join('')}</div></div>`;
  kids().forEach(k => { const m = vs.filter(v => v.child === k.id); h += `<div class="card"><h2>${esc(k.name)}</h2><div class="list">${m.length ? m.map(v => vacRow(v)).join('') : '<div class="mut">Brak wpisów.</div>'}</div></div>`; });
  return h;
}
function calEvent(o) {
  const end = o.start + (o.min || 30) * 60000;
  if (N) {
    if (!N.calHasPerm()) { N.calReqPerm(); toast('Zezwól na kalendarz i zapisz jeszcze raz'); return; }
    if (!S.calId) { toast('Wybierz kalendarz w Więcej → Kalendarz'); return; }
    const old = EV[o.id]; let ok = old && N.calUpdate(String(old), o.title, o.desc || '', '', o.start, end);
    if (!ok) { const id = N.calInsert(String(S.calId), o.title, o.desc || '', '', o.start, end, +S.remind || 0); if (id) { EV[o.id] = id; ok = true; } }
    ST.set('evmap', EV); toast(ok ? 'Zapisano w kalendarzu' : 'Nie udało się zapisać w kalendarzu'); return;
  }
  const s = new Date(o.start), e = new Date(end), z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(o.title) + '&dates=' + z(s) + '/' + z(e) + '&details=' + encodeURIComponent(o.desc || '');
  window.__ics = () => icsFile('wydarzenie.ics', [{ uid: o.id, s, e, t: o.title, d: o.desc, a: +S.remind || 0 }]);
  setTimeout(() => sheet(`<h2>Dodaj do kalendarza</h2><p class="mut">${esc(o.title)} · ${esc(fmtDT(msToLocal(o.start)))}</p><div class="btns" style="flex-direction:column"><a class="b pri" style="text-align:center;text-decoration:none" href="${esc(g)}" target="_blank" rel="noopener">Kalendarz Google</a><button class="b" onclick="__ics()">Kalendarz iPhone (.ics)</button><button class="b" onclick="closeSheet()">Pomiń</button></div>`), 50);
}

// ---------- epizody choroby ----------
const activeEp = child => live('episodes').filter(e => e.child === child && !e.end).sort((a, b) => b.start.localeCompare(a.start))[0];
function epEdit(id, child) {
  const e = id ? byId('episodes', id) : { child, name: '', start: nowLocal(), end: '' };
  form(id ? 'Epizod choroby' : 'Nowy epizod choroby', [{ k: 'name', l: 'Nazwa', ph: 'np. Infekcja, Ospa, Zapalenie ucha', req: 1 }, { k: 'start', l: 'Początek', t: 'datetime-local', req: 1 }, { k: 'end', l: 'Koniec (puste = trwa)', t: 'datetime-local' }, { k: 'note', l: 'Uwagi / rozpoznanie', t: 'area', r: 2 }],
    e, v => { put('episodes', Object.assign(e, v)); }, id ? { del: () => del('episodes', id), delMsg: 'Usunąć epizod? Objawy i leki zostaną.' } : {});
}
function epEnd(id) { const e = byId('episodes', id); e.end = nowLocal(); put('episodes', e); render(); toast('Epizod zakończony'); }
const epDays = e => Math.max(1, Math.ceil(((e.end ? toDate(e.end) : new Date()) - toDate(e.start)) / 864e5));

// ---------- dokumenty ----------
function docEdit(id, child) {
  const ks = kids(); const d = id ? byId('docs', id) : { child: child || ks[0].id, date: today(), type: 'Wynik badania' };
  form(id ? 'Dokument' : 'Nowy dokument', [{ k: 'child', l: 'Kto', t: 'sel', o: ks.map(k => [k.id, k.name]) }, { k: 'type', l: 'Rodzaj', t: 'sel', o: DOCT }, { k: 'date', l: 'Data', t: 'date' }, { k: 'title', l: 'Tytuł', ph: 'np. Morfologia, RTG klatki' }, { k: 'note', l: 'Opis / wynik', t: 'area', r: 3 }],
    d, v => { const r = put('docs', Object.assign(d, v)); if (!id) setTimeout(() => { openP({ t: 'doc', id: r.id }); addFiles(r.id, r.child, 'image/*,application/pdf', () => render()); }, 0); },
    id ? { del: () => { live('files').filter(f => f.ref === id).forEach(f => dropFile(f.id)); del('docs', id); if (pages.length && pages[pages.length - 1].t === 'doc') pages.pop(); } } : {});
}
function pDoc(id) {
  const d = byId('docs', id); if (!d || d.del) { pages.pop(); setTimeout(render, 0); return ''; }
  return `<div class="card"><div class="row"><div class="grow"><div class="big">${esc(d.title || d.type)}</div><div class="mut">${esc(d.type)} · ${esc(kidName(d.child))} · ${esc(fmtD(d.date))}</div></div><button class="b sm" onclick="docEdit('${id}')">Edytuj</button></div>${d.note ? `<p style="white-space:pre-wrap">${esc(d.note)}</p>` : ''}${thumbs(id)}<div class="btns"><button class="b pri" onclick="addFiles('${id}','${d.child}','image/*,application/pdf',()=>render())">📎 Dodaj zdjęcie / PDF</button></div></div>`;
}
const docRow = d => `<div class="it" onclick="openP({t:'doc',id:'${d.id}'})"><div style="font-size:22px">📄</div><div class="grow"><b>${esc(d.title || d.type)}</b><div class="mut">${esc(d.type)} · ${esc(fmtD(d.date))} · ${live('files').filter(f => f.ref === d.id).length} plik(ów)</div></div></div>`;

// ---------- karta alarmowa ----------
const fam = () => byId('family', 'fam') || { id: 'fam', contacts: '' };
function famEdit() { const f = fam(); form('Kontakty alarmowe', [{ k: 'contacts', l: 'Każdy w osobnej linii: Imię: telefon', t: 'area', r: 4, ph: 'Tata: 600 000 000\nMama: 600 000 000' }, { k: 'addr', l: 'Adres domowy (opcjonalnie)' }], f, v => { put('family', Object.assign(f, v)); }); }
function sosHtml(k, print) {
  const m = lastMeasure(k.id), a = ageTxt(k.birth), f = fam();
  const tel = l => { const p = l.replace(/[^\d+]/g, ''); return p.length >= 9 && !print ? `<a href="tel:${p}" style="color:inherit">${esc(l)}</a>` : esc(l); };
  const v = live('vaccines').filter(x => x.child === k.id).sort((x, y) => y.date.localeCompare(x.date))[0];
  return `<div class="sos"><div class="big" style="font-size:28px">${esc(k.name)}</div><div>${esc(fmtD(k.birth))}${a ? ' (' + esc(a) + ')' : ''}${m && m.w ? ' · waga ' + fmtN(m.w) + ' kg (' + esc(fmtD(m.date)) + ')' : ''}</div>
  <div class="alg">ALERGIE: ${esc(k.allergy || 'brak znanych')}</div>
  <table>${[['PESEL', k.pesel], ['Grupa krwi', k.blood], ['Choroby przewlekłe', k.chronic], ['Leki stałe', k.meds], ['Pediatra / przychodnia', k.doctor], ['Ostatnie szczepienie', v && fmtD(v.date) + ' – ' + vacTxt(v)], ['Uwagi', k.notes]].filter(x => x[1]).map(x => `<tr><th style="width:38%">${x[0]}</th><td>${esc(x[1])}</td></tr>`).join('')}</table>
  <h3>Kontakt alarmowy</h3>${(f.contacts || '').split('\n').filter(Boolean).map(l => `<div style="font-size:20px;margin:4px 0">📞 ${tel(l)}</div>`).join('') || '<div class="mut">Brak – uzupełnij.</div>'}${f.addr ? `<div>🏠 ${esc(f.addr)}</div>` : ''}</div>`;
}
function pSos(id) {
  const k = byId('children', id); if (!k) { pages.pop(); setTimeout(render, 0); return ''; }
  return `<div class="card">${sosHtml(k)}</div><div class="btns"><button class="b" onclick="famEdit()">✏️ Kontakty</button><button class="b" onclick="editChild('${id}')">✏️ Dane dziecka</button><button class="b" onclick="sosPrint('${id}')">🖨 Drukuj kartę</button></div><p class="mut">Działa bez internetu. Pokaż na SOR, u lekarza albo zostaw opiekunce.</p>`;
}
function sosPrint(id) { printHtml(`<!doctype html><meta charset="utf-8"><style>${PRINT_CSS}.box{border:2px solid #dc2626;border-radius:10px;padding:10px;max-width:520px}.alg{background:#dc2626;color:#fff;padding:8px;font-weight:800;font-size:16px;border-radius:6px;margin:6px 0}.big{font-weight:800}</style><div class="box">${sosHtml(byId('children', id), true)}</div>`, 'Karta ' + kidName(id)); }

// ---------- wykres wzrostu i wagi ----------
function growthSvg(ms, key, unit, color) {
  const p = ms.filter(m => m[key] !== '' && m[key] != null).slice().sort((a, b) => a.date.localeCompare(b.date)); if (p.length < 2) return '';
  const W = 320, H = 130, pl = 34, pr = 8, pt = 8, pb = 20, t0 = toDate(p[0].date).getTime(), t1 = toDate(p[p.length - 1].date).getTime() || t0 + 1;
  const vs = p.map(m => +m[key]), lo = Math.min(...vs), hi = Math.max(...vs), r = (hi - lo) || 1;
  const X = m => pl + (t1 === t0 ? 0 : (toDate(m.date).getTime() - t0) / (t1 - t0)) * (W - pl - pr), Y = v => pt + (hi + r * 0.1 - v) / (r * 1.2) * (H - pt - pb);
  return `<div class="lab">${key === 'h' ? 'Wzrost' : 'Waga'} (${unit})</div><svg viewBox="0 0 ${W} ${H}" width="100%"><text x="2" y="${Y(hi) + 4}" font-size="10" fill="currentColor" opacity=".6">${fmtN(hi)}</text><text x="2" y="${Y(lo) + 4}" font-size="10" fill="currentColor" opacity=".6">${fmtN(lo)}</text>
  <polyline points="${p.map(m => X(m).toFixed(1) + ',' + Y(+m[key]).toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>${p.map(m => `<circle cx="${X(m)}" cy="${Y(+m[key])}" r="3.5" fill="${color}"/>`).join('')}
  <text x="${pl}" y="${H - 5}" font-size="10" fill="currentColor" opacity=".6">${esc(fmtD(p[0].date))}</text><text x="${W - pr}" y="${H - 5}" font-size="10" fill="currentColor" opacity=".6" text-anchor="end">${esc(fmtD(p[p.length - 1].date))}</text></svg>`;
}

// ---------- strona dziecka ----------
function pChild(id) {
  const k = byId('children', id); if (!k || k.del) { pages.pop(); return vKids(); }
  const ep = activeEp(id), act = activeEntries(id), nl = nowLocal();
  const ms = live('measures').filter(m => m.child === id).sort((a, b) => b.date.localeCompare(a.date));
  const vs = live('visits').filter(v => v.child === id).sort((a, b) => b.dt.localeCompare(a.dt));
  const d24 = live('doses').filter(d => d.child === id && Date.now() - toDate(d.dt).getTime() < 864e5).sort((a, b) => b.dt.localeCompare(a.dt));
  const cs = live('courses').filter(c => c.child === id && courseActive(c));
  const all = ents(id).sort((a, b) => b.dt.localeCompare(a.dt)), mon = all.filter(e => e.mon && !e.healed);
  let h = `<div class="card"><div class="row">${avatar(k, 56)}<div class="grow"><div class="big">${esc(k.name)}</div><div class="mut">${esc(fmtD(k.birth))} · ${esc(ageTxt(k.birth))}${ms[0] && ms[0].w ? ' · ' + fmtN(ms[0].w) + ' kg' : ''}</div>${k.allergy ? `<span class="tag red">alergie: ${esc(k.allergy)}</span>` : ''}</div><button class="b sm" onclick="editChild('${id}')">Edytuj</button></div>
  <div class="btns"><button class="b" onclick="openP({t:'sos',id:'${id}'})">🆘 Karta alarmowa</button><button class="b" onclick="reportDlg('${id}')">📄 Raport</button></div></div>`;
  h += ep ? `<div class="card ep"><div class="row"><div class="grow"><b>🤒 Trwa: ${esc(ep.name)}</b><div style="font-size:13px">od ${esc(fmtDT(ep.start))} · dzień ${epDays(ep)}</div></div><button class="b sm" onclick="epEdit('${ep.id}')">✏️</button><button class="b sm" onclick="epEnd('${ep.id}')">Zakończ</button></div></div>`
    : '';
  h += `<div class="card"><h2>Zgłoś objaw lub uraz</h2>${bodySvg(id)}<div class="btns" style="justify-content:center"><button class="b pri" onclick="entryDlg({child:'${id}',region:'',rl:'Ogólne'})">🌡 Gorączka / ogólne</button><button class="b pri" onclick="doseDlg({child:'${id}'})">💊 Podaj lek</button></div>${ep ? '' : `<div style="text-align:center"><button class="b sm" onclick="epEdit(null,'${id}')">＋ Rozpocznij epizod choroby</button></div>`}</div>`;
  if (act.length) h += `<div class="card"><h2>Teraz</h2><div class="list">${act.map(entryRow).join('')}</div></div>`;
  if (d24.length || cs.length) h += `<div class="card"><h2>Leki (24 h)</h2><div class="list">${d24.map(d => doseRow(d)).join('')}${cs.map(c => `<div class="it" onclick="openP({t:'course',id:'${c.id}'})"><div style="font-size:22px">📆</div><div class="grow"><b>Kurs: ${esc(c.med)}</b><div class="mut">${slots(c).filter(x => (c.done || {})[x]).length}/${slots(c).length} dawek</div></div></div>`).join('')}</div></div>`;
  if (mon.length) h += `<div class="card"><h2>Obserwowane zmiany skórne</h2><div class="list">${mon.map(entryRow).join('')}</div></div>`;
  h += vitCard(k);
  h += `<div class="card"><div class="row"><h2 style="flex:1">Wizyty</h2><button class="b sm pri" onclick="editVisit(null,'${id}')">＋</button></div>${vs.length ? `<div class="list">${vs.slice(0, 8).map(v => `<div class="it" onclick="openP({t:'visit',id:'${v.id}'})"><div class="grow"><b>${esc(fmtDT(v.dt))}</b> ${v.dt >= nl ? '<span class="tag grn">zaplanowana</span>' : ''}<div class="mut">${esc([v.spec, v.place, v.reason].filter(Boolean).join(' · '))}</div></div></div>`).join('')}</div>` : '<div class="mut">Brak wizyt.</div>'}</div>`;
  const vac = live('vaccines').filter(v => v.child === id).sort((a, b) => b.date.localeCompare(a.date));
  h += `<div class="card"><div class="row"><h2 style="flex:1">Szczepienia</h2><button class="b sm pri" onclick="vacEdit(null,'${id}')">＋</button></div>${vac.length ? `<div class="list">${vac.slice(0, 5).map(v => vacRow(v)).join('')}</div>${vac.length > 5 ? `<button class="b sm" onclick="openP({t:'vacc'})">Wszystkie (${vac.length})</button>` : ''}` : '<div class="mut">Brak wpisów.</div>'}</div>`;
  const docs = live('docs').filter(d => d.child === id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  h += `<div class="card"><div class="row"><h2 style="flex:1">Dokumenty i wyniki</h2><button class="b sm pri" onclick="docEdit(null,'${id}')">＋</button></div>${docs.length ? `<div class="list">${docs.slice(0, 10).map(docRow).join('')}</div>` : '<div class="mut">Wyniki badań, recepty, skierowania – zdjęcie lub PDF.</div>'}</div>`;
  h += `<div class="card"><div class="row"><h2 style="flex:1">Pomiary</h2><button class="b sm pri" onclick="editMeasure(null,'${id}')">＋</button></div>${growthSvg(ms, 'h', 'cm', '#2b7a9e')}${growthSvg(ms, 'w', 'kg', '#ef6c5a')}`;
  h += ms.length ? `<details><summary>Tabela (${ms.length})</summary><table><tr><th>Data</th><th>Wzrost</th><th>Waga</th><th>Obwód gł.</th></tr>${ms.map(m => `<tr onclick="editMeasure('${m.id}')"><td>${esc(fmtD(m.date))}</td><td>${m.h ? fmtN(m.h) + ' cm' : ''}</td><td>${m.w ? fmtN(m.w) + ' kg' : ''}</td><td>${m.hc ? fmtN(m.hc) + ' cm' : ''}</td></tr>`).join('')}</table></details>` : '<div class="mut">Brak pomiarów.</div>';
  h += '</div>';
  const eps = live('episodes').filter(e => e.child === id && e.end).sort((a, b) => b.start.localeCompare(a.start));
  h += `<div class="card"><details><summary>Historia zgłoszeń (${all.length})</summary><div class="list">${all.slice(0, 60).map(entryRow).join('') || '<div class="mut">Brak.</div>'}</div></details>`;
  if (eps.length) h += `<details><summary>Przebyte choroby (${eps.length})</summary><div class="list">${eps.map(e => `<div class="it"><div class="grow" onclick="epEdit('${e.id}')"><b>${esc(e.name)}</b><div class="mut">${esc(fmtD(e.start))} – ${esc(fmtD(e.end))} · ${epDays(e)} dni${e.note ? ' · ' + esc(e.note) : ''}</div></div><button class="b sm" onclick="openP({t:'rep',id:'${id}',p:'ep:${e.id}'})">📄</button></div>`).join('')}</div></details>`;
  return h + '</div>';
}

// ---------- zakładka Dzieci ----------
function vKids() {
  const ks = kids(), nl = nowLocal();
  const up = live('visits').filter(v => v.dt >= nl.slice(0, 10)).sort((a, b) => a.dt.localeCompare(b.dt)).slice(0, 5);
  const vn = live('vaccines').filter(v => v.next && v.next >= today() && (toDate(v.next) - Date.now()) < 45 * 864e5);
  const cs = live('courses').filter(courseActive);
  let h = `<div class="btns"><button class="b pri" onclick="editChild()">＋ Osoba</button><button class="b" onclick="editVisit()">＋ Wizyta</button><button class="b" onclick="openP({t:'cal'})">📅 Z kalendarza</button></div>`;
  const bd = bdayRows();
  if (up.length || vn.length || cs.length || bd) h += `<div class="card"><h2>Najbliżej</h2><div class="list">${bd}${up.map(v => `<div class="it" onclick="openP({t:'visit',id:'${v.id}'})"><div style="font-size:22px">🩺</div><div class="grow"><b>${esc(fmtDT(v.dt))}</b> · ${esc(kidName(v.child))}<div class="mut">${esc([v.spec, v.place].filter(Boolean).join(' · '))}</div></div>${v.dt.slice(0, 10) === today() ? '<span class="tag yel">dziś</span>' : ''}</div>`).join('')}${vn.map(v => `<div class="it" onclick="vacEdit('${v.id}')"><div style="font-size:22px">💉</div><div class="grow"><b>${esc(fmtD(v.next))}</b> · ${esc(kidName(v.child))}<div class="mut">${esc(vacTxt(v))} – następna dawka</div></div></div>`).join('')}${cs.map(c => `<div class="it" onclick="openP({t:'course',id:'${c.id}'})"><div style="font-size:22px">📆</div><div class="grow"><b>${esc(c.med)}</b> · ${esc(kidName(c.child))}<div class="mut">kurs: ${slots(c).filter(x => (c.done || {})[x]).length}/${slots(c).length}</div></div></div>`).join('')}</div></div>`;
  if (!ks.length) h += `<div class="card empty">Dodaj dzieci i dorosłych, żeby zgłaszać objawy, urazy i podawane leki.</div>`;
  ks.forEach(k => {
    const m = lastMeasure(k.id), act = activeEntries(k.id), ep = activeEp(k.id);
    h += `<div class="card"><div class="row kid" onclick="openP({t:'child',id:'${k.id}'})">${avatar(k)}<div class="grow"><b style="font-size:17px">${esc(k.name)}</b> <span class="mut">${esc(ageTxt(k.birth))}</span><div class="mut">${m ? esc([m.h ? fmtN(m.h) + ' cm' : '', m.w ? fmtN(m.w) + ' kg' : ''].filter(Boolean).join(' · ')) : 'brak pomiarów'}</div>${k.allergy ? '<span class="tag red">alergie</span> ' : ''}${ep ? `<span class="tag yel">🤒 ${esc(ep.name)}, dzień ${epDays(ep)}</span> ` : ''}${act.length ? `<span class="tag">aktywne: ${act.length}</span>` : ''}</div><span class="mut" style="font-size:22px">›</span></div>
    <div class="btns" style="margin-bottom:0"><button class="b sm" onclick="openP({t:'child',id:'${k.id}'})">🩺 Zgłoś</button><button class="b sm" onclick="doseDlg({child:'${k.id}'})">💊 Lek</button>${vitBtns(k)}<button class="b sm" onclick="openP({t:'sos',id:'${k.id}'})">🆘</button></div></div>`;
  });
  return h;
}

// ---------- zakładka Leki ----------
function vMeds() {
  const ks = kids(), d24 = live('doses').filter(d => Date.now() - toDate(d.dt).getTime() < 864e5).sort((a, b) => b.dt.localeCompare(a.dt));
  const cs = live('courses').filter(courseActive), st = live('stock'), bad = st.filter(s => stockStat(s)[1] < 30 || s.qty === 'mało' || s.qty === 'brak').length;
  let h = `<div class="card"><h2>Podaj lek</h2><div class="row" style="flex-wrap:wrap;gap:10px">${ks.map(k => `<button class="kidbtn" onclick="doseDlg({child:'${k.id}'})">${avatar(k, 52)}${esc(k.name)}</button>`).join('') || '<span class="mut">Najpierw dodaj osoby w zakładce Rodzina.</span>'}</div></div>`;
  h += `<div class="card"><div class="row"><h2 style="flex:1">Ostatnie 24 h</h2><button class="b sm" onclick="openP({t:'doses'})">Historia</button></div><div class="list">${d24.map(d => doseRow(d, true)).join('') || '<div class="mut">Nic nie podano.</div>'}</div></div>`;
  if (cs.length) h += `<div class="card"><h2>Kursy w trakcie</h2><div class="list">${cs.map(c => { const sl = slots(c), nx = sl.find(k => !(c.done || {})[k] && toDate(k).getTime() > Date.now() - 36e5); return `<div class="it" onclick="openP({t:'course',id:'${c.id}'})"><div style="font-size:22px">📆</div><div class="grow"><b>${esc(c.med)}</b> · ${esc(kidName(c.child))}<div class="mut">${sl.filter(k => (c.done || {})[k]).length}/${sl.length}${nx ? ' · następna ' + esc(fmtDT(nx)) : ''}</div></div></div>`; }).join('')}</div></div>`;
  h += `<div class="grid2"><button class="b" onclick="courseDlg()">📆 Nowy kurs leku</button><button class="b" onclick="openP({t:'stock'})">🧰 Apteczka${bad ? ' (' + bad + ')' : ''}</button><button class="b" onclick="openP({t:'vacc'})">💉 Szczepienia</button><button class="b" onclick="openP({t:'medbase'})">📚 Baza leków</button></div>`;
  return h;
}

// ---------- wizyta: lista do przekazania ----------
function visitItems(v) {
  const k = byId('children', v.child) || {}, r = repData(v.child, 'auto', v.dt), I = [];
  if (k.allergy) I.push(['alg', '⚠️ Alergie: ' + k.allergy]);
  if (k.meds) I.push(['stale', 'Leki stałe: ' + k.meds]);
  if (r.ep) I.push(['ep', `Choroba „${r.ep.name}” od ${fmtDT(r.ep.start)} (dzień ${epDays(r.ep)})`]);
  if (r.temps.length) { const mx = r.temps.reduce((a, b) => b.temp > a.temp ? b : a); I.push(['temp', `Temperatura: ${r.temps.length} pomiarów, max ${fmtN(mx.temp)}°C (${fmtDT(mx.dt)})`]); }
  const syms = {}; r.sy.filter(s => (s.kind || 'sym') === 'sym').forEach(s => (s.sym || []).forEach(x => { if (x !== 'Pomiar temperatury') { const o = syms[x] || (syms[x] = { a: s.dt, b: s.dt, rl: s.rl }); o.b = s.dt; } }));
  Object.keys(syms).forEach(x => I.push(['s' + x, `${x}${syms[x].rl && syms[x].rl !== 'Ogólne' ? ' (' + syms[x].rl + ')' : ''}: od ${fmtDT(syms[x].a)}${syms[x].b !== syms[x].a ? ', ostatnio ' + fmtDT(syms[x].b) : ''}`]));
  r.marks.forEach(e => I.push(['e' + e.id, `${KINDS[e.kind][1]} ${entryMain(e)} – ${e.rl || 'ogólne'}, od ${fmtD(e.dt)}${(e.fu || []).length ? ', kontroli: ' + e.fu.length : ''}${live('files').some(f => f.ref === e.id) ? ' · pokaż zdjęcia' : ''}`]));
  r.medSum.forEach(m => I.push(['m' + m.med, `Podano ${m.med}: ${m.n}× (${m.amts}), ostatnio ${fmtDT(m.last)}`]));
  r.courses.forEach(c => I.push(['c' + c.id, `Kurs ${c.med} ${fmtN(c.amt)} ${c.unit}, ${(c.times || []).join(', ')}, od ${fmtD(c.start)}`]));
  (v.questions || '').split('\n').map(x => x.trim()).filter(Boolean).forEach((q, i) => I.push(['q' + i, '❓ ' + q]));
  live('docs').filter(d => d.child === v.child && d.date >= r.from.slice(0, 10)).forEach(d => I.push(['d' + d.id, '📄 Pokaż: ' + (d.title || d.type) + ' (' + fmtD(d.date) + ')']));
  return { I, r };
}
function pVisit(id) {
  const v = byId('visits', id); if (!v || v.del) { pages.pop(); setTimeout(render, 0); return ''; }
  const { I } = visitItems(v), chk = v.chk || {};
  let h = `<div class="card"><div class="row"><div class="grow"><div class="big">${esc(v.spec || 'Wizyta')} · ${esc(kidName(v.child))}</div><div class="mut">${esc(fmtDT(v.dt))}${v.place ? ' · ' + esc(v.place) : ''}${v.reason ? ' · ' + esc(v.reason) : ''}</div></div><button class="b sm" onclick="editVisit('${id}')">Edytuj</button></div>
  <div class="btns"><button class="b" onclick="openP({t:'rep',id:'${v.child}',p:'auto',to:'${v.dt}'})">📄 Raport PDF</button><button class="b" onclick="shareText(${esc(JSON.stringify('Do lekarza – ' + kidName(v.child)))},visitText('${id}'))">📤 Wyślij listę</button></div></div>
  <div class="card"><h2>Do przekazania lekarzowi</h2><div class="mut">Odhaczaj w gabinecie, żeby niczego nie pominąć.</div><div class="list">${I.map(([k, t]) => `<div class="it ${chk[k] ? 'done' : ''}"><button class="ck ${chk[k] ? 'on' : ''}" onclick="visitChk('${id}',${esc(JSON.stringify(k))})">${chk[k] ? '✓' : ''}</button><div class="grow nm">${esc(t)}</div></div>`).join('') || '<div class="mut">Brak zapisów z ostatniego okresu. Dopisz pytania w edycji wizyty.</div>'}</div></div>
  <div class="card"><h2>Po wizycie</h2><label>Rozpoznanie i zalecenia<textarea id="v_recs" rows="4">${esc(v.recs || '')}</textarea></label><div class="btns"><button class="b pri" onclick="const v=byId('visits','${id}');v.recs=$('#v_recs').value;put('visits',v);toast('Zapisano')">Zapisz</button><button class="b" onclick="courseDlg(null,'${v.child}')">📆 Kurs leku z zalecenia</button><button class="b" onclick="docEdit(null,'${v.child}')">📄 Dodaj receptę / skierowanie</button></div></div>`;
  return h;
}
function visitChk(id, k) { const v = byId('visits', id); v.chk = v.chk || {}; if (v.chk[k]) delete v.chk[k]; else v.chk[k] = 1; put('visits', v); render(); }
function visitText(id) { const v = byId('visits', id); return `Do lekarza – ${kidName(v.child)}, ${fmtDT(v.dt)}\n` + visitItems(v).I.map(x => '• ' + x[1]).join('\n'); }

// ---------- raport (z lekami, urazami i zdjęciami) ----------
function reportDlg(id) {
  const ep = activeEp(id), eps = live('episodes').filter(e => e.child === id && e.end).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 6);
  const vs = live('visits').filter(v => v.child === id && v.dt < nowLocal()).sort((a, b) => b.dt.localeCompare(a.dt));
  const o = (ep ? [['ep:' + ep.id, 'Trwająca choroba: ' + ep.name]] : []).concat([['last', vs.length ? 'Od ostatniej wizyty (' + fmtD(vs[0].dt) + ')' : 'Od ostatniej wizyty (brak – 30 dni)'], ['7', 'Ostatnie 7 dni'], ['14', 'Ostatnie 14 dni'], ['30', 'Ostatnie 30 dni'], ['90', 'Ostatnie 3 miesiące']]).concat(eps.map(e => ['ep:' + e.id, e.name + ' (' + fmtD(e.start) + ')']));
  form('Raport dla lekarza', [{ k: 'p', l: 'Okres', t: 'sel', o }], { p: o[0][0] }, v => { openP({ t: 'rep', id, p: v.p }); return true; }, { save: 'Pokaż raport' });
}
function repData(id, p, toStr) {
  const k = byId('children', id), to = toStr || '9999';
  let from, ep = null;
  if (p === 'auto') { ep = activeEp(id); if (!ep) p = 'last'; else p = 'ep:' + ep.id; }
  if (String(p).startsWith('ep:')) { ep = byId('episodes', p.slice(3)); from = ep ? ep.start : msToLocal(Date.now() - 30 * 864e5); }
  else if (p === 'last') { const v = live('visits').filter(v => v.child === id && v.dt < (toStr || nowLocal())).sort((a, b) => b.dt.localeCompare(a.dt))[0]; from = v ? v.dt : msToLocal(Date.now() - 30 * 864e5); }
  else from = msToLocal(Date.now() - (+p) * 864e5);
  const end = ep && ep.end ? ep.end : to;
  const inR = dt => dt >= from && dt <= end;
  const allE = ents(id);
  const sy = allE.filter(s => inR(s.dt)).sort((a, b) => a.dt.localeCompare(b.dt));
  const marks = allE.filter(e => (e.kind || 'sym') !== 'sym' && (inR(e.dt) || (!e.healed && e.dt <= end))).map(e => Object.assign({ kind: 'sym' }, e)).sort((a, b) => a.dt.localeCompare(b.dt));
  const ms = live('measures').filter(m => m.child === id).sort((a, b) => b.date.localeCompare(a.date));
  const vs = live('visits').filter(v => v.child === id).sort((a, b) => b.dt.localeCompare(a.dt));
  const next = vs.filter(v => v.dt >= nowLocal()).pop(), past = vs.filter(v => v.dt < nowLocal()).slice(0, 3);
  const sum = {};
  sy.filter(s => (s.kind || 'sym') === 'sym').forEach(s => (s.sym || []).forEach(x => { if (x === 'Pomiar temperatury') return; const o = sum[x] || (sum[x] = { n: 0, a: s.dt, b: s.dt }); o.n++; o.b = s.dt; }));
  const temps = sy.filter(s => s.temp !== '' && s.temp != null);
  const doses = live('doses').filter(d => d.child === id && inR(d.dt)).sort((a, b) => a.dt.localeCompare(b.dt));
  const mm = {}; doses.forEach(d => { const o = mm[d.med] || (mm[d.med] = { med: d.med, n: 0, a: [], last: d.dt }); o.n++; o.last = d.dt; const t = fmtN(d.amt) + ' ' + d.unit; if (!o.a.includes(t)) o.a.push(t); });
  const medSum = Object.values(mm).map(o => Object.assign(o, { amts: o.a.join(' / ') }));
  const courses = live('courses').filter(c => c.child === id && (c.start <= end) && slots(c).some(s => s >= from.slice(0, 16)));
  return { k, from, to: end, ep, sy, marks, ms, next, past, sum, temps, doses, medSum, courses };
}
function repHtml(r) {
  const k = r.k, m = r.ms[0];
  const kv = (l, v) => v ? `<tr><th style="width:34%">${l}</th><td>${esc(v)}</td></tr>` : '';
  let h = `<h1 style="font-size:22px;margin:0">Raport dla lekarza – ${esc(k.name)}</h1><div class="mut">Przygotowano ${esc(fmtD(today()))} · okres od ${esc(fmtDT(r.from))}${r.to !== '9999' ? ' do ' + esc(fmtDT(r.to)) : ''}${r.ep ? ' · choroba: ' + esc(r.ep.name) + ' (dzień ' + epDays(r.ep) + ')' : ''}</div>`;
  if (r.next) h += `<p><b>Wizyta:</b> ${esc(fmtDT(r.next.dt))} · ${esc([r.next.spec, r.next.place].filter(Boolean).join(' · '))}</p>`;
  h += `<h3>Dane pacjenta</h3><table>${kv('Data urodzenia', fmtD(k.birth) + (k.birth ? ' (' + ageTxt(k.birth) + ')' : ''))}${kv('PESEL', k.pesel)}${kv('Alergie', k.allergy || 'brak wpisu')}${kv('Grupa krwi', k.blood)}${kv('Choroby przewlekłe', k.chronic)}${kv('Leki stałe', k.meds)}`;
  if (m) h += kv('Ostatni pomiar (' + fmtD(m.date) + ')', [m.h && fmtN(m.h) + ' cm', m.w && fmtN(m.w) + ' kg', m.hc && 'obwód głowy ' + fmtN(m.hc) + ' cm'].filter(Boolean).join(', '));
  h += '</table>';
  const keys = Object.keys(r.sum);
  h += '<h3>Objawy</h3>';
  if (!keys.length && !r.temps.length) h += '<p>Brak zapisanych objawów w tym okresie.</p>';
  else {
    if (keys.length) h += `<table><tr><th>Objaw</th><th>Od</th><th>Ostatni wpis</th><th>Wpisów</th></tr>${keys.map(x => `<tr><td>${esc(x)}</td><td>${esc(fmtDT(r.sum[x].a))}</td><td>${esc(fmtDT(r.sum[x].b))}</td><td>${r.sum[x].n}</td></tr>`).join('')}</table>`;
    if (r.temps.length) { const mx = r.temps.reduce((a, b) => b.temp > a.temp ? b : a); h += `<p><b>Temperatura:</b> ${r.temps.length} pomiarów, najwyższa ${fmtN(mx.temp)}°C (${esc(fmtDT(mx.dt))}).</p>${tempSvg(r.temps)}`; }
  }
  if (r.marks.length) h += `<h3>Urazy, ból, zmiany skórne</h3><table><tr><th>Miejsce</th><th>Co</th><th>Od</th><th>Szczegóły</th></tr>${r.marks.map(e => `<tr><td>${esc(e.rl || 'ogólne')}</td><td>${esc(entryMain(e))}</td><td>${esc(fmtD(e.dt))}${e.healed ? '<br>wyleczone ' + esc(fmtD(e.healed)) : ''}</td><td>${esc([e.how && 'jak: ' + e.how, e.done && 'zrobiono: ' + e.done, e.color, e.chg && 'zmienia się', e.freq, e.note].filter(Boolean).join('; '))}${(e.fu || []).map(u => '<br>' + esc(fmtD(u.dt) + ': ' + (u.t || 'kontrola'))).join('')}${repPhotos([e.id].concat((e.fu || []).map(u => u.id)))}</td></tr>`).join('')}</table>`;
  if (r.doses.length) h += `<h3>Podane leki</h3><table><tr><th>Lek</th><th>Ile razy</th><th>Dawka</th><th>Ostatnio</th></tr>${r.medSum.map(o => `<tr><td>${esc(o.med)}</td><td>${o.n}</td><td>${esc(o.amts)}</td><td>${esc(fmtDT(o.last))}</td></tr>`).join('')}</table>
    <details open><summary style="font-size:13px">Wszystkie podania</summary><table><tr><th>Kiedy</th><th>Lek</th><th>Dawka</th><th>Powód</th></tr>${r.doses.map(d => `<tr><td>${esc(fmtDT(d.dt))}</td><td>${esc(d.med)}</td><td>${esc(fmtN(d.amt) + ' ' + d.unit)}</td><td>${esc(d.why || '')}</td></tr>`).join('')}</table></details>`;
  if (r.courses.length) h += `<h3>Kursy leków</h3><table>${r.courses.map(c => { const sl = slots(c); return `<tr><td>${esc(c.med)} ${esc(fmtN(c.amt) + ' ' + c.unit)}</td><td>${esc((c.times || []).join(', '))}, ${c.days} dni od ${esc(fmtD(c.start))}</td><td>podano ${sl.filter(s => (c.done || {})[s]).length}/${sl.length}</td></tr>`; }).join('')}</table>`;
  const sym = r.sy.filter(s => (s.kind || 'sym') === 'sym');
  if (sym.length) h += `<h3>Przebieg objawów</h3><table><tr><th>Kiedy</th><th>Objawy</th><th>Temp.</th><th>Uwagi</th></tr>${sym.map(s => `<tr><td>${esc(fmtDT(s.dt))}</td><td>${esc(symTxt(s))}${s.rl && s.rl !== 'Ogólne' ? ' (' + esc(s.rl) + ')' : ''}</td><td>${s.temp ? fmtN(s.temp) + '°C' : ''}</td><td>${esc([s.sev, s.given && 'podano: ' + s.given, s.note].filter(Boolean).join('; '))}</td></tr>`).join('')}</table>`;
  if (r.next && r.next.questions) h += `<h3>Pytania do lekarza</h3><p style="white-space:pre-wrap">${esc(r.next.questions)}</p>`;
  if (r.past.length) h += `<h3>Ostatnie wizyty</h3><table>${r.past.map(v => `<tr><td style="width:30%">${esc(fmtD(v.dt))}<br><span class="mut">${esc(v.spec || '')}</span></td><td>${esc(v.reason || '')}${v.recs ? '<br><b>Zalecenia:</b> ' + esc(v.recs) : ''}</td></tr>`).join('')}</table>`;
  return h;
}
function repPhotos(refs) { const fs = live('files').filter(f => refs.includes(f.ref) && f.th); return fs.length ? '<div>' + fs.map(f => `<img src="${f.th}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;margin:3px 3px 0 0" alt="">`).join('') + '</div>' : ''; }
function repText(r) {
  const k = r.k, L = [`Raport dla lekarza – ${k.name}`, `Ur. ${fmtD(k.birth)} (${ageTxt(k.birth)})`];
  if (k.allergy) L.push('Alergie: ' + k.allergy); if (k.chronic) L.push('Choroby: ' + k.chronic); if (k.meds) L.push('Leki stałe: ' + k.meds);
  if (r.ep) L.push(`Choroba: ${r.ep.name}, od ${fmtDT(r.ep.start)}`);
  L.push('', 'Objawy od ' + fmtDT(r.from) + ':');
  r.sy.forEach(s => L.push(`• ${fmtDT(s.dt)}: ${entryMain(Object.assign({ kind: 'sym' }, s))}${s.rl && s.rl !== 'Ogólne' ? ' (' + s.rl + ')' : ''}${s.note ? ' – ' + s.note : ''}`));
  if (!r.sy.length) L.push('brak wpisów');
  if (r.doses.length) { L.push('', 'Podane leki:'); r.doses.forEach(d => L.push(`• ${fmtDT(d.dt)}: ${fmtAmt(d)}${d.why ? ' (' + d.why + ')' : ''}`)); }
  if (r.next && r.next.questions) L.push('', 'Pytania do lekarza:', r.next.questions);
  return L.join('\n');
}
// raport może mieć koniec okresu (np. data wizyty)
function pRep(id, p, to) { const r = repData(id, p, to); lastRep = r; return `<div class="btns"><button class="b pri" onclick="repPrint()">🖨 Drukuj / zapisz PDF</button><button class="b" onclick="repShare()">📤 Udostępnij tekst</button></div><div class="card" style="overflow-x:auto">${repHtml(r)}</div><p class="mut">${N ? 'W oknie druku wybierz „Zapisz jako PDF”.' : 'Na iPhonie: Drukuj → rozsuń podgląd dwoma palcami → Udostępnij / Zachowaj w Plikach.'} Zdjęcia w raporcie są miniaturami – pełne są w aplikacji.</p>`; }

// ---------- rejestracja stron ----------
Object.assign(PAGES, {
  entry: { r: p => pEntry(p.id), title: () => 'Zgłoszenie' },
  medbase: { r: pMedBase, title: () => 'Baza leków' },
  doses: { r: pDoses, title: () => 'Historia podań' },
  course: { r: p => pCourse(p.id), title: () => 'Kurs leku' },
  stock: { r: pStock, title: () => 'Apteczka domowa' },
  vacc: { r: pVacc, title: () => 'Szczepienia' },
  doc: { r: p => pDoc(p.id), title: () => 'Dokument' },
  sos: { r: p => pSos(p.id), title: p => '🆘 ' + kidName(p.id) },
  visit: { r: p => pVisit(p.id), title: () => 'Wizyta' },
  rep2: { r: p => pRep(p.id, p.p, p.to), title: p => 'Raport – ' + kidName(p.id) }
});
TABS.meds = { r: vMeds, title: 'Leki' };
// strona „rep” z app.js – przekazujemy też koniec okresu
const render0 = render;
render = function () { const p = pages[pages.length - 1]; if (p && p.t === 'rep') p.t = 'rep2'; render0(); };

// ---------- synchronizacja: pliki i przypomnienia ----------
const put0 = put;
put = function (c, o) { const r = put0(c, o); if (c === 'courses' || c === 'vaccines') reAlarms(); return r; };
const sync0 = sync;
sync = async function (m) { await sync0(m); uploadFiles(); reAlarms(); };

