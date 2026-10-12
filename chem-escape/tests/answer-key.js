#!/usr/bin/env node
/* Generates a compact ANSWER_KEY.md from js/content.js.
   Run:  node tests/answer-key.js   (re-run whenever you edit content.js) */
'use strict';
var path = require('path'), fs = require('fs');
var Core = require(path.join(__dirname, '..', 'js', 'core.js'));
var C = require(path.join(__dirname, '..', 'js', 'content.js'));
var S = Core.stripHtml;
function short(t, n) { t = String(t); n = n || 64; return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; }
function ans(f) {
  if (f.kind === 'number') {
    var v = f.answer, e = v ? Math.floor(Math.log10(Math.abs(v))) : 0;
    var txt = Math.abs(e) >= 5 ? (v / Math.pow(10, e)).toFixed(2) + ' × 10' + Core.supStr(e) : String(v);
    return txt + (f.units ? ' ' + f.units : '');
  }
  if (f.kind === 'config') return f.answer.replace(/([spdf])(\d+)/g, function (m, l, d) { return l + Core.supStr(+d); });
  if (f.kind === 'equation' || f.kind === 'formula') return Core.prettyFormula(f.answer).replace(/->/g, '→');
  return short(f.answer);
}
function part(p) {
  switch (p.type) {
    case 'fields':
      if (p.rows) return p.rows.map(function (r) { return short(S(r.label), 34) + ': ' + r.cells.filter(Boolean).map(ans).join(' / '); }).join('; ');
      return p.fields.map(function (f) { return ans(f); }).join('; ');
    case 'slots': {
      var t = {}; p.tiles.forEach(function (x) { t[x.id] = short(S(x.alt || x.label), 34); });
      return p.slots.map(function (s) { return S(s.label) + ' = ' + [].concat(s.answer).map(function (a) { return t[a]; }).join(', '); }).join('; ');
    }
    case 'order': { var l = {}; p.items.forEach(function (i) { l[i.id] = S(i.label); }); return p.answer.map(function (a) { return l[a]; }).join(' → '); }
    case 'spot': return 'wrong lines: ' + p.lines.map(function (x, i) { return x.error ? (i + 1) + (x.fix ? ' (' + short(x.fix, 50) + ')' : '') : null; }).filter(Boolean).join(', ');
    case 'orbital': return p.diagrams.map(function (d) { return d.label.split(' (')[0] + ' ' + d.subshells.map(function (s) { return s.name + Core.supStr(d.expect[s.name]); }).join(' '); }).join('; ') + ' (singles ↑ first, then pair ↓)';
    case 'grid': return p.rows.map(function (r, i) { return r + ' = ' + p.cols[p.answer[i]]; }).join('; ');
    case 'balance': return p.equations.map(function (e) { return Core.prettyFormula(e.answer).replace(/->/g, '→'); }).join('; ');
  }
  return '';
}
var digits = {}; C.rooms.forEach(function (r) { digits[r.award.symbol] = r.award.digit; });
var out = ['# The Thistlewood Game Works — Answer key', '',
  'Teacher Mode (press **T**) can also show these inside each puzzle. Calculations accept ±2 % (Rf ±0.03). Long answers are shortened here with “…”. Generated from `js/content.js` by `node tests/answer-key.js`.', ''];
C.rooms.forEach(function (r) {
  out.push('### ' + r.number + '. ' + r.name + ' (' + r.game + ') — meeple ' + r.award.symbol + ', digit ' + r.award.digit);
  r.puzzles.forEach(function (p) { out.push('- **' + p.prop.name + ':** ' + p.parts.map(part).join(' ‖ ')); });
  out.push('');
});
out.push('### Vault');
out.push('- Order by atomic radius, largest first: ' + C.vault.order.join(' → ') + ' → combination **' + C.vault.order.map(function (s) { return digits[s]; }).join('') + '**. Explanation: ' + short(C.vault.explain.answer, 90));
fs.writeFileSync(path.join(__dirname, '..', 'ANSWER_KEY.md'), out.join('\n') + '\n');
// also refresh the copy inside README.md (between the ANSWER-KEY markers)
var readme = path.join(__dirname, '..', 'README.md');
if (fs.existsSync(readme)) {
  var r = fs.readFileSync(readme, 'utf8'), a = '<!-- ANSWER-KEY:START -->', b = '<!-- ANSWER-KEY:END -->';
  if (r.indexOf(a) >= 0 && r.indexOf(b) > r.indexOf(a)) fs.writeFileSync(readme, r.slice(0, r.indexOf(a) + a.length) + '\n' + out.slice(4).join('\n').replace(/^### /gm, '#### ') + '\n' + r.slice(r.indexOf(b)));
}
console.log('Wrote ANSWER_KEY.md (' + out.length + ' lines, ' + out.join(' ').split(/\s+/).length + ' words)');
