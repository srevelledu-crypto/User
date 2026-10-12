#!/usr/bin/env node
/* ==========================================================================
   Content checker for The Thistlewood Game Works.
   Run:  node tests/check.js
   - Recomputes every numerical answer from its inputs (independently of the
     game's answer-checker) and compares with the stored answer.
   - Checks every electron configuration, ionic formula and equation.
   - Checks that every stored answer is accepted by the game's own checker,
     and that common typing variants are accepted.
   - Checks hints, story word counts, the vault order and the time budget.
   ========================================================================== */
'use strict';
var path = require('path');
var Core = require(path.join(__dirname, '..', 'js', 'core.js'));
var C = require(path.join(__dirname, '..', 'js', 'content.js'));

var pass = 0, fail = 0, failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
function close(a, b, rel, abs) { return Math.abs(a - b) <= Math.max(abs || 0, Math.abs(b) * (rel || 0.01)) + 1e-9; }
var E = Core.BY_SYMBOL;

/* ---------- independent calculators ------------------------------------- */
function M(f) { return Core.molarMass(f); }
function eqCoef(eq, f) {
  var p = Core.parseEquation(eq), all = p.lhs.concat(p.rhs);
  for (var i = 0; i < all.length; i++) if (all[i].formula === f) return all[i].coef;
  throw new Error('species ' + f + ' not in ' + eq);
}
function molesOf(r) { return r.m != null ? r.m / M(r.f) : r.c * r.VmL / 1000; }
function limiting(v) {
  var best = null;
  v.reactants.forEach(function (r) { var k = molesOf(r) / eqCoef(v.eq, r.f); if (!best || k < best.k) best = { f: r.f, k: k }; });
  return best;
}
var CALC = {
  rf: function (v) { return v.d / v.front; },
  arAbund: function (v) { var s = 0, t = 0; v.iso.forEach(function (x) { s += x[0] * x[1]; t += x[1]; }); return s / t; },
  mr: function (v) { return M(v.f); },
  pct: function (v) { return 100 * E[v.el].Ar * Core.parseFormula(v.f)[v.el] / M(v.f); },
  yield: function (v) { return 100 * v.actual / v.theo; },
  n_m: function (v) { return v.m / M(v.f); },
  m_n: function (v) { return v.n * M(v.f); },
  n_cv: function (v) { return v.c * v.VmL / 1000; },
  N: function (v) { return v.n * 6.02e23; },
  n_N: function (v) { return v.N / 6.02e23; },
  shellMax: function (v) { return 2 * v.n * v.n; },
  product: function (v) { var L = limiting(v); return L.k * eqCoef(v.eq, v.product) * M(v.product); },
  reagent: function (v) {
    var n = v.given.m / M(v.given.f) / eqCoef(v.eq, v.given.f) * eqCoef(v.eq, v.target);
    return v.out === 'm' ? n * M(v.target) : n / v.c * 1000;
  },
  pne: function (v) { var Z = E[v.sym].Z; return v.what === 'p' ? Z : v.what === 'n' ? v.A - Z : Z - v.charge; },
  valence: function (v) {
    var c = Core.parseFormula(v.f), t = 0;
    for (var k in c) t += c[k] * (E[k].group > 12 ? E[k].group - 10 : E[k].group);
    return t;
  }
};

/* ---------- typing variants for configs/formulas ------------------------ */
function supify(s) { return s.replace(/([spdf])(\d+)/g, function (m, l, d) { return l + Core.supStr(+d); }); }
function caretify(s) { return s.replace(/([spdf])(\d+)/g, '$1^$2'); }
function subify(s) { return s.replace(/(\d+)/g, function (d) { return d.split('').map(function (x) { return '₀₁₂₃₄₅₆₇₈₉'[+x]; }).join(''); }); }

/* ---------- walk the content ---------------------------------------------- */
var totalBudget = 0, puzzleCount = 0;
var CHECK_FIELD = Core.checkField;

function checkField(f, where, rowVerify) {
  ok(f.answer !== undefined, where + ': field has no answer');
  // 1. the game accepts its own stored answer
  var typed = f.kind === 'number' ? String(f.answer) : f.answer;
  var r = CHECK_FIELD(f, typed);
  ok(r.ok, where + ': stored answer "' + f.answer + '" is rejected by the checker (' + (r.msg || '') + ')');
  if (f.kind === 'select') ok(f.options.indexOf(f.answer) >= 0 && new Set(f.options).size === f.options.length, where + ': select options missing answer or duplicated');
  if (f.kind === 'number') {
    ok(CHECK_FIELD(f, String(f.answer * 1.009)).ok || (f.tol === 0) || (f.tolAbs != null && f.tolAbs < Math.abs(f.answer) * 0.009), where + ': tolerance tighter than ~1 %');
    ok(!CHECK_FIELD(f, String(f.answer * 1.2 + 0.5)).ok, where + ': tolerance far too loose');
    if (f.answer > 1e6) {
      var mant = (f.answer / Math.pow(10, Math.floor(Math.log10(f.answer)))).toFixed(2), ex = Math.floor(Math.log10(f.answer));
      ['e' + ex, ' x 10^' + ex, ' × 10' + Core.supStr(ex), '*10^' + ex].forEach(function (suf) {
        ok(CHECK_FIELD(f, mant + suf).ok, where + ': scientific notation variant "' + mant + suf + '" rejected');
      });
    }
  }
  var v = f.verify || rowVerify;
  if (v && v.fn && CALC[v.fn] && f.kind === 'number') {
    var calc = CALC[v.fn](v);
    var tol = f.tolAbs != null ? Math.max(f.tolAbs / 2, 0) : 0;
    ok(close(calc, f.answer, f.tol === 0 ? 1e-9 : 0.006, tol), where + ': stored ' + f.answer + ' but recomputed ' + calc.toPrecision(5));
    ok(CHECK_FIELD(f, String(calc)).ok, where + ': unrounded recomputed value ' + calc + ' rejected');
    ok(CHECK_FIELD(f, calc.toPrecision(3)).ok, where + ': 3 s.f. value ' + calc.toPrecision(3) + ' rejected');
  }
  if (f.kind === 'config') {
    var v2 = f.verify;
    var want = Core.groundState(E[v2.sym].Z, v2.charge || 0);
    ok(Core.sameCounts(Core.expandConfig(Core.parseConfig(f.answer)), want), where + ': configuration ' + f.answer + ' ≠ ground state ' + Core.configToString(want));
    [f.answer.replace(/\s+/g, ''), supify(f.answer), caretify(f.answer), f.answer.toUpperCase().replace(/\[([A-Z])([A-Z])\]/, '[$1$2]')].forEach(function (variant) {
      ok(CHECK_FIELD(f, variant).ok, where + ': typing variant "' + variant + '" rejected');
    });
    (f.traps || []).forEach(function (t) { var rr = CHECK_FIELD(f, t.value); ok(!rr.ok && rr.msg === t.msg, where + ': trap "' + t.value + '" not triggered'); });
  }
  if (f.kind === 'formula') {
    ok(CHECK_FIELD(f, subify(f.answer)).ok, where + ': subscript variant rejected');
    ok(CHECK_FIELD(f, f.answer.split('').join(' ')).ok, where + ': spaced variant rejected');
    if (f.verify && f.verify.fn === 'ionic') {
      var ions = f.verify.ions, q1 = ions[0][1], q2 = -ions[1][1], g = Core.gcd(q1, q2);
      var n1 = q2 / g, n2 = q1 / g, tot = {};
      [[ions[0][0], n1], [ions[1][0], n2]].forEach(function (pair) { var c = Core.parseFormula(pair[0]); for (var k in c) tot[k] = (tot[k] || 0) + c[k] * pair[1]; });
      ok(Core.sameCounts(tot, Core.parseFormula(f.answer)), where + ': ' + f.answer + ' is not the neutral combination of ' + JSON.stringify(ions));
    }
    if (f.verify && f.verify.fn === 'covalent') {
      Object.keys(Core.parseFormula(f.answer)).forEach(function (k) { ok(['H', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I', 'Si', 'B', 'Se'].indexOf(k) >= 0, where + ': covalent formula contains a metal'); });
    }
    ok(!CHECK_FIELD(f, f.answer.toLowerCase()).ok || f.answer === f.answer.toLowerCase(), where + ': lower-case formula wrongly accepted');
  }
  if (f.kind === 'equation') {
    var pe = Core.parseEquation(f.answer);
    ok(!pe.error && Core.isBalanced(pe), where + ': equation not balanced: ' + f.answer);
    ok(CHECK_FIELD(f, f.answer.replace('->', '→')).ok, where + ': → arrow rejected');
    ok(CHECK_FIELD(f, subify(f.answer.replace(/\(([a-z/]+)\)/g, function (m, s) { return '(' + s.split('/')[0] + ')'; }))).ok, where + ': subscript variant rejected');
    var noStates = f.answer.replace(/\((s|l|g|aq)(\/(s|l|g|aq))*\)/g, '');
    var rr2 = CHECK_FIELD(f, noStates);
    ok(!rr2.ok && /state/.test(rr2.msg), where + ': missing states not flagged');
    var unbalanced = f.answer.replace(/^\d+/, '').replace(/\+ \d+/, '+ ');
    if (unbalanced !== f.answer) { var rr3 = CHECK_FIELD(f, unbalanced); ok(!rr3.ok && /balanced|count|whole/i.test(rr3.msg), where + ': unbalanced version not flagged (' + rr3.msg + ')'); }
  }
  if (f.kind === 'select' && f.verify && f.verify.eq && !f.verify.fn) {
    var p2 = Core.parseEquation(f.verify.eq);
    ok(!p2.error && Core.isBalanced(p2), where + ': prediction equation unbalanced: ' + f.verify.eq);
    // the correct option must describe the same products
    var opt = Core.toPlain(f.answer).replace(/\s+/g, '');
    var rhs = Core.toPlain(f.verify.eq.split('->')[1]).replace(/\s+/g, '');
    ok(opt === rhs, where + ': answer option "' + f.answer + '" does not match verified products "' + rhs + '"');
    p2.rhs.forEach(function (sp) { if (sp.states && sp.counts) ok(solubleState(sp.formula) == null || solubleState(sp.formula) === sp.states[0], where + ': state of ' + sp.formula + ' disagrees with solubility rules'); });
  }
  if (f.kind === 'select' && f.verify && f.verify.fn === 'limiting') {
    ok(limiting(f.verify).f === f.verify.expect && Core.toPlain(f.answer).replace(/\s/g, '') === f.verify.expect, where + ': limiting reagent wrong (calc ' + limiting(f.verify).f + ')');
  }
  if (f.verify && f.verify.fn === 'lewis') {
    var vv = f.verify;
    ok(2 * (vv.bp + vv.lp) === vv.ve && CALC.valence(vv) === vv.ve, where + ': Lewis electron count inconsistent for ' + vv.f);
  }
}

// simple Year 10 solubility rules for ionic products (returns 'aq', 's' or null when not an ionic salt we judge)
function solubleState(f) {
  var c = Core.parseFormula(f); if (!c) return null;
  if (f === 'H2O') return 'l';
  if (/^(H2|O2|CO2|N2|Cl2)$/.test(f)) return 'g';
  var group1 = ['Li', 'Na', 'K'];
  var metal = Object.keys(c).filter(function (k) { return ['Li', 'Na', 'K', 'Mg', 'Ca', 'Ba', 'Zn', 'Cu', 'Fe', 'Pb', 'Ag', 'Al'].indexOf(k) >= 0; })[0];
  if (!metal) return null;
  if (group1.indexOf(metal) >= 0 || /NO3/.test(f)) return 'aq';
  if (/Cl|Br|I/.test(f) && !/O/.test(f)) return (metal === 'Ag' || metal === 'Pb') ? 's' : 'aq';
  if (/SO4/.test(f)) return (['Ba', 'Pb', 'Ca'].indexOf(metal) >= 0) ? 's' : 'aq';
  if (/CO3|OH/.test(f) || Object.keys(c).join() === metal + ',O') return 's';
  return null;
}

function walkPart(part, where, puzzle) {
  switch (part.type) {
    case 'fields':
      (part.fields || []).forEach(function (f, i) { checkField(f, where + ' field ' + (i + 1)); });
      (part.rows || []).forEach(function (row, ri) {
        row.cells.forEach(function (f, ci) {
          if (!f) return;
          var rv = row.verify;
          if (rv && rv.fn === 'notation') {
            var expect = [rv.A, E[rv.sym].Z, rv.sym][ci];
            ok(f.answer === expect, where + ' row ' + (ri + 1) + ': notation cell ' + ci + ' expected ' + expect + ' got ' + f.answer);
            if (rv.n != null) ok(rv.A - E[rv.sym].Z === rv.n, where + ': neutron count mismatch');
          }
          checkField(f, where + ' row ' + (ri + 1) + ' col ' + (ci + 1));
        });
      });
      if (part.fig && part.fig.name === 'chromatogram') {
        // Mystery = the known inks whose Rf match the mystery spots
        var lanes = part.fig.lanes, mys = lanes[lanes.length - 1];
        var names = lanes.slice(0, -1).filter(function (l) { return l.spots.some(function (s) { return mys.spots.indexOf(s) >= 0; }); }).map(function (l) { return l.label; });
        var sf = part.fields.filter(function (f) { return f.verify && f.verify.fn === 'chromaMatch'; })[0];
        ok(sf && names.every(function (n) { return sf.answer.indexOf(n) >= 0; }) && sf.answer.split('+').length === names.length, where + ': chromatogram match answer inconsistent (' + names + ')');
      }
      if (part.fig && part.fig.name === 'flames') {
        var refs = part.fig.refs, sample = part.fig.sample.slice().sort();
        var present = Object.keys(refs).filter(function (el) { return refs[el].every(function (l) { return sample.indexOf(l) >= 0; }); });
        var union = []; present.forEach(function (el) { union = union.concat(refs[el]); });
        ok(union.sort().join() === sample.join(), where + ': sample spectrum is not exactly explained by ' + present);
        var sf2 = part.fields.filter(function (f) { return f.verify && f.verify.fn === 'spectrum'; })[0];
        ok(present.length === 2 && present.every(function (el) { return sf2.answer.indexOf(E[el].name) >= 0; }), where + ': spectrum answer should name ' + present.map(function (e) { return E[e].name; }));
      }
      break;
    case 'slots': {
      var ids = part.tiles.map(function (t) { return t.id; });
      var used = {};
      part.slots.forEach(function (s) { [].concat(s.answer).forEach(function (a) { ok(ids.indexOf(a) >= 0, where + ': slot ' + s.id + ' answer ' + a + ' is not a tile'); used[a] = (used[a] || 0) + 1; }); });
      if (part.layout === 'bins') ids.forEach(function (id) { ok(used[id] === 1, where + ': tile ' + id + ' must belong to exactly one bin'); });
      part.tiles.forEach(function (t) {
        if (t.eq) { var pe = Core.parseEquation(t.eq); ok(!pe.error && Core.isBalanced(pe), where + ': tile equation unbalanced ' + t.eq); }
        if (t.bond) {
          var d = Math.abs(E[t.bond[0]].EN - E[t.bond[1]].EN), cat = d < 0.5 ? 'np' : d <= 1.7 ? 'p' : 'i';
          var bin = part.slots.filter(function (s) { return [].concat(s.answer).indexOf(t.id) >= 0; })[0];
          ok(bin && bin.id === cat, where + ': bond ' + t.label + ' ΔEN ' + d.toFixed(1) + ' belongs in ' + cat);
        }
      });
      break;
    }
    case 'order':
      ok(part.answer.length === part.items.length && part.answer.every(function (a) { return part.items.some(function (i) { return i.id === a; }); }), where + ': order answer/items mismatch');
      if (part.items[0].id === '1s') ok(part.answer.join() === Core.AUFBAU.slice(0, part.answer.length).join(), where + ': Aufbau order wrong');
      var DATA = {
        ie: { K: 419, Na: 496, Mg: 738, S: 1000, Cl: 1251, Ar: 1521 },
        ionr: { N: 146, O: 140, F: 133, Na: 102, Mg: 72, Al: 54 },
        bp: { F2: -188, HCl: -85, H2O: 100, NaCl: 1413 }
      };
      ['ie', 'ionr', 'bp'].forEach(function (k) {
        var d = DATA[k];
        if (part.answer.every(function (a) { return d[a] != null; })) {
          for (var i = 1; i < part.answer.length; i++) {
            var a = d[part.answer[i - 1]], b = d[part.answer[i]];
            ok(k === 'ionr' ? a > b : a < b, where + ': ' + k + ' order wrong at ' + part.answer[i]);
          }
        }
      });
      break;
    case 'spot':
      ok(part.lines.filter(function (l) { return l.error; }).length === part.count, where + ': spot count says ' + part.count);
      part.lines.forEach(function (l, i) {
        if (!l.check) return;
        var cfgText = l.text.split(':')[1];
        var shown = Core.expandConfig(Core.parseConfig(cfgText)), truth = Core.groundState(E[l.check].Z, 0);
        ok(Core.sameCounts(shown, truth) === !l.error, where + ' line ' + (i + 1) + ': ' + l.text + ' marked ' + (l.error ? 'wrong' : 'right') + ' but truth is ' + Core.configToString(truth));
        if (l.fix) ok(Core.sameCounts(Core.expandConfig(Core.parseConfig(l.fix)), truth), where + ' line ' + (i + 1) + ': fix is wrong');
      });
      break;
    case 'orbital':
      part.diagrams.forEach(function (d) {
        var truth = Core.groundState(E[d.verify.sym].Z, 0), exp = {};
        if (d.verify.core) { var core = Core.fillAufbau(Core.CORES[d.verify.core]); for (var k in truth) { var x = truth[k] - (core[k] || 0); if (x) exp[k] = x; } }
        else exp = truth;
        ok(Core.sameCounts(exp, d.expect), where + ': orbital expectation for ' + d.id + ' wrong');
        // build the correct boxes and run the game's checker
        var boxes = {};
        d.subshells.forEach(function (s) {
          var n = d.expect[s.name], arr = [];
          for (var b = 0; b < s.boxes; b++) arr.push([null, null]);
          for (var e = 0; e < n; e++) { if (e < s.boxes) arr[e][0] = 'u'; else arr[e - s.boxes][1] = 'd'; }
          boxes[s.name] = arr;
        });
        ok(Core.checkOrbitals(d, boxes).ok, where + ': correct orbital diagram for ' + d.id + ' rejected');
        // Hund violation detection
        var big = d.subshells.filter(function (s) { return s.boxes > 1 && d.expect[s.name] > 1 && d.expect[s.name] < s.boxes * 2; })[0];
        if (big) {
          var bad = JSON.parse(JSON.stringify(boxes)), arr2 = bad[big.name];
          var n2 = d.expect[big.name]; arr2.forEach(function (bx) { bx[0] = null; bx[1] = null; });
          for (var q = 0; q < n2; q++) { if (q % 2 === 0) arr2[q >> 1][0] = 'u'; else arr2[q >> 1][1] = 'd'; } // pair up first: breaks Hund
          var r = Core.checkOrbitals(d, bad);
          ok(!r.ok && r.rule === 'Hund', where + ': Hund violation not detected for ' + d.id + ' (' + r.msg + ')');
          var bad2 = JSON.parse(JSON.stringify(boxes)); bad2[d.subshells[0].name][0] = ['u', 'u'];
          var r2 = Core.checkOrbitals(d, bad2);
          ok(!r2.ok && r2.rule === 'Pauli', where + ': Pauli violation not detected for ' + d.id);
        }
      });
      break;
    case 'grid':
      ok(part.answer.length === part.rows.length && new Set(part.answer).size === part.answer.length, where + ': grid answer not one-per-row/col');
      break;
    case 'balance':
      part.equations.forEach(function (e) {
        var pe = Core.parseEquation(e.answer);
        ok(!pe.error && Core.isBalanced(pe), where + ': equation unbalanced ' + e.answer);
        var g = 0; pe.lhs.concat(pe.rhs).forEach(function (s) { g = Core.gcd(g, s.coef); });
        ok(g === 1, where + ': not lowest whole numbers ' + e.answer);
        ok(Core.checkEquation({ answer: e.answer }, e.answer).ok, where + ': game rejects its own equation');
      });
      break;
    default:
      ok(false, where + ': unknown part type ' + part.type);
  }
}

function words(doc) { return [doc.heading || '', (doc.body || []).join(' '), doc.note || '', doc.sign || ''].join(' ').split(/\s+/).filter(Boolean).length; }

C.rooms.forEach(function (room, ri) {
  ok(room.puzzles.length >= 3 && room.puzzles.length <= 5, room.id + ': must have 3–5 puzzles');
  var roomBudget = 0;
  room.puzzles.forEach(function (pz) {
    puzzleCount++;
    roomBudget += pz.budget || 0;
    ok(pz.budget > 0, pz.id + ': missing time budget');
    ok(pz.hints && pz.hints.length === 3 && pz.hints.every(function (h) { return h.length > 20; }), pz.id + ': needs exactly 3 hints');
    ok(pz.prop && pz.prop.name && pz.prop.front, pz.id + ': needs a prop');
    pz.parts.forEach(function (part, pi) { walkPart(part, pz.id + ' part ' + (pi + 1), pz); });
  });
  totalBudget += roomBudget;
  console.log('  ' + room.number + '. ' + room.name.padEnd(28) + room.puzzles.length + ' puzzles  ' + roomBudget.toFixed(1) + ' min');
  ok(room.award && room.award.symbol && room.award.digit >= 0, room.id + ': award missing');
});

// ---- story
var docs = [C.story.intro, C.story.vaultNote].concat(C.story.afterRoom, C.story.ending);
docs.forEach(function (d, i) { var w = words(d); ok(w <= 150, 'story doc ' + i + ' (' + d.heading + ') has ' + w + ' words'); });
ok(C.story.afterRoom.length === C.rooms.length, 'need one story document after each room');

// ---- vault
var RADIUS = { K: 227, Na: 186, Mg: 160, Al: 143, Si: 118, P: 110, Cl: 99, F: 71 }; // pm, atomic radii
var awards = C.rooms.map(function (r) { return r.award.symbol; });
ok(awards.slice().sort().join() === C.vault.order.slice().sort().join(), 'vault order must use exactly the awarded meeples');
for (var i = 1; i < C.vault.order.length; i++) ok(RADIUS[C.vault.order[i - 1]] > RADIUS[C.vault.order[i]], 'vault order not decreasing radius at ' + C.vault.order[i]);
ok(awards.join() !== C.vault.order.join(), 'vault order must differ from the order meeples are found');
ok(C.vault.hints.length === 3, 'vault needs 3 hints');

// ---- checker sanity: generic variant handling
ok(Core.checkField({ kind: 'config', answer: '1s2 2s2 2p6 3s2 3p6 4s2 3d6' }, '1s2 2s2 2p6 3s2 3p6 3d6 4s2').ok, '3d before 4s ordering should be accepted');
ok(Core.checkField({ kind: 'config', answer: '1s2 2s2 2p6 3s2 3p6 4s2 3d6' }, '1S2 2S2 2P6 3S2 3P6 4S2 3D6').ok, 'upper-case config should be accepted');
ok(/Hund|Pauli|Count|electrons/.test(Core.checkField({ kind: 'config', answer: '1s2 2s2 2p3' }, '1s2 2s2 2p4').msg), 'wrong config gives specific feedback');
ok(/mL to L/.test(Core.checkField({ kind: 'number', answer: 0.1 }, '100').msg), 'mL→L trap message');
ok(Core.parseNumber('1.51 × 10²³') > 1.5e23 && Core.parseNumber('1.51x10^23') > 1.5e23 && Core.parseNumber('1.51E23') > 1.5e23, 'sci notation parsing');

console.log('\n  Puzzles: ' + puzzleCount + '   Total puzzle budget: ' + totalBudget.toFixed(1) + ' min (+ vault ~3 min + reading ~3 min = ' + (totalBudget + 6).toFixed(0) + ' min)');
ok(totalBudget + 6 >= 45 && totalBudget + 6 <= 70, 'total time budget out of range');

console.log('\n  ' + pass + ' checks passed, ' + fail + ' failed');
if (fail) { console.log('\nFAILURES:'); failures.forEach(function (f) { console.log('  ✗ ' + f); }); process.exit(1); }
