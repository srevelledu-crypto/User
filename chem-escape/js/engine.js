/* ==========================================================================
   The Thistlewood Game Works — game engine
   Screens: title → letter → box (hub) → rooms → vault → ending/certificate
   ========================================================================== */
(function () {
  'use strict';
  var C = window.GAME_CONTENT, CFG = window.GAME_CONFIG || {}, Core = window.ChemCore, Fig = window.Figures, P = window.Puzzles;
  var h = P.h, esc = P.esc;
  var KEY = CFG.saveKey || 'thistlewood-escape-v1';

  /* ---------- state + persistence ------------------------------------------ */
  function fresh() {
    return { v: 1, team: '', players: '', startedAt: null, finishedAt: null, screen: 'title', room: null,
      unlocked: 0, solvedParts: {}, solved: {}, hints: {}, attempts: {}, wrong: {}, roomDone: {}, docsRead: {},
      flipped: {}, meepleFlip: {}, drafts: {}, vault: { seq: null, combo: '', comboOk: false, explainOk: false, opened: false, attempts: 0 },
      countdown: false };
  }
  var S = load() || fresh();
  var teacher = { unlocked: false, showAnswers: false };
  function load() {
    try { var raw = window.localStorage.getItem(KEY); if (!raw) return null; var s = JSON.parse(raw); return s && s.v === 1 ? Object.assign(fresh(), s) : null; } catch (e) { return null; }
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: play on without saving */ } }, 150);
  }
  function saveNow() { clearTimeout(saveTimer); try { window.localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function resetGame() { try { window.localStorage.removeItem(KEY); } catch (e) { } S = fresh(); closeModal(); go('title'); }

  /* ---------- time --------------------------------------------------------- */
  function elapsedMs() { if (!S.startedAt) return 0; return (S.finishedAt || Date.now()) - S.startedAt; }
  function fmt(ms) { var s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60); return (m >= 60 ? Math.floor(m / 60) + ':' + pad(m % 60) : m) + ':' + pad(s % 60); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function totalHints() { var t = 0; for (var k in S.hints) t += S.hints[k]; return t; }
  var timeUpShown = false;
  function tick() {
    var el = document.getElementById('clock');
    if (!el) return;
    if (!S.startedAt) { el.textContent = ''; return; }
    if (S.countdown && !S.finishedAt) {
      var left = (CFG.countdownMinutes || 45) * 60000 - elapsedMs();
      el.textContent = (left < 0 ? '−' : '') + fmt(Math.abs(left));
      el.className = 'clock countdown' + (left < 5 * 60000 ? ' low' : '');
      el.title = 'Time remaining';
      if (left <= 0 && !timeUpShown) { timeUpShown = true; toast('⏰ Time! (You can keep playing — your teacher will let you know.)'); }
    } else { el.textContent = fmt(elapsedMs()); el.className = 'clock'; el.title = 'Time elapsed'; }
    var hc = document.getElementById('hintcount'); if (hc) hc.textContent = totalHints();
  }
  setInterval(tick, 1000);
  window.addEventListener('pagehide', function () { saveNow(); });
  window.addEventListener('beforeunload', function () { saveNow(); });

  /* ---------- lookups ------------------------------------------------------ */
  function roomById(id) { return C.rooms.filter(function (r) { return r.id === id; })[0]; }
  function roomIndex(id) { return C.rooms.indexOf(roomById(id)); }
  function puzzleById(pid) { for (var i = 0; i < C.rooms.length; i++) for (var j = 0; j < C.rooms[i].puzzles.length; j++) if (C.rooms[i].puzzles[j].id === pid) return { room: C.rooms[i], puzzle: C.rooms[i].puzzles[j], ri: i }; return null; }
  function roomSolvedCount(r) { return r.puzzles.filter(function (p) { return S.solved[p.id]; }).length; }
  function roomComplete(r) { return roomSolvedCount(r) === r.puzzles.length; }
  function meeplesFound() { return C.rooms.filter(function (r, i) { return S.roomDone[i] != null; }); }

  /* ---------- UI shell ----------------------------------------------------- */
  var main, modalRoot, lastFocus = null;
  function shell() {
    document.body.innerHTML = '';
    var top = h('header', { id: 'topbar' });
    top.innerHTML = '<div class="brand"><span class="brand-mark">T</span><span class="brand-name">The Thistlewood Game Works</span></div>' +
      '<div class="team" id="teamname"></div>' +
      '<div class="status"><span class="stat" title="Hints used">🔧 <span id="hintcount">0</span></span><span class="stat" id="meeplecount" title="Meeples found"></span>' + (CFG.showClock === false ? '' : '<span id="clock" class="clock"></span>') + '</div>' +
      '<nav class="tools"><button class="btn ghost" id="btn-box" type="button">📦 The box</button><button class="btn ghost" id="btn-booklet" type="button">📘 Data booklet</button><button class="btn ghost" id="btn-docs" type="button">✉ Papers</button><button class="btn ghost danger" id="btn-reset" type="button">Reset game</button></nav>';
    document.body.appendChild(top);
    main = h('main', { id: 'main', tabindex: '-1' });
    document.body.appendChild(main);
    modalRoot = h('div', { id: 'modal-root' });
    document.body.appendChild(modalRoot);
    document.body.appendChild(h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }));
    document.getElementById('btn-box').onclick = function () { if (S.startedAt) go('hub'); };
    document.getElementById('btn-booklet').onclick = openBooklet;
    document.getElementById('btn-docs').onclick = openPapers;
    document.getElementById('btn-reset').onclick = confirmReset;
  }
  function refreshTop() {
    document.getElementById('teamname').textContent = S.team ? 'Team: ' + S.team : '';
    document.getElementById('meeplecount').innerHTML = S.startedAt ? '♟ ' + meeplesFound().length + '/8' : '';
    ['btn-box', 'btn-docs'].forEach(function (id) { document.getElementById(id).disabled = !S.startedAt; });
    tick();
  }
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 3800);
  }
  function go(screen, room) {
    S.screen = screen; if (room !== undefined) S.room = room; saveNow();
    closeModal();
    main.innerHTML = ''; main.className = 'scr-' + screen;
    ({ title: renderTitle, letter: renderLetter, hub: renderHub, room: renderRoom, vault: renderVault, ending: renderEnding })[screen]();
    refreshTop();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- modals -------------------------------------------------------- */
  function openModal(content, opts) {
    opts = opts || {};
    if (!modalRoot.children.length) lastFocus = document.activeElement;
    modalRoot.innerHTML = '';
    var back = h('div', { class: 'modal-back' });
    var box = h('div', { class: 'modal ' + (opts.cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.label || 'Dialog' });
    if (!opts.noClose) {
      var x = h('button', { class: 'modal-close', type: 'button', 'aria-label': 'Close' }, '✕');
      x.onclick = function () { closeModal(); if (opts.onClose) opts.onClose(); };
      box.appendChild(x);
    }
    if (typeof content === 'string') box.insertAdjacentHTML('beforeend', content); else box.appendChild(content);
    back.appendChild(box);
    back.addEventListener('mousedown', function (e) { if (e.target === back && !opts.noClose) { closeModal(); if (opts.onClose) opts.onClose(); } });
    modalRoot.appendChild(back);
    modalRoot._onClose = opts.noClose ? null : opts.onClose || function () { };
    setTimeout(function () { var f = box.querySelector('[autofocus], .modal-body button:not([disabled]), input, select, .modal-close'); if (f) f.focus(); }, 30);
    return box;
  }
  function closeModal() {
    if (!modalRoot || !modalRoot.children.length) return;
    modalRoot.innerHTML = ''; modalRoot._onClose = null;
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalRoot && modalRoot.children.length && modalRoot._onClose) { var cb = modalRoot._onClose; closeModal(); cb(); }
    // focus trap
    if (e.key === 'Tab' && modalRoot && modalRoot.children.length) {
      var f = modalRoot.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    // Teacher Mode: press T (when not typing)
    var tag = (e.target && e.target.tagName) || '';
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|SELECT|TEXTAREA/.test(tag)) {
      e.preventDefault(); openTeacher();
    }
  });

  /* ---------- documents ------------------------------------------------------ */
  function docHTML(d) {
    var body = (d.body || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var cls = 'doc doc-' + d.style;
    if (d.style === 'newspaper') return '<article class="' + cls + '"><div class="masthead">' + esc(d.masthead) + '</div><div class="dateline">' + esc(d.date) + ' · Price 3d</div><h2>' + esc(d.heading) + '</h2><div class="cols">' + body + '</div></article>';
    return '<article class="' + cls + '">' + (d.date ? '<div class="doc-date">' + esc(d.date) + '</div>' : '') + '<h2 class="doc-head">' + esc(d.heading) + '</h2>' + body +
      (d.sign ? '<p class="sign">' + esc(d.sign) + '</p>' : '') + (d.note ? '<p class="doc-note">' + esc(d.note) + '</p>' : '') + '</article>';
  }
  function showDoc(d, btnLabel, then) {
    var wrap = h('div', { class: 'doc-wrap' }, docHTML(d));
    var b = h('button', { class: 'btn primary', type: 'button', autofocus: true }, btnLabel || 'Put it back in the box');
    b.onclick = function () { closeModal(); if (then) then(); };
    var foot = h('div', { class: 'modal-foot' }); foot.appendChild(b); wrap.appendChild(foot);
    openModal(wrap, { cls: 'paper-modal', label: d.heading, onClose: then });
  }
  function openPapers() {
    if (!S.startedAt) return;
    var docs = [['The letter from Bert', C.story.intro]];
    C.story.afterRoom.forEach(function (d, i) { if (S.docsRead[i]) docs.push([d.heading, d]); });
    if (S.vault.opened) C.story.ending.forEach(function (d) { docs.push([d.heading, d]); });
    var box = h('div', { class: 'modal-body' }, '<h2 class="modal-title">Papers from the box</h2><p>Everything you have found so far.</p>');
    var ul = h('div', { class: 'paper-list' });
    docs.forEach(function (p) { var b = h('button', { class: 'paper-item', type: 'button' }, '✉ ' + esc(p[0])); b.onclick = function () { showDoc(p[1], 'Back to the papers', openPapers); }; ul.appendChild(b); });
    box.appendChild(ul);
    openModal(box, { label: 'Papers' });
  }

  /* ---------- data booklet ---------------------------------------------------- */
  function openBooklet(tab) {
    tab = typeof tab === 'string' ? tab : 'pt';
    var tabs = [['pt', 'Periodic table'], ['en', 'Electronegativity'], ['ions', 'Common ions'], ['sol', 'Solubility'], ['eq', 'Formulas & constants']];
    var box = h('div', { class: 'modal-body booklet' });
    box.innerHTML = '<h2 class="modal-title">Thistlewood Data Booklet <small>(Year 10, simplified)</small></h2>';
    var bar = h('div', { class: 'tabs', role: 'tablist' });
    tabs.forEach(function (t) { var b = h('button', { type: 'button', role: 'tab', class: 'tab' + (t[0] === tab ? ' on' : ''), 'aria-selected': t[0] === tab ? 'true' : 'false' }, t[1]); b.onclick = function () { openBooklet(t[0]); }; bar.appendChild(b); });
    box.appendChild(bar);
    var content = '';
    if (tab === 'pt') content = Fig.raw.periodicTable(false);
    if (tab === 'en') content = Fig.raw.periodicTable(true);
    if (tab === 'ions') content = Fig.raw.ionChart();
    if (tab === 'sol') content = Fig.raw.solubility();
    if (tab === 'eq') content = '<table class="data formulas"><tr><th>Amount of substance</th><td>n = m ÷ M &nbsp;(mol = g ÷ g mol⁻¹)</td></tr><tr><th>Solutions</th><td>n = c × V &nbsp;(V in litres: mL ÷ 1000 = L)</td></tr><tr><th>Particles</th><td>N = n × Nₐ &nbsp;&nbsp; Nₐ = 6.02 × 10²³ mol⁻¹</td></tr><tr><th>Relative atomic mass</th><td>Aᵣ = Σ(isotope mass × abundance) ÷ Σ(abundance)</td></tr><tr><th>Percentage composition</th><td>% element = (number of atoms × Aᵣ) ÷ Mᵣ × 100</td></tr><tr><th>Percentage yield</th><td>% yield = actual mass ÷ theoretical mass × 100</td></tr><tr><th>Chromatography</th><td>R<sub>f</sub> = distance moved by spot ÷ distance moved by solvent front</td></tr><tr><th>Subshell capacity</th><td>an s subshell holds 2 electrons · a p subshell holds 6</td></tr><tr><th>Bond type (ΔEN)</th><td>&lt; 0.5 non-polar covalent · 0.5–1.7 polar covalent · &gt; 1.7 ionic</td></tr></table>';
    box.appendChild(h('div', { class: 'booklet-page' }, content));
    openModal(box, { cls: 'wide', label: 'Data booklet' });
    var on = box.querySelector('.tab.on'); if (on) on.focus();
  }

  /* ---------- TITLE ------------------------------------------------------------ */
  function renderTitle() {
    var wrap = h('section', { class: 'title-screen' });
    var lid = h('div', { class: 'box-lid' });
    lid.innerHTML = '<div class="lid-inner"><div class="lid-est">EST. 1952 · CORELLA CREEK, QLD</div>' +
      '<h1 class="lid-title"><span>The</span> Thistlewood <span class="lid-line2">Game Works</span></h1>' +
      '<div class="lid-sub">Box of prototypes — recovered from the factory</div>' +
      '<div class="lid-pieces">' + Fig.raw.rocket('#b5482f') + Fig.raw.meeple('#2f7f7a') + Fig.raw.die(5) + Fig.raw.meeple('#d9a53b') + Fig.raw.rocket('#2f7f7a') + Fig.raw.die(3) + '</div>' +
      '<div class="lid-foot">8 games · 1 vault · for 2–4 chemists · ages 15 and up</div></div>' +
      '<div class="stamp lid-stamp">PROPERTY OF<br>B. NAKAMURA-REID</div>';
    wrap.appendChild(lid);
    var form = h('form', { class: 'start-card', autocomplete: 'off' });
    if (S.startedAt) {
      form.innerHTML = '<h2>Welcome back, ' + esc(S.team) + '</h2><p>Your progress was saved. ' + meeplesFound().length + ' of 8 meeples found.</p>';
      var cont = h('button', { class: 'btn primary big', type: 'button' }, 'Continue the game'); cont.onclick = function () { go(S.screen === 'title' ? 'hub' : (S.screen || 'hub'), S.room); };
      var nw = h('button', { class: 'btn', type: 'button' }, 'Start again as a new team'); nw.onclick = confirmReset;
      form.appendChild(cont); form.appendChild(nw);
    } else {
      form.innerHTML = '<h2>Who is opening the box?</h2>' +
        '<label>Team name<input id="team" required maxlength="40" placeholder="e.g. The Noble Gasses"></label>' +
        '<label>Players <small>(optional)</small><input id="players" maxlength="120" placeholder="first names"></label>' +
        '<p class="small">Play together on one laptop. Use the 📘 Data booklet whenever you like. When you are stuck, each puzzle has Bert’s maintenance log for hints.</p>';
      var b = h('button', { class: 'btn primary big', type: 'submit' }, 'Lift the lid'); form.appendChild(b);
      form.onsubmit = function (e) {
        e.preventDefault();
        var t = form.querySelector('#team').value.trim(); if (!t) { form.querySelector('#team').focus(); return; }
        S.team = t; S.players = form.querySelector('#players').value.trim(); S.startedAt = Date.now(); saveNow(); go('letter');
      };
    }
    wrap.appendChild(form);
    main.appendChild(wrap);
  }

  /* ---------- LETTER ----------------------------------------------------------- */
  function renderLetter() {
    var wrap = h('section', { class: 'letter-screen' });
    wrap.innerHTML = docHTML(C.story.intro);
    var b = h('button', { class: 'btn primary big', type: 'button' }, 'Lift out the contents of the box');
    b.onclick = function () { go('hub'); };
    wrap.appendChild(b);
    main.appendChild(wrap);
  }

  /* ---------- HUB (the box) --------------------------------------------------- */
  function renderHub() {
    var wrap = h('section', { class: 'hub' });
    wrap.appendChild(h('div', { class: 'hub-head' }, '<h1 class="screen-title">Inside the box</h1><p>Eight prototype games, packed in the order Gussie made them. Each one opens after the one before it. Each may hide something small…</p>'));
    var shelf = h('div', { class: 'shelf' });
    C.rooms.forEach(function (r, i) {
      var open = i <= S.unlocked, done = S.roomDone[i] != null, next = open && !done;
      var b = h('button', { type: 'button', class: 'gamebox theme-' + r.theme + (open ? '' : ' locked') + (done ? ' done' : '') + (next ? ' next' : ''), 'aria-label': 'Prototype ' + r.number + ': ' + r.game + ' — ' + r.name + (done ? ' (completed)' : open ? '' : ' (locked)') });
      b.innerHTML = '<span class="gb-no">No. ' + r.number + '</span><span class="gb-game">' + esc(r.game) + '</span><span class="gb-room">' + esc(r.name) + '</span><span class="gb-year">' + r.year + '</span>' +
        (open ? '' : '<span class="gb-lock" aria-hidden="true">🔒 tied with string</span>') + (done ? '<span class="stamp small">QC PASSED</span>' : '') +
        '<span class="gb-progress">' + (open ? roomSolvedCount(r) + '/' + r.puzzles.length + ' pieces' : '') + '</span>';
      if (!open) b.disabled = true;
      b.onclick = function () { go('room', r.id); };
      shelf.appendChild(b);
    });
    var vaultOpen = meeplesFound().length === C.rooms.length;
    var vb = h('button', { type: 'button', class: 'gamebox vaultbox' + (vaultOpen ? ' next' : ' locked'), 'aria-label': 'The vault' + (vaultOpen ? '' : ' (needs all eight meeples)') });
    vb.innerHTML = '<span class="gb-no">The</span><span class="gb-game">VAULT</span><span class="gb-room">' + (vaultOpen ? 'Bring the meeples' : 'Needs 8 meeples') + '</span>' + (S.vault.opened ? '<span class="stamp small">OPENED</span>' : '');
    vb.disabled = !vaultOpen;
    vb.onclick = function () { go(S.vault.opened ? 'ending' : 'vault'); };
    shelf.appendChild(vb);
    wrap.appendChild(shelf);
    wrap.appendChild(meepleTray());
    main.appendChild(wrap);
  }
  function meepleTray() {
    var tray = h('div', { class: 'tray' });
    tray.appendChild(h('h2', { class: 'tray-title' }, 'Meeple tray <small>— click a meeple to turn it over</small>'));
    var row = h('div', { class: 'tray-row' });
    C.rooms.forEach(function (r, i) {
      var found = S.roomDone[i] != null, flipped = S.meepleFlip[r.award.symbol];
      var b = h('button', { type: 'button', class: 'meeple-slot' + (found ? ' found' : '') + (flipped ? ' flipped' : ''), 'aria-label': found ? (r.award.name + ' meeple' + (flipped ? ', stamped ' + r.award.digit + ' underneath' : ', click to turn over')) : 'empty slot' });
      if (!found) { b.disabled = true; b.innerHTML = '<span class="empty-meeple">?</span>'; }
      else b.innerHTML = flipped ? '<span class="meeple-base"><span class="base-digit">' + r.award.digit + '</span><span class="base-sym">' + r.award.symbol + '</span></span>' : Fig.raw.meeple(r.award.color, r.award.symbol, 54);
      b.onclick = function () { S.meepleFlip[r.award.symbol] = !S.meepleFlip[r.award.symbol]; save(); b.replaceWith(meepleTray().querySelectorAll('.meeple-slot')[i]); };
      row.appendChild(b);
    });
    tray.appendChild(row);
    return tray;
  }

  /* ---------- ROOM -------------------------------------------------------------- */
  var PROP_ICON = {
    tuckbox: '<svg viewBox="0 0 80 60"><rect x="12" y="10" width="56" height="44" rx="3" fill="var(--c1)" stroke="#1f1b16" stroke-width="2"/><path d="M12 10 L24 2 L56 2 L68 10" fill="var(--c2)" stroke="#1f1b16" stroke-width="2"/><rect x="22" y="20" width="36" height="22" rx="2" fill="#f6eedb" stroke="#1f1b16"/></svg>',
    board: '<svg viewBox="0 0 80 60"><rect x="6" y="6" width="68" height="48" fill="#f6eedb" stroke="#1f1b16" stroke-width="2"/><path d="M6 30 H74 M40 6 V54" stroke="var(--c1)" stroke-width="5" opacity=".7"/><circle cx="58" cy="18" r="6" fill="var(--c2)" stroke="#1f1b16"/></svg>',
    spinner: '<svg viewBox="0 0 80 60"><circle cx="40" cy="30" r="25" fill="#f6eedb" stroke="#1f1b16" stroke-width="2"/><path d="M40 30 L40 5 A25 25 0 0 1 62 18 Z" fill="var(--c1)"/><path d="M40 30 L18 42 A25 25 0 0 1 18 18 Z" fill="var(--c2)"/><path d="M40 30 L58 44" stroke="#1f1b16" stroke-width="3"/><circle cx="40" cy="30" r="3"/></svg>',
    drawer: '<svg viewBox="0 0 80 60"><rect x="6" y="14" width="68" height="40" rx="3" fill="var(--c1)" stroke="#1f1b16" stroke-width="2"/><rect x="30" y="26" width="20" height="8" rx="3" fill="#f6eedb" stroke="#1f1b16"/><rect x="10" y="6" width="60" height="10" fill="#f6eedb" stroke="#1f1b16"/></svg>',
    card: '<svg viewBox="0 0 80 60"><rect x="18" y="4" width="40" height="52" rx="4" fill="#f6eedb" stroke="#1f1b16" stroke-width="2" transform="rotate(-8 38 30)"/><rect x="26" y="6" width="40" height="52" rx="4" fill="var(--c1)" stroke="#1f1b16" stroke-width="2" transform="rotate(6 46 32)"/></svg>',
    booklet: '<svg viewBox="0 0 80 60"><path d="M8 10 Q24 4 40 10 Q56 4 72 10 V54 Q56 48 40 54 Q24 48 8 54 Z" fill="#f6eedb" stroke="#1f1b16" stroke-width="2"/><path d="M40 10 V54" stroke="#1f1b16"/><path d="M14 20 H34 M14 28 H32 M46 20 H66 M46 28 H64" stroke="var(--c1)" stroke-width="2"/></svg>',
    receipt: '<svg viewBox="0 0 80 60"><path d="M22 4 H58 V56 L52 52 L46 56 L40 52 L34 56 L28 52 L22 56 Z" fill="#f6eedb" stroke="#1f1b16" stroke-width="2"/><path d="M28 14 H52 M28 22 H48 M28 30 H52" stroke="#1f1b16"/><circle cx="46" cy="42" r="8" fill="none" stroke="var(--c2)" stroke-width="2.5"/></svg>',
    panel: '<svg viewBox="0 0 80 60"><rect x="10" y="4" width="60" height="52" rx="3" fill="var(--c1)" stroke="#1f1b16" stroke-width="2"/><g fill="#f6eedb" stroke="#1f1b16"><rect x="18" y="12" width="10" height="16"/><rect x="35" y="12" width="10" height="16"/><rect x="52" y="12" width="10" height="16"/></g><path d="M18 40 H62" stroke="var(--c2)" stroke-width="4"/></svg>',
    jar: '<svg viewBox="0 0 80 60"><g stroke="#1f1b16" stroke-width="2"><rect x="10" y="22" width="18" height="30" rx="3" fill="var(--c1)"/><rect x="31" y="16" width="18" height="36" rx="3" fill="var(--c2)"/><rect x="52" y="24" width="18" height="28" rx="3" fill="#2f7f7a"/></g></svg>',
    catalogue: '<svg viewBox="0 0 80 60"><rect x="14" y="4" width="52" height="52" fill="var(--c1)" stroke="#1f1b16" stroke-width="2"/><rect x="20" y="10" width="40" height="18" fill="#f6eedb"/><text x="40" y="23" text-anchor="middle" font-size="9" font-family="Alfa Slab One">1968</text><path d="M22 36 H58 M22 44 H50" stroke="#f6eedb" stroke-width="3"/></svg>',
    ledger: '<svg viewBox="0 0 80 60"><path d="M40 2 V40" stroke="#1f1b16" stroke-width="3"/><rect x="16" y="22" width="44" height="34" fill="#f6eedb" stroke="#1f1b16" stroke-width="2" transform="rotate(-5 38 39)"/><rect x="20" y="18" width="44" height="34" fill="var(--c1)" stroke="#1f1b16" stroke-width="2" transform="rotate(4 42 35)"/></svg>',
    envelope: '<svg viewBox="0 0 80 60"><rect x="8" y="12" width="64" height="40" fill="#f6eedb" stroke="#1f1b16" stroke-width="2"/><path d="M8 12 L40 36 L72 12" fill="none" stroke="#1f1b16" stroke-width="2"/><rect x="54" y="16" width="12" height="12" fill="var(--c2)"/></svg>',
    blueprint: '<svg viewBox="0 0 80 60"><rect x="6" y="6" width="68" height="48" fill="#2c5a7a" stroke="#1f1b16" stroke-width="2"/><path d="M14 16 H40 M14 24 H34 M46 14 L64 40 L46 40 Z" stroke="#e8f0f4" fill="none" stroke-width="1.5"/></svg>'
  };
  function renderRoom() {
    var r = roomById(S.room), ri = roomIndex(S.room);
    if (!r || ri > S.unlocked) { go('hub'); return; }
    var wrap = h('section', { class: 'room theme-' + r.theme });
    var banner = h('div', { class: 'room-banner' });
    banner.innerHTML = '<div class="rb-left"><div class="rb-no">Prototype No. ' + r.number + ' · ' + r.year + '</div><h1 class="rb-game">' + esc(r.game) + '</h1><div class="rb-tag">' + esc(r.tagline) + '</div></div>' +
      '<div class="rb-right"><div class="rb-room">' + esc(r.name) + '</div><div class="rb-topic">' + esc(r.topic) + '</div><div class="rb-progress">' + roomSolvedCount(r) + ' of ' + r.puzzles.length + ' pieces checked</div></div>';
    wrap.appendChild(banner);
    var board = h('div', { class: 'board' });
    board.appendChild(h('p', { class: 'board-help' }, 'The box contents are laid out on the table. Pick anything up to look at it more closely.'));
    var props = h('div', { class: 'props' });
    r.puzzles.forEach(function (pz, i) {
      var solved = S.solved[pz.id];
      var b = h('button', { type: 'button', class: 'prop prop-' + pz.prop.kind + (solved ? ' solved' : '') + (S.flipped[pz.id] && !solved ? ' started' : ''), style: '--rot:' + ([-2.5, 1.5, -1, 2.2, -1.8][i % 5]) + 'deg', 'aria-label': pz.prop.name + (solved ? ' (checked)' : '') });
      b.innerHTML = '<span class="prop-art" style="--c1:' + ['#d9a53b', '#2f7f7a', '#b5482f', '#7a4a6b', '#6aa3b5'][i % 5] + ';--c2:' + ['#b5482f', '#d9a53b', '#2f7f7a', '#d9a53b', '#b5482f'][i % 5] + '">' + (PROP_ICON[pz.prop.kind] || PROP_ICON.card) + '</span>' +
        '<span class="prop-name">' + esc(pz.prop.name) + '</span><span class="prop-sub">' + esc(pz.prop.sub || '') + '</span>' +
        (solved ? '<span class="stamp small">QC PASSED</span>' : '') + (S.hints[pz.id] ? '<span class="prop-hints" title="hints used">🔧' + S.hints[pz.id] + '</span>' : '');
      b.onclick = function () { openPuzzle(pz.id); };
      props.appendChild(b);
    });
    board.appendChild(props);
    var deco = h('div', { class: 'board-deco', 'aria-hidden': 'true' });
    deco.innerHTML = Fig.raw.rocket(r.award.color) + Fig.raw.die(r.number % 6 + 1) + Fig.raw.die((r.number + 2) % 6 + 1);
    board.appendChild(deco);
    wrap.appendChild(board);
    var back = h('button', { class: 'btn', type: 'button' }, '← Back to the box'); back.onclick = function () { go('hub'); };
    wrap.appendChild(h('div', { class: 'room-foot' })).appendChild(back);
    main.appendChild(wrap);
  }

  function openPuzzle(pid) {
    var found = puzzleById(pid), pz = found.puzzle, r = found.room;
    var box = h('div', { class: 'inspect' });
    var head = h('div', { class: 'inspect-head' }, '<div class="ih-kicker">' + esc(r.game) + ' · ' + esc(pz.prop.name) + '</div><h2 class="ih-title">' + esc(pz.title) + '</h2>');
    box.appendChild(head);
    var cols = h('div', { class: 'inspect-cols' });
    var mainCol = h('div', { class: 'inspect-main' });
    var logCol = h('aside', { class: 'maint-log', 'aria-label': 'Bert’s maintenance log (hints)' });
    cols.appendChild(mainCol); cols.appendChild(logCol);
    box.appendChild(cols);

    function drawFront() {
      mainCol.innerHTML = '';
      var front = h('div', { class: 'prop-front prop-' + pz.prop.kind });
      front.innerHTML = '<div class="pf-art" style="--c1:#d9a53b;--c2:#b5482f">' + (PROP_ICON[pz.prop.kind] || PROP_ICON.card) + '</div><p class="pf-text">' + esc(pz.prop.front) + '</p>';
      var fb = h('button', { class: 'btn primary', type: 'button' }, '↻ ' + esc(pz.prop.flip || 'Turn it over'));
      fb.onclick = function () { S.flipped[pz.id] = true; save(); drawBack(); var first = mainCol.querySelector('input, select, button'); if (first) first.focus(); };
      front.appendChild(fb);
      mainCol.appendChild(front);
    }
    function drawBack() {
      mainCol.innerHTML = '';
      mainCol.appendChild(h('p', { class: 'puzzle-intro' }, pz.intro));
      pz.parts.forEach(function (part, i) {
        var key = pz.id + '#' + i;
        S.drafts[key] = S.drafts[key] || {};
        var el = P.render(part, {
          key: key, draft: S.drafts[key], solved: !!S.solvedParts[key], showAnswers: teacher.showAnswers,
          onChange: save,
          onAttempt: function (ok) { S.attempts[pz.id] = (S.attempts[pz.id] || 0) + 1; if (!ok) S.wrong[pz.id] = (S.wrong[pz.id] || 0) + 1; save(); },
          onSolved: function () { S.solvedParts[key] = true; checkPuzzle(pz, r); }
        });
        if (pz.parts.length > 1) el.insertBefore(h('div', { class: 'part-no' }, 'Part ' + (i + 1) + ' of ' + pz.parts.length), el.firstChild);
        mainCol.appendChild(el);
      });
      if (S.solved[pz.id]) mainCol.appendChild(h('div', { class: 'solved-banner' }, '<span class="stamp">QC PASSED</span> This piece is done.'));
      if (teacher.unlocked && !S.solved[pz.id]) {
        var tb = h('button', { class: 'btn teacher-btn', type: 'button' }, 'Teacher: mark this puzzle solved');
        tb.onclick = function () { teacherSolve(pz, r); openPuzzle(pz.id); };
        mainCol.appendChild(tb);
      }
    }
    function drawLog() {
      var used = S.hints[pz.id] || 0;
      logCol.innerHTML = '<h3 class="log-title">Maintenance Log</h3><p class="log-sub">B. Nakamura-Reid · caretaker</p>';
      for (var i = 0; i < used; i++) logCol.appendChild(h('div', { class: 'log-entry' }, '<span class="log-tier">' + ['Nudge', 'Method', 'Worked step'][i] + '</span>' + esc(pz.hints[i])));
      if (used < 3) {
        var hb = h('button', { class: 'btn log-btn', type: 'button' }, used === 0 ? 'Look this up in Bert’s log (hint 1 of 3)' : 'Read further (hint ' + (used + 1) + ' of 3)');
        hb.onclick = function () { S.hints[pz.id] = used + 1; save(); drawLog(); tick(); var e = logCol.querySelectorAll('.log-entry'); if (e.length) e[e.length - 1].focus && e[e.length - 1].setAttribute('tabindex', '-1'); if (e.length) e[e.length - 1].focus(); };
        logCol.appendChild(hb);
        logCol.appendChild(h('p', { class: 'log-note' }, 'Hints are counted on your certificate.'));
      } else logCol.appendChild(h('p', { class: 'log-note' }, 'That’s everything Bert wrote about this one.'));
    }
    if (S.flipped[pz.id] || S.solved[pz.id]) drawBack(); else drawFront();
    drawLog();
    openModal(box, { cls: 'wide inspect-modal', label: pz.title, onClose: function () { if (S.screen === 'room') go('room', S.room); } });
  }

  function checkPuzzle(pz, r) {
    var all = pz.parts.every(function (p, i) { return S.solvedParts[pz.id + '#' + i]; });
    if (!all || S.solved[pz.id]) { save(); return; }
    S.solved[pz.id] = true; save();
    toast('✔ ' + pz.prop.name + ' — quality control passed!');
    if (roomComplete(r)) setTimeout(function () { finishRoom(r); }, 900);
    else setTimeout(function () { var m = modalRoot.querySelector('.inspect-main'); if (m && !m.querySelector('.solved-banner')) m.appendChild(h('div', { class: 'solved-banner' }, '<span class="stamp">QC PASSED</span> This piece is done. Close it and pick up something else.')); }, 300);
  }
  function teacherSolve(pz, r) {
    pz.parts.forEach(function (part, i) { var key = pz.id + '#' + i; S.drafts[key] = P.solution(part); S.solvedParts[key] = true; });
    S.solved[pz.id] = true; save();
    if (roomComplete(r) && S.roomDone[roomIndex(r.id)] == null) markRoomDone(r);
  }
  function markRoomDone(r) {
    var i = roomIndex(r.id);
    if (S.roomDone[i] == null) S.roomDone[i] = elapsedMs();
    S.unlocked = Math.max(S.unlocked, Math.min(i + 1, C.rooms.length - 1));
    save();
  }
  function finishRoom(r) {
    var i = roomIndex(r.id), already = S.roomDone[i] != null;
    markRoomDone(r);
    if (already) return;
    var box = h('div', { class: 'award' });
    box.innerHTML = '<div class="ih-kicker">' + esc(r.game) + ' — all pieces checked</div><h2 class="ih-title">Something rattles in the bottom of the box…</h2>' +
      '<div class="award-meeple">' + Fig.raw.meeple(r.award.color, r.award.symbol, 150) + '</div>' +
      '<p>A little <b>' + esc(r.award.name) + '</b> meeple, with its symbol painted on the front. Something is stamped underneath.</p>';
    var flip = h('button', { class: 'btn', type: 'button', autofocus: true }, 'Turn it over');
    var next = h('button', { class: 'btn primary', type: 'button' }, 'Put it in the tray and read the paper underneath');
    flip.onclick = function () {
      box.querySelector('.award-meeple').innerHTML = '<span class="meeple-base big"><span class="base-digit">' + r.award.digit + '</span><span class="base-sym">' + r.award.symbol + '</span></span>';
      S.meepleFlip[r.award.symbol] = true; save(); flip.remove(); next.focus();
    };
    next.onclick = function () {
      S.docsRead[i] = true; save(); closeModal();
      showDoc(C.story.afterRoom[i], i === C.rooms.length - 1 ? 'Back to the box — the vault awaits' : 'Back to the box', function () { go('hub'); });
    };
    var foot = h('div', { class: 'modal-foot' }); foot.appendChild(flip); foot.appendChild(next); box.appendChild(foot);
    openModal(box, { cls: 'award-modal', label: 'Meeple found', noClose: true });
  }

  /* ---------- VAULT --------------------------------------------------------------- */
  function renderVault() {
    if (meeplesFound().length < C.rooms.length) { go('hub'); return; }
    var V = S.vault, bySym = {};
    C.rooms.forEach(function (r) { bySym[r.award.symbol] = r.award; });
    if (!V.seq) V.seq = C.rooms.map(function (r) { return r.award.symbol; });
    var wrap = h('section', { class: 'vault' });
    wrap.appendChild(h('div', { class: 'vault-note' }, docHTML(C.story.vaultNote)));
    var door = h('div', { class: 'vault-door' });
    door.appendChild(h('h1', { class: 'screen-title' }, 'The Vault'));
    door.appendChild(h('p', { class: 'small' }, 'Line up the meeples on the rack (use ◀ ▶ or drag). The digit stamped under each one shows beneath it.'));
    var rack = h('ol', { class: 'rack' });
    var dragSym = null;
    function drawRack() {
      rack.innerHTML = '';
      V.seq.forEach(function (sym, i) {
        var a = bySym[sym];
        var li = h('li', { class: 'rack-slot', draggable: V.comboOk ? 'false' : 'true' });
        li.innerHTML = '<span class="rack-pos">' + (i + 1) + '</span>' + Fig.raw.meeple(a.color, sym, 56) + '<span class="rack-digit" aria-label="stamped digit">' + a.digit + '</span>';
        var l = h('button', { class: 'btn tiny', type: 'button', 'aria-label': 'Move ' + a.name + ' left' }, '◀');
        var r2 = h('button', { class: 'btn tiny', type: 'button', 'aria-label': 'Move ' + a.name + ' right' }, '▶');
        l.disabled = V.comboOk || i === 0; r2.disabled = V.comboOk || i === V.seq.length - 1;
        function mv(j, sel) { var x = V.seq.splice(i, 1)[0]; V.seq.splice(j, 0, x); save(); drawRack(); var bt = rack.children[j].querySelectorAll('button')[sel]; if (bt && !bt.disabled) bt.focus(); }
        l.onclick = function () { mv(i - 1, 0); }; r2.onclick = function () { mv(i + 1, 1); };
        var btns = h('span', { class: 'rack-btns' }); btns.appendChild(l); btns.appendChild(r2); li.appendChild(btns);
        li.addEventListener('dragstart', function (e) { dragSym = sym; e.dataTransfer.setData('text/plain', sym); });
        li.addEventListener('dragover', function (e) { e.preventDefault(); });
        li.addEventListener('drop', function (e) { e.preventDefault(); if (dragSym && dragSym !== sym) { var from = V.seq.indexOf(dragSym), to = V.seq.indexOf(sym); V.seq.splice(from, 1); V.seq.splice(to, 0, dragSym); save(); drawRack(); } });
        rack.appendChild(li);
      });
    }
    drawRack();
    door.appendChild(rack);
    // combination dial
    var dial = h('div', { class: 'dial' });
    dial.appendChild(h('label', { class: 'dial-label', for: 'combo' }, 'Combination dial (8 digits)'));
    var inp = h('input', { id: 'combo', class: 'combo', inputmode: 'numeric', maxlength: '8', autocomplete: 'off', placeholder: '• • • • • • • •' });
    inp.value = V.combo || ''; if (V.comboOk) inp.disabled = true;
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, '').slice(0, 8); V.combo = inp.value; save(); });
    dial.appendChild(inp);
    var fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
    var turn = h('button', { class: 'btn primary', type: 'button' }, V.comboOk ? '✔ Dial set' : 'Spin the dial');
    turn.disabled = V.comboOk;
    var target = C.vault.order.map(function (s) { return bySym[s].digit; }).join('');
    var reversed = C.vault.order.slice().reverse().map(function (s) { return bySym[s].digit; }).join('');
    var found = C.rooms.map(function (r) { return r.award.digit; }).join('');
    function tryCombo() {
      V.attempts = (V.attempts || 0) + 1;
      if (inp.value === target) { V.comboOk = true; save(); fb.className = 'feedback good'; fb.innerHTML = '<span class="fb-stamp">CLICK</span> The first lock gives way… one more question on the dial.'; inp.disabled = true; turn.disabled = true; turn.textContent = '✔ Dial set'; drawRack(); drawExplain(); return; }
      fb.className = 'feedback bad';
      fb.innerHTML = '<span class="fb-stamp bad">CLUNK</span> ' + (inp.value.length < 8 ? 'The dial needs all 8 digits.' : inp.value === reversed ? 'Nearly — but Gussie said the BIGGEST go first.' : inp.value === found ? 'That’s just the order you found them in. Gussie wants them lined up by something about the atoms themselves.' : 'Nothing happens. Think about what “biggest” means for an atom, and check the order of your meeples.');
      save();
    }
    turn.onclick = tryCombo;
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryCombo(); });
    dial.appendChild(turn);
    dial.appendChild(fb);
    door.appendChild(dial);
    var explainBox = h('div', { class: 'explain' });
    door.appendChild(explainBox);
    function drawExplain() {
      explainBox.innerHTML = '';
      if (!V.comboOk) return;
      var part = { type: 'fields', fields: [C.vault.explain] };
      S.drafts.vault = S.drafts.vault || {};
      explainBox.appendChild(P.render(part, { key: 'vault', draft: S.drafts.vault, solved: V.explainOk, showAnswers: teacher.showAnswers, onChange: save, onSolved: function () { V.explainOk = true; save(); openVault(); } }));
    }
    drawExplain();
    if (teacher.showAnswers) door.appendChild(h('div', { class: 'teacher-answers' }, '<b>Answer:</b> order ' + C.vault.order.join(' → ') + ' (largest → smallest atomic radius) · combination ' + target));
    wrap.appendChild(door);
    // hints for the vault
    var log = h('aside', { class: 'maint-log vault-log' });
    function drawLog() {
      var used = S.hints.vault || 0;
      log.innerHTML = '<h3 class="log-title">Maintenance Log</h3><p class="log-sub">B. Nakamura-Reid · the vault</p>';
      for (var i = 0; i < used; i++) log.appendChild(h('div', { class: 'log-entry' }, '<span class="log-tier">' + ['Nudge', 'Method', 'Worked step'][i] + '</span>' + esc(C.vault.hints[i])));
      if (used < 3) { var b = h('button', { class: 'btn log-btn', type: 'button' }, 'Look up the vault in the log (hint ' + (used + 1) + ' of 3)'); b.onclick = function () { S.hints.vault = used + 1; save(); drawLog(); tick(); }; log.appendChild(b); }
    }
    drawLog();
    wrap.appendChild(log);
    main.appendChild(wrap);
    if (V.explainOk && !V.opened) setTimeout(openVault, 300);
  }
  function openVault() {
    S.vault.opened = true;
    if (!S.finishedAt) S.finishedAt = Date.now();
    saveNow();
    var anim = h('div', { class: 'vault-open-anim' }, '<div class="vault-wheel" aria-hidden="true"></div><h2 class="ih-title">The wheel turns…</h2>');
    openModal(anim, { noClose: true, cls: 'award-modal', label: 'The vault opens' });
    setTimeout(function () { closeModal(); showDoc(C.story.ending[0], 'Read Bert’s postscript', function () { showDoc(C.story.ending[1], 'See our certificate', function () { go('ending'); }); }); }, 2200);
  }

  /* ---------- ENDING ---------------------------------------------------------------- */
  function renderEnding() {
    if (!S.vault.opened) { go('hub'); return; }
    var wrap = h('section', { class: 'ending' });
    var date = new Date(S.finishedAt || Date.now());
    var dstr = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    var rooms = C.rooms.map(function (r, i) {
      var hints = r.puzzles.reduce(function (t, p) { return t + (S.hints[p.id] || 0); }, 0);
      var prev = i ? S.roomDone[i - 1] || 0 : 0, dur = S.roomDone[i] != null ? S.roomDone[i] - prev : null;
      return '<tr><td>' + r.number + '. ' + esc(r.game) + '</td><td>' + (dur != null ? fmt(dur) : '—') + '</td><td>' + hints + '</td></tr>';
    }).join('');
    var cert = h('div', { class: 'certificate' });
    cert.innerHTML = '<div class="cert-border"><div class="cert-kicker">The Thistlewood Workers’ Co-operative</div>' +
      '<h1 class="cert-title">Certificate of<br>Master Tinkering</h1>' +
      '<p class="cert-line">This is to certify that</p><div class="cert-team">' + esc(S.team) + '</div>' + (S.players ? '<div class="cert-players">' + esc(S.players) + '</div>' : '') +
      '<p class="cert-line">played all eight prototypes properly, knew their chemistry,<br>and opened Gussie’s vault on ' + esc(dstr) + '.</p>' +
      '<div class="cert-stats"><div><span class="cs-num">' + fmt(elapsedMs()) + '</span><span class="cs-lab">time taken</span></div><div><span class="cs-num">' + totalHints() + '</span><span class="cs-lab">hints from Bert’s log</span></div><div><span class="cs-num">8/8</span><span class="cs-lab">meeples</span></div></div>' +
      '<table class="cert-table"><tr><th>Prototype</th><th>Time</th><th>Hints</th></tr>' + rooms + '<tr><td>The Vault</td><td>' + (S.roomDone[7] != null ? fmt(elapsedMs() - S.roomDone[7]) : '—') + '</td><td>' + (S.hints.vault || 0) + '</td></tr></table>' +
      '<div class="cert-sign"><span class="sig">Bert Nakamura-Reid</span><span class="sig-lab">Caretaker (re-hired)</span></div>' +
      '<div class="stamp cert-stamp">VAULT<br>OPENED<br><small>' + date.getFullYear() + '</small></div></div>';
    wrap.appendChild(cert);
    var btns = h('div', { class: 'ending-btns' });
    var pr = h('button', { class: 'btn primary', type: 'button' }, '🖨 Print certificate'); pr.onclick = function () { window.print(); };
    var pp = h('button', { class: 'btn', type: 'button' }, '✉ Re-read the papers'); pp.onclick = openPapers;
    var again = h('button', { class: 'btn', type: 'button' }, 'New team'); again.onclick = confirmReset;
    btns.appendChild(pr); btns.appendChild(pp); btns.appendChild(again);
    wrap.appendChild(btns);
    main.appendChild(wrap);
  }

  /* ---------- reset ------------------------------------------------------------------ */
  function confirmReset() {
    var box = h('div', { class: 'modal-body' }, '<h2 class="modal-title">Reset the game?</h2><p>This clears <b>all</b> progress' + (S.team ? ' for team <b>' + esc(S.team) + '</b>' : '') + ' on this laptop: meeples, solved puzzles, hints and time. It can’t be undone.</p>');
    var foot = h('div', { class: 'modal-foot' });
    var no = h('button', { class: 'btn', type: 'button', autofocus: true }, 'Keep playing'); no.onclick = closeModal;
    var yes = h('button', { class: 'btn danger', type: 'button' }, 'Yes, reset everything'); yes.onclick = resetGame;
    foot.appendChild(no); foot.appendChild(yes); box.appendChild(foot);
    openModal(box, { label: 'Reset game' });
  }

  /* ---------- TEACHER MODE ------------------------------------------------------------ */
  function openTeacher() {
    if (teacher.unlocked) { teacherPanel(); return; }
    var box = h('form', { class: 'modal-body', autocomplete: 'off' }, '<h2 class="modal-title">Staff only</h2><p class="small">Enter the teacher passcode.</p>');
    var inp = h('input', { type: 'password', 'aria-label': 'Teacher passcode', autofocus: true });
    var fb = h('div', { class: 'feedback' });
    box.appendChild(inp); box.appendChild(fb);
    var b = h('button', { class: 'btn primary', type: 'submit' }, 'Unlock'); box.appendChild(b);
    box.onsubmit = function (e) {
      e.preventDefault();
      if (inp.value === String(CFG.teacherPasscode)) { teacher.unlocked = true; teacherPanel(); }
      else { fb.className = 'feedback bad'; fb.textContent = 'That’s not it.'; inp.select(); }
    };
    openModal(box, { label: 'Teacher passcode' });
  }
  function teacherPanel() {
    var box = h('div', { class: 'modal-body teacher' });
    var rows = C.rooms.map(function (r, i) {
      var hints = r.puzzles.reduce(function (t, p) { return t + (S.hints[p.id] || 0); }, 0);
      var wrong = r.puzzles.reduce(function (t, p) { return t + (S.wrong[p.id] || 0); }, 0);
      var st = S.roomDone[i] != null ? '✔ done at ' + fmt(S.roomDone[i]) : i <= S.unlocked ? 'open' : 'locked';
      return '<tr><td>' + r.number + '. ' + esc(r.name) + '</td><td>' + roomSolvedCount(r) + '/' + r.puzzles.length + '</td><td>' + hints + '</td><td>' + wrong + '</td><td>' + st + '</td>' +
        '<td><button class="btn tiny" data-go="' + i + '" type="button">Go</button> <button class="btn tiny" data-solve="' + i + '" type="button"' + (S.roomDone[i] != null ? ' disabled' : '') + '>Solve room</button></td></tr>';
    }).join('');
    box.innerHTML = '<h2 class="modal-title">Teacher Mode</h2>' +
      '<div class="t-stats"><div><b>Team</b> ' + esc(S.team || '—') + (S.players ? ' (' + esc(S.players) + ')' : '') + '</div><div><b>Elapsed</b> ' + fmt(elapsedMs()) + (S.finishedAt ? ' (finished)' : '') + '</div><div><b>Hints used</b> ' + totalHints() + '</div><div><b>Meeples</b> ' + meeplesFound().length + '/8</div></div>' +
      '<div class="table-wrap"><table class="data"><tr><th>Room</th><th>Puzzles</th><th>Hints</th><th>Wrong tries</th><th>Status</th><th></th></tr>' + rows +
      '<tr><td>Vault</td><td>' + (S.vault.opened ? '1/1' : '0/1') + '</td><td>' + (S.hints.vault || 0) + '</td><td>' + Math.max(0, (S.vault.attempts || 0) - (S.vault.comboOk ? 1 : 0)) + '</td><td>' + (S.vault.opened ? '✔ opened' : '') + '</td><td><button class="btn tiny" data-vault="1" type="button">Go</button></td></tr></table></div>' +
      '<div class="t-toggles"><label><input type="checkbox" id="t-ans"' + (teacher.showAnswers ? ' checked' : '') + '> Show answers in puzzles</label>' +
      '<label><input type="checkbox" id="t-cd"' + (S.countdown ? ' checked' : '') + '> ' + (CFG.countdownMinutes || 45) + '-minute countdown clock</label></div>' +
      '<p class="small">“Go” unlocks every room up to that one. “Solve room” fills in the answers and awards that room’s meeple. Passcode and countdown length are set in <code>js/config.js</code>. A full answer key is in <code>ANSWER_KEY.md</code>.</p>';
    var foot = h('div', { class: 'modal-foot' });
    var lock = h('button', { class: 'btn', type: 'button' }, 'Lock Teacher Mode'); lock.onclick = function () { teacher.unlocked = false; teacher.showAnswers = false; closeModal(); toast('Teacher Mode locked.'); };
    var rs = h('button', { class: 'btn danger', type: 'button' }, 'Reset game'); rs.onclick = confirmReset;
    var cl = h('button', { class: 'btn primary', type: 'button' }, 'Close'); cl.onclick = closeModal;
    foot.appendChild(lock); foot.appendChild(rs); foot.appendChild(cl); box.appendChild(foot);
    box.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.go != null) { var i = +t.dataset.go; if (!S.startedAt) { S.startedAt = Date.now(); S.team = S.team || 'Teacher'; } S.unlocked = Math.max(S.unlocked, i); save(); go('room', C.rooms[i].id); }
      if (t.dataset.solve != null) {
        var r = C.rooms[+t.dataset.solve];
        if (!S.startedAt) { S.startedAt = Date.now(); S.team = S.team || 'Teacher'; }
        r.puzzles.forEach(function (p) { teacherSolve(p, r); }); markRoomDone(r); S.docsRead[+t.dataset.solve] = true; S.meepleFlip[r.award.symbol] = true; save(); teacherPanel(); refreshTop();
      }
      if (t.dataset.vault) { if (meeplesFound().length === C.rooms.length) go(S.vault.opened ? 'ending' : 'vault'); else toast('All 8 rooms must be solved first (use “Solve room”).'); }
    });
    box.querySelector('#t-ans').onchange = function (e) { teacher.showAnswers = e.target.checked; if (S.screen === 'vault') { closeModal(); go('vault'); } };
    box.querySelector('#t-cd').onchange = function (e) { S.countdown = e.target.checked; timeUpShown = false; save(); tick(); };
    openModal(box, { cls: 'wide', label: 'Teacher Mode', onClose: function () { if (S.screen === 'room' || S.screen === 'hub') go(S.screen, S.room); } });
  }

  /* ---------- boot ------------------------------------------------------------------ */
  function boot() {
    shell();
    var scr = S.startedAt ? (S.screen === 'title' ? 'hub' : S.screen) : 'title';
    if (scr === 'room' && !roomById(S.room)) scr = 'hub';
    go(scr, S.room);
  }
  window.Game = { state: function () { return S; }, go: go, openPuzzle: openPuzzle, openTeacher: openTeacher };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
