'use strict';
const CATALOG = {
  'Nabiał': ['Masło', 'Mleko', 'Jajka', 'Jogurt naturalny', 'Jogurty owocowe', 'Ser żółty', 'Twaróg', 'Śmietana', 'Serek wiejski', 'Kefir'],
  'Pieczywo': ['Chleb', 'Bułki', 'Bagietka', 'Chleb tostowy'],
  'Sypkie': ['Mąka pszenna', 'Cukier', 'Sól', 'Ryż', 'Makaron', 'Kasza', 'Płatki owsiane', 'Płatki śniadaniowe', 'Kakao', 'Bułka tarta'],
  'Warzywa': ['Ziemniaki', 'Marchew', 'Cebula', 'Czosnek', 'Pomidory', 'Ogórki', 'Papryka', 'Sałata', 'Kapusta', 'Brokuł', 'Pietruszka', 'Ogórki kiszone'],
  'Owoce': ['Jabłka', 'Banany', 'Pomarańcze', 'Mandarynki', 'Cytryny', 'Gruszki', 'Winogrona', 'Truskawki', 'Kiwi'],
  'Mięso i ryby': ['Kurczak', 'Mięso mielone', 'Wędlina', 'Parówki', 'Kiełbasa', 'Ryba'],
  'Napoje': ['Woda', 'Sok', 'Herbata', 'Kawa', 'Syrop', 'Napój dla dzieci'],
  'Słodycze i przekąski': ['Herbatniki', 'Chrupki', 'Czekolada', 'Wafle ryżowe'],
  'Mrożonki': ['Warzywa mrożone', 'Pierogi', 'Lody', 'Frytki'],
  'Przyprawy i inne': ['Olej', 'Oliwa', 'Ketchup', 'Majonez', 'Musztarda', 'Dżem', 'Miód', 'Koncentrat pomidorowy', 'Drożdże', 'Proszek do pieczenia'],
  'Chemia': ['Papier toaletowy', 'Ręczniki papierowe', 'Chusteczki higieniczne', 'Płyn do naczyń', 'Tabletki do zmywarki', 'Proszek do prania', 'Płyn do płukania', 'Mydło', 'Pasta do zębów', 'Szampon', 'Worki na śmieci'],
  'Apteka': ['Plastry', 'Sól fizjologiczna', 'Elektrolity', 'Lek przeciwgorączkowy', 'Krem z filtrem'],
  'Dzieci': ['Pieluchy', 'Chusteczki nawilżane', 'Krem na odparzenia', 'Kaszka', 'Mleko modyfikowane', 'Słoiczki']
};
const CAT_ORDER = Object.keys(CATALOG).concat(['Inne']);
const SHOPS0 = ['Apteka', 'Biedronka', 'Lidl', 'Kaufland', 'Auchan', 'Netto', 'Dino', 'Żabka', 'Rossmann', 'Hebe', 'Piekarnia', 'Targ'];
const SYMPTOMS = ['Gorączka', 'Kaszel suchy', 'Kaszel mokry', 'Katar', 'Ból gardła', 'Ból ucha', 'Ból głowy', 'Ból brzucha', 'Wymioty', 'Biegunka', 'Wysypka', 'Duszność', 'Osłabienie', 'Brak apetytu', 'Zaczerwienione oczy', 'Problemy ze snem'];
const SPECS = ['Pediatra', 'Lekarz rodzinny', 'Szczepienie', 'Bilans', 'Dentysta', 'Okulista', 'Laryngolog', 'Alergolog', 'Dermatolog', 'Ortopeda', 'Neurolog', 'Logopeda', 'Fizjoterapeuta'];
const PLACES = { gory: ['Góry', '⛰️'], jezioro: ['Jezioro', '🏞️'], morze: ['Morze', '🏖️'], las: ['Las', '🌲'], miasto: ['Miasto', '🏙️'] };
const SEASONS = { wiosna: '🌷 Wiosna', lato: '☀️ Lato', jesien: '🍂 Jesień', zima: '❄️ Zima' };
const STAYS = { hotel: 'Hotel / pensjonat (są ręczniki)', apart: 'Apartament / dom', namiot: 'Namiot / kemping', rodzina: 'U rodziny / znajomych' };
const COLORS = ['#ef6c5a', '#2b7a9e', '#8b5cf6', '#16a34a', '#d97706', '#db2777', '#0891b2', '#4f46e5'];

function seasonOf(dateStr) {
  const m = dateStr ? new Date(dateStr + 'T00:00').getMonth() + 1 : new Date().getMonth() + 1;
  return m >= 3 && m <= 5 ? 'wiosna' : m >= 6 && m <= 8 ? 'lato' : m >= 9 && m <= 11 ? 'jesien' : 'zima';
}

// Generator listy do spakowania.
// t: {days, season, places[], adults[], hours, laundry, stay, meds[]}, kids: [{id, name, age}]
// element: {id, o (właściciel: id dziecka | 'a0'.. | 'w' wspólne), cat, n, e, q, l (litry/szt.), w (na sobie), d}
function genPack(t, kids) {
  const items = []; let n = 0;
  const P = new Set(t.places || []);
  const D = Math.max(1, +t.days || 1);
  const cd = t.laundry ? Math.min(D, 4) : D;
  const S = t.season, summer = S === 'lato', winter = S === 'zima', mid = !summer && !winter;
  const add = (o, cat, name, e, q, l, f, ex) => {
    q = Math.max(0, Math.round(q)); if (!q) return;
    const old = items.find(x => x.o === o && x.n === name);
    if (old) { old.q = Math.max(old.q, q); return; }
    items.push(Object.assign({ id: 'i' + (++n), o, cat, n: name, e, q, l: +(l * f).toFixed(2), d: 0 }, ex || {}));
  };
  const persons = kids.map(k => ({ o: k.id, age: k.age, kid: k.age < 16 }))
    .concat((t.adults || []).map((a, i) => ({ o: 'a' + i, age: 30, kid: false })));
  const fac = a => a < 3 ? 0.35 : a < 6 ? 0.5 : a < 10 ? 0.65 : a < 14 ? 0.8 : 1;
  const U = 'Ubrania', B = 'Buty', H = 'Higiena', Z = 'Drobiazgi';
  persons.forEach(p => {
    const f = fac(p.age), o = p.o, a = p.age;
    add(o, U, 'Majtki', '🩲', cd + 1 + (a < 4 ? 2 : 0), 0.1, f);
    add(o, U, 'Skarpetki', '🧦', cd + 1, 0.1, f);
    add(o, U, summer ? 'Koszulki z krótkim rękawem' : 'Koszulki / bluzki', '👕', summer ? cd + 1 : Math.ceil(cd * 0.7) + 1 + (a < 6 ? 1 : 0), 0.6, f);
    if (summer) { add(o, U, 'Krótkie spodenki', '🩳', Math.ceil(cd / 2) + 1, 0.5, f); add(o, U, 'Długie spodnie', '👖', 1, 1.2, f); }
    else add(o, U, 'Długie spodnie', '👖', Math.ceil(cd / 3) + 1 + (a < 6 ? 1 : 0), 1.2, f);
    add(o, U, summer ? 'Bluza na chłodny wieczór' : 'Bluza / sweter', '🧥', summer ? 1 : Math.ceil(cd / 4) + 1, 1.5, f);
    add(o, U, 'Piżama', '🛌', Math.ceil(D / 5) + (a < 6 ? 1 : 0), 1, f);
    if (winter) {
      add(o, U, 'Kurtka zimowa (na sobie)', '🧥', 1, 6, f, { w: 1 });
      add(o, U, 'Czapka zimowa', '🧢', 1, 0.3, f); add(o, U, 'Szalik / komin', '🧣', 1, 0.4, f);
      add(o, U, 'Rękawiczki', '🧤', a < 10 ? 2 : 1, 0.3, f); add(o, U, 'Bielizna termiczna', '🩱', 2, 0.8, f);
      add(o, B, 'Buty zimowe (na nogach)', '🥾', 1, 4, f, { w: 1 });
    } else if (mid) {
      add(o, U, 'Kurtka przejściowa (na sobie)', '🧥', 1, 3, f, { w: 1 }); add(o, U, 'Czapka', '🧢', 1, 0.3, f);
      add(o, B, 'Buty na co dzień (na nogach)', '👟', 1, 3, f, { w: 1 }); if (a < 10) add(o, B, 'Kalosze', '🥾', 1, 4, f);
    } else {
      add(o, U, 'Kurtka przeciwdeszczowa', '🧥', 1, 1.5, f); add(o, U, 'Czapka z daszkiem', '🧢', 1, 0.3, f);
      add(o, B, 'Buty na co dzień (na nogach)', '👟', 1, 3, f, { w: 1 }); add(o, B, 'Sandały', '🩴', 1, 1.5, f);
    }
    add(o, H, 'Szczoteczka do zębów', '🪥', 1, 0.05, 1);
    if (t.stay !== 'hotel') add(o, H, 'Ręcznik', '🧺', 1, 2, f < 1 ? 0.7 : 1);
    if (a < 3) {
      add(o, H, 'Pieluchy', '🧷', Math.min(6 * D, 70), 0.12, 1); add(o, H, 'Chusteczki nawilżane', '🧻', Math.ceil(D / 4) + 1, 0.6, 1);
      add(o, H, 'Krem na odparzenia', '🧴', 1, 0.15, 1); add(o, Z, 'Butelka / kubek niekapek', '🍼', 1, 0.4, 1);
      if (a < 2) add(o, Z, 'Smoczek (+ zapasowy)', '👶', 2, 0.05, 1);
      add(o, Z, 'Śliniaki', '🧣', Math.min(D, 5), 0.1, 1);
    }
    if (p.kid) {
      if (a < 9) add(o, Z, 'Przytulanka', '🧸', 1, 1, 1);
      if (a >= 4) add(o, Z, 'Książka / gra na drogę', '📚', 1, 0.6, 1);
      if (a >= 7) add(o, Z, 'Słuchawki', '🎧', 1, 0.3, 1);
      if (a >= 3) add(o, Z, 'Bidon', '🥤', 1, 0.6, 1);
    } else add(o, Z, 'Ładowarka do telefonu', '🔌', 1, 0.2, 1);
    if (P.has('gory')) {
      add(o, B, 'Buty trekkingowe', '🥾', 1, 5, f); add(o, U, 'Polar', '🧶', 1, 2, f); add(o, U, 'Kurtka przeciwdeszczowa', '🧥', 1, 1.5, f);
      if (a >= 6) add(o, Z, 'Latarka czołowa', '🔦', 1, 0.2, 1);
      if (!p.kid) add(o, Z, 'Kijki trekkingowe', '🦯', 1, 0.8, 1);
      if (a >= 4) add(o, Z, 'Mały plecak na wycieczki', '🎒', 1, 0, 1);
    }
    if (P.has('morze') || P.has('jezioro')) {
      add(o, U, 'Strój kąpielowy', '🩱', 2, 0.3, f); add(o, H, 'Ręcznik plażowy', '🏖️', 1, 3, f < 1 ? 0.7 : 1); add(o, B, 'Klapki', '🩴', 1, 1.2, f);
      if (summer) { add(o, U, 'Kapelusz / czapka z daszkiem', '👒', 1, 0.3, f); add(o, Z, 'Okulary przeciwsłoneczne', '🕶️', 1, 0.2, 1); }
      if (p.kid && summer) add(o, U, 'Koszulka z filtrem UV', '👕', 1, 0.4, f);
    }
    if (P.has('jezioro')) { add(o, B, 'Buty do wody', '🩴', 1, 1, f); if (p.kid && a < 12) add(o, Z, 'Kamizelka asekuracyjna (jeśli nie ma na miejscu)', '🦺', 1, 4, f); }
    if (P.has('las')) {
      add(o, U, 'Długie spodnie do lasu', '👖', 1, 1.2, f); add(o, U, 'Koszulka z długim rękawem', '👕', 1, 0.6, f);
      add(o, B, 'Kalosze / wysokie buty', '🥾', 1, 4, f); add(o, U, 'Kurtka przeciwdeszczowa', '🧥', 1, 1.5, f);
    }
    if (P.has('miasto')) { add(o, B, 'Wygodne buty do chodzenia', '👟', 1, 3, f); if (a >= 3) add(o, Z, 'Bidon', '🥤', 1, 0.6, 1); }
    if (winter && P.has('gory')) {
      add(o, U, 'Spodnie narciarskie / kombinezon', '🎿', 1, 3, f); add(o, U, 'Rękawice narciarskie', '🧤', 1, 0.5, f);
      if (a >= 4) add(o, Z, 'Gogle', '🥽', 1, 0.5, 1);
    }
    if (t.stay === 'namiot') { add(o, 'Nocleg', 'Śpiwór', '🛏️', 1, 8, f < 1 ? 0.6 : 1); add(o, 'Nocleg', 'Karimata / materac (przypięta z zewnątrz)', '🧘', 1, 0, 1); }
  });

  const W = 'w', AP = 'Apteczka', DK = 'Dokumenty i elektronika', KS = 'Kosmetyczka rodzinna', JD = 'Jedzenie i picie', IN = 'Inne';
  const all = persons.length, little = kids.some(k => k.age < 3), anyKid = kids.length > 0;
  add(W, AP, 'Plastry (różne rozmiary)', '🩹', 1, 0.1, 1); add(W, AP, 'Gaziki jałowe i bandaż', '🩹', 1, 0.2, 1);
  add(W, AP, 'Środek do odkażania ran', '🧴', 1, 0.15, 1); add(W, AP, 'Termometr', '🌡️', 1, 0.05, 1);
  if (anyKid) add(W, AP, 'Lek przeciwgorączkowy dla dzieci (ten, który zwykle stosujecie)', '💊', 1, 0.2, 1);
  add(W, AP, 'Lek przeciwbólowy dla dorosłych', '💊', 1, 0.05, 1); add(W, AP, 'Sól fizjologiczna', '💧', 1, 0.2, 1);
  add(W, AP, 'Elektrolity', '🥤', 1, 0.1, 1); add(W, AP, 'Żel na ukąszenia / oparzenia', '🧴', 1, 0.1, 1);
  add(W, AP, 'Pęseta, nożyczki, agrafki', '✂️', 1, 0.05, 1);
  if (+t.hours >= 2 && anyKid) add(W, AP, 'Środki na chorobę lokomocyjną (jeśli stosujecie) + woreczki', '🤢', 1, 0.1, 1);
  if (P.has('las') || P.has('gory') || P.has('jezioro')) add(W, AP, 'Środek na kleszcze i komary + karta do kleszczy', '🦟', 1, 0.3, 1);
  if (P.has('gory')) add(W, AP, 'Folia NRC', '🟨', 1, 0.1, 1);
  if (summer || P.has('morze') || P.has('jezioro') || (winter && P.has('gory'))) add(W, AP, 'Krem z filtrem SPF 50', '🧴', Math.ceil(all / 3), 0.25, 1);
  (t.meds || []).forEach(m => add(W, AP, 'Stałe leki – ' + m, '💊', 1, 0.15, 1));
  add(W, DK, 'Dowody osobiste / legitymacje', '🪪', 1, 0.05, 1);
  if (anyKid) add(W, DK, 'Dokumenty zdrowotne dzieci', '📋', 1, 0.05, 1);
  add(W, DK, 'Rezerwacje i bilety', '🎫', 1, 0.02, 1); add(W, DK, 'Ładowarki i kable', '🔌', 1, 0.4, 1); add(W, DK, 'Powerbank', '🔋', 1, 0.3, 1);
  add(W, KS, 'Pasta do zębów', '🪥', 1, 0.15, 1); add(W, KS, 'Szampon i żel pod prysznic', '🧴', 1, 0.6, 1);
  add(W, KS, 'Grzebień / szczotka do włosów', '💇', 1, 0.15, 1); add(W, KS, 'Krem do twarzy i rąk', '🧴', 1, 0.15, 1);
  add(W, KS, 'Chusteczki higieniczne', '🤧', Math.ceil(D / 3), 0.2, 1); add(W, KS, 'Worek na brudne ubrania', '🛍️', 2, 0.1, 1);
  if (little) add(W, KS, 'Przewijak / podkład', '🧷', 1, 0.5, 1);
  if (t.laundry) add(W, KS, 'Proszek / kapsułki do prania', '🧺', 1, 0.4, 1);
  let water = 0; const h = Math.max(0, +t.hours || 0);
  persons.forEach(p => { water += Math.max(0.5, h * (p.kid ? (p.age < 3 ? 0.15 : 0.2) : 0.3)); });
  if (summer) water *= 1.5;
  add(W, JD, 'Woda na drogę (butelki 1 l)', '💧', Math.ceil(water), 1, 1);
  add(W, JD, 'Przekąski na drogę', '🍎', all, 0.3, 1);
  if (h >= 4) add(W, JD, 'Kanapki na drogę', '🥪', all, 0.3, 1);
  if (P.has('morze') || P.has('jezioro')) {
    if (anyKid) add(W, IN, 'Zabawki do piasku i wody', '🪣', 1, 3, 1);
    add(W, IN, 'Torba plażowa', '👜', 1, 0.5, 1); add(W, IN, 'Koc plażowy', '🧺', 1, 2, 1);
    if (P.has('morze')) add(W, IN, 'Parawan', '⛱️', 1, 6, 1);
  }
  if (P.has('miasto') && little) add(W, IN, 'Wózek / nosidło', '👶', 1, 0, 1);
  if (P.has('gory') && little) add(W, IN, 'Nosidło turystyczne', '🎒', 1, 0, 1);
  if (t.stay === 'namiot') {
    add(W, 'Nocleg', 'Namiot', '⛺', 1, 15, 1); add(W, 'Nocleg', 'Lampka kempingowa', '🔦', 1, 0.4, 1);
    add(W, 'Nocleg', 'Kuchenka turystyczna i naczynia', '🍳', 1, 5, 1); add(W, 'Nocleg', 'Papier toaletowy', '🧻', 2, 1, 1);
  }
  if (D >= 3 && anyKid) add(W, IN, 'Gra planszowa / karty', '🎲', 1, 1, 1);
  if (mid || P.has('gory')) add(W, IN, 'Parasol', '☂️', 1, 0.6, 1);
  return items;
}

function packLiters(items, owner) {
  let s = 0;
  items.forEach(x => { if ((owner == null || x.o === owner) && !x.w) s += (x.q || 0) * (x.l || 0); });
  return Math.round(s * 1.15 * 10) / 10; // +15% na luźne pakowanie
}

function bagFor(l) {
  if (l <= 0) return '—';
  if (l <= 12) return 'plecak 10–15 l';
  if (l <= 22) return 'plecak 20–25 l';
  if (l <= 35) return 'plecak 35 l / mała walizka';
  if (l <= 45) return 'walizka kabinowa 40 l';
  if (l <= 65) return 'walizka 60 l';
  if (l <= 90) return 'walizka 80–90 l';
  return 'duża walizka + torba';
}
if (typeof module !== 'undefined') module.exports = { genPack, packLiters, bagFor, seasonOf };
