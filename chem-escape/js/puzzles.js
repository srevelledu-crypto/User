/* ==========================================================================
   Puzzle part renderers. Each part type draws itself into a container,
   keeps its working in a JSON-able "draft" (saved by the engine), and calls
   ctx.onSolved() when correct.
   ========================================================================== */
(function () {
  'use strict';
  var Core = window.ChemCore, Fig = window.Figures;

  /* ---------- helpers -------------------------------------------------------- */
  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    if (html != null) el.innerHTML = html;
    return el;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function seedRand(str) {
    var a = 0; for (var i = 0; i < str.length; i++) a = (a * 31 + str.charCodeAt(i)) | 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(arr, seed) {
    var r = seedRand(seed), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function feedback(box, ok, msgs) {
    box.className = 'feedback ' + (ok ? 'good' : 'bad');
    if (ok) { box.innerHTML = '<span class="fb-stamp">PASSED</span> Quality control approved.'; return; }
    var list = (msgs || []).filter(Boolean);
    var uniq = list.filter(function (m, i) { return list.indexOf(m) === i; }).slice(0, 3);
    box.innerHTML = '<span class="fb-stamp bad">NOT YET</span> ' + (uniq.length ? '<ul>' + uniq.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>' : 'Not quite — have another look.');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  function actions(ctx, onCheck, label) {
    var wrap = h('div', { class: 'part-actions' });
    var btn = h('button', { class: 'btn check', type: 'button' }, ctx.solved ? '✔ Solved' : (label || 'Check'));
    btn.disabled = !!ctx.solved;
    var fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
    if (ctx.solved) { fb.className = 'feedback good'; fb.innerHTML = '<span class="fb-stamp">PASSED</span> Quality control approved.'; }
    btn.addEventListener('click', function () {
      var r = onCheck();
      feedback(fb, r.ok, r.msgs);
      ctx.onAttempt && ctx.onAttempt(r.ok);
      if (r.ok) { btn.disabled = true; btn.textContent = '✔ Solved'; ctx.onSolved(); }
    });
    wrap.appendChild(btn); wrap.appendChild(fb);
    return wrap;
  }
  function labelText(s) { return Core.stripHtml(s); }

  var R = {};

  /* ======================================================================
     FIELDS — inputs, selects, tables
     ====================================================================== */
  function fieldList(part) {
    var out = [];
    if (part.rows) part.rows.forEach(function (row, ri) { row.cells.forEach(function (f, ci) { if (f) out.push({ f: f, id: 'r' + ri + 'c' + ci, row: row, ci: ci }); }); });
    else part.fields.forEach(function (f, i) { out.push({ f: f, id: 'f' + i }); });
    return out;
  }
  R.fields = function (part, ctx) {
    var d = ctx.draft; d.values = d.values || {}; d.okf = d.okf || {};
    var root = h('div', { class: 'part part-fields' });
    if (part.heading) root.appendChild(h('p', { class: 'part-heading' }, part.heading));
    if (part.fig) root.appendChild(h('div', null, Fig.render(part.fig)));
    var inputs = {};
    function makeInput(entry) {
      var f = entry.f, id = entry.id, val = d.values[id] != null ? d.values[id] : '';
      var wrap = h('span', { class: 'finput kind-' + f.kind });
      var aria = labelText((entry.row ? entry.row.label + ' — ' + (part.columns[entry.ci] || '') : f.label));
      var el;
      if (f.kind === 'select') {
        el = h('select', { 'aria-label': aria });
        el.appendChild(h('option', { value: '' }, '— choose —'));
        var opts = f.noShuffle ? f.options.slice().sort() : shuffle(f.options, ctx.key + id);
        opts.forEach(function (o) { var op = h('option', { value: o }); op.textContent = o; if (o === val) op.selected = true; el.appendChild(op); });
      } else {
        el = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': aria, placeholder: f.placeholder || ({ number: 'number', config: 'e.g. 1s2 2s2…', formula: 'formula', equation: 'e.g. 2Na(s) + Cl2(g) -> 2NaCl(s)', symbol: 'Xx' })[f.kind] || '' });
        el.value = val;
      }
      el.addEventListener('input', function () { d.values[id] = el.value; delete d.okf[id]; el.classList.remove('is-ok', 'is-bad'); ctx.onChange(); });
      el.addEventListener('change', function () { d.values[id] = el.value; ctx.onChange(); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && f.kind !== 'select') { e.preventDefault(); var b = root.querySelector('.btn.check'); if (b && !b.disabled) b.click(); } });
      if (ctx.solved || d.okf[id]) { el.disabled = true; el.classList.add('is-ok'); }
      inputs[id] = el;
      wrap.appendChild(el);
      if (f.kind === 'equation' && !ctx.solved) {
        var ab = h('button', { type: 'button', class: 'btn tiny', title: 'Insert arrow', 'aria-label': 'Insert reaction arrow' }, '→');
        ab.addEventListener('click', function () { var p = el.selectionStart || el.value.length; el.value = el.value.slice(0, p) + ' → ' + el.value.slice(p); el.focus(); d.values[id] = el.value; ctx.onChange(); });
        wrap.appendChild(ab);
      }
      if (f.units) wrap.appendChild(h('span', { class: 'units' }, esc(f.units)));
      return wrap;
    }
    var list = fieldList(part);
    if (part.rows && part.layout === 'cards') {
      part.rows.forEach(function (row, ri) {
        var card = h('div', { class: 'fcard' });
        card.appendChild(h('div', { class: 'fcard-label' }, row.label));
        row.cells.forEach(function (f, ci) {
          if (!f) return;
          var line = h('div', { class: 'fcard-line' });
          line.appendChild(h('span', { class: 'fcard-col' }, part.columns[ci]));
          line.appendChild(makeInput({ f: f, id: 'r' + ri + 'c' + ci, row: row, ci: ci }));
          card.appendChild(line);
        });
        root.appendChild(card);
      });
    } else if (part.rows) {
      var tbl = h('table', { class: 'ftable' });
      var hr = '<tr><th></th>' + part.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
      tbl.innerHTML = '<thead>' + hr + '</thead>';
      var tb = h('tbody');
      part.rows.forEach(function (row, ri) {
        var tr = h('tr');
        tr.appendChild(h('th', { scope: 'row', class: 'rowlab' }, row.label));
        row.cells.forEach(function (f, ci) {
          var td = h('td', f ? null : { class: 'blank' });
          if (f) td.appendChild(makeInput({ f: f, id: 'r' + ri + 'c' + ci, row: row, ci: ci }));
          tr.appendChild(td);
        });
        for (var k = row.cells.length; k < part.columns.length; k++) tr.appendChild(h('td', { class: 'blank' }));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      root.appendChild(h('div', { class: 'table-wrap' })).appendChild(tbl);
    } else {
      list.forEach(function (entry) {
        var row = h('div', { class: 'frow' + (entry.f.kind === 'equation' || entry.f.kind === 'select' ? ' wide' : '') });
        row.appendChild(h('label', { class: 'flabel' }, entry.f.label));
        row.appendChild(makeInput(entry));
        root.appendChild(row);
      });
    }
    root.appendChild(actions(ctx, function () {
      var msgs = [], allOk = true, badSelects = 0, selMsgs = [];
      list.forEach(function (entry) {
        var el = inputs[entry.id], f = entry.f;
        if (d.okf[entry.id]) return;
        var r = Core.checkField(f, el.value);
        if (r.ok) {
          if (f.kind !== 'select') { d.okf[entry.id] = true; el.classList.add('is-ok'); el.classList.remove('is-bad'); el.disabled = true; }
        } else {
          allOk = false;
          if (f.kind === 'select') { badSelects++; if (r.msg && el.value) selMsgs.push(r.msg); if (!el.value) msgs.push('Choose an option in every drop-down.'); }
          else {
            el.classList.add('is-bad');
            var where = entry.row ? labelText(entry.row.label) + (part.columns.length > 1 ? ' (' + labelText(part.columns[entry.ci]) + ')' : '') : '';
            msgs.push((where ? '<b>' + esc(where) + ':</b> ' : '') + r.msg);
          }
        }
      });
      if (badSelects && !msgs.length) msgs.push(badSelects === 1 ? 'One of your choices isn’t right yet.' : badSelects + ' of your choices aren’t right yet.');
      if (allOk) list.forEach(function (e) { inputs[e.id].disabled = true; inputs[e.id].classList.add('is-ok'); });
      ctx.onChange();
      return { ok: allOk, msgs: msgs.concat(selMsgs) };
    }));
    return root;
  };
  function solveFields(part) {
    var v = {}, okf = {};
    fieldList(part).forEach(function (e) {
      var a = e.f.answer;
      if (e.f.kind === 'equation') a = a.replace(/\(([a-z]+)\/[a-z/]+\)/g, '($1)');
      v[e.id] = String(a); okf[e.id] = true;
    });
    return { values: v, okf: okf };
  }

  /* ======================================================================
     SLOTS — drag-and-drop (or click-to-place) into slots / bins
     ====================================================================== */
  R.slots = function (part, ctx) {
    var d = ctx.draft; d.place = d.place || {};
    var bins = part.layout === 'bins';
    var root = h('div', { class: 'part part-slots layout-' + (part.layout || 'list') });
    var selected = null;
    var tileById = {}; part.tiles.forEach(function (t) { tileById[t.id] = t; });
    var tileOrder = shuffle(part.tiles.map(function (t) { return t.id; }), ctx.key + 'tiles');

    function tileEl(id) {
      var t = tileById[id];
      var b = h('button', { type: 'button', class: 'tile' + (t.fig ? ' has-fig' : '') + (selected === id ? ' selected' : ''), draggable: ctx.solved ? 'false' : 'true', 'data-tile': id, 'aria-pressed': selected === id ? 'true' : 'false', 'aria-label': labelText(t.alt || t.label) });
      b.innerHTML = (t.fig ? Fig.render(t.fig) : '') + '<span class="tile-label">' + t.label + '</span>';
      if (ctx.solved) b.disabled = true;
      b.addEventListener('click', function (e) { e.stopPropagation(); if (selected && selected !== id && d.place[id]) { place(selected, d.place[id]); return; } selected = selected === id ? null : id; draw(); var again = root.querySelector('[data-tile="' + id + '"]'); if (again) again.focus(); });
      b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; selected = id; b.classList.add('dragging'); });
      b.addEventListener('dragend', function () { b.classList.remove('dragging'); });
      return b;
    }
    function place(tile, slotId) {
      if (!tile || ctx.solved) return;
      if (!bins && slotId) { for (var k in d.place) if (d.place[k] === slotId && k !== tile) delete d.place[k]; }
      if (slotId) d.place[tile] = slotId; else delete d.place[tile];
      selected = null; ctx.onChange(); draw();
    }
    function dropzone(el, slotId) {
      el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
      el.addEventListener('dragleave', function () { el.classList.remove('over'); });
      el.addEventListener('drop', function (e) { e.preventDefault(); el.classList.remove('over'); place(e.dataTransfer.getData('text/plain'), slotId); });
      el.addEventListener('click', function () { if (selected) { place(selected, slotId); var z = root.querySelector('[data-slot="' + (slotId || '__pool') + '"]'); if (z) z.focus(); } });
      el.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); el.click(); } });
    }
    var host = h('div', { class: 'slots-host' });
    root.appendChild(host);
    function draw() {
      host.innerHTML = '';
      var pool = h('div', { class: 'pool', 'data-slot': '__pool', tabindex: ctx.solved ? null : '0', role: 'button', 'aria-label': 'Parts tray. Select a part, then choose where it goes.' });
      pool.appendChild(h('div', { class: 'pool-label' }, ctx.solved ? 'All placed' : (bins ? 'Cards to sort' : 'Parts tray') + ' — click a card, then click where it goes (or drag it)'));
      tileOrder.forEach(function (id) { if (!d.place[id]) pool.appendChild(tileEl(id)); });
      dropzone(pool, null);
      var area = h('div', { class: 'slot-area' });
      if (part.layout === 'diagram') {
        var figWrap = h('div', { class: 'diagram-fig' }, Fig.render(part.fig));
        area.appendChild(figWrap);
        setTimeout(function () {
          part.slots.forEach(function (s) {
            var g = figWrap.querySelector('#part-' + s.id);
            if (g) g.classList.toggle('placed', Object.keys(d.place).some(function (k) { return d.place[k] === s.id; }));
          });
        }, 0);
      }
      var slotsBox = h('div', { class: bins ? 'bins' : 'slot-list' });
      part.slots.forEach(function (s) {
        var here = Object.keys(d.place).filter(function (k) { return d.place[k] === s.id; });
        var z = h('div', { class: (bins ? 'bin' : 'slot') + (here.length ? ' filled' : ''), 'data-slot': s.id, tabindex: ctx.solved ? null : '0', role: 'button', 'aria-label': labelText(s.label) + (here.length ? ': ' + here.map(function (x) { return labelText(tileById[x].alt || tileById[x].label); }).join(', ') : ': empty') });
        z.appendChild(h('div', { class: 'slot-label' }, (s.fig ? Fig.render(s.fig) : '') + '<span>' + s.label + '</span>'));
        var inner = h('div', { class: 'slot-inner' });
        if (!here.length) inner.appendChild(h('span', { class: 'slot-empty' }, bins ? 'drop cards here' : 'drop here'));
        here.forEach(function (id) { inner.appendChild(tileEl(id)); });
        z.appendChild(inner);
        dropzone(z, s.id);
        slotsBox.appendChild(z);
      });
      area.appendChild(slotsBox);
      host.appendChild(pool);
      host.appendChild(area);
    }
    draw();
    root.appendChild(actions(ctx, function () {
      var placed = Object.keys(d.place).length;
      if (bins) {
        if (placed < part.tiles.length) return { ok: false, msgs: ['Sort every card into a bin first (' + (part.tiles.length - placed) + ' left).'] };
        var wrong = part.tiles.filter(function (t) { var s = part.slots.filter(function (x) { return x.id === d.place[t.id]; })[0]; return [].concat(s.answer).indexOf(t.id) < 0; });
        return wrong.length ? { ok: false, msgs: [wrong.length === 1 ? 'One card is in the wrong place.' : wrong.length + ' cards are in the wrong place.'] } : { ok: true };
      }
      var empty = part.slots.filter(function (s) { return !Object.keys(d.place).some(function (k) { return d.place[k] === s.id; }); });
      if (empty.length) return { ok: false, msgs: ['Fill every space first (' + empty.length + ' empty).'] };
      var msgs = [], right = 0;
      part.slots.forEach(function (s) {
        var t = Object.keys(d.place).filter(function (k) { return d.place[k] === s.id; })[0];
        if ([].concat(s.answer).indexOf(t) >= 0) right++;
        else if (s.wrong && s.wrong[t]) msgs.push(s.wrong[t]);
      });
      if (right === part.slots.length) return { ok: true };
      return { ok: false, msgs: [right + ' of ' + part.slots.length + ' are in the right place.'].concat(msgs) };
    }));
    return root;
  };
  function solveSlots(part) {
    var p = {};
    part.slots.forEach(function (s) { [].concat(s.answer).forEach(function (a, i) { if (part.layout === 'bins' || i === 0) p[a] = s.id; }); });
    return { place: p };
  }

  /* ======================================================================
     ORDER — sort a list
     ====================================================================== */
  R.order = function (part, ctx) {
    var d = ctx.draft;
    if (!d.seq) {
      var seq = shuffle(part.answer, ctx.key + 'order'), n = 0;
      while (seq.join() === part.answer.join() && n++ < 5) seq = shuffle(seq, ctx.key + 'o' + n);
      d.seq = seq;
    }
    var label = {}; part.items.forEach(function (i) { label[i.id] = i.label; });
    var root = h('div', { class: 'part part-order' });
    if (part.heading) root.appendChild(h('p', { class: 'part-heading' }, part.heading));
    var ol = h('ol', { class: 'order-list' });
    root.appendChild(h('div', { class: 'order-end top' }, '▲ ' + part.topLabel));
    root.appendChild(ol);
    root.appendChild(h('div', { class: 'order-end bottom' }, '▼ ' + part.bottomLabel));
    var dragId = null;
    function move(i, j, focusSel) {
      if (j < 0 || j >= d.seq.length || ctx.solved) return;
      var x = d.seq.splice(i, 1)[0]; d.seq.splice(j, 0, x); ctx.onChange(); draw();
      if (focusSel) { var b = ol.querySelector('[data-id="' + x + '"] ' + focusSel); if (b && !b.disabled) b.focus(); else { var b2 = ol.querySelector('[data-id="' + x + '"] button:not([disabled])'); if (b2) b2.focus(); } }
    }
    function draw() {
      ol.innerHTML = '';
      d.seq.forEach(function (id, i) {
        var li = h('li', { class: 'order-item', draggable: ctx.solved ? 'false' : 'true', 'data-id': id });
        li.innerHTML = '<span class="grip" aria-hidden="true">⠿</span><span class="order-label">' + label[id] + '</span>';
        var up = h('button', { type: 'button', class: 'btn tiny up', 'aria-label': 'Move ' + labelText(label[id]) + ' up' }, '▲');
        var dn = h('button', { type: 'button', class: 'btn tiny dn', 'aria-label': 'Move ' + labelText(label[id]) + ' down' }, '▼');
        up.disabled = ctx.solved || i === 0; dn.disabled = ctx.solved || i === d.seq.length - 1;
        up.addEventListener('click', function () { move(i, i - 1, '.up'); });
        dn.addEventListener('click', function () { move(i, i + 1, '.dn'); });
        li.appendChild(up); li.appendChild(dn);
        li.addEventListener('dragstart', function (e) { dragId = id; e.dataTransfer.setData('text/plain', id); li.classList.add('dragging'); });
        li.addEventListener('dragend', function () { li.classList.remove('dragging'); });
        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('over'); });
        li.addEventListener('drop', function (e) { e.preventDefault(); li.classList.remove('over'); if (dragId && dragId !== id) move(d.seq.indexOf(dragId), d.seq.indexOf(id)); });
        ol.appendChild(li);
      });
    }
    draw();
    root.appendChild(actions(ctx, function () {
      if (d.seq.join() === part.answer.join()) return { ok: true };
      var msgs = [];
      (part.rules || []).forEach(function (r) { if (d.seq.indexOf(r.a) > d.seq.indexOf(r.b)) msgs.push(r.msg); });
      var right = d.seq.filter(function (x, i) { return part.answer[i] === x; }).length;
      return { ok: false, msgs: [right + ' of ' + d.seq.length + ' are in the right position.'].concat(msgs.slice(0, 1)) };
    }));
    return root;
  };

  /* ======================================================================
     SPOT — flag the faulty lines
     ====================================================================== */
  R.spot = function (part, ctx) {
    var d = ctx.draft; d.flags = d.flags || {};
    var root = h('div', { class: 'part part-spot' });
    root.appendChild(h('p', { class: 'spot-count' }, 'Faults to find: <b>' + part.count + '</b> · flagged: <b class="nflag">' + Object.keys(d.flags).length + '</b>'));
    var ul = h('ol', { class: 'spot-list' });
    part.lines.forEach(function (l, i) {
      var li = h('li');
      var b = h('button', { type: 'button', class: 'spot-line' + (d.flags[i] ? ' flagged' : ''), 'aria-pressed': d.flags[i] ? 'true' : 'false' }, '<span class="spot-mark" aria-hidden="true">' + (d.flags[i] ? '✗' : '') + '</span><span>' + l.text + '</span>');
      if (ctx.solved) b.disabled = true;
      b.addEventListener('click', function () {
        if (d.flags[i]) delete d.flags[i]; else d.flags[i] = true;
        b.classList.toggle('flagged', !!d.flags[i]); b.setAttribute('aria-pressed', d.flags[i] ? 'true' : 'false');
        b.querySelector('.spot-mark').textContent = d.flags[i] ? '✗' : '';
        root.querySelector('.nflag').textContent = Object.keys(d.flags).length;
        ctx.onChange();
      });
      li.appendChild(b);
      if (ctx.solved && l.error && l.fix) li.appendChild(h('div', { class: 'spot-fix' }, '✎ ' + l.fix));
      ul.appendChild(li);
    });
    root.appendChild(ul);
    root.appendChild(actions(ctx, function () {
      var wrongFlag = part.lines.some(function (l, i) { return d.flags[i] && !l.error; });
      var found = part.lines.filter(function (l, i) { return d.flags[i] && l.error; }).length;
      if (!wrongFlag && found === part.count) {
        part.lines.forEach(function (l, i) { if (l.error && l.fix) { var li = ul.children[i]; if (!li.querySelector('.spot-fix')) li.appendChild(h('div', { class: 'spot-fix' }, '✎ ' + l.fix)); } });
        return { ok: true };
      }
      var m = [];
      if (wrongFlag) m.push('At least one line you flagged is actually correct.');
      if (found < part.count) m.push('There ' + (part.count - found === 1 ? 'is still 1 fault' : 'are still ' + (part.count - found) + ' faults') + ' you haven’t flagged.');
      return { ok: false, msgs: m };
    }, 'Submit corrections'));
    return root;
  };

  /* ======================================================================
     ORBITAL — arrow-in-box diagrams with Hund / Pauli feedback
     ====================================================================== */
  R.orbital = function (part, ctx) {
    var d = ctx.draft; d.boxes = d.boxes || {}; d.okd = d.okd || {};
    var root = h('div', { class: 'part part-orbital' });
    var held = null; // 'u' | 'd'
    var palette = h('div', { class: 'arrow-palette' });
    palette.innerHTML = '<span>Arrow plugs:</span>';
    ['u', 'd'].forEach(function (a) {
      var b = h('button', { type: 'button', class: 'arrow-plug', draggable: 'true', 'aria-pressed': 'false', 'aria-label': a === 'u' ? 'Spin-up arrow' : 'Spin-down arrow' }, a === 'u' ? '↑' : '↓');
      b.addEventListener('click', function () { held = held === a ? null : a; palette.querySelectorAll('.arrow-plug').forEach(function (x) { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); }); if (held) { b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); } });
      b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', a); });
      palette.appendChild(b);
    });
    palette.appendChild(h('span', { class: 'palette-help' }, 'Drag a plug into a socket — or click a socket to cycle ↑ → ↓ → empty.'));
    if (!ctx.solved) root.appendChild(palette);
    var msgBoxes = {};
    part.diagrams.forEach(function (dg) {
      if (!d.boxes[dg.id]) { d.boxes[dg.id] = {}; dg.subshells.forEach(function (s) { var arr = []; for (var i = 0; i < s.boxes; i++) arr.push([null, null]); d.boxes[dg.id][s.name] = arr; }); }
      var locked = ctx.solved || d.okd[dg.id];
      var card = h('div', { class: 'orb-card' + (locked ? ' ok' : '') });
      card.appendChild(h('div', { class: 'orb-title' }, dg.label + (locked ? ' <span class="okmark">✔</span>' : '')));
      var row = h('div', { class: 'orb-row' });
      if (dg.core) row.appendChild(h('span', { class: 'orb-core' }, dg.core));
      dg.subshells.forEach(function (s) {
        var grp = h('div', { class: 'orb-sub' });
        var bx = h('div', { class: 'orb-boxes' });
        d.boxes[dg.id][s.name].forEach(function (box, bi) {
          var b = h('div', { class: 'orb-box' });
          [0, 1].forEach(function (half) {
            var v = box[half];
            var sock = h('button', { type: 'button', class: 'sock', 'aria-label': dg.label + ' ' + s.name + ' orbital ' + (bi + 1) + ' socket ' + (half + 1) + ': ' + (v === 'u' ? 'up' : v === 'd' ? 'down' : 'empty') }, v === 'u' ? '↑' : v === 'd' ? '↓' : '');
            if (locked) sock.disabled = true;
            function set(val) { box[half] = val; delete d.okd[dg.id]; ctx.onChange(); sock.textContent = val === 'u' ? '↑' : val === 'd' ? '↓' : ''; sock.setAttribute('aria-label', dg.label + ' ' + s.name + ' orbital ' + (bi + 1) + ' socket ' + (half + 1) + ': ' + (val === 'u' ? 'up' : val === 'd' ? 'down' : 'empty')); }
            sock.addEventListener('click', function () { if (held) set(box[half] === held ? null : held); else set(box[half] === null ? 'u' : box[half] === 'u' ? 'd' : null); });
            sock.addEventListener('dragover', function (e) { e.preventDefault(); });
            sock.addEventListener('drop', function (e) { e.preventDefault(); var a = e.dataTransfer.getData('text/plain'); if (a === 'u' || a === 'd') set(a); });
            b.appendChild(sock);
          });
          bx.appendChild(b);
        });
        grp.appendChild(bx);
        grp.appendChild(h('div', { class: 'orb-lab' }, s.name));
        row.appendChild(grp);
      });
      card.appendChild(row);
      msgBoxes[dg.id] = card;
      root.appendChild(card);
    });
    root.appendChild(actions(ctx, function () {
      var msgs = [], all = true;
      part.diagrams.forEach(function (dg) {
        if (d.okd[dg.id]) return;
        var r = Core.checkOrbitals(dg, d.boxes[dg.id]);
        msgBoxes[dg.id].classList.toggle('ok', r.ok); msgBoxes[dg.id].classList.toggle('bad', !r.ok);
        if (r.ok) { d.okd[dg.id] = true; msgBoxes[dg.id].querySelectorAll('.sock').forEach(function (s) { s.disabled = true; }); }
        else { all = false; msgs.push('<b>' + esc(dg.label.split(' (')[0]) + ':</b> ' + r.msg); }
      });
      ctx.onChange();
      return { ok: all, msgs: msgs };
    }, 'Test the wiring'));
    return root;
  };
  function solveOrbital(part) {
    var boxes = {}, okd = {};
    part.diagrams.forEach(function (dg) {
      boxes[dg.id] = {}; okd[dg.id] = true;
      dg.subshells.forEach(function (s) {
        var n = dg.expect[s.name], arr = [];
        for (var b = 0; b < s.boxes; b++) arr.push([null, null]);
        for (var e = 0; e < n; e++) { if (e < s.boxes) arr[e][0] = 'u'; else arr[e - s.boxes][1] = 'd'; }
        boxes[dg.id][s.name] = arr;
      });
    });
    return { boxes: boxes, okd: okd };
  }

  /* ======================================================================
     GRID — logic grid
     ====================================================================== */
  R.grid = function (part, ctx) {
    var d = ctx.draft; d.marks = d.marks || {};
    var root = h('div', { class: 'part part-grid' });
    if (part.fig) root.appendChild(h('div', { class: 'table-wrap' }, Fig.render(part.fig)));
    var t = h('table', { class: 'logic' });
    t.innerHTML = '<tr><th></th>' + part.cols.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') + '</tr>';
    part.rows.forEach(function (r, ri) {
      var tr = h('tr'); tr.appendChild(h('th', { scope: 'row' }, 'Sample ' + r));
      part.cols.forEach(function (c, ci) {
        var k = ri + '-' + ci, td = h('td');
        var b = h('button', { type: 'button', class: 'cell' }, '');
        function paint() { var m = d.marks[k]; b.textContent = m === 'y' ? '✓' : m === 'n' ? '✗' : ''; b.className = 'cell ' + (m || ''); b.setAttribute('aria-label', 'Sample ' + r + ' is ' + c + ': ' + (m === 'y' ? 'yes' : m === 'n' ? 'no' : 'unmarked')); }
        paint();
        if (ctx.solved) b.disabled = true;
        b.addEventListener('click', function () { d.marks[k] = !d.marks[k] ? 'y' : d.marks[k] === 'y' ? 'n' : undefined; if (!d.marks[k]) delete d.marks[k]; paint(); ctx.onChange(); });
        td.appendChild(b); tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    root.appendChild(h('div', { class: 'table-wrap' })).appendChild(t);
    root.appendChild(actions(ctx, function () {
      var bad = 0, multi = false;
      part.rows.forEach(function (r, ri) {
        var ys = part.cols.map(function (c, ci) { return d.marks[ri + '-' + ci] === 'y' ? ci : -1; }).filter(function (x) { return x >= 0; });
        if (ys.length !== 1) multi = true; else if (ys[0] !== part.answer[ri]) bad++;
      });
      if (multi) return { ok: false, msgs: ['Each sample needs exactly ONE ✓ (click a square once for ✓, twice for ✗).'] };
      return bad ? { ok: false, msgs: [bad === 1 ? 'One sample is wrongly identified.' : bad + ' samples are wrongly identified.'] } : { ok: true };
    }));
    return root;
  };

  /* ======================================================================
     BALANCE — coefficient dials + state selects
     ====================================================================== */
  R.balance = function (part, ctx) {
    var d = ctx.draft; d.eq = d.eq || {}; d.oke = d.oke || {};
    var root = h('div', { class: 'part part-balance' });
    var rows = {};
    part.equations.forEach(function (e, ei) {
      var p = Core.parseEquation(e.answer);
      var st = d.eq[e.id] = d.eq[e.id] || { coef: [], state: [] };
      var locked = ctx.solved || d.oke[e.id];
      var row = h('div', { class: 'mould' + (locked ? ' ok' : '') });
      row.appendChild(h('span', { class: 'mould-no' }, 'Mould ' + (ei + 1)));
      var all = p.lhs.concat(p.rhs), idx = 0;
      [p.lhs, p.rhs].forEach(function (side, si) {
        side.forEach(function (sp, k) {
          var i = idx++;
          if (k > 0) row.appendChild(h('span', { class: 'op' }, '+'));
          var sp1 = h('span', { class: 'species' });
          var c = h('input', { type: 'text', inputmode: 'numeric', class: 'coef', maxlength: '2', 'aria-label': 'Coefficient for ' + sp.formula, placeholder: ' ' });
          c.value = st.coef[i] || '';
          var s = h('select', { class: 'state', 'aria-label': 'State of ' + sp.formula });
          s.innerHTML = '<option value="">( )</option><option value="s">(s)</option><option value="l">(l)</option><option value="g">(g)</option><option value="aq">(aq)</option>';
          s.value = st.state[i] || '';
          if (locked) { c.disabled = true; s.disabled = true; }
          c.addEventListener('input', function () { c.value = c.value.replace(/[^0-9]/g, ''); st.coef[i] = c.value; delete d.oke[e.id]; ctx.onChange(); });
          s.addEventListener('change', function () { st.state[i] = s.value; delete d.oke[e.id]; ctx.onChange(); });
          sp1.appendChild(c);
          sp1.appendChild(h('span', { class: 'formula' }, Core.prettyFormula(sp.formula)));
          sp1.appendChild(s);
          row.appendChild(sp1);
        });
        if (si === 0) row.appendChild(h('span', { class: 'op arrow' }, '→'));
      });
      rows[e.id] = { row: row, p: p, n: all.length };
      root.appendChild(row);
    });
    root.appendChild(actions(ctx, function () {
      var msgs = [], ok = true;
      part.equations.forEach(function (e, ei) {
        if (d.oke[e.id]) return;
        var st = d.eq[e.id], p = rows[e.id].p, i = 0;
        function side(arr) { return arr.map(function (sp) { var j = i++; var c = st.coef[j]; if (c === '0') c = '0'; return (c && c !== '1' ? c : '') + sp.formula + (st.state[j] ? '(' + st.state[j] + ')' : ''); }).join(' + '); }
        var zero = st.coef.some(function (c) { return c === '0'; });
        var str = side(p.lhs) + ' -> ' + side(p.rhs);
        var r = zero ? { ok: false, msg: 'A coefficient can’t be 0 — leave it blank for 1.' } : Core.checkEquation({ answer: e.answer }, str);
        rows[e.id].row.classList.toggle('ok', r.ok); rows[e.id].row.classList.toggle('bad', !r.ok);
        if (r.ok) { d.oke[e.id] = true; rows[e.id].row.querySelectorAll('input,select').forEach(function (x) { x.disabled = true; }); }
        else { ok = false; msgs.push('<b>Mould ' + (ei + 1) + ':</b> ' + r.msg); }
      });
      ctx.onChange();
      return { ok: ok, msgs: msgs };
    }, 'Pull the lever'));
    return root;
  };
  function solveBalance(part) {
    var eq = {}, oke = {};
    part.equations.forEach(function (e) {
      var p = Core.parseEquation(e.answer), all = p.lhs.concat(p.rhs);
      eq[e.id] = { coef: all.map(function (s) { return s.coef > 1 ? String(s.coef) : ''; }), state: all.map(function (s) { return s.states[0]; }) };
      oke[e.id] = true;
    });
    return { eq: eq, oke: oke };
  }

  /* ---------- public API --------------------------------------------------- */
  window.Puzzles = {
    render: function (part, ctx) {
      var el = (R[part.type] || function () { return h('div', null, 'Unknown part type: ' + esc(part.type)); })(part, ctx);
      if (ctx.showAnswers) {
        el.appendChild(h('div', { class: 'teacher-answers' }, '<b>Answer:</b><ul>' + Core.partAnswerLines(part).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'));
      }
      return el;
    },
    solution: function (part) {
      switch (part.type) {
        case 'fields': return solveFields(part);
        case 'slots': return solveSlots(part);
        case 'order': return { seq: part.answer.slice() };
        case 'spot': { var f = {}; part.lines.forEach(function (l, i) { if (l.error) f[i] = true; }); return { flags: f }; }
        case 'orbital': return solveOrbital(part);
        case 'grid': { var m = {}; part.answer.forEach(function (c, r) { m[r + '-' + c] = 'y'; }); return { marks: m }; }
        case 'balance': return solveBalance(part);
      }
      return {};
    },
    shuffle: shuffle, h: h, esc: esc
  };
})();
