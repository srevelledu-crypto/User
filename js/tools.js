/* ------------------------------------------------------------------
   Tools: pure logic for the group maker, the random picker and CSV
   class-list import. No DOM access, so it is unit tested in Node
   (see tests/tools.test.mjs). Randomness comes from an injectable
   rng() so tests can use a seeded generator.
------------------------------------------------------------------- */
const Tools = (() => {
  const shuffle = (arr, rng) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

  /* ================= groups ================= */

  /* How many groups to make from n students: by group size (round up, so a class of 26 in fours
     makes 7 groups) or a fixed number of groups. Never more groups than students. */
  function groupCount(n, { mode = 'size', size = 4, count = 6 } = {}) {
    if (!n) return 1;
    const k = mode === 'size' ? Math.ceil(n / Math.max(1, size)) : count;
    return Math.max(1, Math.min(n, Math.round(k) || 1));
  }
  function groupSizesText(n, k) {
    if (!n) return 'Nobody here yet';
    const lo = Math.floor(n / k), hi = Math.ceil(n / k);
    return `${k} group${k === 1 ? '' : 's'} of ${lo === hi ? lo : `${lo}–${hi}`}`;
  }

  /* How often each pair of students has shared a group in past groupings (most recent first).
     More recent groupings count more, so the effect fades over time. */
  function pairHistory(history = [], depth = 8) {
    const counts = new Map();
    history.slice(0, depth).forEach((list, age) => {
      const w = depth - age;
      for (const grp of list) for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
        const k = pairKey(grp[i], grp[j]);
        counts.set(k, (counts.get(k) || 0) + w);
      }
    });
    return counts;
  }
  /* Number of pairs in `list` who were together in the most recent past grouping. */
  function repeatPairs(list, history = []) {
    if (!history.length) return 0;
    const prev = new Set();
    for (const grp of history[0]) for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) prev.add(pairKey(grp[i], grp[j]));
    let n = 0;
    for (const grp of list) for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) if (prev.has(pairKey(grp[i], grp[j]))) n++;
    return n;
  }

  /* Balanced random groups.
     - Group sizes differ by at most one (n % k groups get one extra).
     - Keep-together rules are merged into units first; keep-apart rules are avoided.
     - With history, students who were recently together are kept apart where possible.
     Units are placed largest first into the group with room, then fewest keep-apart clashes,
     fewest repeat partners, fewest members. Many random restarts keep the best result:
     fewest broken rules, then sizes closest to target, then fewest repeats.
     Returns { groups, broken, repeats }. */
  function makeGroups({ ids, rules = [], k, useRules = true, history = [], avoidRepeats = true, rng = Math.random, tries = 300 }) {
    const n = ids.length;
    if (!n) return { groups: [], broken: 0, repeats: 0 };
    k = Math.max(1, Math.min(n, k || 1));
    const here = new Set(ids);
    const active = useRules ? rules.map(r => ({ ...r, members: [...new Set(r.members)].filter(m => here.has(m)) })).filter(r => r.members.length >= 2) : [];
    const parent = new Map(ids.map(id => [id, id]));
    const find = x => { while (parent.get(x) !== x) x = parent.get(x); return x; };
    for (const r of active) if (r.type === 'together') for (const m of r.members.slice(1)) parent.set(find(m), find(r.members[0]));
    const unitMap = new Map();
    for (const id of ids) { const root = find(id); if (!unitMap.has(root)) unitMap.set(root, []); unitMap.get(root).push(id); }
    const units = [...unitMap.values()];
    const apart = new Set();
    for (const r of active) if (r.type === 'apart') for (const a of r.members) for (const b of r.members) if (a !== b) apart.add(a + '|' + b);
    const past = avoidRepeats ? pairHistory(history) : new Map();
    const clash = (unit, grp) => { let c = 0; for (const a of unit) for (const b of grp) if (apart.has(a + '|' + b)) c++; return c; };
    const rep = (unit, grp) => { let c = 0; if (!past.size) return 0; for (const a of unit) for (const b of grp) c += past.get(pairKey(a, b)) || 0; return c; };
    const base = Math.floor(n / k), extra = n % k;
    let best = null;
    for (let t = 0; t < tries; t++) {
      const target = shuffle(Array.from({ length: k }, (_, i) => base + (i < extra ? 1 : 0)), rng);
      const order = shuffle(units.slice(), rng).sort((a, b) => b.length - a.length);
      const groups = Array.from({ length: k }, () => []);
      let broken = 0, repeats = 0;
      for (const u of order) {
        let pick = null;
        for (let i = 0; i < k; i++) {
          const o = { i, fits: groups[i].length + u.length <= target[i], c: clash(u, groups[i]), r: rep(u, groups[i]), len: groups[i].length, z: rng() };
          if (!pick || (o.fits !== pick.fits ? o.fits : o.c !== pick.c ? o.c < pick.c : o.r !== pick.r ? o.r < pick.r : o.len !== pick.len ? o.len < pick.len : o.z < pick.z)) pick = o;
        }
        groups[pick.i].push(...u);
        broken += pick.c; repeats += pick.r;
      }
      for (const u of units) for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) if (apart.has(u[i] + '|' + u[j])) broken++; // together and apart for the same pair
      const off = groups.reduce((s, g, i) => s + Math.abs(g.length - target[i]), 0);
      const score = broken * 1e9 + off * 1e6 + repeats;
      if (!best || score < best.score) best = { groups, broken, repeats, score };
      if (score === 0) break;
    }
    let groups = best.groups;
    if (best.broken || best.repeats) groups = repair(groups, units, apart, past);
    const broken = countBroken(groups, units, apart);
    return { groups: groups.map(g => shuffle(g, rng)), broken, repeats: repeatPairs(groups, history) };
  }

  /* Keep-apart clashes in a grouping, plus any pair that is both kept together and kept apart. */
  function countBroken(groups, units, apart) {
    let n = 0;
    for (const g of groups) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (apart.has(g[i] + '|' + g[j])) n++;
    return n;
  }
  /* Local repair: swap two students (who aren't tied to others by a keep-together rule) between
     groups while that lowers the number of keep-apart clashes, then of repeat partners. Swaps keep
     every group the same size. */
  function repair(groups, units, apart, past) {
    groups = groups.map(g => g.slice());
    const solo = new Set(units.filter(u => u.length === 1).map(u => u[0]));
    const cost = (id, g, skip) => {
      let c = 0;
      for (const o of g) if (o !== id && o !== skip) c += (apart.has(id + '|' + o) ? 1e6 : 0) + (past.get(pairKey(id, o)) || 0);
      return c;
    };
    for (let pass = 0; pass < 50; pass++) {
      let improved = false;
      for (let gi = 0; gi < groups.length; gi++) for (let ai = 0; ai < groups[gi].length; ai++) {
        const a = groups[gi][ai];
        if (!solo.has(a)) continue;
        const ca = cost(a, groups[gi]);
        if (!ca) continue;
        let bestSwap = null;
        for (let gj = 0; gj < groups.length; gj++) if (gj !== gi) for (let bi = 0; bi < groups[gj].length; bi++) {
          const b = groups[gj][bi];
          if (!solo.has(b)) continue;
          const before = ca + cost(b, groups[gj]);
          const after = cost(a, groups[gj], b) + cost(b, groups[gi], a);
          if (after < before && (!bestSwap || before - after > bestSwap.gain)) bestSwap = { gj, bi, gain: before - after };
        }
        if (bestSwap) {
          const b = groups[bestSwap.gj][bestSwap.bi];
          groups[gi][ai] = b; groups[bestSwap.gj][bestSwap.bi] = a;
          improved = true;
        }
      }
      if (!improved) break;
    }
    return groups;
  }

  /* Rules broken by a grouping (only students who are in it count). */
  function groupProblems(list, rules) {
    const gi = new Map();
    list.forEach((grp, i) => grp.forEach(id => gi.set(id, i)));
    const out = [];
    for (const r of rules) {
      const m = [...new Set(r.members)].filter(id => gi.has(id));
      if (r.type === 'apart') {
        for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) if (gi.get(m[i]) === gi.get(m[j])) out.push({ rule: r.id, type: 'apart', students: [m[i], m[j]] });
      } else if (new Set(m.map(id => gi.get(id))).size > 1) out.push({ rule: r.id, type: 'together', students: m });
    }
    return out;
  }

  /* ================= random picker ================= */

  /* Choose the next student.
     here: ids of students present. picked: ids already picked this round. last: the previous pick.
     With noRepeat, nobody is picked twice until everyone present has had a turn; then a new round
     starts. The same student is never picked twice in a row unless they are the only one here.
     Returns { id, newRound } or null when nobody is here. */
  function pickNext({ here, picked = [], last = null, noRepeat = true, rng = Math.random }) {
    if (!here.length) return null;
    const done = new Set(picked);
    let pool = noRepeat ? here.filter(id => !done.has(id)) : here.slice();
    let newRound = false;
    if (!pool.length) { newRound = true; pool = here.slice(); }
    if (pool.length > 1) pool = pool.filter(id => id !== last);
    return { id: pool[Math.floor(rng() * pool.length)], newRound };
  }
  /* The picker state after a pick (picked list capped so it can't grow forever). */
  function recordPick(state, { id, newRound }, cap = 300) {
    const picked = newRound ? [id] : [...state.picked, id];
    return { ...state, picked: picked.slice(-cap), last: id };
  }

  /* ================= CSV class lists ================= */

  /* Parse CSV text into rows. Handles quotes (with "" escapes and line breaks inside quotes),
     CRLF line endings, a byte-order mark, and comma, semicolon or tab separators. */
  function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, '');
    const first = text.split(/\r?\n/).find(l => l.trim()) || '';
    const counts = { ',': 0, ';': 0, '\t': 0 };
    let q = false;
    for (const ch of first) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch]++; }
    const sep = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const rows = [];
    let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
        else cell += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c));
  }

  const HEAD = {
    preferred: /^prefer|preferred/i,
    first: /^(first|given|fore)\s*(name)?s?$|first\s*name|given\s*name|forename/i,
    last: /^(last|sur|family)\s*(name)?$|surname|last\s*name|family\s*name/i,
    full: /^((student|full|display)\s*)?name$|student\s*name|full\s*name/i,
  };
  /* Work out student names from CSV rows, as exported by school systems (SEQTA, Compass, Sentral,
     OneSchool) or typed into a spreadsheet. Uses header names where present: preferred name over
     first name, then surname. Without a header, one column is a full name and two columns are
     first name then surname. A "Surname, First" cell is turned round.
     Returns { names, hasHeader, columns } where columns describes what was used. */
  function namesFromRows(rows, { swap = false } = {}) {
    if (!rows.length) return { names: [], hasHeader: false, columns: '' };
    const head = rows[0].map(h => h.toLowerCase());
    const col = re => head.findIndex(h => re.test(h));
    const hasHeader = head.some(h => HEAD.first.test(h) || HEAD.last.test(h) || HEAD.full.test(h) || HEAD.preferred.test(h));
    let firstI = -1, prefI = -1, lastI = -1, fullI = -1, used;
    if (hasHeader) {
      prefI = col(HEAD.preferred);
      firstI = col(HEAD.first);
      if (firstI === prefI) firstI = -1;
      if (firstI < 0 && prefI >= 0) { firstI = prefI; prefI = -1; }
      lastI = col(HEAD.last);
      fullI = col(HEAD.full);
      if (firstI < 0 && lastI < 0 && fullI < 0) fullI = 0;
    } else if (rows[0].length >= 2) { firstI = 0; lastI = 1; }
    else fullI = 0;
    if (swap && firstI >= 0 && lastI >= 0) [firstI, lastI] = [lastI, firstI];
    const body = hasHeader ? rows.slice(1) : rows;
    const seen = new Set(), names = [];
    for (const r of body) {
      let nm;
      if (firstI >= 0 || lastI >= 0) nm = [(prefI >= 0 && r[prefI]) || r[firstI] || '', r[lastI] || ''].join(' ');
      else nm = r[fullI] || '';
      nm = nm.replace(/\s+/g, ' ').trim();
      const m = nm.match(/^([^,]+),\s*([^,]+)$/);
      if (m) nm = `${m[2]} ${m[1]}`;
      if (!nm || seen.has(nm.toLowerCase())) continue;
      seen.add(nm.toLowerCase()); names.push(nm);
    }
    if (firstI >= 0 || lastI >= 0) used = hasHeader ? `${prefI >= 0 ? `${rows[0][prefI]} (or ${rows[0][firstI]})` : rows[0][firstI] ?? ''} + ${rows[0][lastI] ?? ''}`.replace(/^ \+ | \+ $/g, '') : (swap ? 'column 2 + column 1' : 'column 1 + column 2');
    else used = hasHeader ? rows[0][fullI] : 'column 1';
    return { names, hasHeader, columns: used };
  }

  /* Seeded random numbers for tests (mulberry32). */
  function seeded(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  return { groupCount, groupSizesText, makeGroups, groupProblems, pairHistory, repeatPairs, pickNext, recordPick, parseCSV, namesFromRows, seeded, shuffle };
})();
if (typeof module !== 'undefined') module.exports = Tools;
