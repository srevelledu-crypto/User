/* ==========================================================================
   The Thistlewood Game Works — chemistry core
   Pure functions (no DOM). Used by the game in the browser AND by the Node
   test script (tests/check.js), so the game and the tests agree on what
   counts as a correct answer.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ChemCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Simplified periodic table / data booklet --------------------
     [Z, symbol, name, relative atomic mass (1 d.p.), electronegativity (Pauling, 1 d.p.) or null, group, period]
     Ar values are the standard 1 d.p. data-booklet values. */
  var ELEMENTS = [
    [1, 'H', 'hydrogen', 1.0, 2.2, 1, 1], [2, 'He', 'helium', 4.0, null, 18, 1],
    [3, 'Li', 'lithium', 6.9, 1.0, 1, 2], [4, 'Be', 'beryllium', 9.0, 1.6, 2, 2],
    [5, 'B', 'boron', 10.8, 2.0, 13, 2], [6, 'C', 'carbon', 12.0, 2.6, 14, 2],
    [7, 'N', 'nitrogen', 14.0, 3.0, 15, 2], [8, 'O', 'oxygen', 16.0, 3.4, 16, 2],
    [9, 'F', 'fluorine', 19.0, 4.0, 17, 2], [10, 'Ne', 'neon', 20.2, null, 18, 2],
    [11, 'Na', 'sodium', 23.0, 0.9, 1, 3], [12, 'Mg', 'magnesium', 24.3, 1.3, 2, 3],
    [13, 'Al', 'aluminium', 27.0, 1.6, 13, 3], [14, 'Si', 'silicon', 28.1, 1.9, 14, 3],
    [15, 'P', 'phosphorus', 31.0, 2.2, 15, 3], [16, 'S', 'sulfur', 32.1, 2.6, 16, 3],
    [17, 'Cl', 'chlorine', 35.5, 3.2, 17, 3], [18, 'Ar', 'argon', 39.9, null, 18, 3],
    [19, 'K', 'potassium', 39.1, 0.8, 1, 4], [20, 'Ca', 'calcium', 40.1, 1.0, 2, 4],
    [21, 'Sc', 'scandium', 45.0, 1.4, 3, 4], [22, 'Ti', 'titanium', 47.9, 1.5, 4, 4],
    [23, 'V', 'vanadium', 50.9, 1.6, 5, 4], [24, 'Cr', 'chromium', 52.0, 1.7, 6, 4],
    [25, 'Mn', 'manganese', 54.9, 1.6, 7, 4], [26, 'Fe', 'iron', 55.8, 1.8, 8, 4],
    [27, 'Co', 'cobalt', 58.9, 1.9, 9, 4], [28, 'Ni', 'nickel', 58.7, 1.9, 10, 4],
    [29, 'Cu', 'copper', 63.5, 1.9, 11, 4], [30, 'Zn', 'zinc', 65.4, 1.7, 12, 4],
    [31, 'Ga', 'gallium', 69.7, 1.8, 13, 4], [32, 'Ge', 'germanium', 72.6, 2.0, 14, 4],
    [33, 'As', 'arsenic', 74.9, 2.2, 15, 4], [34, 'Se', 'selenium', 79.0, 2.6, 16, 4],
    [35, 'Br', 'bromine', 79.9, 3.0, 17, 4], [36, 'Kr', 'krypton', 83.8, 3.0, 18, 4],
    [37, 'Rb', 'rubidium', 85.5, 0.8, 1, 5], [38, 'Sr', 'strontium', 87.6, 1.0, 2, 5],
    [39, 'Y', 'yttrium', 88.9, 1.2, 3, 5], [40, 'Zr', 'zirconium', 91.2, 1.3, 4, 5],
    [41, 'Nb', 'niobium', 92.9, 1.6, 5, 5], [42, 'Mo', 'molybdenum', 96.0, 2.2, 6, 5],
    [43, 'Tc', 'technetium', 98.0, 1.9, 7, 5], [44, 'Ru', 'ruthenium', 101.1, 2.2, 8, 5],
    [45, 'Rh', 'rhodium', 102.9, 2.3, 9, 5], [46, 'Pd', 'palladium', 106.4, 2.2, 10, 5],
    [47, 'Ag', 'silver', 107.9, 1.9, 11, 5], [48, 'Cd', 'cadmium', 112.4, 1.7, 12, 5],
    [49, 'In', 'indium', 114.8, 1.8, 13, 5], [50, 'Sn', 'tin', 118.7, 2.0, 14, 5],
    [51, 'Sb', 'antimony', 121.8, 2.1, 15, 5], [52, 'Te', 'tellurium', 127.6, 2.1, 16, 5],
    [53, 'I', 'iodine', 126.9, 2.7, 17, 5], [54, 'Xe', 'xenon', 131.3, 2.6, 18, 5],
    [55, 'Cs', 'caesium', 132.9, 0.8, 1, 6], [56, 'Ba', 'barium', 137.3, 0.9, 2, 6],
    [79, 'Au', 'gold', 197.0, 2.5, 11, 6], [80, 'Hg', 'mercury', 200.6, 2.0, 12, 6],
    [82, 'Pb', 'lead', 207.2, 2.3, 14, 6]
  ];
  var BY_SYMBOL = {};
  ELEMENTS.forEach(function (e) {
    BY_SYMBOL[e[1]] = { Z: e[0], symbol: e[1], name: e[2], Ar: e[3], EN: e[4], group: e[5], period: e[6] };
  });
  var NA = 6.02e23;

  /* ---------- Text normalisation ---------------------------------------- */
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function toPlain(s) {
    s = String(s == null ? '' : s);
    // "× 10²³" style scientific notation -> e23 before superscripts are flattened
    s = s.replace(/\s*[×xX*]\s*10\s*\^?\s*([⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, function (m, p) {
      return 'e' + p.replace(/⁻/g, '-').replace(/⁺/g, '').replace(/[⁰-⁹¹²³]/g, function (c) { return String(SUP.indexOf(c)); });
    });
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], k = SUB.indexOf(c), j = SUP.indexOf(c);
      if (k >= 0) out += k;
      else if (j >= 0) out += j;
      else if (c === '⁺') out += '+';
      else if (c === '⁻' || c === '−' || c === '–' || c === '—') out += '-';
      else if (c === '​' || c === ' ') out += ' ';
      else out += c;
    }
    return out;
  }

  /* ---------- Numbers ----------------------------------------------------- */
  function parseNumber(s) {
    var t = toPlain(s).trim().replace(/,/g, '').replace(/\s+/g, ' ');
    var m = t.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\s*(?:[eE]\s*([-+]?\d+)|(?:[xX*×]|times)\s*10\s*(?:\^|\*\*)?\s*\(?\s*([-+]?\d+)\s*\)?)?/);
    if (!m) return NaN;
    var v = parseFloat(m[1]);
    var exp = m[2] != null ? m[2] : m[3];
    if (exp != null) v = v * Math.pow(10, parseInt(exp, 10));
    return v;
  }
  function near(a, b, rel, abs) {
    var tol = Math.max(abs || 0, Math.abs(b) * (rel == null ? 0.02 : rel));
    return Math.abs(a - b) <= tol + 1e-12;
  }
  function checkNumber(field, input) {
    var v = parseNumber(input);
    if (String(input).trim() === '') return { ok: false, msg: 'Fill this one in.' };
    if (isNaN(v)) return { ok: false, msg: 'Type a number (for big numbers you can write 1.5e23 or 1.5 x 10^23).' };
    var ans = field.answer, rel = field.tol, abs = field.tolAbs;
    if (near(v, ans, rel, abs)) return { ok: true };
    var traps = field.traps || [];
    for (var i = 0; i < traps.length; i++) {
      if (near(v, traps[i].value, traps[i].tol == null ? 0.02 : traps[i].tol, traps[i].tolAbs)) return { ok: false, msg: traps[i].msg };
    }
    if (ans !== 0) {
      var r = v / ans;
      if (near(r, 1000, 0.03) || near(r, 0.001, 0.03)) return { ok: false, msg: field.unitsMsg || 'Out by a factor of 1000 — check your units. Did you convert mL to L (÷ 1000)?' };
      if (near(r, 100, 0.03) || near(r, 0.01, 0.03)) return { ok: false, msg: 'Out by a factor of 100 — should this be a percentage or a decimal?' };
      if (near(r, 2, 0.03) || near(r, 0.5, 0.03) || near(r, 3, 0.03) || near(r, 1 / 3, 0.03)) return { ok: false, msg: field.ratioMsg || 'Out by a whole-number factor — check the mole ratio (or the number of atoms in the formula).' };
      if (near(r, 1 / NA, 0.05) || near(r, NA, 0.05)) return { ok: false, msg: 'Check where Avogadro’s number belongs: N = n × Nₐ.' };
      if (near(v, ans, 0.06)) return { ok: false, msg: field.closeMsg || 'Very close! Check your rounding and use the 1 d.p. molar masses from the data booklet.' };
    }
    return { ok: false, msg: field.wrong || 'Not quite — check your working.' };
  }

  /* ---------- Formulas ------------------------------------------------------ */
  function normFormula(s) {
    return toPlain(s).replace(/\s+/g, '').replace(/\[/g, '(').replace(/\]/g, ')').replace(/[·•*]/g, '.');
  }
  // Returns {El: count} or null if it isn't a valid formula.
  function parseFormula(s) {
    s = normFormula(s).replace(/\((s|l|g|aq)\)$/i, '').replace(/[0-9]*[+-]$/, '');
    if (!s) return null;
    var parts = s.split('.');
    var total = {};
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p], mult = 1;
      var lead = part.match(/^(\d+)(.*)$/);
      if (lead && p > 0) { mult = parseInt(lead[1], 10); part = lead[2]; }
      var counts = parseGroup(part);
      if (!counts) return null;
      for (var k in counts) total[k] = (total[k] || 0) + counts[k] * mult;
    }
    return total;
  }
  function parseGroup(s) {
    var stack = [{}], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === '(') { stack.push({}); i++; }
      else if (c === ')') {
        if (stack.length < 2) return null;
        i++;
        var num = ''; while (i < s.length && /\d/.test(s[i])) num += s[i++];
        var n = num ? parseInt(num, 10) : 1, top = stack.pop(), below = stack[stack.length - 1];
        for (var k in top) below[k] = (below[k] || 0) + top[k] * n;
      } else if (/[A-Z]/.test(c)) {
        var sym = c; i++;
        if (i < s.length && /[a-z]/.test(s[i])) { sym += s[i]; i++; }
        if (!BY_SYMBOL[sym]) return null;
        var num2 = ''; while (i < s.length && /\d/.test(s[i])) num2 += s[i++];
        var cur = stack[stack.length - 1];
        cur[sym] = (cur[sym] || 0) + (num2 ? parseInt(num2, 10) : 1);
      } else return null;
    }
    if (stack.length !== 1) return null;
    return stack[0];
  }
  function sameCounts(a, b) {
    if (!a || !b) return false;
    var k;
    for (k in a) if ((a[k] || 0) !== (b[k] || 0)) return false;
    for (k in b) if ((a[k] || 0) !== (b[k] || 0)) return false;
    return true;
  }
  function scaledCounts(a, b) { // is a a whole-number multiple of b (or vice versa)?
    if (!a || !b) return false;
    var keysA = Object.keys(a).sort().join(), keysB = Object.keys(b).sort().join();
    if (keysA !== keysB) return false;
    var r = null;
    for (var k in a) { var q = a[k] / b[k]; if (r === null) r = q; else if (Math.abs(q - r) > 1e-9) return false; }
    return r !== 1;
  }
  function molarMass(formula) {
    var c = parseFormula(formula);
    if (!c) throw new Error('Bad formula: ' + formula);
    var m = 0;
    for (var k in c) m += BY_SYMBOL[k].Ar * c[k];
    return Math.round(m * 1000) / 1000;
  }
  function checkFormula(field, input) {
    var raw = String(input || '').trim();
    if (!raw) return { ok: false, msg: 'Fill this one in.' };
    var n = normFormula(raw);
    var accepts = [field.answer].concat(field.accept || []).map(normFormula);
    if (accepts.indexOf(n) >= 0) return { ok: true };
    var c = parseFormula(raw), want = parseFormula(field.answer);
    if (!c) return { ok: false, msg: 'That doesn’t read as a formula. Check the capital letters (Co is cobalt, CO is carbon monoxide) and brackets.' };
    if (sameCounts(c, want)) return { ok: false, msg: 'Right atoms in the right ratio — now write it the conventional way: metal (or NH₄) first, and polyatomic ions in brackets when there is more than one, e.g. Ca(NO₃)₂.' };
    if (scaledCounts(c, want)) return { ok: false, msg: 'Use the simplest whole-number ratio of ions.' };
    if (field.wrong) return { ok: false, msg: field.wrong };
    if (field.bond === 'covalent') return { ok: false, msg: 'Check the prefixes: mono 1, di 2, tri 3, tetra 4, penta 5.' };
    return { ok: false, msg: 'Check the charges: the total positive charge must cancel the total negative charge.' };
  }

  /* ---------- Electron configurations --------------------------------------- */
  var AUFBAU = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
  var CAP = { s: 2, p: 6, d: 10, f: 14 };
  var CORES = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
  function fillAufbau(n) {
    var out = {}, i = 0;
    while (n > 0) { var sub = AUFBAU[i++], take = Math.min(CAP[sub[1]], n); out[sub] = take; n -= take; }
    return out;
  }
  // Ground-state configuration of a neutral atom or ion (Cr and Cu exceptions included).
  function groundState(Z, charge) {
    var c = fillAufbau(Z);
    var EXC = { 24: ['3d', 5, '4s', 1], 29: ['3d', 10, '4s', 1], 42: ['4d', 5, '5s', 1], 47: ['4d', 10, '5s', 1] };
    if (EXC[Z]) { c[EXC[Z][0]] = EXC[Z][1]; c[EXC[Z][2]] = EXC[Z][3]; }
    charge = charge || 0;
    if (charge > 0) { // remove from the highest n first (4s before 3d), then p before s
      var order = Object.keys(c).sort(function (a, b) { return (b[0] - a[0]) || ('fdps'.indexOf(a[1]) - 'fdps'.indexOf(b[1])); });
      var r = charge;
      for (var i = 0; i < order.length && r > 0; i++) { var t = Math.min(c[order[i]], r); c[order[i]] -= t; r -= t; }
    } else if (charge < 0) c = fillAufbau(Z - charge);
    for (var k in c) if (!c[k]) delete c[k];
    return c;
  }
  // Parses "1s2 2s2 2p6", "[Ne]3s^2 3p⁴", "1s22s22p6" ... -> {core, subs, order} or {error}
  function parseConfig(s) {
    var t = toPlain(s).replace(/\s+/g, '').replace(/\^/g, '').replace(/[.,]/g, '');
    if (!t) return { error: 'Fill this one in.' };
    var core = null;
    var m = t.match(/^\[([A-Za-z]{2})\]/);
    if (m) {
      var g = m[1][0].toUpperCase() + m[1][1].toLowerCase();
      if (!CORES[g]) return { error: 'The core in square brackets must be a noble gas, e.g. [Ne] or [Ar].' };
      core = g; t = t.slice(m[0].length);
    }
    t = t.toLowerCase();
    var subs = {}, order = [], i = 0;
    while (i < t.length) {
      var mm = t.slice(i).match(/^([1-7])([spdf])/);
      if (!mm) return { error: 'I can’t read that. Write it like 1s2 2s2 2p6 (or 1s² 2s² 2p⁶).' };
      i += 2;
      var max = CAP[mm[2]], digits = '';
      while (i < t.length && /\d/.test(t[i]) && parseInt(digits + t[i], 10) <= max && (digits + t[i]).length <= 2) {
        // stop if this digit is really the start of the next subshell (e.g. "4s2" after "3d1")
        if (digits && /[spdf]/.test(t[i + 1] || '')) break;
        digits += t[i++];
      }
      if (!digits) return { error: 'Each subshell needs a number of electrons, e.g. 2p6.' };
      var key = mm[1] + mm[2];
      if (subs[key] != null) return { error: 'You’ve written ' + key + ' twice.' };
      subs[key] = parseInt(digits, 10); order.push(key);
      if (i < t.length && /\d/.test(t[i]) && !/[spdf]/.test(t[i + 1] || '')) return { error: 'A ' + mm[2] + ' subshell holds at most ' + max + ' electrons.' };
    }
    return { core: core, subs: subs, order: order };
  }
  function expandConfig(p) {
    var full = {};
    if (p.core) { var c = fillAufbau(CORES[p.core]); for (var k in c) full[k] = c[k]; }
    for (var k2 in p.subs) full[k2] = (full[k2] || 0) + p.subs[k2];
    for (var k3 in full) if (!full[k3]) delete full[k3];
    return full;
  }
  function configToString(subs) {
    var keys = Object.keys(subs).sort(function (a, b) { return AUFBAU.indexOf(a) - AUFBAU.indexOf(b); });
    return keys.map(function (k) { return k + supStr(subs[k]); }).join(' ');
  }
  function supStr(n) { return String(n).split('').map(function (d) { return SUP[+d]; }).join(''); }
  function checkConfig(field, input) {
    var p = parseConfig(input);
    if (p.error) return { ok: false, msg: p.error };
    var want = parseConfig(field.answer), wantFull = expandConfig(want), got = expandConfig(p);
    for (var k in p.subs) if (p.subs[k] > CAP[k[1]]) return { ok: false, msg: 'A ' + k[1] + ' subshell holds at most ' + CAP[k[1]] + ' electrons.' };
    if (sameCounts(got, wantFull)) {
      if (field.condensed && !p.core) return { ok: false, msg: 'Right electrons! But this box wants the condensed form: start with the previous noble gas in square brackets, e.g. [Ne]3s².' };
      if (field.condensed && p.core !== want.core) return { ok: false, msg: 'Use the nearest noble gas BEFORE the element as the core (here: [' + want.core + ']).' };
      if (!field.condensed && p.core) return { ok: false, msg: 'This box wants the full configuration — write out every subshell, no noble-gas shortcut.' };
      return { ok: true };
    }
    var tot = 0, totW = 0, k2;
    for (k2 in got) tot += got[k2];
    for (k2 in wantFull) totW += wantFull[k2];
    if (field.traps) for (var i = 0; i < field.traps.length; i++) {
      if (sameCounts(got, expandConfig(parseConfig(field.traps[i].value)))) return { ok: false, msg: field.traps[i].msg };
    }
    if (tot !== totW) return { ok: false, msg: 'Count your electrons: you have ' + tot + '. Use the atomic number' + (field.ion ? ', then add or remove electrons for the charge.' : '.') };
    return { ok: false, msg: field.wrong || 'Right number of electrons, wrong subshells. Follow the Aufbau order — and remember 4s fills before 3d.' };
  }

  /* ---------- Equations ------------------------------------------------------ */
  // "2Na(s) + 2H2O(l) -> 2NaOH(aq) + H2(g)"
  function parseEquation(s) {
    var t = toPlain(s).replace(/⟶|→|⇒|⇌|-+>|=+>|=/g, '>');
    var sides = t.split('>').filter(function (x) { return x.trim() !== ''; });
    if (sides.length !== 2) return { error: 'Write it with one arrow, like: 2Na(s) + Cl2(g) → 2NaCl(s)  (you can type -> for the arrow).' };
    function side(str) {
      var terms = str.split('+').map(function (x) { return x.trim(); });
      var out = [];
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i].replace(/\s+/g, '');
        if (!term) return null;
        var st = null, sm = term.match(/\(([a-zA-Z/|]+)\)$/);
        if (sm && /^(s|l|g|aq)([/|](s|l|g|aq))*$/i.test(sm[1])) { st = sm[1].toLowerCase().split(/[/|]/); term = term.slice(0, -sm[0].length); }
        var cm = term.match(/^(\d+)(.*)$/), coef = 1;
        if (cm) { coef = parseInt(cm[1], 10); term = cm[2]; }
        out.push({ coef: coef, formula: normFormula(term), counts: parseFormula(term), states: st });
      }
      return out;
    }
    var lhs = side(sides[0]), rhs = side(sides[1]);
    if (!lhs || !rhs) return { error: 'There’s a stray “+”. Check each side is a list of species separated by “+”.' };
    return { lhs: lhs, rhs: rhs };
  }
  function atomTotals(sideArr) {
    var t = {};
    sideArr.forEach(function (sp) { for (var k in sp.counts) t[k] = (t[k] || 0) + sp.counts[k] * sp.coef; });
    return t;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function isBalanced(eq) { return sameCounts(atomTotals(eq.lhs), atomTotals(eq.rhs)); }
  var STATE_NAMES = { s: 'solid (s)', l: 'liquid (l)', g: 'gas (g)', aq: 'aqueous (aq)' };
  function prettyFormula(f) { return String(f).replace(/([A-Za-z)\]])(\d+)/g, function (m, a, d) { return a + d.split('').map(function (x) { return SUB[+x]; }).join(''); }); }
  function checkEquation(field, input, opts) {
    opts = opts || {};
    var want = parseEquation(field.answer), got = parseEquation(input);
    if (got.error) return { ok: false, msg: got.error };
    var bad = got.lhs.concat(got.rhs).filter(function (sp) { return !sp.counts; });
    if (bad.length) return { ok: false, msg: '“' + bad[0].formula + '” doesn’t read as a formula — check capital letters and brackets.' };
    var sides = ['lhs', 'rhs'];
    for (var s = 0; s < 2; s++) {
      var gs = got[sides[s]], ws = want[sides[s]], other = want[sides[1 - s]];
      for (var i = 0; i < gs.length; i++) {
        var sp = gs[i];
        var match = ws.filter(function (w) { return w.formula === sp.formula; })[0];
        if (match) continue;
        var sameAtoms = ws.filter(function (w) { return sameCounts(w.counts, sp.counts); })[0];
        if (sameAtoms) return { ok: false, msg: 'Write ' + prettyFormula(sp.formula) + ' the conventional way: ' + prettyFormula(sameAtoms.formula) + '.' };
        if (other.some(function (w) { return w.formula === sp.formula; })) return { ok: false, msg: prettyFormula(sp.formula) + ' is on the wrong side of the arrow.' };
        if (sp.formula === 'H' || sp.formula === 'O' || sp.formula === 'Cl' || sp.formula === 'N') return { ok: false, msg: 'Hydrogen, oxygen, nitrogen and chlorine are diatomic: H₂, O₂, N₂, Cl₂.' };
        return { ok: false, msg: 'Check the formula “' + prettyFormula(sp.formula) + '”. ' + (field.formulaMsg || 'Work it out from the ion charges.') };
      }
      for (var j = 0; j < ws.length; j++) {
        if (!gs.some(function (g) { return g.formula === ws[j].formula; })) return { ok: false, msg: field.missingMsg || ('Something is missing from the ' + (s === 0 ? 'reactant' : 'product') + ' side.') };
      }
    }
    if (!isBalanced(got)) {
      var L = atomTotals(got.lhs), R = atomTotals(got.rhs), el = null;
      Object.keys(L).concat(Object.keys(R)).some(function (k) { if ((L[k] || 0) !== (R[k] || 0)) { el = k; return true; } return false; });
      return { ok: false, msg: 'Not balanced yet: count the ' + el + ' atoms — ' + (L[el] || 0) + ' on the left, ' + (R[el] || 0) + ' on the right.' };
    }
    var all = got.lhs.concat(got.rhs), g0 = 0;
    all.forEach(function (sp) { g0 = gcd(g0, sp.coef); });
    if (g0 > 1) return { ok: false, msg: 'Balanced — but use the lowest whole-number coefficients (everything here divides by ' + g0 + ').' };
    if (!opts.ignoreStates) {
      for (var s2 = 0; s2 < 2; s2++) {
        var gs2 = got[sides[s2]];
        for (var q = 0; q < gs2.length; q++) {
          var w2 = want[sides[s2]].filter(function (w) { return w.formula === gs2[q].formula; })[0];
          if (!gs2[q].states) return { ok: false, msg: 'Balanced! Now add a state symbol to every species: (s), (l), (g) or (aq).' };
          if (w2.states && w2.states.indexOf(gs2[q].states[0]) < 0) {
            var exp = w2.states[0], f = prettyFormula(gs2[q].formula);
            var why = exp === 'aq' ? 'Is it dissolved in water? (Check the solubility table.)'
              : exp === 's' && gs2[q].states[0] === 'aq' ? 'Check the solubility table — is it soluble?'
              : exp === 'g' ? 'What state is it in at room temperature?'
              : exp === 'l' ? 'Pure water at room temperature is a liquid.' : '';
            return { ok: false, msg: 'Check the state of ' + f + '. ' + why };
          }
        }
      }
    }
    return { ok: true };
  }

  /* ---------- Generic field checking ---------------------------------------- */
  function normText(s) { return toPlain(s).toLowerCase().replace(/[^a-z0-9+\-.]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function checkField(field, input) {
    switch (field.kind) {
      case 'number': return checkNumber(field, input);
      case 'formula': return checkFormula(field, input);
      case 'config': return checkConfig(field, input);
      case 'equation': return checkEquation(field, input);
      case 'symbol': {
        var v = toPlain(input).trim();
        if (!v) return { ok: false, msg: 'Fill this one in.' };
        if (v === field.answer) return { ok: true };
        if (v.toLowerCase() === field.answer.toLowerCase()) return { ok: false, msg: 'Symbols: first letter capital, second letter lower case.' };
        return { ok: false, msg: field.wrong || 'Look the element up on the periodic table.' };
      }
      case 'select': {
        if (input == null || input === '') return { ok: false, msg: 'Choose an option.' };
        if (input === field.answer || (field.accept && field.accept.indexOf(input) >= 0)) return { ok: true };
        return { ok: false, msg: (field.why && field.why[input]) || field.wrong || null, select: true };
      }
      default: { // text
        var t = normText(input);
        if (!t) return { ok: false, msg: 'Fill this one in.' };
        var acc = [field.answer].concat(field.accept || []).map(normText);
        return acc.indexOf(t) >= 0 ? { ok: true } : { ok: false, msg: field.wrong || 'Not quite.' };
      }
    }
  }

  /* ---------- Orbital box diagrams ------------------------------------------ */
  // boxes: {sub: [[up|down|null, up|down|null], ...]} ; expect: {sub: electrons}
  function checkOrbitals(diagram, boxes) {
    var subs = diagram.subshells.map(function (s) { return s.name; });
    var counts = {}, total = 0, expTotal = 0, i, j;
    for (i = 0; i < subs.length; i++) {
      var bx = boxes[subs[i]] || [];
      var c = 0;
      for (j = 0; j < bx.length; j++) {
        var a = bx[j][0], b = bx[j][1];
        if (a && b && a === b) return { ok: false, rule: 'Pauli', msg: 'Pauli exclusion principle broken in ' + subs[i] + ': two electrons in the same orbital must have opposite spins (↑↓).' };
        c += (a ? 1 : 0) + (b ? 1 : 0);
      }
      counts[subs[i]] = c; total += c;
      expTotal += diagram.expect[subs[i]] || 0;
    }
    if (total !== expTotal) return { ok: false, rule: 'count', msg: diagram.label.split(' (')[0] + ' needs ' + expTotal + ' electrons in these boxes — you have ' + total + '.' };
    // Aufbau: lower-energy subshells (in the order listed) must be full before the next gets electrons
    var ordered = subs.slice().sort(function (a, b) { return AUFBAU.indexOf(a) - AUFBAU.indexOf(b); });
    for (i = 0; i < ordered.length - 1; i++) {
      var cap = boxes[ordered[i]].length * 2;
      if (counts[ordered[i]] < cap) {
        for (j = i + 1; j < ordered.length; j++) if (counts[ordered[j]] > 0 && !diagram.allowExceptions)
          return { ok: false, rule: 'Aufbau', msg: 'Aufbau principle: fill ' + ordered[i] + ' completely before putting electrons in ' + ordered[j] + '.' };
      }
    }
    for (i = 0; i < subs.length; i++) {
      var bx2 = boxes[subs[i]], occ = bx2.map(function (b) { return (b[0] ? 1 : 0) + (b[1] ? 1 : 0); });
      var hasEmpty = occ.indexOf(0) >= 0, hasDouble = occ.indexOf(2) >= 0;
      if (hasEmpty && hasDouble) return { ok: false, rule: 'Hund', msg: 'Hund’s rule broken in ' + subs[i] + ': put one electron in each orbital of a subshell before pairing any up.' };
      var singles = [];
      bx2.forEach(function (b) { if ((b[0] ? 1 : 0) + (b[1] ? 1 : 0) === 1) singles.push(b[0] || b[1]); });
      if (singles.length > 1 && singles.some(function (x) { return x !== singles[0]; })) return { ok: false, rule: 'Hund', msg: 'Hund’s rule broken in ' + subs[i] + ': unpaired electrons in a subshell should all have parallel spins (all ↑).' };
      if (counts[subs[i]] !== diagram.expect[subs[i]]) return { ok: false, rule: 'count', msg: 'Right total, but check how many electrons go in ' + subs[i] + '.' };
    }
    return { ok: true };
  }

  /* ---------- Answer text (for Teacher Mode + answer key) ------------------- */
  function stripHtml(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'); }
  function fieldAnswerText(f) {
    if (f.kind === 'number') return f.answer + (f.units ? ' ' + f.units : '');
    return String(f.answerText || f.answer);
  }
  function partAnswerLines(part) {
    var lines = [];
    switch (part.type) {
      case 'fields':
        (part.rows || [{ fields: part.fields }]).forEach(function (row) {
          (row.fields || row.cells || []).forEach(function (f, i) {
            if (!f) return;
            var lab = (row.label ? stripHtml(row.label) + ' — ' : '') + stripHtml(f.label || (part.columns && part.columns[i]) || '');
            lines.push(lab + ': ' + fieldAnswerText(f));
          });
        });
        break;
      case 'slots': {
        var tl = {}; part.tiles.forEach(function (t) { tl[t.id] = stripHtml(t.label); });
        part.slots.forEach(function (s) {
          var a = [].concat(s.answer).map(function (x) { return tl[x]; });
          lines.push(stripHtml(s.label) + ': ' + a.join(part.layout === 'bins' ? '; ' : ' / '));
        });
        break;
      }
      case 'order': {
        var il = {}; part.items.forEach(function (t) { il[t.id] = stripHtml(t.label); });
        lines.push(part.answer.map(function (x) { return il[x]; }).join('  →  '));
        break;
      }
      case 'spot':
        part.lines.forEach(function (l, i) { if (l.error) lines.push('Line ' + (i + 1) + ' is wrong: ' + stripHtml(l.text) + (l.fix ? '  ✎ ' + l.fix : '')); });
        break;
      case 'orbital':
        part.diagrams.forEach(function (d) {
          lines.push(d.label + ': ' + d.subshells.map(function (s) { return s.name + supStr(d.expect[s.name] || 0); }).join(' ') + ' (one arrow per box first, all ↑, then pair with ↓)');
        });
        break;
      case 'grid':
        part.rows.forEach(function (r, i) { lines.push(stripHtml(r) + ': ' + stripHtml(part.cols[part.answer[i]])); });
        break;
      case 'balance':
        part.equations.forEach(function (e) { lines.push(prettyFormula(e.answer).replace(/->/g, '→')); });
        break;
    }
    return lines;
  }

  return {
    ELEMENTS: ELEMENTS, BY_SYMBOL: BY_SYMBOL, NA: NA, AUFBAU: AUFBAU, CORES: CORES,
    toPlain: toPlain, parseNumber: parseNumber, near: near, checkNumber: checkNumber,
    normFormula: normFormula, parseFormula: parseFormula, sameCounts: sameCounts, molarMass: molarMass, checkFormula: checkFormula,
    fillAufbau: fillAufbau, groundState: groundState, parseConfig: parseConfig, expandConfig: expandConfig, configToString: configToString, checkConfig: checkConfig,
    parseEquation: parseEquation, isBalanced: isBalanced, atomTotals: atomTotals, checkEquation: checkEquation, prettyFormula: prettyFormula,
    checkField: checkField, checkOrbitals: checkOrbitals, partAnswerLines: partAnswerLines, stripHtml: stripHtml, supStr: supStr, gcd: gcd
  };
});
