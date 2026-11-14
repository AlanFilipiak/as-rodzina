'use strict';
/* AS Rodzina – aktualizacje (Android z Dysku Google przez skrypt, Windows z folderu na komputerze) i układ na duży ekran */
const DESK = window.AS_DESK || null;
let DESK_VER = '', UPD = null;
const cmpV = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
const appVer = () => N ? N.version() : DESK ? DESK_VER : WEB_VER;

document.head.insertAdjacentHTML('beforeend', `<style>
.upd{background:#dcfce7;border:2px solid #16a34a;color:#14532d}@media (prefers-color-scheme:dark){.upd{background:#12301e;color:#bbf7d0}}
@media (min-width:900px){
 body{padding-left:200px}
 nav{top:0;bottom:0;left:0;right:auto;width:200px;flex-direction:column;justify-content:flex-start;border-top:0;border-right:1px solid var(--ln);padding:72px 0 0}
 nav button{flex:none;display:flex;align-items:center;gap:12px;padding:12px 20px;font-size:15px;text-align:left}
 nav button b{display:inline;font-size:20px}
 nav button.on{background:var(--chip)}
 #main{max-width:1000px;padding:20px 24px 40px}
 header{padding-left:24px}
 #ov{align-items:center}#sheet{border-radius:18px;max-width:640px;max-height:88vh}
 #toast{bottom:28px;left:calc(50% + 100px)}
 .grid2{grid-template-columns:repeat(4,1fr)}
 .body{max-width:280px}
}</style>`);

async function checkUpd(manual) {
  try {
    if (N) {
      if (!S.url || !S.key || !N.installApk) { if (manual) toast('Najpierw połącz aplikację z arkuszem'); return; }
      const r = await post(S.url, { key: S.key, action: 'update' });
      if (!r || !r.ok) { if (manual) toast('Sprawdzanie: ' + ((r && r.err) || 'błąd') + (r && /Nieznana akcja/.test(r.err || '') ? ' – zaktualizuj Rodzina.gs' : '')); return; }
      UPD = r.apk && cmpV(r.apk.v, appVer()) > 0 ? { kind: 'apk', v: r.apk.v, fid: r.apk.fid } : null;
    } else if (DESK) {
      if (!S.updDir) { if (manual) toast('Wybierz folder z aktualizacjami'); return; }
      const r = await DESK.checkUpdate(S.updDir);
      if (!r.ok) { if (manual) toast(r.err); return; }
      UPD = r.newer ? { kind: 'exe', v: r.v, path: r.path } : null;
      if (manual && r.none) { toast('W folderze nie ma pliku AS-Rodzina-Setup-….exe'); return; }
    } else { if (manual) toast('Wersja web aktualizuje się sama przy uruchomieniu'); return; }
    S.updChk = Date.now(); saveAll();
    if (manual) toast(UPD ? 'Dostępna wersja ' + UPD.v : 'Masz najnowszą wersję (' + appVer() + ')');
    render();
  } catch (e) { if (manual) toast('Sprawdzanie aktualizacji nie powiodło się'); }
}
let updBusy = false;
async function doUpd() {
  if (!UPD || updBusy) return; updBusy = true;
  try {
    if (UPD.kind === 'exe') { toast('Uruchamiam instalator…'); await DESK.install(UPD.path); return; }
    toast('Pobieram wersję ' + UPD.v + '…');
    const r = await post(S.url, { key: S.key, action: 'apk', fid: UPD.fid });
    if (!r || !r.ok) { toast('Pobieranie: ' + ((r && r.err) || 'błąd')); return; }
    N.installApk(r.data, r.name || ('AS-Rodzina-' + UPD.v + '.apk'));
  } finally { updBusy = false; }
}
const updBanner = () => UPD ? `<div class="card upd row"><div style="font-size:28px">⬆️</div><div class="grow"><b>Dostępna wersja ${esc(UPD.v)}</b><div style="font-size:13px">Masz ${esc(appVer())}${UPD.kind === 'exe' ? ' · program zamknie się na czas instalacji' : ''}</div></div><button class="b pri" onclick="doUpd()">Zainstaluj</button></div>` : '';

const render2 = render;
render = function () { render2(); if (UPD && !pages.length && tab !== 'more') $('#main').insertAdjacentHTML('afterbegin', updBanner()); };
const vMore2 = vMore;
vMore = function () {
  let box = `<div class="card"><h2>🔄 Aktualizacje</h2><div class="mut">Wersja: ${esc(appVer())}${N ? ' (Android)' : DESK ? ' (Windows)' : ' (web)'}</div>`;
  if (N) box += `<p class="mut">Aplikacja szuka na Twoim Dysku Google plików <b>AS-Rodzina-X.Y.apk</b> (w dowolnym folderze) – przez skrypt arkusza. Wrzuć nowe APK do folderu z programami.</p><div class="btns"><button class="b" onclick="checkUpd(true)">Sprawdź teraz</button></div>`;
  else if (DESK) box += `<p class="mut">Program sprawdza folder na komputerze (np. zsynchronizowany z Dyskiem Google) i szuka pliku <b>AS-Rodzina-Setup-X.Y.Z.exe</b>.</p><label>Folder z aktualizacjami<input id="sUpd" value="${esc(S.updDir || '')}" placeholder="np. G:\\Mój dysk\\MOJE PROGRAMY"></label><div class="btns"><button class="b" onclick="pickUpdDir()">📁 Wybierz folder</button><button class="b" onclick="S.updDir=$('#sUpd').value.trim();saveAll();checkUpd(true)">Sprawdź teraz</button></div>`;
  else box += '<p class="mut">Wersja web pobiera nowe pliki sama przy uruchomieniu z internetem.</p>';
  box += updBanner() + '</div>';
  return box + vMore2();
};
async function pickUpdDir() { const d = await DESK.pickFolder(); if (d) { S.updDir = d; saveAll(); checkUpd(true); } }

(async () => {
  if (DESK) { try { DESK_VER = await DESK.version(); } catch (e) { } document.title = 'AS Rodzina ' + DESK_VER; }
  boot();
  reAlarms();
  if (N || DESK) setTimeout(() => checkUpd(false), 4000);
})();
