#!/usr/bin/env node
/* ==========================================================================
   Optional end-to-end playthrough (needs Playwright + Chromium).
   Plays every puzzle through the real UI (typing, clicking, selecting),
   checks a few deliberately wrong answers give specific feedback, opens the
   vault, and saves screenshots.
   Run:  NODE_PATH=$(npm root -g) node tests/e2e.js [screenshotDir] [width] [height]
   ========================================================================== */
'use strict';
var path = require('path'), fs = require('fs');
var chromium = require('playwright').chromium;
var OUT = process.argv[2] || path.join(__dirname, 'screenshots');
var W = +(process.argv[3] || 1366), H = +(process.argv[4] || 768);
fs.mkdirSync(OUT, { recursive: true });
var url = 'file://' + path.resolve(__dirname, '..', 'index.html');
var errors = [];
function assert(c, m) { if (!c) { errors.push(m); console.log('  ✗ ' + m); } }

(async function () {
  var launchOpts = {};
  if (fs.existsSync('/opt/pw-browsers/chromium')) { /* let playwright find it via PLAYWRIGHT_BROWSERS_PATH */ }
  var browser = await chromium.launch(launchOpts);
  var page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', function (e) { errors.push('page error: ' + e.message); console.log('  ✗ page error: ' + e.message); });
  page.on('console', function (m) { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) { errors.push('console: ' + m.text()); } });
  var shot = async function (name) { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, name + '.png') }); };

  await page.goto(url);
  await page.evaluate(function () { localStorage.clear(); });
  await page.reload();
  await shot('00-title');
  await page.fill('#team', 'The Noble Gasses');
  await page.fill('#players', 'Ada, Marie, Rosalind');
  await page.click('button[type=submit]');
  await shot('01-letter');
  await page.click('text=Lift out the contents');
  await shot('02-hub');

  var rooms = await page.evaluate(function () { return window.GAME_CONTENT.rooms.map(function (r) { return { id: r.id, puzzles: r.puzzles.map(function (p) { return p.id; }) }; }); });
  for (var ri = 0; ri < rooms.length; ri++) {
    var room = rooms[ri];
    await page.click('.gamebox:not(.locked) >> nth=' + ri);
    await page.waitForSelector('.room');
    await shot('r' + (ri + 1) + '-0-board');
    for (var pi = 0; pi < room.puzzles.length; pi++) {
      var pid = room.puzzles[pi];
      await page.click('.prop >> nth=' + pi);
      await page.waitForSelector('.inspect');
      if (pi === 0) await shot('r' + (ri + 1) + '-1-front');
      var flip = await page.$('.prop-front .btn');
      if (flip) await flip.click();
      await page.waitForSelector('.part');
      await shot('r' + (ri + 1) + '-p' + (pi + 1) + '-unsolved');
      // deliberate mistakes on some puzzles
      if (pid === 'r3-wiring') await wrongOrbital();
      if (pid === 'r6-crates') await wrongUnits();
      if (pid === 'r5-tickets') await wrongEquation();
      // take a hint on the first puzzle of each room
      if (pi === 0) { await page.click('.log-btn'); }
      await solvePuzzle(pid);
      var solvedNow = await page.evaluate(function (id) { return !!window.Game.state().solved[id]; }, pid);
      assert(solvedNow, pid + ' not solved through the UI');
      if (pi === room.puzzles.length - 1) {
        // last piece: award modal
        await page.waitForSelector('.award', { timeout: 4000 });
        await page.click('text=Turn it over');
        await shot('r' + (ri + 1) + '-9-award');
        await page.click('text=Put it in the tray');
        await page.waitForSelector('.doc');
        await shot('r' + (ri + 1) + '-9-story');
        await page.click('.doc-wrap .btn.primary');
        await page.waitForSelector('.hub');
      } else {
        await shot('r' + (ri + 1) + '-p' + (pi + 1) + '-solved');
        await page.click('.modal-close');
        await page.waitForSelector('.room');
      }
    }
  }
  await shot('80-hub-complete');

  // refresh mid-game keeps progress
  await page.reload();
  var kept = await page.evaluate(function () { return Object.keys(window.Game.state().roomDone).length; });
  assert(kept === 8, 'progress lost on refresh (' + kept + ')');

  // vault
  await page.click('.vaultbox');
  await page.waitForSelector('.vault');
  await shot('90-vault');
  await page.fill('#combo', '12345678');
  await page.click('text=Spin the dial');
  var fb = await page.textContent('.dial .feedback');
  assert(/CLUNK/.test(fb), 'wrong combo not rejected');
  var order = await page.evaluate(function () { return window.GAME_CONTENT.vault.order; });
  // reorder rack with the ◀ buttons
  for (var k = 0; k < order.length; k++) {
    var seq = await page.evaluate(function () { return window.Game.state().vault.seq; });
    var from = seq.indexOf(order[k]);
    for (var m = from; m > k; m--) await page.click('.rack-slot >> nth=' + m + ' >> button >> nth=0');
  }
  var digits = await page.$$eval('.rack-digit', function (els) { return els.map(function (e) { return e.textContent; }).join(''); });
  await page.fill('#combo', digits);
  await shot('91-vault-ordered');
  await page.click('text=Spin the dial');
  await page.waitForSelector('.explain select');
  var ans = await page.evaluate(function () { return window.GAME_CONTENT.vault.explain.answer; });
  await page.selectOption('.explain select', ans);
  await page.click('.explain .btn.check');
  await page.waitForSelector('.paper-modal', { timeout: 6000 });
  await shot('92-ending-letter');
  await page.click('.doc-wrap .btn.primary');
  await page.waitForSelector('.paper-modal');
  await page.click('.doc-wrap .btn.primary');
  await page.waitForSelector('.certificate');
  await shot('93-certificate');

  // Teacher mode
  await page.keyboard.press('t');
  await page.fill('input[type=password]', 'wrong');
  await page.keyboard.press('Enter');
  await page.fill('input[type=password]', await page.evaluate(function () { return window.GAME_CONFIG.teacherPasscode; }));
  await page.keyboard.press('Enter');
  await page.waitForSelector('.teacher');
  await page.check('#t-ans');
  await page.check('#t-cd');
  await shot('95-teacher');
  // Teacher answers visible inside a puzzle
  await page.click('[data-go="2"]');
  await page.click('.prop >> nth=2');
  await page.waitForSelector('.teacher-answers');
  await shot('96-teacher-answers');
  await page.keyboard.press('Escape');

  // Data booklet
  await page.click('#btn-booklet');
  await shot('97-booklet');
  await page.click('text=Electronegativity');
  await shot('98-booklet-en');

  await browser.close();
  console.log(errors.length ? '\nE2E: ' + errors.length + ' problem(s)' : '\nE2E: full playthrough OK — screenshots in ' + OUT);
  process.exit(errors.length ? 1 : 0);

  /* ---------------- solvers ---------------- */
  async function solvePuzzle(pid) {
    var nParts = await page.$$eval('.inspect-main .part', function (e) { return e.length; });
    for (var i = 0; i < nParts; i++) {
      var info = await page.evaluate(function (a) {
        var pz = null; window.GAME_CONTENT.rooms.forEach(function (r) { r.puzzles.forEach(function (p) { if (p.id === a.pid) pz = p; }); });
        return { part: pz.parts[a.i], solved: !!window.Game.state().solvedParts[a.pid + '#' + a.i] };
      }, { pid: pid, i: i });
      if (info.solved) continue;
      var part = info.part, root = '.inspect-main .part >> nth=' + i;
      var el = page.locator('.inspect-main .part').nth(i);
      if (part.type === 'fields') {
        var fields = [];
        if (part.rows) part.rows.forEach(function (r) { r.cells.forEach(function (c) { if (c) fields.push(c); }); });
        else fields = part.fields;
        var ctrls = el.locator('.finput input, .finput select');
        for (var f = 0; f < fields.length; f++) {
          var c = ctrls.nth(f), fd = fields[f];
          if (await c.isDisabled()) continue;
          if (fd.kind === 'select') await c.selectOption(fd.answer);
          else await c.fill(fd.kind === 'equation' ? fd.answer.replace(/\(([a-z]+)\/[a-z/]+\)/g, '($1)') : String(fd.answer));
        }
      } else if (part.type === 'slots') {
        for (var s = 0; s < part.slots.length; s++) {
          var sl = part.slots[s], ans = [].concat(sl.answer);
          for (var a = 0; a < (part.layout === 'bins' ? ans.length : 1); a++) {
            await el.locator('.pool [data-tile="' + ans[a] + '"]').click();
            await el.locator('[data-slot="' + sl.id + '"]').click();
          }
        }
      } else if (part.type === 'order') {
        for (var k = 0; k < part.answer.length; k++) {
          var ids = await el.locator('.order-item').evaluateAll(function (els) { return els.map(function (e) { return e.dataset.id; }); });
          for (var m = ids.indexOf(part.answer[k]); m > k; m--) await el.locator('.order-item').nth(m).locator('.up').click();
        }
      } else if (part.type === 'spot') {
        for (var l = 0; l < part.lines.length; l++) if (part.lines[l].error) await el.locator('.spot-line').nth(l).click();
      } else if (part.type === 'orbital') {
        var socks = el.locator('.sock'), idx = 0;
        for (var dg of part.diagrams) for (var sub of dg.subshells) {
          var n = dg.expect[sub.name];
          for (var b = 0; b < sub.boxes; b++) {
            var up = b < n, down = b + sub.boxes < n;
            var s0 = socks.nth(idx), s1 = socks.nth(idx + 1);
            var t0 = await s0.textContent(), t1 = await s1.textContent();
            while ((await s0.textContent()) !== (up ? '↑' : '')) await s0.click();
            while ((await s1.textContent()) !== (down ? '↓' : '')) await s1.click();
            idx += 2;
          }
        }
      } else if (part.type === 'grid') {
        for (var r = 0; r < part.answer.length; r++) await el.locator('table.logic tr').nth(r + 1).locator('.cell').nth(part.answer[r]).click();
      } else if (part.type === 'balance') {
        for (var e = 0; e < part.equations.length; e++) {
          var sp = await page.evaluate(function (eq) { var p = window.ChemCore.parseEquation(eq); return p.lhs.concat(p.rhs).map(function (s) { return [s.coef, s.states[0]]; }); }, part.equations[e].answer);
          var mould = el.locator('.mould').nth(e);
          for (var q = 0; q < sp.length; q++) {
            if (sp[q][0] > 1) await mould.locator('.coef').nth(q).fill(String(sp[q][0]));
            await mould.locator('.state').nth(q).selectOption(sp[q][1]);
          }
        }
      }
      await el.locator('.btn.check').click();
      await page.waitForTimeout(80);
      var good = await el.locator('.feedback').getAttribute('class').catch(function () { return ''; });
      if (!/good/.test(good || '')) {
        var msg = await el.locator('.feedback').textContent().catch(function () { return '?'; });
        assert(false, pid + ' part ' + (i + 1) + ' rejected correct answer: ' + msg);
      }
    }
  }
  async function wrongOrbital() {
    // Nitrogen with a paired 2p box → Hund
    var socks = page.locator('.inspect-main .sock');
    await socks.nth(0).click(); await socks.nth(1).click(); await socks.nth(1).click(); // 1s ↑↓
    await socks.nth(2).click(); await socks.nth(3).click(); await socks.nth(3).click(); // 2s ↑↓
    await socks.nth(4).click(); await socks.nth(5).click(); await socks.nth(5).click(); // 2p box1 ↑↓
    await socks.nth(6).click(); // box2 ↑
    await page.click('.inspect-main .btn.check');
    var t = await page.textContent('.inspect-main .feedback');
    assert(/Hund/.test(t), 'Hund feedback missing: ' + t);
    // Pauli: make box1 ↑↑
    await socks.nth(5).click(); await socks.nth(5).click(); // ↓ → empty → ↑
    await page.click('.inspect-main .btn.check');
    t = await page.textContent('.inspect-main .feedback');
    assert(/Pauli/.test(t), 'Pauli feedback missing: ' + t);
    // reset those sockets to empty
    for (var i = 0; i < 8; i++) { while ((await socks.nth(i).textContent()) !== '') await socks.nth(i).click(); }
  }
  async function wrongUnits() {
    var inp = page.locator('.inspect-main .finput input').nth(2);
    await inp.fill('100');
    await page.click('.inspect-main .btn.check');
    var t = await page.textContent('.inspect-main .feedback');
    assert(/mL to L/.test(t), 'mL→L feedback missing: ' + t);
    await inp.fill('');
  }
  async function wrongEquation() {
    var inp = page.locator('.inspect-main .finput input').nth(0);
    await inp.fill('Mg + HCl -> MgCl2 + H2');
    await page.click('.inspect-main .btn.check');
    var t = await page.textContent('.inspect-main .feedback');
    assert(/Cl atoms|balanced/.test(t), 'unbalanced-equation feedback missing: ' + t);
    await inp.fill('Mg + 2HCl -> MgCl2 + H2');
    await page.click('.inspect-main .btn.check');
    t = await page.textContent('.inspect-main .feedback');
    assert(/state/.test(t), 'missing-state feedback missing: ' + t);
    await inp.fill('');
  }
})().catch(function (e) { console.error(e); process.exit(2); });
