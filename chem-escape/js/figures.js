/* ==========================================================================
   Figures — all artwork is generated here as inline SVG / HTML.
   Each function takes the "fig" object from content.js and returns markup.
   ========================================================================== */
(function () {
  'use strict';
  var Core = window.ChemCore;
  var INK = '#1f1b16', TEAL = '#2f7f7a', BRICK = '#b5482f', MUSTARD = '#d9a53b', CREAM = '#f6eedb';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function sub(f) { return Core.prettyFormula(f); }

  /* ---------- wavelength → approximate colour ------------------------------ */
  function nmColour(w) {
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; }
    else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; }
    else if (w < 645) { r = 1; g = -(w - 645) / 65; } else { r = 1; }
    var f = w > 700 ? 0.3 + 0.7 * (780 - w) / 80 : w < 420 ? 0.3 + 0.7 * (w - 380) / 40 : 1;
    function c(x) { return Math.round(255 * Math.pow(Math.max(0, x * f), 0.8)); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }

  var F = {};

  /* ---------- Room 1 ------------------------------------------------------- */
  F.chromatogram = function (fig) {
    var cm = 38, top = 20, base = top + 9 * cm, lanes = fig.lanes, w = 120 + lanes.length * 84;
    var s = '<svg class="fig-svg" viewBox="0 0 ' + w + ' ' + (base + 50) + '" role="img" aria-label="Chromatogram with ruler. Solvent front and spots shown; ruler zero is on the baseline.">';
    s += '<rect x="96" y="' + (top - 8) + '" width="' + (lanes.length * 84 + 10) + '" height="' + (9 * cm + 30) + '" fill="#fbf7ec" stroke="#cdbf9f"/>';
    // ruler
    s += '<rect x="20" y="' + (top - 8) + '" width="58" height="' + (9 * cm + 22) + '" rx="3" fill="#e9c98a" stroke="#9c7a3c"/>';
    for (var mm = 0; mm <= 90; mm++) {
      var y = base - mm * cm / 10, len = mm % 10 === 0 ? 22 : mm % 5 === 0 ? 14 : 8;
      s += '<line x1="78" x2="' + (78 - len) + '" y1="' + y + '" y2="' + y + '" stroke="' + INK + '" stroke-width="' + (mm % 10 === 0 ? 1.4 : 0.8) + '"/>';
      if (mm % 10 === 0) s += '<text x="30" y="' + (y + 4) + '" font-size="13" font-family="Special Elite, monospace" fill="' + INK + '">' + (mm / 10) + '</text>';
    }
    s += '<text x="22" y="' + (base + 22) + '" font-size="11" fill="' + INK + '" font-family="Special Elite, monospace">cm</text>';
    // baseline + front
    var fy = base - fig.front * cm;
    s += '<line x1="100" x2="' + (w - 14) + '" y1="' + base + '" y2="' + base + '" stroke="#555" stroke-dasharray="2 2"/>';
    s += '<text x="' + (w - 16) + '" y="' + (base + 16) + '" text-anchor="end" font-size="12" font-family="Special Elite, monospace">baseline (pencil)</text>';
    s += '<line x1="100" x2="' + (w - 14) + '" y1="' + fy + '" y2="' + fy + '" stroke="' + TEAL + '" stroke-width="1.5"/>';
    s += '<text x="' + (w - 16) + '" y="' + (fy - 5) + '" text-anchor="end" font-size="12" fill="' + TEAL + '" font-family="Special Elite, monospace">solvent front</text>';
    s += '<rect x="100" y="' + (fy + 1) + '" width="' + (w - 114) + '" height="' + (base - fy - 1) + '" fill="' + TEAL + '" opacity="0.05"/>';
    lanes.forEach(function (ln, i) {
      var x = 140 + i * 84;
      s += '<line x1="' + (x - 5) + '" x2="' + (x + 5) + '" y1="' + base + '" y2="' + base + '" stroke="#333" stroke-width="2"/>';
      ln.spots.forEach(function (d) {
        var y2 = base - d * cm;
        s += '<ellipse cx="' + x + '" cy="' + y2 + '" rx="13" ry="7" fill="' + ln.color + '" opacity="0.85"/>';
        s += '<line x1="' + (x - 20) + '" x2="' + (x + 20) + '" y1="' + y2 + '" y2="' + y2 + '" stroke="' + INK + '" stroke-width="0.5" stroke-dasharray="1 2"/>';
      });
      s += '<text x="' + x + '" y="' + (base + 36) + '" text-anchor="middle" font-size="13" font-family="Special Elite, monospace">' + esc(ln.label) + '</text>';
    });
    // faint guide lines across from ruler for readability
    for (var c2 = 1; c2 <= 9; c2++) s += '<line x1="78" x2="100" y1="' + (base - c2 * cm) + '" y2="' + (base - c2 * cm) + '" stroke="#9c7a3c" stroke-width="0.6" stroke-dasharray="2 2"/>';
    return s + '</svg><p class="fig-cap">Measure from the baseline (0 cm) to the centre of each spot.</p>';
  };

  F.still = function () {
    var g = 'stroke="' + INK + '" stroke-width="2.2" fill="none"';
    var s = '<svg class="fig-svg still" viewBox="0 0 600 380" role="img" aria-label="Outline of a distillation apparatus with seven positions labelled A to G">';
    s += '<g id="part-A" class="ghost"><rect x="72" y="300" width="48" height="58" rx="4" ' + g + '/><path d="M86 300 q10 -26 20 0" ' + g + '/><line x1="56" x2="136" y1="282" y2="282" ' + g + '/><line x1="62" x2="62" y1="282" y2="360" ' + g + '/><line x1="130" x2="130" y1="282" y2="360" ' + g + '/></g>';
    s += '<g id="part-B" class="ghost"><circle cx="96" cy="230" r="46" ' + g + '/><path d="M86 186 L86 70 M106 186 L106 70" ' + g + '/><path d="M56 245 q40 18 80 0" stroke="' + TEAL + '" stroke-width="2" fill="none"/></g>';
    s += '<g id="part-C" class="ghost"><line x1="96" x2="96" y1="8" y2="86" stroke="' + INK + '" stroke-width="5"/><circle cx="96" cy="88" r="5" fill="' + BRICK + '"/></g>';
    s += '<g id="part-D" class="ghost"><path d="M106 84 L480 250" stroke="' + INK + '" stroke-width="3"/><path d="M150 82 L470 226 L456 256 L136 112 Z" ' + g + '/></g>';
    s += '<g id="part-E" class="ghost"><path d="M420 216 L420 262 M408 262 L432 262" ' + g + '/><path d="M420 300 L420 270" stroke="' + TEAL + '" stroke-width="2" marker-end="url(#arr)"/></g>';
    s += '<g id="part-F" class="ghost"><path d="M200 106 L200 60 M188 60 L212 60" ' + g + '/><path d="M200 56 L200 26" stroke="' + TEAL + '" stroke-width="2" marker-end="url(#arr)"/></g>';
    s += '<g id="part-G" class="ghost"><path d="M492 262 L492 290 L460 352 L556 352 L524 290 L524 262" ' + g + '/><path d="M474 340 L542 340" stroke="' + TEAL + '" stroke-width="2"/></g>';
    s += '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + TEAL + '"/></marker></defs>';
    var labels = { A: [30, 330], B: [24, 220], C: [124, 26], D: [330, 128], E: [452, 290], F: [232, 54], G: [570, 320] };
    Object.keys(labels).forEach(function (k) {
      s += '<g class="lbl"><circle cx="' + labels[k][0] + '" cy="' + labels[k][1] + '" r="15" fill="' + MUSTARD + '" stroke="' + INK + '" stroke-width="1.5"/><text x="' + labels[k][0] + '" y="' + (labels[k][1] + 6) + '" text-anchor="middle" font-size="17" font-family="Alfa Slab One, serif">' + k + '</text></g>';
    });
    return s + '</svg>';
  };

  /* ---------- Room 2 ------------------------------------------------------- */
  F.notation = function () {
    return '<div class="notation-demo" aria-label="Notation: mass number A top left, atomic number Z bottom left, then the symbol"><span class="nt"><span class="nA">A</span><span class="nZ">Z</span></span><span class="nX">X</span><span class="nt-note">A = mass number (protons + neutrons)<br>Z = atomic number (protons)<br>e.g. <span class="nt"><span class="nA">23</span><span class="nZ">11</span></span>Na</span></div>';
  };

  /* ---------- Room 4 ------------------------------------------------------- */
  F.massSpectrum = function (fig) {
    var W = 420, H = 250, x0 = 56, y0 = 210, maxY = 70, sx = 80, sy = 170 / maxY;
    var s = '<svg class="fig-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(fig.label) + ': ' + fig.peaks.map(function (p) { return 'm/z ' + p[0] + ' height ' + p[1]; }).join('; ') + '">';
    s += '<text x="' + (W / 2) + '" y="16" text-anchor="middle" font-size="13" font-family="Special Elite, monospace">' + esc(fig.label) + '</text>';
    for (var v = 0; v <= maxY; v += 10) {
      var y = y0 - v * sy;
      s += '<line x1="' + x0 + '" x2="' + (W - 20) + '" y1="' + y + '" y2="' + y + '" stroke="#cdbf9f" stroke-width="0.7"/>';
      s += '<text x="' + (x0 - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" font-family="Special Elite, monospace">' + v + '</text>';
    }
    s += '<line x1="' + x0 + '" x2="' + x0 + '" y1="30" y2="' + y0 + '" stroke="' + INK + '"/><line x1="' + x0 + '" x2="' + (W - 20) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="' + INK + '"/>';
    fig.peaks.forEach(function (p, i) {
      var x = x0 + 70 + i * sx, h = p[1] * sy;
      s += '<rect x="' + (x - 6) + '" y="' + (y0 - h) + '" width="12" height="' + h + '" fill="' + BRICK + '"/>';
      s += '<text x="' + x + '" y="' + (y0 - h - 6) + '" text-anchor="middle" font-size="12" font-weight="bold" font-family="Special Elite, monospace">' + p[1].toFixed(1) + '</text>';
      s += '<text x="' + x + '" y="' + (y0 + 16) + '" text-anchor="middle" font-size="12" font-family="Special Elite, monospace">' + p[0] + '</text>';
    });
    s += '<text x="' + (W / 2 + 20) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" font-family="Special Elite, monospace">mass / charge (m/z)</text>';
    s += '<text x="14" y="120" transform="rotate(-90 14 120)" text-anchor="middle" font-size="11" font-family="Special Elite, monospace">relative height</text>';
    return s + '</svg>';
  };

  var FLAME = [['lithium', 'crimson red', '#c4183c'], ['sodium', 'yellow-orange', '#f2a516'], ['potassium', 'lilac', '#b493d6'], ['calcium', 'orange-red (brick red)', '#d9542b'], ['strontium', 'scarlet red', '#e0302a'], ['barium', 'pale apple green', '#9ccf5a'], ['copper', 'blue-green', '#21a6a0']];
  F.flames = function (fig) {
    var h = '<div class="flame-grid"><table class="data"><caption>Flame-test colours (catalogue p. 14)</caption><tr><th>Metal ion</th><th>Flame colour</th></tr>';
    FLAME.forEach(function (f) { h += '<tr><td>' + f[0] + '</td><td><span class="swatch" style="background:' + f[2] + '"></span>' + f[1] + '</td></tr>'; });
    h += '</table><div>';
    var rows = Object.keys(fig.refs).map(function (k) { return [Core.BY_SYMBOL[k].name + ' (' + k + ')', fig.refs[k]]; });
    rows.push(['SAMPLE D', fig.sample]);
    var W = 470, rowH = 44, x0 = 110, x1 = W - 10, lo = 380, hi = 780;
    function X(w) { return x0 + (w - lo) / (hi - lo) * (x1 - x0); }
    var s = '<svg class="fig-svg" viewBox="0 0 ' + W + ' ' + (rows.length * rowH + 30) + '" role="img" aria-label="Emission line spectra. ' + rows.map(function (r) { return r[0] + ': ' + r[1].join(', ') + ' nm'; }).join('. ') + '">';
    rows.forEach(function (r, i) {
      var y = 6 + i * rowH, sample = i === rows.length - 1;
      s += '<text x="4" y="' + (y + 18) + '" font-size="12" font-family="Special Elite, monospace" font-weight="' + (sample ? 'bold' : 'normal') + '">' + esc(r[0]) + '</text>';
      s += '<rect x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="24" fill="#111"' + (sample ? ' stroke="' + MUSTARD + '" stroke-width="3"' : '') + '/>';
      var lastX = -99, bump = 0;
      r[1].slice().sort(function (a, b) { return a - b; }).forEach(function (w) {
        bump = X(w) - lastX < 24 ? (bump ? 0 : 1) : 0; lastX = X(w);
        s += '<line x1="' + X(w) + '" x2="' + X(w) + '" y1="' + y + '" y2="' + (y + 24) + '" stroke="' + nmColour(w) + '" stroke-width="3"/>';
        s += '<text x="' + (X(w) + (bump ? 12 : 0)) + '" y="' + (y + 36) + '" text-anchor="' + (bump ? 'start' : 'middle') + '" font-size="10" font-family="Special Elite, monospace">' + w + '</text>';
      });
    });
    var yb = rows.length * rowH + 20;
    for (var w = 400; w <= 750; w += 50) s += '<text x="' + X(w) + '" y="' + yb + '" text-anchor="middle" font-size="9" fill="#7a6e5c" font-family="Special Elite, monospace">' + w + '</text>';
    s += '<text x="' + x0 + '" y="' + (yb + 9) + '" font-size="9" fill="#7a6e5c" font-family="Special Elite, monospace">wavelength / nm</text>';
    return h + s + '</svg></div></div>';
  };

  var IONS = {
    '1+': ['H⁺', 'Li⁺', 'Na⁺', 'K⁺', 'Ag⁺', 'NH₄⁺ (ammonium)'],
    '2+': ['Mg²⁺', 'Ca²⁺', 'Ba²⁺', 'Zn²⁺', 'Cu²⁺ (copper(II))', 'Fe²⁺ (iron(II))', 'Pb²⁺'],
    '3+': ['Al³⁺', 'Fe³⁺ (iron(III))'],
    '1−': ['F⁻', 'Cl⁻', 'Br⁻', 'I⁻', 'OH⁻ (hydroxide)', 'NO₃⁻ (nitrate)', 'HCO₃⁻ (hydrogencarbonate)'],
    '2−': ['O²⁻', 'S²⁻', 'SO₄²⁻ (sulfate)', 'CO₃²⁻ (carbonate)'],
    '3−': ['N³⁻', 'PO₄³⁻ (phosphate)']
  };
  F.ionChart = function () {
    var h = '<div class="ion-chart" aria-label="Common ions chart">';
    Object.keys(IONS).forEach(function (k) {
      h += '<div class="ion-col"><div class="ion-head ' + (k.indexOf('+') > 0 ? 'pos' : 'neg') + '">' + k + '</div>' + IONS[k].map(function (i) { return '<span class="ion-tile">' + i + '</span>'; }).join('') + '</div>';
    });
    return h + '</div>';
  };
  F.solubility = function () {
    return '<table class="data sol"><caption>Solubility in water (Data Booklet)</caption>' +
      '<tr><th>These are SOLUBLE (aq)…</th><th>…EXCEPT with (forms a precipitate, s)</th></tr>' +
      '<tr><td>All Group 1 (Li⁺, Na⁺, K⁺) and NH₄⁺ compounds</td><td>—</td></tr>' +
      '<tr><td>All nitrates, NO₃⁻</td><td>—</td></tr>' +
      '<tr><td>Chlorides, bromides, iodides (Cl⁻, Br⁻, I⁻)</td><td>Ag⁺, Pb²⁺</td></tr>' +
      '<tr><td>Sulfates, SO₄²⁻</td><td>Ba²⁺, Pb²⁺, Ca²⁺ (slightly)</td></tr>' +
      '<tr><th>These are INSOLUBLE (s)…</th><th>…EXCEPT with (soluble)</th></tr>' +
      '<tr><td>Carbonates CO₃²⁻, phosphates PO₄³⁻</td><td>Group 1, NH₄⁺</td></tr>' +
      '<tr><td>Hydroxides OH⁻ and oxides O²⁻</td><td>Group 1, NH₄⁺ (Ba²⁺, Ca²⁺ slightly)</td></tr></table>';
  };

  // Particle diagrams (deterministic pseudo-random layout)
  F.particles = function (fig) {
    var W = 140, H = 110, s = '<svg class="fig-svg particle" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 4) + '" rx="8" fill="#fffaf0" stroke="#9c8b6b"/>';
    var A = BRICK, B = '#f0e2c0', Cc = TEAL;
    function at(x, y, r, c) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '" stroke="' + INK + '" stroke-width="1.2"/>'; }
    var spots = [[25, 25], [70, 22], [112, 30], [40, 60], [88, 58], [24, 90], [66, 88], [112, 84]];
    var k = fig.kind;
    if (k === 'atoms') spots.forEach(function (p) { s += at(p[0], p[1], 8, Cc); });
    else if (k === 'diatomic') spots.slice(0, 7).forEach(function (p, i) { var a = i % 2 ? 0 : 1; s += at(p[0] - 6 * a, p[1] - 6 * (1 - a), 7, A) + at(p[0] + 6 * a, p[1] + 6 * (1 - a), 7, A); });
    else if (k === 'compound') spots.slice(0, 6).forEach(function (p) { s += at(p[0] - 10, p[1] + 4, 5, B) + at(p[0] + 10, p[1] + 4, 5, B) + at(p[0], p[1], 8, A); });
    else if (k === 'mixElements') spots.forEach(function (p, i) { s += i % 2 ? at(p[0], p[1], 8, Cc) : at(p[0] - 6, p[1], 7, A) + at(p[0] + 6, p[1], 7, A); });
    else if (k === 'mixCompound') spots.slice(0, 7).forEach(function (p, i) { s += i % 2 ? at(p[0] - 6, p[1], 6, B) + at(p[0] + 6, p[1], 6, B) : at(p[0] - 10, p[1] + 4, 5, B) + at(p[0] + 10, p[1] + 4, 5, B) + at(p[0], p[1], 8, A); });
    else if (k === 'ionic' || k === 'metallic') {
      for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) {
        var x = 22 + c * 24, y = 20 + r * 24, plus = (r + c) % 2 === 0 || k === 'metallic';
        s += k === 'ionic'
          ? at(x, y, plus ? 7 : 10, plus ? MUSTARD : Cc) + '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" font-weight="bold">' + (plus ? '+' : '−') + '</text>'
          : at(x, y, 9, '#b9b6ae') + '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" font-weight="bold">+</text>';
        if (k === 'metallic' && c < 4 && r < 3) s += '<text x="' + (x + 12) + '" y="' + (y + 15) + '" text-anchor="middle" font-size="9" fill="' + BRICK + '">e⁻</text>';
      }
    }
    return s + '</svg>';
  };

  /* ---------- Room 7 ------------------------------------------------------- */
  F.dataTable = function (fig) {
    return '<table class="data"><tr>' + fig.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>' +
      fig.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i ? '<td>' + esc(c) + '</td>' : '<th>' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</table>';
  };

  function lewisSvg(spec, label) {
    var s = '<svg class="fig-svg lewis" viewBox="0 0 220 110" role="img" aria-label="' + esc(label) + '">';
    spec.bonds.forEach(function (b) {
      var A = spec.atoms[b[0]], B = spec.atoms[b[1]], n = b[2];
      for (var i = 0; i < n; i++) {
        var off = (i - (n - 1) / 2) * 6;
        s += '<line x1="' + (A.x + 14) + '" x2="' + (B.x - 14) + '" y1="' + (A.y + off) + '" y2="' + (B.y + off) + '" stroke="' + INK + '" stroke-width="2"/>';
      }
    });
    var D = { N: [0, -18, 1], S: [0, 18, 1], E: [16, 0, 0], W: [-16, 0, 0] };
    spec.atoms.forEach(function (a) {
      s += '<text x="' + a.x + '" y="' + (a.y + 8) + '" text-anchor="middle" font-size="24" font-family="Special Elite, monospace">' + a.s + '</text>';
      (a.lp || []).forEach(function (d) {
        var o = D[d];
        if (o[2]) s += '<circle cx="' + (a.x - 4) + '" cy="' + (a.y + o[1] - (o[1] < 0 ? 0 : -4)) + '" r="2.2" fill="' + BRICK + '"/><circle cx="' + (a.x + 4) + '" cy="' + (a.y + o[1] - (o[1] < 0 ? 0 : -4)) + '" r="2.2" fill="' + BRICK + '"/>';
        else s += '<circle cx="' + (a.x + o[0]) + '" cy="' + (a.y - 4) + '" r="2.2" fill="' + BRICK + '"/><circle cx="' + (a.x + o[0]) + '" cy="' + (a.y + 4) + '" r="2.2" fill="' + BRICK + '"/>';
      });
    });
    return s + '</svg>';
  }
  F.lewisChoices = function () {
    var A = { atoms: [{ s: 'O', x: 40, y: 55, lp: ['N', 'S'] }, { s: 'C', x: 110, y: 55 }, { s: 'O', x: 180, y: 55, lp: ['N', 'S'] }], bonds: [[0, 1, 2], [1, 2, 2]] };
    var B = { atoms: [{ s: 'O', x: 40, y: 55, lp: ['N', 'S', 'W'] }, { s: 'C', x: 110, y: 55, lp: ['N', 'S'] }, { s: 'O', x: 180, y: 55, lp: ['N', 'S', 'E'] }], bonds: [[0, 1, 1], [1, 2, 1]] };
    var C = { atoms: [{ s: 'O', x: 40, y: 55, lp: ['N', 'S'] }, { s: 'C', x: 110, y: 55, lp: ['N'] }, { s: 'O', x: 180, y: 55, lp: ['N', 'S'] }], bonds: [[0, 1, 2], [1, 2, 2]] };
    return '<div class="choices">' + [['A', A], ['B', B], ['C', C]].map(function (p) {
      return '<figure class="choice"><figcaption>Sketch ' + p[0] + '</figcaption>' + lewisSvg(p[1], 'Sketch ' + p[0]) + '</figure>';
    }).join('') + '</div><p class="fig-cap">Each pair of red dots is a lone pair; each line is a bonding pair.</p>';
  };

  F.shape = function (fig) {
    var s = '<svg class="fig-svg shape" viewBox="0 0 160 120" aria-hidden="true">';
    function atom(x, y, big) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (big ? 15 : 11) + '" fill="' + (big ? INK : CREAM) + '" stroke="' + INK + '" stroke-width="2"/>'; }
    function bond(x1, y1, x2, y2, kind) {
      if (kind === 'wedge') { var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L * 6, ny = dx / L * 6; return '<path d="M' + x1 + ' ' + y1 + ' L' + (x2 + nx) + ' ' + (y2 + ny) + ' L' + (x2 - nx) + ' ' + (y2 - ny) + ' Z" fill="' + INK + '"/>'; }
      if (kind === 'dash') { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + INK + '" stroke-width="5" stroke-dasharray="2 3"/>'; }
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + INK + '" stroke-width="3"/>';
    }
    function lp(x, y, rot) { return '<g transform="rotate(' + rot + ' 80 60)"><ellipse cx="' + x + '" cy="' + y + '" rx="10" ry="17" fill="' + MUSTARD + '" opacity="0.55" stroke="' + INK + '" stroke-dasharray="3 2"/><circle cx="' + (x - 4) + '" cy="' + y + '" r="2.2"/><circle cx="' + (x + 4) + '" cy="' + y + '" r="2.2"/></g>'; }
    var k = fig.kind;
    if (k === 'linear') s += bond(20, 60, 140, 60) + atom(20, 60) + atom(140, 60) + atom(80, 60, 1);
    else if (k === 'planar') s += bond(80, 60, 80, 14) + bond(80, 60, 40, 84) + bond(80, 60, 120, 84) + atom(80, 14) + atom(40, 84) + atom(120, 84) + atom(80, 60, 1);
    else if (k === 'tetrahedral') s += bond(80, 54, 80, 10) + bond(80, 54, 30, 80) + bond(80, 54, 112, 100, 'wedge') + bond(80, 54, 132, 74, 'dash') + atom(80, 10) + atom(30, 80) + atom(132, 74) + atom(112, 100) + atom(80, 54, 1);
    else if (k === 'pyramidal') s += lp(80, 28, 0) + bond(80, 58, 30, 86) + bond(80, 58, 112, 104, 'wedge') + bond(80, 58, 132, 80, 'dash') + atom(30, 86) + atom(132, 80) + atom(112, 104) + atom(80, 58, 1);
    else if (k === 'bent') s += lp(80, 30, -35) + lp(80, 30, 35) + bond(80, 62, 36, 96) + bond(80, 62, 124, 96) + atom(36, 96) + atom(124, 96) + atom(80, 62, 1);
    return s + '</svg>';
  };

  F.enMini = function () {
    var els = ['H', 'C', 'N', 'O', 'Na', 'Mg', 'Cl'];
    return '<div class="en-mini"><b>Electronegativity:</b> ' + els.map(function (e) { return '<span class="en-chip">' + e + ' ' + Core.BY_SYMBOL[e].EN.toFixed(1) + '</span>'; }).join('') +
      '<div class="en-rule">ΔEN &lt; 0.5 non-polar covalent · 0.5–1.7 polar covalent · &gt; 1.7 ionic</div></div>';
  };

  /* ---------- Room 8 ------------------------------------------------------- */
  F.reasons = function () {
    var R = window.GAME_CONTENT.reasons;
    return '<div class="reason-cards">' + Object.keys(R).map(function (k) { return '<div class="reason"><b>' + k + '</b> ' + esc(R[k]) + '</div>'; }).join('') + '</div>';
  };

  /* ---------- Data booklet --------------------------------------------------- */
  F.periodicTable = function (showEN) {
    var grid = {};
    Core.ELEMENTS.forEach(function (e) { grid[e[6] + '-' + e[5]] = e; });
    var h = '<div class="ptable' + (showEN ? ' show-en' : '') + '" role="table" aria-label="Periodic table">';
    for (var p = 1; p <= 6; p++) {
      for (var g = 1; g <= 18; g++) {
        var e = grid[p + '-' + g];
        if (e) {
          var cls = e[5] <= 2 ? 's' : e[5] >= 13 ? 'p' : 'd';
          if (e[5] === 18) cls += ' noble';
          h += '<div class="pt ' + cls + '" title="' + e[2] + '" role="cell"><span class="z">' + e[0] + '</span><span class="sym">' + e[1] + '</span><span class="ar">' + e[3].toFixed(1) + '</span><span class="en">' + (e[4] != null ? e[4].toFixed(1) : '—') + '</span></div>';
        } else h += '<div class="pt empty" role="cell"></div>';
      }
    }
    return h + '</div><p class="fig-cap">Each square: atomic number, symbol, relative atomic mass' + (showEN ? ', electronegativity' : '') + '. (Lanthanoids, actinoids and some period 6–7 elements omitted.)</p>';
  };

  /* ---------- decorative pieces -------------------------------------------- */
  F.meeple = function (color, label, size) {
    size = size || 46;
    return '<svg class="meeple" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6 a15 15 0 1 1 -0.1 0 Z M30 40 Q50 32 70 40 L93 52 Q99 61 90 65 L72 62 L82 94 L58 94 L50 76 L42 94 L18 94 L28 62 L10 65 Q1 61 7 52 Z" fill="' + color + '" stroke="' + INK + '" stroke-width="3"/>' +
      (label ? '<text x="50" y="72" text-anchor="middle" font-size="24" font-family="Alfa Slab One, serif" fill="#fff" stroke="' + INK + '" stroke-width="1">' + label + '</text>' : '') + '</svg>';
  };
  F.rocket = function (color) {
    return '<svg class="rocket" width="34" height="56" viewBox="0 0 34 56" aria-hidden="true"><path d="M17 2 C29 14 29 34 25 44 L9 44 C5 34 5 14 17 2 Z" fill="' + color + '" stroke="' + INK + '" stroke-width="2"/><circle cx="17" cy="22" r="5" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2"/><path d="M9 34 L2 48 L10 44 Z M25 34 L32 48 L24 44 Z" fill="' + BRICK + '" stroke="' + INK + '" stroke-width="2"/><path d="M12 44 L17 54 L22 44 Z" fill="' + MUSTARD + '"/></svg>';
  };
  F.die = function (n) {
    var pips = { 1: [[25, 25]], 2: [[14, 14], [36, 36]], 3: [[12, 12], [25, 25], [38, 38]], 4: [[14, 14], [36, 14], [14, 36], [36, 36]], 5: [[13, 13], [37, 13], [25, 25], [13, 37], [37, 37]], 6: [[14, 12], [36, 12], [14, 25], [36, 25], [14, 38], [36, 38]] }[n];
    return '<svg class="die" width="40" height="40" viewBox="0 0 50 50" aria-hidden="true"><rect x="2" y="2" width="46" height="46" rx="9" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.5"/>' + pips.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="' + INK + '"/>'; }).join('') + '</svg>';
  };

  window.Figures = {
    render: function (fig) { if (!fig) return ''; var fn = F[fig.name]; return fn ? '<div class="fig fig-' + fig.name + '">' + fn(fig) + '</div>' : ''; },
    raw: F
  };
})();
