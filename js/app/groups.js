'use strict';
/* =================================================================
   4. GROUPS
================================================================= */
function groupCount(cls, n) {
  const g = cls.groups;
  if (!n) return 1;
  return clamp(g.mode === 'size' ? Math.ceil(n / Math.max(1, g.size)) : g.count, 1, n);
}
function groupSizesText(n, k) {
  if (!n) return 'Nobody here yet';
  const lo = Math.floor(n / k), hi = Math.ceil(n / k);
  return `${k} group${k === 1 ? '' : 's'} of ${lo === hi ? lo : `${lo}–${hi}`}`;
}
/* Balanced random groups. Keep-together rules are merged into units first; units are then placed,
   largest first, into the emptiest group with the fewest keep-apart clashes. Many random restarts,
   keeping the best (fewest broken rules, then most even sizes). */
function makeGroups(cls) {
  const ids = presentStudents(cls).map(s => s.id);
  const n = ids.length, k = groupCount(cls, n), cap = Math.ceil(n / k);
  const here = new Set(ids);
  const rules = cls.groups.rules ? cls.rules.map(r => ({ ...r, members: r.members.filter(m => here.has(m)) })).filter(r => r.members.length >= 2) : [];
  const parent = new Map(ids.map(id => [id, id]));
  const find = x => { while (parent.get(x) !== x) x = parent.get(x); return x; };
  for (const r of rules) if (r.type === 'together') for (const m of r.members.slice(1)) parent.set(find(m), find(r.members[0]));
  const unitMap = new Map();
  for (const id of ids) { const root = find(id); if (!unitMap.has(root)) unitMap.set(root, []); unitMap.get(root).push(id); }
  const units = [...unitMap.values()];
  const apart = new Set();
  for (const r of rules) if (r.type === 'apart') for (const a of r.members) for (const b of r.members) if (a !== b) apart.add(a + '|' + b);
  const clash = (unit, grp) => unit.reduce((t, a) => t + grp.filter(b => apart.has(a + '|' + b)).length, 0);
  let best = null;
  for (let t = 0; t < 400; t++) {
    const order = Core.shuffle(units.slice(), Math.random).sort((a, b) => b.length - a.length);
    const groups = Array.from({ length: k }, () => []);
    let viol = 0, over = 0;
    for (const u of order) {
      const o = groups.map((grp, i) => ({ i, c: clash(u, grp), fits: grp.length + u.length <= cap, len: grp.length, r: Math.random() }))
        .sort((a, b) => (b.fits - a.fits) || (a.c - b.c) || (a.len - b.len) || (a.r - b.r))[0];
      groups[o.i].push(...u); viol += o.c; if (!o.fits) over++;
    }
    const lens = groups.map(x => x.length), score = viol * 1000 + over * 100 + Math.max(...lens) - Math.min(...lens);
    if (!best || score < best.score) best = { groups, score };
    if (score <= 1) break;
  }
  return best ? best.groups.map(grp => Core.shuffle(grp, Math.random)) : [];
}
function groupProblems(cls) {
  const gi = new Map();
  cls.groups.list.forEach((grp, i) => grp.forEach(id => { if (!isAbsent(cls, id)) gi.set(id, i); }));
  const out = [];
  for (const r of cls.rules) {
    const m = r.members.filter(id => gi.has(id));
    if (r.type === 'apart') {
      for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) if (gi.get(m[i]) === gi.get(m[j])) out.push({ type: 'apart', students: [m[i], m[j]] });
    } else if (new Set(m.map(id => gi.get(id))).size > 1) out.push({ type: 'together', students: m });
  }
  return out;
}
function renderGroupsTab() {
  const cls = activeClass(), g = cls.groups;
  const ids = new Set(cls.students.map(s => s.id));
  g.list = g.list.map(grp => grp.filter(id => ids.has(id)));
  const n = presentStudents(cls).length;
  $$('#grpModeSeg button').forEach(b => b.classList.toggle('on', b.dataset.gm === g.mode));
  if (document.activeElement !== $('#grpN')) $('#grpN').value = g.mode === 'size' ? g.size : g.count;
  $('#grpPreview').textContent = groupSizesText(n, groupCount(cls, n));
  $('#grpRules').checked = !!g.rules;
  $('#grpAbsent').innerHTML = attendanceHtml(cls);
  const probs = g.rules && g.list.length ? groupProblems(cls) : [];
  const badIds = new Set(probs.flatMap(p => p.students));
  const nm = id => esc(shortName(cls, id));
  let msg = '';
  if (!g.list.length) msg = '<div class="msg ok">Choose a group size, then press <b>Make groups</b>.</div>';
  else if (probs.length) msg = `<div class="msg warn"><b>⚠ ${probs.length} rule${probs.length > 1 ? 's' : ''} broken</b><ul>${probs.slice(0, 6).map(p => p.type === 'apart'
    ? `<li>${nm(p.students[0])} ✕ ${nm(p.students[1])} are in the same group</li>` : `<li>${p.students.map(nm).join(' + ')} are in different groups</li>`).join('')}</ul></div>`;
  else if (g.rules && cls.rules.length) msg = `<div class="msg ok"><b>✓ All ${cls.rules.length} rule${cls.rules.length === 1 ? '' : 's'} followed.</b></div>`;
  $('#grpMsgs').innerHTML = msg;

  const inGroup = new Set(g.list.flat());
  const loose = presentStudents(cls).filter(s => !inGroup.has(s.id)).map(s => s.id);
  const chip = id => { const st = cls.students.find(s => s.id === id); return `<button class="gname ${ui.grpSel === id ? 'sel' : ''} ${badIds.has(id) ? 'bad' : ''} ${isAbsent(cls, id) ? 'absent' : ''}" data-gs="${id}">${avatar(st.name)}<span>${esc(displayName(cls, st))}</span></button>`; };
  const card = (title, gi, list, col) => `<div class="gcard" data-gi="${gi}">
    <div class="gcard-head">${col ? `<span class="gnum" style="background:${col}">${gi + 1}</span>` : ''}<b class="grow">${title}</b><span class="muted small">${list.filter(id => !isAbsent(cls, id)).length}</span></div>
    <div class="gnames">${list.map(chip).join('') || '<span class="muted small">Empty</span>'}</div></div>`;
  const pal = PALETTES[cls.palette] || PALETTES.pastel;
  $('#groupGrid').innerHTML = g.list.length
    ? g.list.map((grp, i) => card(`Group ${i + 1}`, i, grp, pal.tables[i % pal.tables.length])).join('') + (loose.length ? card('Not in a group', -1, loose) : '')
    : `<div class="empty">${n ? `${groupSizesText(n, groupCount(cls, n))} will be made from the ${n} students here.` : 'Add students on the Students tab first.'}</div>`;
  $('#grpHint').hidden = !g.list.length;
}
function regroup(a, b, toGi) {
  mutate(() => {
    const L = activeClass().groups.list;
    const where = id => L.findIndex(grp => grp.includes(id));
    const ga = where(a);
    ui.grpSel = null;
    if (b !== null) {
      const gb = where(b);
      if (ga >= 0) L[ga][L[ga].indexOf(a)] = '__swap__';
      if (gb >= 0) L[gb][L[gb].indexOf(b)] = a;
      if (ga >= 0) L[ga][L[ga].indexOf('__swap__')] = b;
    } else if (ga !== toGi) {
      if (ga >= 0) L[ga].splice(L[ga].indexOf(a), 1);
      if (toGi >= 0) L[toGi].push(a);
    }
  });
}
function bindGroups() {
  $('#grpModeSeg').addEventListener('click', e => { const b = e.target.closest('[data-gm]'); if (b) mutate(() => { activeClass().groups.mode = b.dataset.gm; }); });
  const setN = v => mutate(() => { const g = activeClass().groups; g[g.mode === 'size' ? 'size' : 'count'] = clamp(Math.round(v) || 1, 1, 60); });
  $('#grpN').addEventListener('change', e => setN(+e.target.value));
  $('#grpMinus').addEventListener('click', () => setN(+$('#grpN').value - 1));
  $('#grpPlus').addEventListener('click', () => setN(+$('#grpN').value + 1));
  $('#grpRules').addEventListener('change', e => mutate(() => { activeClass().groups.rules = e.target.checked; }));
  $('#grpGen').addEventListener('click', () => {
    const cls = activeClass();
    if (!presentStudents(cls).length) return toast('Add some students first.');
    mutate(() => { cls.groups.list = makeGroups(cls); ui.grpSel = null; });
  });
  $('#grpCopy').addEventListener('click', async () => {
    const cls = activeClass(), L = cls.groups.list;
    if (!L.length) return toast('Make groups first.');
    const name = id => (cls.students.find(s => s.id === id) || {}).name;
    const txt = L.map((grp, i) => `Group ${i + 1}: ${grp.filter(id => !isAbsent(cls, id)).map(name).join(', ')}`).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Groups copied ✓'); } catch { toast("Couldn't copy in this browser."); }
  });
  $('#groupGrid').addEventListener('click', e => {
    const chip = e.target.closest('[data-gs]'), card = e.target.closest('[data-gi]');
    if (chip) {
      const id = chip.dataset.gs;
      if (!ui.grpSel || ui.grpSel === id) { ui.grpSel = ui.grpSel === id ? null : id; renderGroupsTab(); }
      else regroup(ui.grpSel, id, null);
      return;
    }
    if (card && ui.grpSel) regroup(ui.grpSel, null, +card.dataset.gi);
  });
}
