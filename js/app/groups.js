'use strict';
/* =================================================================
   4. GROUPS
   The grouping logic itself lives in js/tools.js (unit tested); this file is the UI around it:
   making groups, swapping students, history of recent groupings and named saved sets.
================================================================= */
const HISTORY_MAX = 12;
const groupCount = (cls, n) => Tools.groupCount(n, cls.groups);
const groupSizesText = Tools.groupSizesText;
const liveList = (cls, list) => list.map(grp => grp.filter(id => !isAbsent(cls, id)));

function makeGroups(cls) {
  const ids = presentStudents(cls).map(s => s.id), g = cls.groups;
  return Tools.makeGroups({
    ids, rules: cls.rules, k: groupCount(cls, ids.length), useRules: g.rules,
    history: g.history.map(h => h.list), avoidRepeats: g.avoidRepeats,
  });
}
const groupProblems = cls => Tools.groupProblems(liveList(cls, cls.groups.list), cls.rules);

/* Put the groups currently in use into the history (newest first) before replacing them. */
function retireCurrentGroups(g) {
  if (!g.list.some(grp => grp.length)) return;
  g.history.unshift({ at: g.at || Date.now(), list: g.list.map(grp => grp.slice()) });
  g.history = g.history.slice(0, HISTORY_MAX);
}
function setGroups(g, list) { retireCurrentGroups(g); g.list = list.map(grp => grp.slice()); g.at = Date.now(); }

const whenText = at => {
  const d = new Date(at), today = new Date();
  const day = d.toDateString() === today.toDateString() ? 'Today' : d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`;
};
function setRow(cls, entry, kind, i) {
  const ids = new Set(cls.students.map(s => s.id));
  const list = entry.list.map(grp => grp.filter(id => ids.has(id))).filter(grp => grp.length);
  const people = list.reduce((n, grp) => n + grp.length, 0);
  const title = kind === 'saved' ? esc(entry.name) : whenText(entry.at);
  const meta = `${list.length} group${list.length === 1 ? '' : 's'} · ${people} student${people === 1 ? '' : 's'}${kind === 'saved' ? ' · ' + whenText(entry.at) : ''}`;
  return `<div class="set-row"><div class="grow"><b>${title}</b><div class="hint">${meta}</div></div>
    <button class="btn sm" data-load="${kind}:${i}">Use</button>
    ${kind === 'saved' ? `<button class="btn sm ghost icon" data-del-set="${i}" title="Delete “${esc(entry.name)}”" aria-label="Delete ${esc(entry.name)}">✕</button>` : ''}</div>`;
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
  $('#grpAvoid').checked = !!g.avoidRepeats;
  $('#grpAbsent').innerHTML = attendanceHtml(cls);
  const probs = g.rules && g.list.length ? groupProblems(cls) : [];
  const badIds = new Set(probs.flatMap(p => p.students));
  const nm = id => esc(shortName(cls, id));
  const repeats = g.list.length && g.history.length ? Tools.repeatPairs(liveList(cls, g.list), g.history.map(h => h.list)) : 0;
  let msg = '';
  if (!g.list.length) msg = '<div class="msg ok">Choose a group size, then press <b>Make groups</b>.</div>';
  else if (probs.length) msg = `<div class="msg warn"><b>⚠ ${probs.length} rule${probs.length > 1 ? 's' : ''} broken</b><ul>${probs.slice(0, 6).map(p => p.type === 'apart'
    ? `<li>${nm(p.students[0])} ✕ ${nm(p.students[1])} are in the same group</li>` : `<li>${p.students.map(nm).join(' + ')} are in different groups</li>`).join('')}</ul></div>`;
  else if (g.rules && cls.rules.length) msg = `<div class="msg ok"><b>✓ All ${cls.rules.length} rule${cls.rules.length === 1 ? '' : 's'} followed.</b>${g.history.length ? ` ${repeats ? `${repeats} pair${repeats === 1 ? ' is' : 's are'} together again from last time.` : 'Nobody is with the same partner as last time.'}` : ''}</div>`;
  $('#grpMsgs').innerHTML = msg;
  $('#grpSaved').innerHTML = g.saved.length ? g.saved.map((e, i) => setRow(cls, e, 'saved', i)).join('') : '<div class="hint">No saved sets yet. Make groups you like, then save them with a name such as “Prac groups”.</div>';
  $('#grpHistory').innerHTML = g.history.length ? g.history.map((e, i) => setRow(cls, e, 'history', i)).join('') : '<div class="hint">Nothing yet.</div>';

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
  $('#grpAvoid').addEventListener('change', e => mutate(() => { activeClass().groups.avoidRepeats = e.target.checked; }));
  $('#grpGen').addEventListener('click', () => {
    const cls = activeClass();
    if (!presentStudents(cls).length) return toast('Add some students first.');
    mutate(() => {
      const g = cls.groups;
      retireCurrentGroups(g); // first, so the groups being replaced count as the most recent history
      g.list = makeGroups(cls).groups; g.at = Date.now();
      ui.grpSel = null;
    });
  });
  $('#grpCopy').addEventListener('click', async () => {
    const cls = activeClass(), L = cls.groups.list;
    if (!L.length) return toast('Make groups first.');
    const name = id => (cls.students.find(s => s.id === id) || {}).name;
    const txt = L.map((grp, i) => `Group ${i + 1}: ${grp.filter(id => !isAbsent(cls, id)).map(name).join(', ')}`).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Groups copied ✓'); } catch { toast("Couldn't copy in this browser."); }
  });
  $('#grpSave').addEventListener('click', async () => {
    const cls = activeClass(), g = cls.groups;
    if (!g.list.some(grp => grp.length)) return toast('Make some groups first.');
    const name = await askText('Save these groups as', '', 'e.g. Prac groups');
    if (!name) return;
    const i = g.saved.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
    mutate(() => {
      const entry = { id: uid('set'), name, at: Date.now(), list: g.list.map(grp => grp.slice()) };
      if (i >= 0) g.saved[i] = entry; else g.saved.unshift(entry);
    });
    toast(i >= 0 ? `Updated “${name}” ✓` : `Saved “${name}” ✓`);
  });
  $('#view-groups').addEventListener('click', async e => {
    const load = e.target.closest('[data-load]'), del = e.target.closest('[data-del-set]');
    const cls = activeClass(), g = cls.groups;
    if (load) {
      const [kind, i] = load.dataset.load.split(':');
      const entry = (kind === 'saved' ? g.saved : g.history)[+i];
      if (!entry) return;
      mutate(() => {
        if (kind === 'history') g.history.splice(+i, 1); // it becomes the current groups again
        setGroups(g, entry.list);
        ui.grpSel = null;
      });
      toast(kind === 'saved' ? `Using “${entry.name}”` : 'Using those groups again');
    }
    if (del) {
      const entry = g.saved[+del.dataset.delSet];
      if (entry && await confirmBox(`Delete “${entry.name}”?`, 'You can undo this.')) mutate(() => { g.saved.splice(+del.dataset.delSet, 1); });
    }
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
