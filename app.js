'use strict';
/* AS Rodzina – Alan Solutions */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = window.A || null;
const WEB_VER = '1.6';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const dstr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => dstr(new Date());
const nowLocal = () => { const d = new Date(); return dstr(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const msToLocal = ms => { const d = new Date(ms); return dstr(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const toDate = s => new Date(s && s.length <= 10 ? s + 'T00:00' : s);
const fmtD = s => { if (!s) return ''; const d = toDate(s); return isNaN(d) ? s : d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtDT = s => { if (!s) return ''; const d = toDate(s); return isNaN(d) ? s : d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }) + (s.length > 10 ? ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''); };
const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? '' : x; };
const fmtN = v => v === '' || v == null ? '' : String(v).replace('.', ',');

// ---------- dane ----------
const ST = {
  get(k, def) { try { const v = N ? N.load(k) : localStorage.getItem('rd_' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { const s = JSON.stringify(v); try { N ? N.save(k, s) : localStorage.setItem('rd_' + k, s); } catch (e) { } }
};
const COLS = ['vitals', 'children', 'measures', 'visits', 'symptoms', 'shop', 'catalog', 'shops', 'trips', 'doses', 'meds', 'courses', 'stock', 'vaccines', 'episodes', 'docs', 'files', 'family'];
const PAGES = {}, TABS = {};
let D = ST.get('data', {}); COLS.forEach(c => { if (!Array.isArray(D[c])) D[c] = []; });
let S = Object.assign({ me: '', url: '', key: '', rev: 0, calId: '', calKw: 'lekarz, wizyta, przychodnia, pediatra, szczepienie, dentysta, bilans', remind: 60, lastSync: 0, syncErr: '' }, ST.get('set', {}));
let P = ST.get('pending', {});
const IS_WEB = !N;
// Adres kreatora (Kreator.gs wdrożony raz przez Alana) – można też wpisać w Więcej
const INSTALLER_URL = '';
function applyCfg(u, k, me) {
  if (!u || !k || (u === S.url && k === S.key)) return false;
  S.url = u; S.key = k; if (me && !S.me) S.me = me; S.rev = 0; S.syncErr = ''; ST.set('set', S);
  setTimeout(() => { toast('Połączono z arkuszem rodziny – synchronizuję'); if (typeof sync === 'function') sync(false); if (typeof render === 'function') render(); }, 300);
  return true;
}
function startWizard() {
  saveSet();
  const inst = S.inst || INSTALLER_URL;
  if (!inst) { toast('Wpisz najpierw adres kreatora (poniżej)'); const e = $('#sInst'); if (e) e.focus(); return; }
  const ret = N ? 'android' : location.origin + location.pathname;
  const url = inst + (inst.includes('?') ? '&' : '?') + 'ret=' + encodeURIComponent(ret);
  if (N) location.href = url; else window.open(url, '_blank');
}
async function pasteCfg() {
  let t = '';
  try { t = N && N.clip ? N.clip() : await navigator.clipboard.readText(); } catch (e) { }
  if (!/^AS-RODZINA\|/.test(t || '')) t = prompt('Wklej tekst konfiguracji (zaczyna się od AS-RODZINA|):') || '';
  const m = t.trim().match(/^AS-RODZINA\|(https:\/\/[^|\s]+)\|(\w+)$/);
  if (!m) { if (t) toast('To nie jest tekst konfiguracji AS Rodzina'); return; }
  if (!applyCfg(m[1], m[2])) toast('Ta konfiguracja jest już ustawiona');
}
(function cfgFromLink() {
  try {
    const h = new URLSearchParams((location.hash || '').slice(1));
    if (h.get('u') && h.get('k')) applyCfg(h.get('u'), h.get('k'), h.get('me'));
  } catch (e) { }
})();
let EV = ST.get('evmap', {});
const live = c => D[c].filter(x => !x.del);
const byId = (c, id) => D[c].find(x => x.id === id);
function saveAll() { ST.set('data', D); ST.set('pending', P); ST.set('set', S); }
function put(c, o) {
  o.id = o.id || uid(); o.u = Date.now(); if (o.by == null) o.by = S.me || '';
  const i = D[c].findIndex(x => x.id === o.id); if (i < 0) D[c].push(o); else D[c][i] = o;
  P[c + '|' + o.id] = o.u; saveAll(); if (c === 'shop') pushWidget(); schedSync(); setDot(); return o;
}
function del(c, id) { const o = byId(c, id); if (o) { o.del = 1; put(c, o); } }

// ---------- synchronizacja ----------
let syncing = false, syncT = null;
const CB = {}; let cbN = 0;
function schedSync(ms = 1500) { clearTimeout(syncT); syncT = setTimeout(() => sync(false), ms); }
function post(url, obj) {
  return new Promise(res => {
    const body = JSON.stringify(obj);
    const parse = t => { try { return JSON.parse(t); } catch (e) { return { ok: false, err: 'Zła odpowiedź skryptu (sprawdź wdrożenie i dostęp „Każdy”)' }; } };
    if (N) { const id = ++cbN; CB[id] = (ok, t) => res(ok ? parse(t) : { ok: false, err: t }); N.post(url, body, id); }
    else fetch(url, { method: 'POST', body }).then(r => r.text()).then(t => res(parse(t))).catch(e => res({ ok: false, err: String(e) }));
  });
}
async function sync(manual) {
  if (!S.url || !S.key) { if (manual) toast('Ustaw adres skryptu i klucz w Więcej → Synchronizacja'); setDot(); return; }
  if (syncing) { schedSync(3000); return; }
  syncing = true; setDot();
  const sent = Object.assign({}, P);
  const changes = Object.keys(sent).map(k => { const i = k.indexOf('|'), c = k.slice(0, i), id = k.slice(i + 1); const o = byId(c, id); return o ? { c, id, u: o.u, del: o.del ? 1 : 0, d: o } : null; }).filter(Boolean);
  const r = await post(S.url, { key: S.key, rev: S.rev || 0, changes });
  syncing = false;
  if (!r || !r.ok) { S.syncErr = (r && r.err) || 'błąd'; saveAll(); setDot(); if (manual) toast('Synchronizacja: ' + S.syncErr); return; }
  Object.keys(sent).forEach(k => { if (P[k] === sent[k]) delete P[k]; });
  let ch = 0;
  (r.rows || []).forEach(w => {
    if (!COLS.includes(w.c)) return;
    const l = byId(w.c, w.id); if (l && l.u >= w.u) return;
    const o = w.d || {}; o.id = w.id; o.u = w.u; if (w.del) o.del = 1; else delete o.del;
    const i = D[w.c].findIndex(x => x.id === w.id); if (i < 0) D[w.c].push(o); else D[w.c][i] = o; ch++;
  });
  S.rev = r.rev || S.rev; S.lastSync = Date.now(); S.syncErr = ''; saveAll(); setDot();
  if (ch) { pushWidget(); if (!$('#ov').classList.contains('on')) render(); }
  if (manual) toast(ch ? 'Pobrano zmiany: ' + ch : 'Wszystko aktualne');
  if (Object.keys(P).length) schedSync(2000);
}
function setDot() {
  const d = $('#dot'); if (!d) return;
  d.style.background = !S.url || !S.key ? '#9ca3af' : S.syncErr ? '#dc2626' : (syncing || Object.keys(P).length) ? '#f59e0b' : '#22c55e';
}

// ---------- widżet ----------
function pushWidget() {
  if (!N) return;
  const it = live('shop').filter(x => !x.done).sort(shopSort).map(x => ({ id: x.id, n: x.name, q: x.qty || '', s: x.shop || '' }));
  try { N.widget(JSON.stringify(it)); } catch (e) { }
}
function applyWidgetOps() {
  if (!N) return;
  let ops = []; try { ops = JSON.parse(N.widgetOps() || '[]'); } catch (e) { }
  ops.forEach(op => { const o = byId('shop', op.id); if (o && !o.del && (o.u || 0) < op.t) { o.done = op.d ? 1 : 0; o.doneBy = S.me; put('shop', o); } });
}

// ---------- UI: podstawy ----------
let tab = 'kids', pages = [];
function toast(t) { const e = $('#toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(e._t); e._t = setTimeout(() => e.style.display = 'none', 2600); }
function sheet(html) { $('#sheet').innerHTML = html; $('#ov').classList.add('on'); $('#sheet').scrollTop = 0; }
function closeSheet() { $('#ov').classList.remove('on'); $('#sheet').innerHTML = ''; }
$('#ov').addEventListener('click', e => { if (e.target.id === 'ov') closeSheet(); });
$('#sheet').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c || !c.parentElement.dataset.multi) return;
  if (c.parentElement.dataset.multi === '0') $$('.chip', c.parentElement).forEach(x => x !== c && x.classList.remove('on'));
  c.classList.toggle('on');
});
function go(t) { tab = t; pages = []; render(); window.scrollTo(0, 0); }
function openP(p) { pages.push(p); render(); window.scrollTo(0, 0); }
$$('#nav button').forEach(b => b.onclick = () => go(b.dataset.t));
const opt = (o, v) => o.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('');

function form(title, fields, vals, onSave, o = {}) {
  vals = vals || {};
  const h = fields.map(f => {
    const v = vals[f.k] ?? f.def ?? '', id = 'f_' + f.k;
    if (f.t === 'sel') return `<label>${f.l}<select id="${id}">${opt(f.o, v)}</select></label>`;
    if (f.t === 'area') return `<label>${f.l}<textarea id="${id}" rows="${f.r || 3}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea></label>`;
    if (f.t === 'chk') return `<label class="row" style="margin:12px 0"><input type="checkbox" id="${id}"${v ? ' checked' : ''}> ${f.l}</label>`;
    if (f.t === 'chips') {
      const arr = Array.isArray(v) ? v : (v ? [v] : []);
      const known = f.o.map(x => Array.isArray(x) ? x[0] : x);
      const extra = arr.filter(x => !known.includes(x)).join(', ');
      return `<div class="lab">${f.l}</div><div class="chips" id="${id}" data-multi="${f.single ? 0 : 1}">${f.o.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<button type="button" class="chip${arr.includes(val) ? ' on' : ''}" data-v="${esc(val)}">${esc(lab)}</button>`; }).join('')}</div>` + (f.extra ? `<input id="${id}_x" placeholder="${esc(f.extra)}" value="${esc(extra)}">` : '');
    }
    return `<label>${f.l}<input id="${id}" type="${f.t || 'text'}" value="${esc(f.t === 'number' ? fmtN(v).replace(',', '.') : v)}"${f.list ? ` list="dl_${f.k}"` : ''}${f.t === 'number' ? ' inputmode="decimal" step="any"' : ''} placeholder="${esc(f.ph || '')}">${f.list ? `<datalist id="dl_${f.k}">${f.list.map(x => `<option value="${esc(x)}">`).join('')}</datalist>` : ''}</label>`;
  }).join('');
  sheet(`<h2>${esc(title)}</h2>${o.top || ''}<div class="form">${h}</div><div class="btns" style="margin-top:16px">${o.del ? '<button class="b danger" id="fDel">Usuń</button>' : ''}<span style="flex:1"></span><button class="b" id="fCancel">Anuluj</button><button class="b pri" id="fSave">${o.save || 'Zapisz'}</button></div>`);
  $('#fCancel').onclick = closeSheet;
  if (o.del) $('#fDel').onclick = () => { if (confirm(o.delMsg || 'Usunąć?')) { o.del(); closeSheet(); render(); } };
  $('#fSave').onclick = () => {
    const out = {};
    for (const f of fields) {
      const el = $('#f_' + f.k);
      if (f.t === 'chips') {
        let a = $$('.chip.on', el).map(x => x.dataset.v);
        if (f.extra) a = a.concat(($('#f_' + f.k + '_x').value || '').split(',').map(s => s.trim()).filter(Boolean));
        out[f.k] = f.single ? (a[0] || '') : a;
      } else if (f.t === 'chk') out[f.k] = el.checked;
      else if (f.t === 'number') out[f.k] = num(el.value);
      else out[f.k] = el.value.trim();
      if (f.req && (out[f.k] === '' || (Array.isArray(out[f.k]) && !out[f.k].length))) { toast('Uzupełnij: ' + f.l); el.focus && el.focus(); return; }
    }
    if (onSave(out) !== false) { closeSheet(); render(); }
  };
}

// ---------- dzieci ----------
function ageOf(b) {
  if (!b) return null; const d = toDate(b), n = new Date(); if (isNaN(d)) return null;
  let m = (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth(); if (n.getDate() < d.getDate()) m--;
  return { y: Math.floor(m / 12), m: m % 12, yf: m / 12 };
}
function ageTxt(b) { const a = ageOf(b); if (!a) return ''; if (a.y < 2) return (a.y * 12 + a.m) + ' mies.'; return a.y + ' l.' + (a.y < 10 && a.m ? ' ' + a.m + ' mies.' : ''); }
const kids = () => live('children').sort((a, b) => (a.birth || '9').localeCompare(b.birth || '9'));
const kidName = id => (byId('children', id) || {}).name || '?';
function avatar(k, sz = 44) { return `<div class="av" style="background:${k.color || COLORS[0]};width:${sz}px;height:${sz}px;font-size:${sz * 0.42}px">${esc((k.name || '?')[0].toUpperCase())}</div>`; }
function lastMeasure(id) { return live('measures').filter(m => m.child === id).sort((a, b) => b.date.localeCompare(a.date))[0]; }
const symTxt = s => (s.sym || []).join(', ');

function vKids() {
  const ks = kids(), nl = nowLocal();
  const up = live('visits').filter(v => v.dt >= nl.slice(0, 10)).sort((a, b) => a.dt.localeCompare(b.dt)).slice(0, 6);
  let h = `<div class="btns"><button class="b pri" onclick="editChild()">＋ Dziecko</button><button class="b" onclick="editVisit()">＋ Wizyta</button><button class="b" onclick="editSym()">＋ Objaw</button><button class="b" onclick="openP({t:'cal'})">📅 Z kalendarza</button></div>`;
  if (up.length) h += `<div class="card"><h2>Najbliższe wizyty</h2><div class="list">${up.map(v => `<div class="it" onclick="editVisit('${v.id}')"><div class="grow"><b>${esc(fmtDT(v.dt))}</b> · ${esc(kidName(v.child))}<div class="mut">${esc([v.spec, v.place].filter(Boolean).join(' · '))}</div></div>${v.dt.slice(0, 10) === today() ? '<span class="tag yel">dziś</span>' : ''}</div>`).join('')}</div></div>`;
  if (!ks.length) h += `<div class="card empty">Dodaj dzieci, żeby zapisywać parametry, objawy i wizyty.<br><br>Rozmiary ubrań i wiek przydają się też w Pakowaniu.</div>`;
  ks.forEach(k => {
    const m = lastMeasure(k.id);
    const rec = live('symptoms').filter(s => s.child === k.id && Date.now() - toDate(s.dt).getTime() < 3 * 864e5);
    h += `<div class="card kid row" onclick="openP({t:'child',id:'${k.id}'})">${avatar(k)}<div class="grow"><b style="font-size:17px">${esc(k.name)}</b> <span class="mut">${esc(ageTxt(k.birth))}</span><div class="mut">${m ? esc([m.h ? fmtN(m.h) + ' cm' : '', m.w ? fmtN(m.w) + ' kg' : ''].filter(Boolean).join(' · ') + ' (' + fmtD(m.date) + ')') : 'brak pomiarów'}</div>${k.allergy ? `<span class="tag red">alergie</span> ` : ''}${rec.length ? `<span class="tag yel">objawy (3 dni): ${rec.length}</span>` : ''}</div><span class="mut" style="font-size:22px">›</span></div>`;
  });
  return h;
}

function editChild(id) {
  const k = id ? byId('children', id) : { color: COLORS[live('children').length % COLORS.length] };
  form(id ? 'Edytuj osobę' : 'Nowa osoba w rodzinie', [
    { k: 'name', l: 'Imię', req: 1 }, { k: 'pesel', l: 'PESEL (sam uzupełni datę urodzenia i płeć)', ph: '11 cyfr' }, { k: 'birth', l: 'Data urodzenia', t: 'date' },
    { k: 'sex', l: 'Płeć', t: 'sel', o: [['', '—'], ['d', 'dziewczynka / kobieta'], ['c', 'chłopiec / mężczyzna']] },
    { k: 'bodyT', l: 'Sylwetka na mapie ciała', t: 'sel', o: BODY_KINDS },
    { k: 'blood', l: 'Grupa krwi', ph: 'np. A Rh+' },
    { k: 'allergy', l: 'Alergie', t: 'area', r: 2 }, { k: 'chronic', l: 'Choroby przewlekłe', t: 'area', r: 2 },
    { k: 'meds', l: 'Leki stałe (nazwa, jak podawane – wg lekarza)', t: 'area', r: 2 },
    { k: 'clothes', l: 'Rozmiar ubrań', ph: 'np. 116' }, { k: 'shoe', l: 'Rozmiar buta', ph: 'np. 29' },
    { k: 'doctor', l: 'Lekarz / przychodnia' }, { k: 'notes', l: 'Uwagi', t: 'area', r: 2 },
    { k: 'bpOn', l: 'Pokazuj pomiary ciśnienia krwi', t: 'chk' }, { k: 'gluOn', l: 'Pokazuj pomiary glukozy (cukru)', t: 'chk' },
    { k: 'color', l: 'Kolor', t: 'sel', o: COLORS.map((c, i) => [c, ['Koral', 'Morski', 'Fiolet', 'Zieleń', 'Bursztyn', 'Róż', 'Turkus', 'Indygo'][i]]) }
  ], k, v => { const pi = v.pesel ? peselInfo(v.pesel) : null; if (v.pesel && (!pi || pi.err)) { toast('PESEL: ' + ((pi && pi.err) || 'musi mieć 11 cyfr')); return false; } if (pi) { v.pesel = v.pesel.replace(/\D/g, ''); v.birth = pi.birth; if (!v.sex) v.sex = pi.sex; } const r = put('children', Object.assign(k, v)); bdaySync(r); }, id ? { del: () => { bdayDel(id); del('children', id); }, delMsg: 'Usunąć osobę? Pomiary, objawy i wizyty zostaną w danych.' } : {});
  const pe = $('#f_pesel'); if (pe) pe.oninput = () => { const pi = peselInfo(pe.value); if (pi && !pi.err) { $('#f_birth').value = pi.birth; $('#f_sex').value = pi.sex; pe.style.borderColor = 'var(--ok)'; } else pe.style.borderColor = pe.value.replace(/\D/g, '').length === 11 ? 'var(--bad)' : ''; };
}

function pChild(id) {
  const k = byId('children', id); if (!k || k.del) { pages.pop(); return vKids(); }
  const ms = live('measures').filter(m => m.child === id).sort((a, b) => b.date.localeCompare(a.date));
  const sy = live('symptoms').filter(s => s.child === id).sort((a, b) => b.dt.localeCompare(a.dt));
  const vs = live('visits').filter(v => v.child === id).sort((a, b) => b.dt.localeCompare(a.dt));
  const nl = nowLocal();
  const row = (l, v) => v ? `<b>${l}</b><span>${esc(v)}</span>` : '';
  let h = `<div class="card"><div class="row">${avatar(k, 56)}<div class="grow"><div class="big">${esc(k.name)}</div><div class="mut">${esc(fmtD(k.birth))} · ${esc(ageTxt(k.birth))}</div></div><button class="b sm" onclick="editChild('${id}')">Edytuj</button></div>
  <div class="kv" style="margin-top:10px">${row('Grupa krwi', k.blood)}${row('Alergie', k.allergy)}${row('Choroby', k.chronic)}${row('Leki stałe', k.meds)}${row('Ubrania', k.clothes)}${row('But', k.shoe)}${row('Lekarz', k.doctor)}${row('Uwagi', k.notes)}</div>
  <div class="btns" style="margin-top:12px"><button class="b pri" onclick="reportDlg('${id}')">📄 Raport przed wizytą</button></div></div>`;
  h += `<div class="card"><div class="row"><h2 style="flex:1">Objawy</h2><button class="b sm pri" onclick="editSym(null,'${id}')">＋ Objaw</button></div>`;
  h += sy.length ? `<div class="list">${sy.slice(0, 25).map(s => `<div class="it" onclick="editSym('${s.id}')"><div class="grow"><b>${esc(symTxt(s))}</b>${s.temp ? ` <span class="tag ${s.temp >= 38 ? 'red' : 'yel'}">${fmtN(s.temp)}°C</span>` : ''}<div class="mut">${esc(fmtDT(s.dt))}${s.sev ? ' · ' + esc(s.sev) : ''}${s.given ? ' · podano: ' + esc(s.given) : ''}${s.note ? ' · ' + esc(s.note) : ''}</div></div></div>`).join('')}</div>` : '<div class="mut">Brak wpisów.</div>';
  h += `</div><div class="card"><div class="row"><h2 style="flex:1">Wizyty</h2><button class="b sm pri" onclick="editVisit(null,'${id}')">＋ Wizyta</button></div>`;
  h += vs.length ? `<div class="list">${vs.slice(0, 20).map(v => `<div class="it" onclick="editVisit('${v.id}')"><div class="grow"><b>${esc(fmtDT(v.dt))}</b> ${v.dt >= nl ? '<span class="tag grn">zaplanowana</span>' : ''}<div class="mut">${esc([v.spec, v.place, v.reason].filter(Boolean).join(' · '))}</div>${v.recs ? `<div class="mut">Zalecenia: ${esc(v.recs)}</div>` : ''}</div></div>`).join('')}</div>` : '<div class="mut">Brak wizyt.</div>';
  h += `</div><div class="card"><div class="row"><h2 style="flex:1">Pomiary</h2><button class="b sm pri" onclick="editMeasure(null,'${id}')">＋ Pomiar</button></div>`;
  h += ms.length ? `<table><tr><th>Data</th><th>Wzrost</th><th>Waga</th><th>Obwód gł.</th></tr>${ms.slice(0, 30).map(m => `<tr onclick="editMeasure('${m.id}')"><td>${esc(fmtD(m.date))}</td><td>${m.h ? fmtN(m.h) + ' cm' : ''}</td><td>${m.w ? fmtN(m.w) + ' kg' : ''}</td><td>${m.hc ? fmtN(m.hc) + ' cm' : ''}</td></tr>`).join('')}</table>` : '<div class="mut">Brak pomiarów.</div>';
  return h + '</div>';
}

function editMeasure(id, child) {
  const m = id ? byId('measures', id) : { child, date: today() };
  form('Pomiar – ' + kidName(m.child), [
    { k: 'date', l: 'Data', t: 'date', req: 1 }, { k: 'h', l: 'Wzrost (cm)', t: 'number' }, { k: 'w', l: 'Waga (kg)', t: 'number' },
    { k: 'hc', l: 'Obwód głowy (cm)', t: 'number' }, { k: 'note', l: 'Uwagi' }
  ], m, v => { put('measures', Object.assign(m, v)); }, id ? { del: () => del('measures', id) } : {});
}

function editSym(id, child) {
  const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const s = id ? byId('symptoms', id) : { child: child || (pages.length && pages[pages.length - 1].id) || ks[0].id, dt: nowLocal(), sym: [] };
  form(id ? 'Objaw' : 'Nowy objaw', [
    { k: 'child', l: 'Dziecko', t: 'sel', o: ks.map(k => [k.id, k.name]) }, { k: 'dt', l: 'Kiedy', t: 'datetime-local', req: 1 },
    { k: 'sym', l: 'Objawy', t: 'chips', o: SYMPTOMS, extra: 'inne objawy (po przecinku)', req: 1 },
    { k: 'temp', l: 'Temperatura (°C)', t: 'number', ph: 'np. 38,4' },
    { k: 'sev', l: 'Nasilenie', t: 'sel', o: [['', '—'], 'łagodne', 'umiarkowane', 'silne'] },
    { k: 'given', l: 'Co podano (lek, ile, o której) – zapis dla lekarza' }, { k: 'note', l: 'Uwagi', t: 'area', r: 2 }
  ], s, v => { put('symptoms', Object.assign(s, v)); }, id ? { del: () => del('symptoms', id) } : {});
}

function editVisit(id, child) {
  const ks = kids(); if (!ks.length) { toast('Najpierw dodaj dziecko'); return; }
  const def = new Date(); def.setDate(def.getDate() + 1); def.setHours(9, 0, 0, 0);
  const v = id ? byId('visits', id) : { child: child || ks[0].id, dt: msToLocal(def.getTime()), dur: 30, cal: N ? !!S.calId : true };
  form(id ? 'Wizyta' : 'Nowa wizyta', [
    { k: 'child', l: 'Dziecko', t: 'sel', o: ks.map(k => [k.id, k.name]) }, { k: 'dt', l: 'Data i godzina', t: 'datetime-local', req: 1 },
    { k: 'dur', l: 'Czas trwania (min)', t: 'number' }, { k: 'spec', l: 'Lekarz / rodzaj', list: SPECS },
    { k: 'place', l: 'Miejsce' }, { k: 'reason', l: 'Cel wizyty' },
    { k: 'questions', l: 'Pytania do lekarza', t: 'area', r: 3 },
    { k: 'recs', l: 'Po wizycie: rozpoznanie i zalecenia', t: 'area', r: 3 },
    { k: 'cal', l: N ? 'Zapisz w kalendarzu Google (przez kalendarz telefonu)' : 'Dodaj do kalendarza po zapisie', t: 'chk' }
  ], v, val => {
    Object.assign(v, val); if (!v.dur) v.dur = 30;
    if (!v.id) v.id = uid();
    if (v.cal) calWrite(v);
    put('visits', v);
  }, id ? { del: () => { if (EV[id] && N) { N.calDelete(String(EV[id])); delete EV[id]; ST.set('evmap', EV); } del('visits', id); }, delMsg: 'Usunąć wizytę (także z kalendarza w tym telefonie)?' } : {});
}

// ---------- kalendarz ----------
function calTitle(v) { return (v.spec || 'Wizyta') + ': ' + kidName(v.child); }
function calWrite(v) {
  if (!N) { setTimeout(() => calWebDlg(v.id), 50); return; }
  if (!N.calHasPerm()) { N.calReqPerm(); toast('Zezwól na kalendarz i zapisz wizytę jeszcze raz'); return; }
  if (!S.calId) { toast('Wybierz kalendarz w Więcej → Kalendarz'); return; }
  const st = toDate(v.dt).getTime(), en = st + (+v.dur || 30) * 60000, title = calTitle(v);
  const desc = [v.reason && 'Cel: ' + v.reason, v.questions && 'Pytania: ' + v.questions, 'AS Rodzina'].filter(Boolean).join('\n');
  let ok = false;
  if (EV[v.id]) ok = N.calUpdate(String(EV[v.id]), title, desc, v.place || '', st, en);
  if (!ok) { const eid = N.calInsert(String(S.calId), title, desc, v.place || '', st, en, +S.remind || 0); if (eid) { EV[v.id] = eid; ok = true; } }
  ST.set('evmap', EV);
  if (ok) { v.calKey = title + '|' + st; toast('Zapisano w kalendarzu'); } else toast('Nie udało się zapisać w kalendarzu');
}
function calWebDlg(id) {
  const v = byId('visits', id); if (!v) return;
  const st = toDate(v.dt), en = new Date(st.getTime() + (+v.dur || 30) * 60000), title = calTitle(v);
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const desc = [v.reason && 'Cel: ' + v.reason, v.questions && 'Pytania: ' + v.questions, 'AS Rodzina'].filter(Boolean).join('\n');
  const g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + z(st) + '/' + z(en) + '&details=' + encodeURIComponent(desc) + '&location=' + encodeURIComponent(v.place || '');
  sheet(`<h2>Dodaj do kalendarza</h2><p class="mut">${esc(title)} · ${esc(fmtDT(v.dt))}</p><div class="btns" style="flex-direction:column"><a class="b pri" style="text-align:center;text-decoration:none" href="${esc(g)}" target="_blank" rel="noopener">Kalendarz Google</a><button class="b" onclick="icsDl('${v.id}')">Kalendarz iPhone (.ics)</button><button class="b" onclick="closeSheet()">Pomiń</button></div><p class="mut">Jeśli wizytę zapisał telefon z Androidem we wspólnym kalendarzu, nie dodawaj jej drugi raz.</p>`);
}
function icsDl(id) {
  const v = byId('visits', id), st = toDate(v.dt), en = new Date(st.getTime() + (+v.dur || 30) * 60000);
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const e = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const rem = +S.remind || 0;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alan Solutions//AS Rodzina//PL', 'BEGIN:VEVENT', 'UID:' + v.id + '@as-rodzina', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(st), 'DTEND:' + z(en), 'SUMMARY:' + e(calTitle(v)), 'LOCATION:' + e(v.place), 'DESCRIPTION:' + e([v.reason, v.questions].filter(Boolean).join('\n'))]
    .concat(rem ? ['BEGIN:VALARM', 'TRIGGER:-PT' + rem + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:Wizyta', 'END:VALARM'] : []).concat(['END:VEVENT', 'END:VCALENDAR']).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'wizyta.ics'; document.body.appendChild(a); a.click(); a.remove();
}
let calCand = [];
function pCal() {
  if (!N) return '<div class="card"><h2>Kalendarz na iPhonie</h2><p class="mut">Przeglądarka nie ma dostępu do kalendarza. Wizyty z kalendarza pobiera telefon z Androidem, a po synchronizacji pojawiają się tutaj. Przy zapisie wizyty z zaznaczonym „kalendarzem” dostaniesz przyciski: Kalendarz Google albo plik .ics do kalendarza iPhone.</p></div>';
  if (!N.calHasPerm()) return `<div class="card"><h2>Dostęp do kalendarza</h2><p class="mut">Aplikacja czyta i zapisuje wizyty w kalendarzu telefonu. Kalendarz Google na telefonie synchronizuje je z kontem Google.</p><button class="b pri" onclick="N.calReqPerm()">Zezwól</button></div>`;
  if (!S.calId) return `<div class="card"><h2>Wybierz kalendarz</h2><p class="mut">Ustaw go w Więcej → Kalendarz.</p><button class="b pri" onclick="go('more')">Przejdź</button></div>`;
  let evs = []; try { evs = JSON.parse(N.calQuery(String(S.calId), Date.now() - 60 * 864e5, Date.now() + 365 * 864e5) || '[]'); } catch (e) { }
  // zmiany z kalendarza → wizyty powiązane na tym telefonie
  let upd = 0;
  Object.keys(EV).forEach(vid => {
    const e = evs.find(x => String(x.id) === String(EV[vid])), v = byId('visits', vid);
    if (!e || !v || v.del) return;
    const dt = msToLocal(e.begin), dur = Math.round((e.end - e.begin) / 60000) || v.dur;
    if (dt !== v.dt || dur !== v.dur || (e.loc || '') !== (v.place || '')) { v.dt = dt; v.dur = dur; v.place = e.loc || v.place; v.calKey = (e.title || '') + '|' + e.begin; put('visits', v); upd++; }
  });
  const kw = S.calKw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ks = kids(), names = ks.map(k => k.name.toLowerCase());
  const known = new Set(live('visits').map(v => v.calKey).filter(Boolean)), linked = new Set(Object.values(EV).map(String));
  calCand = evs.filter(e => { const t = (e.title || '').toLowerCase(); return !linked.has(String(e.id)) && !known.has((e.title || '') + '|' + e.begin) && (kw.some(w => t.includes(w)) || names.some(n => n && t.includes(n))); });
  let h = upd ? `<div class="card">Zaktualizowano z kalendarza: ${upd} wizyt(y).</div>` : '';
  h += `<div class="card"><h2>Wizyty znalezione w kalendarzu</h2><p class="mut">Wydarzenia z ostatnich 60 dni i najbliższego roku, w tytule słowo kluczowe albo imię dziecka. Już dodane są pomijane.</p>`;
  if (!calCand.length) h += '<div class="mut">Nic nowego.</div>';
  else h += `<div class="list">${calCand.map((e, i) => { const t = (e.title || '').toLowerCase(); const g = ks.find(k => t.includes(k.name.toLowerCase())); return `<div class="it" style="flex-wrap:wrap"><div class="grow"><b>${esc(e.title)}</b><div class="mut">${esc(fmtDT(msToLocal(e.begin)))}${e.loc ? ' · ' + esc(e.loc) : ''}</div></div><select id="cc${i}" style="width:130px;margin:0"><option value="">— dziecko —</option>${opt(ks.map(k => [k.id, k.name]), g ? g.id : '')}</select><button class="b sm pri" onclick="calImport(${i})">Dodaj</button></div>`; }).join('')}</div>`;
  return h + `</div><div class="btns"><button class="b" onclick="render()">↻ Odśwież</button></div>`;
}
function calImport(i) {
  const e = calCand[i], ch = $('#cc' + i).value; if (!ch) { toast('Wybierz dziecko'); return; }
  const t = (e.title || ''), sp = SPECS.find(s => t.toLowerCase().includes(s.toLowerCase())) || '';
  const v = { id: uid(), child: ch, dt: msToLocal(e.begin), dur: Math.round((e.end - e.begin) / 60000) || 30, spec: sp, place: e.loc || '', reason: sp ? '' : t, cal: true, calKey: t + '|' + e.begin };
  EV[v.id] = e.id; ST.set('evmap', EV); put('visits', v); toast('Dodano wizytę'); render();
}

// ---------- raport przed wizytą ----------
function reportDlg(id) {
  const vs = live('visits').filter(v => v.child === id && v.dt < nowLocal()).sort((a, b) => b.dt.localeCompare(a.dt));
  const o = [['last', vs.length ? 'Od ostatniej wizyty (' + fmtD(vs[0].dt) + ')' : 'Od ostatniej wizyty (brak – 30 dni)'], ['7', 'Ostatnie 7 dni'], ['14', 'Ostatnie 14 dni'], ['30', 'Ostatnie 30 dni'], ['90', 'Ostatnie 3 miesiące']];
  form('Raport przed wizytą', [{ k: 'p', l: 'Okres objawów', t: 'sel', o }], { p: 'last' }, v => { openP({ t: 'rep', id, p: v.p }); return true; }, { save: 'Pokaż raport' });
}
function repData(id, p) {
  const k = byId('children', id);
  let from;
  if (p === 'last') { const v = live('visits').filter(v => v.child === id && v.dt < nowLocal()).sort((a, b) => b.dt.localeCompare(a.dt))[0]; from = v ? v.dt : msToLocal(Date.now() - 30 * 864e5); }
  else from = msToLocal(Date.now() - (+p) * 864e5);
  const sy = live('symptoms').filter(s => s.child === id && s.dt >= from).sort((a, b) => a.dt.localeCompare(b.dt));
  const ms = live('measures').filter(m => m.child === id).sort((a, b) => b.date.localeCompare(a.date));
  const vs = live('visits').filter(v => v.child === id).sort((a, b) => b.dt.localeCompare(a.dt));
  const next = vs.filter(v => v.dt >= nowLocal()).pop();
  const past = vs.filter(v => v.dt < nowLocal()).slice(0, 3);
  const sum = {};
  sy.forEach(s => (s.sym || []).forEach(x => { const o = sum[x] || (sum[x] = { n: 0, a: s.dt, b: s.dt }); o.n++; o.b = s.dt; }));
  const temps = sy.filter(s => s.temp);
  return { k, from, sy, ms, next, past, sum, temps };
}
function tempSvg(temps) {
  if (temps.length < 2) return '';
  const W = 640, H = 170, pl = 34, pr = 10, pt = 10, pb = 24;
  const t0 = toDate(temps[0].dt).getTime(), t1 = toDate(temps[temps.length - 1].dt).getTime() || t0 + 1;
  const lo = Math.min(36, ...temps.map(t => t.temp)) - 0.3, hi = Math.max(39.5, ...temps.map(t => t.temp)) + 0.3;
  const X = t => pl + (t1 === t0 ? 0 : (toDate(t.dt).getTime() - t0) / (t1 - t0)) * (W - pl - pr), Y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  let g = '';
  for (let v = Math.ceil(lo); v <= hi; v++) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ddd"/><text x="2" y="${Y(v) + 4}" font-size="11" fill="#666">${v}°</text>`;
  g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(38)}" y2="${Y(38)}" stroke="#ef4444" stroke-dasharray="4 3"/>`;
  const pts = temps.map(t => X(t).toFixed(1) + ',' + Y(t.temp).toFixed(1)).join(' ');
  g += `<polyline points="${pts}" fill="none" stroke="#1e4d78" stroke-width="2"/>` + temps.map(t => `<circle cx="${X(t)}" cy="${Y(t.temp)}" r="3.5" fill="${t.temp >= 38 ? '#dc2626' : '#1e4d78'}"/>`).join('');
  g += `<text x="${pl}" y="${H - 6}" font-size="11" fill="#666">${esc(fmtDT(temps[0].dt))}</text><text x="${W - pr}" y="${H - 6}" font-size="11" fill="#666" text-anchor="end">${esc(fmtDT(temps[temps.length - 1].dt))}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:640px">${g}</svg>`;
}
function repHtml(r) {
  const k = r.k, m = r.ms[0], m2 = r.ms[1];
  const kv = (l, v) => v ? `<tr><th style="width:34%">${l}</th><td>${esc(v)}</td></tr>` : '';
  let h = `<h1 style="font-size:22px;margin:0">Raport przed wizytą – ${esc(k.name)}</h1><div class="mut">Przygotowano ${esc(fmtD(today()))} · objawy od ${esc(fmtDT(r.from))}</div>`;
  if (r.next) h += `<p><b>Wizyta:</b> ${esc(fmtDT(r.next.dt))} · ${esc([r.next.spec, r.next.place].filter(Boolean).join(' · '))}</p>`;
  h += `<h3>Dane dziecka</h3><table>${kv('Data urodzenia', fmtD(k.birth) + (k.birth ? ' (' + ageTxt(k.birth) + ')' : ''))}${kv('Grupa krwi', k.blood)}${kv('Alergie', k.allergy || 'brak wpisu')}${kv('Choroby przewlekłe', k.chronic)}${kv('Leki stałe', k.meds)}`;
  if (m) h += kv('Ostatni pomiar (' + fmtD(m.date) + ')', [m.h && fmtN(m.h) + ' cm', m.w && fmtN(m.w) + ' kg', m.hc && 'obwód głowy ' + fmtN(m.hc) + ' cm'].filter(Boolean).join(', ') + (m2 && m.w && m2.w ? ` (poprzednio ${fmtN(m2.w)} kg, ${fmtD(m2.date)})` : ''));
  h += '</table>';
  const keys = Object.keys(r.sum);
  h += `<h3>Podsumowanie objawów</h3>`;
  if (!keys.length) h += '<p>Brak zapisanych objawów w tym okresie.</p>';
  else {
    h += `<table><tr><th>Objaw</th><th>Od</th><th>Do (ostatni wpis)</th><th>Wpisów</th></tr>${keys.map(x => `<tr><td>${esc(x)}</td><td>${esc(fmtDT(r.sum[x].a))}</td><td>${esc(fmtDT(r.sum[x].b))}</td><td>${r.sum[x].n}</td></tr>`).join('')}</table>`;
    if (r.temps.length) { const mx = r.temps.reduce((a, b) => b.temp > a.temp ? b : a); h += `<p><b>Temperatura:</b> ${r.temps.length} pomiarów, najwyższa ${fmtN(mx.temp)}°C (${esc(fmtDT(mx.dt))}).</p>${tempSvg(r.temps)}`; }
    h += `<h3>Przebieg (chronologicznie)</h3><table><tr><th>Kiedy</th><th>Objawy</th><th>Temp.</th><th>Nasilenie</th><th>Podano</th><th>Uwagi</th></tr>${r.sy.map(s => `<tr><td>${esc(fmtDT(s.dt))}</td><td>${esc(symTxt(s))}</td><td>${s.temp ? fmtN(s.temp) + '°C' : ''}</td><td>${esc(s.sev || '')}</td><td>${esc(s.given || '')}</td><td>${esc(s.note || '')}</td></tr>`).join('')}</table>`;
  }
  if (r.next && r.next.questions) h += `<h3>Pytania do lekarza</h3><p style="white-space:pre-wrap">${esc(r.next.questions)}</p>`;
  if (r.past.length) h += `<h3>Ostatnie wizyty</h3><table>${r.past.map(v => `<tr><td style="width:30%">${esc(fmtD(v.dt))}<br><span class="mut">${esc(v.spec || '')}</span></td><td>${esc(v.reason || '')}${v.recs ? '<br><b>Zalecenia:</b> ' + esc(v.recs) : ''}</td></tr>`).join('')}</table>`;
  return h;
}
function repText(r) {
  const k = r.k; const L = [`Raport przed wizytą – ${k.name}`, `Ur. ${fmtD(k.birth)} (${ageTxt(k.birth)})`];
  if (k.allergy) L.push('Alergie: ' + k.allergy); if (k.chronic) L.push('Choroby: ' + k.chronic); if (k.meds) L.push('Leki stałe: ' + k.meds);
  if (r.ms[0]) L.push(`Pomiar ${fmtD(r.ms[0].date)}: ${[r.ms[0].h && fmtN(r.ms[0].h) + ' cm', r.ms[0].w && fmtN(r.ms[0].w) + ' kg'].filter(Boolean).join(', ')}`);
  L.push('', 'Objawy od ' + fmtDT(r.from) + ':');
  r.sy.forEach(s => L.push(`• ${fmtDT(s.dt)}: ${symTxt(s)}${s.temp ? ', ' + fmtN(s.temp) + '°C' : ''}${s.sev ? ', ' + s.sev : ''}${s.given ? ', podano: ' + s.given : ''}${s.note ? ' (' + s.note + ')' : ''}`));
  if (!r.sy.length) L.push('brak wpisów');
  if (r.next && r.next.questions) L.push('', 'Pytania do lekarza:', r.next.questions);
  return L.join('\n');
}
const PRINT_CSS = `body{font:13px/1.4 system-ui,Roboto,sans-serif;color:#111;margin:18px}table{border-collapse:collapse;width:100%;margin:4px 0 10px}td,th{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f1f5f9}h3{margin:14px 0 4px;font-size:15px;color:#1e4d78}.mut{color:#666;font-size:12px}`;
let lastRep = null;
function scopeCss(css) { return css.replace(/(^|})\s*([^{}]+)\{/g, (m, a, sel) => a + sel.split(',').map(x => '#printArea ' + x.trim().replace(/^body\b/, '')).join(',') + '{'); }
function printHtml(html, name) {
  if (N) { N.print(html, name); return; }
  const st = html.match(/<style>([\s\S]*?)<\/style>/), body = html.replace(/<!doctype html>|<meta[^>]*>|<style>[\s\S]*?<\/style>/gi, '');
  let pa = $('#printArea'); if (!pa) { pa = document.createElement('div'); pa.id = 'printArea'; document.body.appendChild(pa); }
  pa.innerHTML = '<style>' + scopeCss(st ? st[1] : '') + '</style>' + body;
  const t = document.title; document.title = name; setTimeout(() => { window.print(); document.title = t; }, 100);
}
function shareText(title, text) {
  if (N) return N.share(title, text);
  if (navigator.share) navigator.share({ title, text }).catch(() => { });
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('Skopiowano do schowka'));
}
function pRep(id, p) {
  const r = repData(id, p); lastRep = r;
  return `<div class="btns"><button class="b pri" onclick="repPrint()">🖨 Drukuj / zapisz PDF</button><button class="b" onclick="repShare()">📤 Udostępnij tekst</button></div><div class="card" style="overflow-x:auto">${repHtml(r)}</div><p class="mut">${N ? 'W oknie druku wybierz „Zapisz jako PDF”, żeby mieć plik do wysłania.' : 'Na iPhonie: Drukuj → gest rozsunięcia na podglądzie → Udostępnij / Zachowaj w Plikach daje PDF.'}</p>`;
}
function repPrint() { printHtml(`<!doctype html><meta charset="utf-8"><style>${PRINT_CSS}</style>${repHtml(lastRep)}`, 'Raport ' + lastRep.k.name); }
function repShare() { shareText('Raport – ' + lastRep.k.name, repText(lastRep)); }

// ---------- zakupy ----------
let shopF = '*';
function shopList() { const own = live('shops').sort((a, b) => (a.o || 0) - (b.o || 0)).map(s => s.name); const hidden = new Set(live('shops').filter(s => s.hide).map(s => s.name)); return SHOPS0.filter(s => !hidden.has(s) && !own.includes(s)).concat(own.filter(s => !hidden.has(s))); }
function prodMap() {
  const m = {};
  Object.keys(CATALOG).forEach(c => CATALOG[c].forEach(n => m[n.toLowerCase()] = { name: n, cat: c, shop: '', builtin: 1 }));
  live('catalog').forEach(p => { const k = p.name.toLowerCase(); m[k] = Object.assign({}, m[k] || {}, { name: p.name, cat: p.cat || (m[k] && m[k].cat) || 'Inne', shop: p.shop || '', rec: p.id, builtin: m[k] && m[k].builtin }); });
  return m;
}
const shopSort = (a, b) => (CAT_ORDER.indexOf(a.cat || 'Inne') - CAT_ORDER.indexOf(b.cat || 'Inne')) || a.name.localeCompare(b.name, 'pl');
function vShop() {
  const all = live('shop'), todo = all.filter(x => !x.done), done = all.filter(x => x.done);
  const shops = shopList(), pm = prodMap();
  const cnt = s => todo.filter(x => (x.shop || '') === s).length;
  const chips = [['*', 'Wszystkie (' + todo.length + ')']].concat(shops.filter(s => cnt(s)).map(s => [s, s + ' (' + cnt(s) + ')'])).concat(cnt('') ? [['', 'Bez sklepu (' + cnt('') + ')']] : []);
  if (shopF !== '*' && !chips.some(c => c[0] === shopF)) shopF = '*';
  let h = `<div class="card"><div class="addbar"><input id="aName" list="dlProd" placeholder="Dodaj produkt…" autocomplete="off"><input id="aQty" placeholder="ilość"></div>
  <div class="addbar" style="margin-top:6px"><select id="aShop" style="flex:1;width:auto"><option value="">— sklep —</option>${opt(shops, shopF === '*' ? '' : shopF)}</select><button class="b pri" id="aAdd">＋</button><button class="b" onclick="catalogDlg()" title="Katalog">📋</button></div>
  <datalist id="dlProd">${Object.values(pm).map(p => `<option value="${esc(p.name)}">`).join('')}</datalist></div>`;
  h += `<div class="chips">${chips.map(c => `<button class="chip${c[0] === shopF ? ' on' : ''}" onclick="shopF=${esc(JSON.stringify(c[0]))};render()">${esc(c[1])}</button>`).join('')}</div>`;
  const vis = todo.filter(x => shopF === '*' || (x.shop || '') === shopF).sort(shopSort);
  const row = x => `<div class="it ${x.done ? 'done' : ''}"><button class="ck ${x.done ? 'on' : ''}" onclick="shopTog('${x.id}')">${x.done ? '✓' : ''}</button><div class="grow nm" onclick="editShop('${x.id}')">${esc(x.name)}${x.qty ? ` <span class="mut">· ${esc(x.qty)}</span>` : ''}${x.note ? `<div class="mut">${esc(x.note)}</div>` : ''}</div>${shopF === '*' && x.shop ? `<span class="tag">${esc(x.shop)}</span>` : ''}${x.by ? `<span class="mut" style="font-size:11px">${esc(x.by)}</span>` : ''}</div>`;
  h += '<div class="card list">';
  if (!vis.length) h += '<div class="empty">Lista jest pusta. Dodaj produkt albo wybierz z katalogu 📋</div>';
  else if (shopF === '*') {
    const groups = {}; vis.forEach(x => (groups[x.shop || ''] = groups[x.shop || ''] || []).push(x));
    Object.keys(groups).sort((a, b) => (a ? shops.indexOf(a) : 999) - (b ? shops.indexOf(b) : 999)).forEach(g => { h += `<div class="grp">${esc(g || 'Bez sklepu')}</div>` + groups[g].map(row).join(''); });
  } else h += vis.map(row).join('');
  h += '</div>';
  if (done.length) h += `<div class="card"><details><summary>Kupione (${done.length})</summary><div class="list">${done.sort((a, b) => (b.u || 0) - (a.u || 0)).map(row).join('')}</div><div class="btns"><button class="b danger" onclick="clearBought()">Wyczyść kupione</button></div></details></div>`;
  return h;
}
function bindShop() {
  const n = $('#aName'); if (!n) return;
  const add = () => {
    const name = n.value.trim(); if (!name) return;
    const pm = prodMap()[name.toLowerCase()], shop = $('#aShop').value || (pm && pm.shop) || '';
    if (live('shop').some(x => !x.done && x.name.toLowerCase() === name.toLowerCase() && (x.shop || '') === shop)) { toast('Już jest na liście'); return; }
    put('shop', { name: pm ? pm.name : name, qty: $('#aQty').value.trim(), shop, cat: pm ? pm.cat : 'Inne', done: 0 });
    const keepShop = $('#aShop').value; render(); $('#aShop').value = keepShop; $('#aName').focus();
  };
  $('#aAdd').onclick = add;
  n.onkeydown = $('#aQty').onkeydown = e => { if (e.key === 'Enter') add(); };
  n.onchange = () => { const pm = prodMap()[n.value.trim().toLowerCase()]; if (pm && pm.shop && !$('#aShop').value) $('#aShop').value = pm.shop; };
}
function shopTog(id) { const o = byId('shop', id); o.done = o.done ? 0 : 1; o.doneBy = S.me; put('shop', o); render(); }
function clearBought() { if (!confirm('Usunąć kupione z listy?')) return; live('shop').filter(x => x.done).forEach(x => { x.del = 1; put('shop', x); }); render(); }
function editShop(id) {
  const o = byId('shop', id);
  form('Produkt', [{ k: 'name', l: 'Nazwa', req: 1 }, { k: 'qty', l: 'Ilość' }, { k: 'shop', l: 'Sklep', t: 'sel', o: [['', '— bez sklepu —']].concat(shopList()) }, { k: 'note', l: 'Uwagi (np. marka)' }, { k: 'def', l: 'Zapamiętaj ten sklep dla produktu', t: 'chk' }],
    o, v => { const d = v.def; delete v.def; Object.assign(o, v); put('shop', o); if (d) setProdShop(o.name, o.shop, o.cat); }, { del: () => del('shop', id) });
}
function setProdShop(name, shop, cat) {
  const ex = live('catalog').find(p => p.name.toLowerCase() === name.toLowerCase());
  if (ex) { ex.shop = shop; put('catalog', ex); } else put('catalog', { name, cat: cat || 'Inne', shop });
}
function catalogDlg() {
  const pm = prodMap(), shops = shopList();
  const byCat = {}; Object.values(pm).forEach(p => (byCat[p.cat || 'Inne'] = byCat[p.cat || 'Inne'] || []).push(p));
  const cats = CAT_ORDER.filter(c => byCat[c]).concat(Object.keys(byCat).filter(c => !CAT_ORDER.includes(c)));
  const onList = new Set(live('shop').filter(x => !x.done).map(x => x.name.toLowerCase()));
  sheet(`<div class="row"><h2 style="flex:1">Katalog produktów</h2><button class="b sm" onclick="closeSheet();render()">Gotowe</button></div><p class="mut">Stuknij ＋, żeby dodać na listę. Wybierz sklep przy produkcie, żeby go zapamiętać.</p><button class="b" onclick="newProd()">＋ Własny produkt</button>` +
    cats.map((c, ci) => `<details${ci === 0 ? ' open' : ''}><summary>${esc(c)} (${byCat[c].length})</summary><div class="list">${byCat[c].sort((a, b) => a.name.localeCompare(b.name, 'pl')).map(p => `<div class="it"><div class="grow">${esc(p.name)}${p.builtin ? '' : ' <span class="tag">własny</span>'}</div><select style="width:115px;margin:0;padding:6px" onchange="setProdShop(${esc(JSON.stringify(p.name))},this.value,${esc(JSON.stringify(p.cat))})"><option value="">— sklep —</option>${opt(shops, p.shop)}</select><button class="b sm ${onList.has(p.name.toLowerCase()) ? '' : 'pri'}" onclick="catAdd(this,${esc(JSON.stringify(p.name))})">${onList.has(p.name.toLowerCase()) ? '✓' : '＋'}</button></div>`).join('')}</div></details>`).join(''));
}
function catAdd(btn, name) {
  const p = prodMap()[name.toLowerCase()];
  if (live('shop').some(x => !x.done && x.name.toLowerCase() === name.toLowerCase())) { toast('Już jest na liście'); return; }
  put('shop', { name: p.name, qty: '', shop: p.shop || (shopF !== '*' ? shopF : ''), cat: p.cat, done: 0 });
  btn.textContent = '✓'; btn.classList.remove('pri'); toast('Dodano: ' + p.name);
}
function newProd() {
  form('Własny produkt', [{ k: 'name', l: 'Nazwa', req: 1 }, { k: 'cat', l: 'Kategoria', t: 'sel', o: CAT_ORDER }, { k: 'shop', l: 'Zwykle kupujemy w', t: 'sel', o: [['', '—']].concat(shopList()) }, { k: 'add', l: 'Dodaj od razu na listę', t: 'chk', def: true }],
    { cat: 'Inne' }, v => { setProdShop(v.name, v.shop, v.cat); if (v.add) put('shop', { name: v.name, qty: '', shop: v.shop, cat: v.cat, done: 0 }); setTimeout(catalogDlg, 0); });
}

// ---------- pakowanie ----------
function vPack() {
  const ts = live('trips').sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  let h = `<div class="btns"><button class="b pri" onclick="editTrip()">＋ Nowy wyjazd</button></div>`;
  if (!ts.length) h += `<div class="card empty">Podaj dokąd, kiedy i na ile jedziecie – aplikacja przygotuje listy dla każdego dziecka (ubrania wg wieku, apteczka, woda) i policzy, ile litrów zajmą bagaże.</div>`;
  ts.forEach(t => {
    const it = t.items || [], dn = it.filter(x => x.d).length, pct = it.length ? Math.round(dn / it.length * 100) : 0;
    h += `<div class="card kid" onclick="openP({t:'trip',id:'${t.id}'})"><div class="row"><div style="font-size:30px">${(t.places || []).map(p => PLACES[p] ? PLACES[p][1] : '').join('')}</div><div class="grow"><b style="font-size:17px">${esc(t.name)}</b><div class="mut">${esc(fmtD(t.start))} · ${t.days} dni · ${esc(SEASONS[t.season] || '')} · ≈ ${packLiters(it)} l</div></div><b>${pct}%</b></div><div class="bar" style="margin-top:8px"><i style="width:${pct}%"></i></div></div>`;
  });
  return h;
}
function editTrip(id) {
  const ks = kids(); const t = id ? byId('trips', id) : { start: today(), days: 7, season: 'auto', places: [], kids: ks.map(k => k.id), adults: ks.some(k => (ageOf(k.birth) || { y: 0 }).y >= 18) ? '' : 'Tata, Mama', hours: 4, stay: 'apart', laundry: false };
  const val = Object.assign({}, t, { adults: Array.isArray(t.adults) ? t.adults.join(', ') : t.adults, season: id ? t.season : 'auto' });
  form(id ? 'Parametry wyjazdu' : 'Nowy wyjazd', [
    { k: 'name', l: 'Nazwa', ph: 'np. Wakacje w Zakopanem', req: 1 }, { k: 'start', l: 'Wyjazd', t: 'date' }, { k: 'days', l: 'Ile dni', t: 'number', req: 1 },
    { k: 'season', l: 'Pora roku', t: 'sel', o: [['auto', 'Automatycznie z daty']].concat(Object.entries(SEASONS)) },
    { k: 'places', l: 'Miejsce (można kilka)', t: 'chips', o: Object.entries(PLACES).map(([k, v]) => [k, v[1] + ' ' + v[0]]), req: 1 },
    { k: 'kids', l: 'Kto jedzie', t: 'chips', o: ks.map(k => [k.id, k.name]) },
    { k: 'adults', l: 'Inni dorośli spoza listy (imiona po przecinku)', ph: 'np. Babcia' },
    { k: 'hours', l: 'Dojazd (godzin)', t: 'number' }, { k: 'stay', l: 'Nocleg', t: 'sel', o: Object.entries(STAYS) },
    { k: 'laundry', l: 'Będzie pralka na miejscu (ubrania na max 4 dni)', t: 'chk' }
  ], val, v => {
    if (id && !confirm('Lista zostanie wygenerowana od nowa (zaznaczenia i własne pozycje znikną). Kontynuować?')) return false;
    v.adults = v.adults.split(',').map(s => s.trim()).filter(Boolean);
    if (v.season === 'auto') v.season = seasonOf(v.start);
    v.days = Math.max(1, Math.round(+v.days || 1));
    const kk = v.kids.map(i => byId('children', i)).filter(Boolean).map(k => { const a = ageOf(k.birth); return { id: k.id, name: k.name, age: a ? a.yf : 6 }; });
    v.meds = v.kids.map(i => byId('children', i)).filter(k => k && k.meds).map(k => k.name + ': ' + k.meds);
    const o = Object.assign(id ? t : {}, v); o.items = genPack(o, kk);
    put('trips', o); if (!id) setTimeout(() => openP({ t: 'trip', id: o.id }), 0);
  }, id ? { del: () => del('trips', id), delMsg: 'Usunąć wyjazd?' } : {});
}
let tripOwner = {};
function owners(t) {
  return (t.kids || []).filter(i => byId('children', i)).map(i => [i, kidName(i)]).concat((t.adults || []).map((a, i) => ['a' + i, a])).concat([['w', 'Wspólne']]);
}
function ownerName(t, o) { const f = owners(t).find(x => x[0] === o); return f ? f[1] : o; }
function pTrip(id) {
  const t = byId('trips', id); if (!t || t.del) { pages.pop(); return vPack(); }
  const it = t.items || [], ow = owners(t);
  let cur = tripOwner[id]; if (!ow.some(x => x[0] === cur)) cur = tripOwner[id] = ow[0][0];
  const tot = packLiters(it);
  let h = `<div class="card"><div class="row"><div class="grow"><div class="big">${esc(t.name)}</div><div class="mut">${esc(fmtD(t.start))} · ${t.days} dni · ${esc(SEASONS[t.season] || '')} · ${(t.places || []).map(p => PLACES[p] ? PLACES[p][1] + ' ' + PLACES[p][0] : '').join(', ')} · ${esc(STAYS[t.stay] || '')}</div></div></div>
  <table style="margin-top:8px"><tr><th>Kto</th><th>Objętość</th><th>Sugerowany bagaż</th></tr>${ow.map(([o, n]) => { const l = packLiters(it, o); return `<tr><td>${esc(n)}</td><td>${l} l</td><td>${bagFor(l)}</td></tr>`; }).join('')}<tr><th>Razem</th><th>${tot} l</th><th>${tot > 0 ? '≈ ' + Math.ceil(tot / 60) + ' × walizka 60 l (orientacyjnie)' : ''}</th></tr></table>
  <div class="mut">Szacunek dla złożonych ubrań, +15% luzu. Rzeczy „na sobie” nie są liczone.</div></div>`;
  h += `<div class="chips">${ow.map(([o, n]) => { const x = it.filter(i => i.o === o), dn = x.filter(i => i.d).length; return `<button class="chip${o === cur ? ' on' : ''}" onclick="tripOwner['${id}']='${o}';render()">${esc(n)} ${dn}/${x.length}</button>`; }).join('')}</div>`;
  const mine = it.filter(x => x.o === cur), isKid = !!byId('children', cur);
  h += `<div class="btns">${isKid ? `<button class="b pri" onclick="openP({t:'kidmode',id:'${id}',o:'${cur}'})">🧒 Lista dla dziecka</button>` : ''}<button class="b" onclick="addPackItem('${id}','${cur}')">＋ Rzecz</button><button class="b" onclick="printTrip('${id}')">🖨 Drukuj listy</button></div>`;
  const cats = []; mine.forEach(x => { if (!cats.includes(x.cat)) cats.push(x.cat); });
  h += '<div class="card list">' + (mine.length ? cats.map(c => `<div class="grp">${esc(c)}</div>` + mine.filter(x => x.cat === c).map(x => `<div class="it ${x.d ? 'done' : ''}"><button class="ck ${x.d ? 'on' : ''}" onclick="packTog('${id}','${x.id}')">${x.d ? '✓' : ''}</button><div class="grow nm" onclick="editPackItem('${id}','${x.id}')">${x.e || ''} ${esc(x.n)}${x.w ? ' <span class="tag">na sobie</span>' : ''}</div><b>× ${x.q}</b></div>`).join('')).join('') : '<div class="empty">Brak rzeczy.</div>') + '</div>';
  h += `<div class="btns"><button class="b" onclick="editTrip('${id}')">⚙ Zmień parametry</button><button class="b" onclick="packReset('${id}')">↺ Odznacz wszystko</button></div>`;
  return h;
}
function packTog(tid, iid) { const t = byId('trips', tid), x = t.items.find(i => i.id === iid); x.d = x.d ? 0 : 1; put('trips', t); render(); }
function packReset(tid) { if (!confirm('Odznaczyć wszystkie rzeczy?')) return; const t = byId('trips', tid); t.items.forEach(i => i.d = 0); put('trips', t); render(); }
function addPackItem(tid, o) {
  const t = byId('trips', tid);
  form('Nowa rzecz – ' + ownerName(t, o), [{ k: 'n', l: 'Co', req: 1 }, { k: 'q', l: 'Ile', t: 'number', def: 1 }, { k: 'e', l: 'Obrazek (emoji)', ph: 'np. 🧸' }, { k: 'l', l: 'Objętość 1 szt. (litry, orientacyjnie)', t: 'number', def: 0.5 }, { k: 'cat', l: 'Grupa', def: 'Własne' }],
    {}, v => { t.items.push({ id: 'u' + uid(), o, cat: v.cat || 'Własne', n: v.n, e: v.e || '📦', q: Math.max(1, Math.round(+v.q || 1)), l: +v.l || 0, d: 0 }); put('trips', t); });
}
function editPackItem(tid, iid) {
  const t = byId('trips', tid), x = t.items.find(i => i.id === iid);
  form(x.n, [{ k: 'n', l: 'Co', req: 1 }, { k: 'q', l: 'Ile', t: 'number' }, { k: 'e', l: 'Obrazek (emoji)' }, { k: 'l', l: 'Objętość 1 szt. (litry)', t: 'number' }, { k: 'w', l: 'Na sobie (nie liczyć do bagażu)', t: 'chk' }],
    x, v => { Object.assign(x, v, { q: Math.max(0, Math.round(+v.q || 0)), l: +v.l || 0, w: v.w ? 1 : 0 }); put('trips', t); },
    { del: () => { t.items = t.items.filter(i => i.id !== iid); put('trips', t); } });
}
function pKid(tid, o) {
  const t = byId('trips', tid); if (!t) { pages.pop(); return ''; }
  const mine = t.items.filter(x => x.o === o), dn = mine.filter(x => x.d).length, pct = mine.length ? Math.round(dn / mine.length * 100) : 0;
  let h = `<div class="card" style="text-align:center"><div class="big">🎒 Pakuje się ${esc(kidName(o))}</div><div class="mut">Stuknij rzecz, gdy jest w plecaku</div><div class="bar" style="margin:10px 0 4px;height:14px"><i style="width:${pct}%"></i></div><b>${dn} z ${mine.length}</b>${dn === mine.length && mine.length ? '<div style="font-size:42px">🎉 Brawo!</div>' : ''}</div>`;
  h += `<div class="tiles">${mine.filter(x => !x.w).concat(mine.filter(x => x.w)).map(x => `<div class="tile ${x.d ? 'on' : ''}" onclick="packTog('${tid}','${x.id}')"><div class="e">${x.e || '📦'}</div><div class="n">${esc(x.n)}</div><div class="q">× ${x.q}</div></div>`).join('')}</div>`;
  return h;
}
function printTrip(tid) {
  const t = byId('trips', tid), ow = owners(t);
  const css = `body{font:14px/1.35 system-ui,Roboto,sans-serif;margin:18px;color:#111}.pg{page-break-after:always}.pg:last-child{page-break-after:auto}h1{font-size:26px;margin:0 0 4px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:7px 4px;vertical-align:middle}.bx{width:26px;height:26px;border:2.5px solid #333;border-radius:6px}.e{font-size:28px;width:44px;text-align:center}.q{font-size:20px;font-weight:800;text-align:right;width:60px}.c{background:#eef2f7;font-weight:700;padding:5px 6px}.small td{padding:4px}.small .bx{width:16px;height:16px;border-width:2px}.small .e{font-size:16px;width:24px}.small .q{font-size:14px}.mut{color:#666;font-size:12px}`;
  let h = '';
  ow.forEach(([o, n]) => {
    const mine = t.items.filter(x => x.o === o); if (!mine.length) return;
    const k = byId('children', o), a = k ? ageOf(k.birth) : null, big = k && (!a || a.y >= 4);
    const cats = []; mine.forEach(x => { if (!cats.includes(x.cat)) cats.push(x.cat); });
    h += `<div class="pg"><h1>${big ? '🎒 ' : ''}${esc(n)}</h1><div class="mut">${esc(t.name)} · ${esc(fmtD(t.start))} · ${t.days} dni · ≈ ${packLiters(t.items, o)} l</div><table class="${big ? '' : 'small'}">` +
      cats.map(c => `<tr><td colspan="4" class="c">${esc(c)}</td></tr>` + mine.filter(x => x.cat === c).map(x => `<tr><td style="width:34px"><div class="bx"></div></td><td class="e">${x.e || ''}</td><td>${esc(x.n)}</td><td class="q">× ${x.q}</td></tr>`).join('')).join('') + '</table></div>';
  });
  const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>${h}`;
  printHtml(html, 'Pakowanie ' + t.name);
}

// ---------- więcej ----------
function vMore() {
  const pend = Object.keys(P).length;
  let h = `<div class="card"><h2>Ja</h2><label>Twoje imię (widać, kto dodał produkt)<input id="sMe" value="${esc(S.me)}" placeholder="np. Alan"></label></div>`;
  if (!S.url) h += `<div class="card" style="border:2px solid var(--pri)"><h2>✨ Arkusz rodziny</h2><p class="mut">Nie masz jeszcze arkusza. Kreator założy go na Twoim koncie Google razem z synchronizacją i wróci tu z kluczem.</p><div class="btns"><button class="b pri" onclick="startWizard()">Utwórz arkusz na moim koncie Google</button><button class="b" onclick="pasteCfg()">📋 Wklej konfigurację</button></div></div>`;
  h += `<div class="card"><h2>Synchronizacja z drugim rodzicem</h2><p class="mut">Wspólny arkusz Google ze skryptem „Rodzina”. W obu telefonach ten sam adres i klucz.</p>
  <label>Adres aplikacji internetowej (…/exec)<input id="sUrl" value="${esc(S.url)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
  <label>Klucz rodziny<input id="sKey" value="${esc(S.key)}"></label>
  <div class="mut" style="margin-top:6px">${S.lastSync ? 'Ostatnio: ' + new Date(S.lastSync).toLocaleString('pl-PL') : 'Jeszcze nie synchronizowano'}${pend ? ' · do wysłania: ' + pend : ''}${S.syncErr ? '<br><b style="color:var(--bad)">Błąd: ' + esc(S.syncErr) + '</b>' : ''}</div>
  <div class="btns"><button class="b pri" onclick="saveSet();S.rev=0;sync(true)">Zapisz i synchronizuj</button></div>
  <label>Adres wersji web (iPhone), np. https://login.github.io/as-rodzina/<input id="sWeb" value="${esc(S.web || '')}"></label>
  <div class="btns"><button class="b" onclick="saveSet();shareLink()">📲 Wyślij link do drugiego telefonu</button>${S.url ? '<button class="b" onclick="pasteCfg()">📋 Wklej konfigurację</button>' : ''}</div>
  <details><summary class="mut">Zaawansowane</summary><label>Adres kreatora (Kreator.gs …/exec)<input id="sInst" value="${esc(S.inst || INSTALLER_URL)}"></label>${S.url ? '<div class="btns"><button class="b" onclick="startWizard()">✨ Utwórz nowy arkusz kreatorem</button></div>' : ''}</details></div>`;
  h += `<div class="card"><h2>Kalendarz Google</h2>`;
  if (!N) h += `<p class="mut">Na iPhonie: przy zapisie wizyty wybierasz Kalendarz Google albo kalendarz iPhone (.ics).</p><label>Przypomnienie w pliku .ics (min)<input id="sRem" type="number" value="${esc(S.remind)}"></label>`;
  else if (!N.calHasPerm()) h += `<p class="mut">Wizyty zapisują się w wybranym kalendarzu telefonu (np. Twoim Google), a wizyty z kalendarza można pobrać do aplikacji.</p><button class="b pri" onclick="N.calReqPerm()">Zezwól na kalendarz</button>`;
  else {
    let cals = []; try { cals = JSON.parse(N.calList() || '[]'); } catch (e) { }
    h += `<label>Kalendarz<select id="sCal"><option value="">— wybierz —</option>${opt(cals.map(c => [String(c.id), c.name + (c.acc && c.acc !== c.name ? ' (' + c.acc + ')' : '')]), String(S.calId))}</select></label>
    <label>Przypomnienie przed wizytą (min, 0 = bez)<input id="sRem" type="number" value="${esc(S.remind)}"></label>
    <label>Słowa kluczowe do szukania wizyt w kalendarzu<input id="sKw" value="${esc(S.calKw)}"></label>
    <div class="btns"><button class="b" onclick="saveSet();openP({t:'cal'})">📅 Pobierz wizyty z kalendarza</button></div>`;
  }
  h += `</div><div class="card"><h2>Sklepy</h2><div class="chips">${shopList().map(s => `<button class="chip" onclick="shopDel(${esc(JSON.stringify(s))})">${esc(s)} ✕</button>`).join('')}</div><div class="addbar"><input id="newShop" placeholder="Nowy sklep"><button class="b pri" onclick="shopAdd()">＋</button></div></div>`;
  const own = live('catalog').filter(p => !Object.values(CATALOG).some(a => a.includes(p.name)));
  h += `<div class="card"><h2>Moje produkty</h2>${own.length ? `<div class="chips">${own.map(p => `<button class="chip" onclick="if(confirm('Usunąć produkt z katalogu?')){del('catalog','${p.id}');render()}">${esc(p.name)} ✕</button>`).join('')}</div>` : '<div class="mut">Dodasz je w Zakupy → 📋.</div>'}</div>`;
  h += `<div class="card"><h2>Kopia zapasowa</h2><div class="btns"><button class="b" onclick="exportData()">📤 Eksportuj dane</button><button class="b" onclick="importDlg()">📥 Importuj</button></div></div>`;
  h += `<div class="mut" style="text-align:center">AS Rodzina ${N ? esc(N.version()) : 'web ' + WEB_VER} · Alan Solutions</div>`;
  return h;
}
function saveSet() {
  if ($('#sMe')) S.me = $('#sMe').value.trim();
  if ($('#sUrl')) S.url = $('#sUrl').value.trim();
  if ($('#sKey')) S.key = $('#sKey').value.trim();
  if ($('#sCal')) S.calId = $('#sCal').value;
  if ($('#sRem')) S.remind = Math.max(0, Math.round(+$('#sRem').value || 0));
  if ($('#sKw')) S.calKw = $('#sKw').value;
  if ($('#sWeb')) S.web = $('#sWeb').value.trim();
  if ($('#sInst')) S.inst = $('#sInst').value.trim();
  saveAll();
}
function shareLink() {
  if (!S.url || !S.key) { toast('Najpierw ustaw adres skryptu i klucz'); return; }
  const base = S.web || (IS_WEB ? location.origin + location.pathname : '');
  if (!base) { toast('Wpisz adres wersji web'); return; }
  shareText('AS Rodzina', 'AS Rodzina – otwórz w Safari i dodaj do ekranu początkowego:\n' + base + '#u=' + encodeURIComponent(S.url) + '&k=' + encodeURIComponent(S.key) + '\n\nJeśli aplikacja już jest na ekranie: skopiuj poniższy tekst i wybierz Więcej → 📋 Wklej konfigurację\nAS-RODZINA|' + S.url + '|' + S.key);
}
function shopAdd() { const n = $('#newShop').value.trim(); if (!n) return; const h = live('shops').find(s => s.name === n); if (h) { h.hide = 0; put('shops', h); } else put('shops', { name: n, o: Date.now() }); render(); }
function shopDel(n) { if (!confirm('Usunąć sklep „' + n + '” z listy?')) return; const h = live('shops').find(s => s.name === n); if (h) { h.hide = 1; put('shops', h); } else put('shops', { name: n, hide: 1 }); render(); }
function exportData() { const t = JSON.stringify({ app: 'AS Rodzina', at: new Date().toISOString(), data: D }); shareText('Kopia AS Rodzina', t); }
function importDlg() {
  sheet(`<h2>Import kopii</h2><p class="mut">Wklej tekst kopii. Rekordy są łączone – nowsze wersje wygrywają.</p><textarea id="imp" rows="8"></textarea><div class="btns"><span style="flex:1"></span><button class="b" onclick="closeSheet()">Anuluj</button><button class="b pri" id="impGo">Importuj</button></div>`);
  $('#impGo').onclick = () => {
    let j; try { j = JSON.parse($('#imp').value); } catch (e) { toast('To nie jest poprawna kopia'); return; }
    let n = 0; COLS.forEach(c => (j.data && j.data[c] || []).forEach(o => { const l = byId(c, o.id); if (!l || (o.u || 0) > (l.u || 0)) { if (l) Object.assign(l, o); else D[c].push(o); P[c + '|' + o.id] = o.u; n++; } }));
    saveAll(); pushWidget(); schedSync(); closeSheet(); render(); toast('Zaimportowano: ' + n);
  };
}

// ---------- render ----------
function render() {
  const p = pages[pages.length - 1];
  $('#back').style.display = p ? 'block' : 'none';
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  let h, title = 'AS Rodzina';
  if (p) {
    if (p.t === 'child') { h = pChild(p.id); title = kidName(p.id); }
    else if (p.t === 'cal') { h = pCal(); title = 'Wizyty z kalendarza'; }
    else if (p.t === 'rep') { h = pRep(p.id, p.p); title = 'Raport – ' + kidName(p.id); }
    else if (p.t === 'trip') { h = pTrip(p.id); title = (byId('trips', p.id) || {}).name || 'Wyjazd'; }
    else if (p.t === 'kidmode') { h = pKid(p.id, p.o); title = 'Pakowanie – ' + kidName(p.o); }
    else if (PAGES[p.t]) { h = PAGES[p.t].r(p); title = PAGES[p.t].title(p); }
  } else {
    if (TABS[tab]) { h = TABS[tab].r(); title = TABS[tab].title; }
    else { h = tab === 'kids' ? vKids() : tab === 'shop' ? vShop() : tab === 'pack' ? vPack() : vMore(); title = { kids: 'Rodzina', shop: 'Zakupy', pack: 'Pakowanie', more: 'Więcej' }[tab]; }
  }
  $('#title').textContent = title; $('#main').innerHTML = h;
  if (!p && tab === 'shop') bindShop();
  if (!p && tab === 'more') ['sMe', 'sUrl', 'sKey', 'sCal', 'sRem', 'sKw', 'sWeb', 'sInst'].forEach(i => { const e = $('#' + i); if (e) e.onchange = saveSet; });
  setDot();
}
function startTab() {
  if (!N) return;
  const t = N.startTab();
  if (t.startsWith('setup:')) { const [u, k] = t.slice(6).split('\n'); applyCfg(u, k); go('more'); return; }
  if (t === 'meds') { closeSheet(); go('meds'); }
  if (t === 'shop' || t === 'add') { closeSheet(); go('shop'); if (t === 'add') setTimeout(() => $('#aName') && $('#aName').focus(), 200); }
}
window.App = {
  cb(id, t, ok) { const f = CB[id]; delete CB[id]; if (f) f(ok, t); },
  back() { if ($('#ov').classList.contains('on')) { closeSheet(); return true; } if (pages.length) { pages.pop(); render(); return true; } if (tab !== 'kids') { go('kids'); return true; } return false; },
  resume() { applyWidgetOps(); startTab(); if (!$('#ov').classList.contains('on') && !(tab === 'shop' && document.activeElement && document.activeElement.id === 'aName')) render(); sync(false); },
  onPerm() { render(); }
};
$('#dot').onclick = () => sync(true);
function boot() {
applyWidgetOps();
render();
pushWidget();
startTab();
sync(false);
setInterval(() => { if (document.visibilityState === 'visible') sync(false); }, 30000);
document.addEventListener('visibilitychange', () => { if (IS_WEB && document.visibilityState === 'visible') sync(false); });
if (IS_WEB && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
}
