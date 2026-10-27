// Solver tests. Run with: node seating-plan/tests/solver.test.mjs
// Loads the exact Core + Sample code embedded in index.html.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const block = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const ctx = { module: undefined };
vm.createContext(ctx);
vm.runInContext(block('/*CORE-START*/', '/*CORE-END*/') + ';globalThis.Core=Core;', ctx);
vm.runInContext(block('/*SAMPLE-START*/', '/*SAMPLE-END*/') + ';globalThis.Sample=Sample;', ctx);
const { Core, Sample } = ctx;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.log('  ✗ ' + name + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n    ')); process.exitCode = 1; }
}

const room = Sample.rooms()[0];          // Room B12: 29 available seats (one marked unavailable)
const cls = Sample.classes()[0];         // 28 students
const seats = Core.roomSeats(room);
const avail = seats.filter(s => !s.unavailable);
const nameOf = id => cls.students.find(s => s.id === id).name;
const label = r => r.members.map(nameOf).join(r.type === 'apart' ? ' ✕ ' : ' + ');
const apartRules = cls.rules.filter(r => r.type === 'apart');
const frontIds = cls.students.filter(s => s.front).map(s => s.id);

function verify(res, rules, mode, students = cls.students) {
  const keys = Object.keys(res.assignment);
  const ids = Object.values(res.assignment);
  assert.equal(new Set(ids).size, ids.length, 'a student is seated twice');
  for (const k of keys) {
    const s = seats.find(x => x.key === k);
    assert.ok(s && !s.unavailable, 'assigned to a missing or unavailable seat ' + k);
  }
  assert.equal(ids.length + res.unseated.length, students.length, 'not everybody accounted for');
  const v = Core.checkPlan({ seats, assignment: res.assignment, rules, mode });
  assert.equal(v.length, 0, 'rule violations: ' + JSON.stringify(v));
}

console.log(`\nSample: ${cls.students.length} students, ${apartRules.length} keep-apart rules, ${frontIds.length} front-priority, ${avail.length} seats`);

test('28 students / 6 keep-apart / 4 front-priority: solves in both adjacency modes, 300 runs each', () => {
  for (const mode of ['adjacent', 'table']) {
    let worstMs = 0, worstFrontRank = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const res = Core.solve({ seats, students: cls.students, rules: apartRules, mode, seed, label });
      assert.ok(res.ok, `seed ${seed} failed: ${res.problems.join(' ')}`);
      verify(res, apartRules, mode);
      worstMs = Math.max(worstMs, res.stats.ms);
      // front-priority students must be in the front-most seats (ranks are ties-aware)
      for (const [k, id] of Object.entries(res.assignment)) {
        if (frontIds.includes(id)) worstFrontRank = Math.max(worstFrontRank, seats.find(s => s.key === k).rank);
      }
    }
    // 4 front seats needed; front row of tables has 6 seats at the same distance band
    assert.ok(worstFrontRank <= 6, 'front-priority student seated at rank ' + worstFrontRank);
    console.log(`    mode=${mode}: worst solve ${worstMs} ms, worst front-priority seat rank ${worstFrontRank}`);
  }
});

test('Shuffle gives different arrangements', () => {
  const a = Core.solve({ seats, students: cls.students, rules: apartRules, seed: 11, label }).assignment;
  const b = Core.solve({ seats, students: cls.students, rules: apartRules, seed: 12, label }).assignment;
  assert.notDeepEqual(a, b);
});

test('Empty seat is left at the back when filling from the front', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const res = Core.solve({ seats, students: cls.students, rules: apartRules, seed, label, fill: 'front' });
    const empty = avail.filter(s => !res.assignment[s.key]);
    assert.equal(empty.length, 1);
    const maxDist = Math.max(...avail.map(s => s.dist));
    assert.ok(empty[0].dist >= maxDist - 2.5, 'empty seat not in back rows: dist ' + empty[0].dist);
  }
});

test('Keep-together rule is honoured (same table)', () => {
  const res = Core.solve({ seats, students: cls.students, rules: cls.rules, seed: 5, label });
  assert.ok(res.ok);
  verify(res, cls.rules, 'adjacent');
});

test('Locked seats are respected', () => {
  const students = cls.students.map(s => ({ ...s }));
  students[0].lock = avail[avail.length - 1].key;
  students[1].lock = avail[0].key; // Jack (has a keep-apart with Noah)
  for (let seed = 1; seed <= 50; seed++) {
    const res = Core.solve({ seats, students, rules: apartRules, seed, label });
    assert.ok(res.ok);
    assert.equal(res.assignment[students[0].lock], students[0].id);
    assert.equal(res.assignment[students[1].lock], students[1].id);
    verify(res, apartRules, 'adjacent', students);
  }
});

test('Impossible: two keep-apart students locked to the same table → clear message', () => {
  const students = cls.students.map(s => ({ ...s }));
  const jack = students.find(s => s.name.startsWith('Jack')), noah = students.find(s => s.name.startsWith('Noah'));
  jack.lock = 'b12_t1:0'; noah.lock = 'b12_t1:1';
  const res = Core.solve({ seats, students, rules: apartRules, seed: 1, label });
  assert.equal(res.ok, false);
  assert.match(res.problems.join(' '), /Jack Thompson and Noah Williams are both locked/);
  assert.ok(res.brokenRules.includes(apartRules[0].id));
  console.log('    → ' + res.problems[0]);
});

test('Impossible: keep-apart group larger than the number of tables → names the rule', () => {
  const big = { id: 'big', type: 'apart', members: cls.students.slice(0, 10).map(s => s.id) }; // 10 > 9 tables
  const res = Core.solve({ seats, students: cls.students, rules: [big], mode: 'table', seed: 1, label });
  assert.equal(res.ok, false);
  assert.match(res.problems[0], /needs 10 different tables, but the room only has 9/);
  console.log('    → ' + res.problems[0]);
});

test('Impossible: subtle conflict set is isolated by the diagnosis (and a best-effort plan is still produced)', () => {
  // 10 students who must all be apart, but only 9 tables: the rule is blamed, the harmless one isn't. Plus a harmless rule that must NOT be blamed.
  const g = cls.students.slice(0, 10).map(s => s.id);
  const rules = [
    { id: 'harmless', type: 'apart', members: [cls.students[20].id, cls.students[21].id] },
    { id: 'tooBig', type: 'apart', members: g },
  ];
  const res = Core.solve({ seats, students: cls.students, rules, mode: 'adjacent', seed: 3, label });
  assert.equal(res.ok, false);
  assert.equal(JSON.stringify(res.conflictRules), '["tooBig"]');
  assert.ok(!res.brokenRules.includes('harmless'));
  assert.equal(Object.keys(res.assignment).length, 28, 'best-effort plan should still seat everyone');
  console.log('    → ' + res.problems[0].slice(0, 160) + '…');
});

test('Impossible: chain of rules with no single culprit → reports the minimal set', () => {
  // Pair desks only: 3 pair desks in a tiny room, 6 students, table mode.
  const tiny = { id: 'r', boundary: [{ x: 0, y: 0 }, { x: 14, y: 0 }, { x: 14, y: 4 }, { x: 0, y: 4 }], items: [
    { id: 'bd', type: 'board', x: 7, y: 0, len: 4 },
    { id: 'p1', type: 'pair', x: 0, y: 1 }, { id: 'p2', type: 'pair', x: 5, y: 1 }, { id: 'p3', type: 'pair', x: 10, y: 1 }] };
  const st = ['A', 'B', 'C', 'D', 'E', 'F'].map(n => ({ id: n, name: n }));
  const rules = [
    { id: 'r1', type: 'apart', members: ['A', 'B'] },
    { id: 'r2', type: 'apart', members: ['B', 'C'] },
    { id: 'r3', type: 'apart', members: ['A', 'C'] },
    { id: 'r4', type: 'apart', members: ['D', 'E'] },
    { id: 'r5', type: 'apart', members: ['D', 'F'] },
    { id: 'r6', type: 'apart', members: ['E', 'F'] },
  ];
  // A,B,C need 3 different desks and D,E,F need 3 different desks: fine (6 seats, 3 desks of 2).
  let res = Core.solve({ seats: Core.roomSeats(tiny), students: st, rules, mode: 'table', seed: 1 });
  assert.ok(res.ok, 'should be solvable');
  // Add A ✕ D: now A's desk can hold none of B,C,D... still ok? A needs a partner from {E,F}. Add A ✕ E, A ✕ F → A has no partner.
  rules.push({ id: 'r7', type: 'apart', members: ['A', 'D'] }, { id: 'r8', type: 'apart', members: ['A', 'E'] }, { id: 'r9', type: 'apart', members: ['A', 'F'] });
  res = Core.solve({ seats: Core.roomSeats(tiny), students: st, rules, mode: 'table', seed: 1 });
  assert.equal(res.ok, false);
  // Minimal culprit set: D,E,F take all three desks and A may sit with none of them.
  assert.ok(['r7', 'r8', 'r9'].every(id => res.conflictRules.includes(id)), 'A ✕ D/E/F must be blamed: ' + res.conflictRules);
  assert.ok(res.conflictRules.length < rules.length, 'set should be minimal, not every rule');
  assert.ok(!res.conflictRules.includes('r2'), 'B ✕ C is irrelevant');
  console.log('    → ' + res.problems[0]);
});

test('More students than seats → warns and leaves extras unseated', () => {
  const extra = [...cls.students, { id: 'x1', name: 'Extra One' }, { id: 'x2', name: 'Extra Two' }];
  const res = Core.solve({ seats, students: extra, rules: apartRules, seed: 2, label });
  assert.match(res.warnings[0], /30 students but only 29 available seats/);
  assert.equal(res.unseated.length, 1);
  verify(res, apartRules, 'adjacent', extra);
});

test('Lab with prep-room cut-out: all items inside, solvable', () => {
  const lab = Sample.rooms()[1];
  for (const it of lab.items) assert.equal(Core.itemProblem(lab, it), null, it.id + ' ' + Core.itemProblem(lab, it));
  const res = Core.solve({ seats: Core.roomSeats(lab), students: cls.students, rules: cls.rules, seed: 9, label });
  assert.ok(res.ok, res.problems.join(' '));
});

test('Furniture outside an L-shaped boundary is rejected', () => {
  const r = { boundary: Sample.PRESETS.lshape.boundary, items: [] };
  const inNotch = { id: 'a', type: 'group4', x: 18, y: 2 };
  const inside = { id: 'b', type: 'group4', x: 2, y: 2 };
  const straddle = { id: 'c', type: 'group6', x: 13, y: 6 };
  assert.equal(Core.itemProblem(r, inNotch), 'outside');
  assert.equal(Core.itemProblem(r, inside), null);
  assert.equal(Core.itemProblem(r, straddle), 'outside');
});

test('Round table of 4: 1.2 m top, one seat on each side, keep-apart honoured', () => {
  const g = Core.itemGeom({ id: 'rt', type: 'round4', x: 2, y: 3 }, 0.5);
  assert.equal(g.w, 4.4); assert.equal(g.h, 4.4); assert.equal(g.seats.length, 4); // 1.2 m + 0.5 m chairs each side
  for (const s of g.seats) assert.ok(Math.abs(Math.hypot(s.x - 4.2, s.y - 5.2) - 1.7) < 1e-9);
  const r = { id: 'r', boundary: [{ x: 0, y: 0 }, { x: 16, y: 0 }, { x: 16, y: 10 }, { x: 0, y: 10 }], items: [
    { id: 'bd', type: 'board', x: 8, y: 0, len: 4 },
    { id: 'rA', type: 'round4', x: 1, y: 3 }, { id: 'rB', type: 'round4', x: 11, y: 3 }] };
  for (const it of r.items) assert.equal(Core.itemProblem(r, it), null);
  const st = ['A', 'B', 'C', 'D', 'E'].map(n => ({ id: n, name: n }));
  const res = Core.solve({ seats: Core.roomSeats(r), students: st, rules: [{ id: 'x', type: 'apart', members: ['A', 'B'] }], seed: 4 });
  assert.ok(res.ok);
  const tableOf = id => Object.keys(res.assignment).find(k => res.assignment[k] === id).split(':')[0];
  assert.notEqual(tableOf('A'), tableOf('B'));
});

test('Furniture uses real-world sizes (metres) whatever the grid scale', () => {
  const size = (it, scale) => { const g = Core.itemGeom({ id: 'x', x: 0, y: 0, ...it }, scale); return [g.table.w * scale, g.table.h * scale].map(v => +v.toFixed(3)); };
  for (const scale of [0.5, 0.25, 1]) {
    assert.deepEqual(size({ type: 'pair' }, scale), [1.2, 0.6]);           // 120 × 60 cm, 2 students
    assert.deepEqual(size({ type: 'single' }, scale), [0.7, 0.5]);
    assert.deepEqual(size({ type: 'group4' }, scale), [1.2, 1.2]);
    assert.deepEqual(size({ type: 'group6' }, scale), [1.8, 1.2]);
    assert.deepEqual(size({ type: 'teacher' }, scale), [1.5, 0.75]);
    assert.deepEqual(size({ type: 'bench', lenM: 2.4, sides: { t: 3, b: 3 } }, scale), [2.4, 1.2]); // island bench
    assert.deepEqual(size({ type: 'bench', lenM: 3.6, sides: { t: 0, b: 6 } }, scale), [3.6, 0.6]); // wall bench
    assert.deepEqual(size({ type: 'bench', lenM: 4.8, sides: { t: 0, b: 0 } }, scale), [4.8, 0.6]);
  }
  // pair desk seats are 0.6 m apart; no bench squeezes students under 0.45 m each
  const pg = Core.itemGeom({ id: 'p', type: 'pair', x: 0, y: 0 }, 0.5);
  assert.equal(+(Math.abs(pg.seats[0].x - pg.seats[1].x) * 0.5).toFixed(3), 0.6);
  const bg = Core.itemGeom({ id: 'b', type: 'bench', x: 0, y: 0, lenM: 1.2, sides: { t: 9, b: 0 } }, 0.5);
  assert.equal(bg.seats.length, 2);
  // board length is in metres too
  const room = { scale: 0.5, boundary: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 18 }, { x: 0, y: 18 }], items: [] };
  assert.equal(+(Core.wallGeom(room, { type: "board", x: 10, y: 0, lenM: 3.6 }).len * 0.5).toFixed(3), 3.6);
});

test('"Adjacent" is 1.5 m in real distance, not grid squares', () => {
  const a = { itemId: 'A', x: 0, y: 0, scale: 0.5 }, b = { itemId: 'B', x: 3, y: 0, scale: 0.5 };
  assert.ok(Core.seatsConflict(a, b, 'adjacent'));                       // 1.5 m
  assert.ok(!Core.seatsConflict(a, { ...b, x: 3.2 }, 'adjacent'));       // 1.6 m
  assert.ok(Core.seatsConflict({ ...a, scale: 0.25 }, { ...b, x: 6, scale: 0.25 }, 'adjacent'));
  assert.ok(!Core.seatsConflict(a, b, 'table'));
});

test('Front-first: with spare seats, every occupied row is nearer the board than every empty one', () => {
  const few = cls.students.slice(0, 17).map(s => ({ ...s, front: false }));
  for (let seed = 1; seed <= 100; seed++) {
    const res = Core.solve({ seats, students: few, rules: [], seed });
    const used = avail.filter(s => res.assignment[s.key]), empty = avail.filter(s => !res.assignment[s.key]);
    const back = Math.max(...used.map(s => s.dist)), front = Math.min(...empty.map(s => s.dist));
    assert.ok(back <= front + 1e-9, `seed ${seed}: occupied seat at ${back} behind an empty one at ${front}`);
  }
});

test('Front-first with keep-apart rules: no student could move into an emptier front row without breaking a rule', () => {
  const few = cls.students.slice(0, 20);
  const rules = apartRules.map(r => ({ ...r, members: r.members.filter(id => few.some(s => s.id === id)) })).filter(r => r.members.length >= 2);
  for (let seed = 1; seed <= 60; seed++) {
    const res = Core.solve({ seats, students: few, rules, seed });
    assert.ok(res.ok);
    const empty = avail.filter(s => !res.assignment[s.key]);
    for (const [k, id] of Object.entries(res.assignment)) {
      const from = seats.find(s => s.key === k);
      for (const e of empty) {
        if (Math.round(e.dist * 4) >= Math.round(from.dist * 4)) continue;
        const trial = { ...res.assignment }; delete trial[k]; trial[e.key] = id;
        assert.ok(Core.checkPlan({ seats, assignment: trial, rules, mode: 'adjacent' }).length > 0, `seed ${seed}: ${id} could move forward`);
      }
    }
  }
});

test('Angled board wall: rows are measured straight back from the board, so a whole row ties', () => {
  // board on a 45° wall; two desks side by side in the same row parallel to it
  const r = { scale: 0.5, boundary: [{ x: 0, y: 6 }, { x: 6, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 30 }, { x: 0, y: 30 }], items: [
    { id: 'bd', type: 'board', x: 3, y: 3, lenM: 1.5 }] };
  const geo = Core.wallGeom(r, r.items[0]);
  const along = { x: geo.p2.x - geo.p1.x, y: geo.p2.y - geo.p1.y }, L = Math.hypot(along.x, along.y);
  const pt = (t, d) => ({ x: geo.mid.x + along.x / L * t - geo.n.x * d, y: geo.mid.y + along.y / L * t - geo.n.y * d });
  const sA = pt(0, 4), sB = pt(10, 4); // same row, one far off to the side of the short board
  r.items.push({ id: 'a', type: 'single', x: sA.x - 0.7, y: sA.y - 2.5 }, { id: 'b', type: 'single', x: sB.x - 0.7, y: sB.y - 2.5 });
  const ss = Core.roomSeats(r);
  assert.ok(Math.abs(ss[0].dist - ss[1].dist) < 1e-6, `${ss[0].dist} vs ${ss[1].dist}`);
});

test('Sample room furniture is valid', () => {
  for (const it of room.items) assert.equal(Core.itemProblem(room, it), null, it.id);
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}\n`);
