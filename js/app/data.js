'use strict';
/* =================================================================
   Data menu: export / import / clear sample
================================================================= */
async function dataMenu() {
  const hasSample = data.rooms.some(r => r.sample) || data.classes.some(c => c.sample);
  const v = await modal({
    title: 'Your data',
    body: `<p>Everything is saved in this browser only (${data.classes.length} class${data.classes.length === 1 ? '' : 'es'}, ${data.rooms.length} room layout${data.rooms.length === 1 ? '' : 's'}). Nothing is uploaded. Export a backup file to move it to another computer.</p>`,
    buttons: [
      ...(hasSample ? [{ label: 'Clear sample data', cls: 'danger', value: 'sample' }] : []),
      { label: 'Import…', value: 'import' },
      { label: 'Export backup', cls: 'primary', value: 'export' },
    ],
  });
  if (v === 'export') {
    const blob = new Blob([JSON.stringify({ app: 'classpost', version: 3, exportedAt: new Date().toISOString(), rooms: data.rooms, classes: data.classes }, null, 2)], { type: 'application/json' });
    await download(blob, `classpost-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }
  if (v === 'import') $('#importFile').click();
  if (v === 'sample') {
    mutate(() => {
      data.rooms = data.rooms.filter(r => !r.sample);
      data.classes = data.classes.filter(c => !c.sample);
      if (!data.rooms.length) data.rooms.push(blankRoom());
      if (!data.classes.length) { const c = blankClass(); c.roomId = data.rooms[0].id; data.classes.push(c); }
      fixRefs();
      data.activeRoomId = data.rooms[0].id; data.activeClassId = data.classes[0].id;
      ui.result = null; ui.view = null;
    });
    toast('Sample data cleared (Undo brings it back).');
  }
}
$('#importFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  let inc;
  try { inc = JSON.parse(await f.text()); } catch { return toast("That file isn't valid JSON."); }
  if (!inc || !Array.isArray(inc.rooms) || !Array.isArray(inc.classes)) return toast("That doesn't look like a ClassPost backup.");
  const how = await modal({
    title: 'Import backup',
    body: `<p>The file has ${inc.classes.length} class(es) and ${inc.rooms.length} room layout(s).</p><p><b>Merge</b> adds them to what's here (matching items are updated). <b>Replace</b> discards current data. You can undo either.</p>`,
    buttons: [{ label: 'Cancel' }, { label: 'Replace all', cls: 'danger', value: 'replace' }, { label: 'Merge', cls: 'primary', value: 'merge' }],
  });
  if (!how) return;
  mutate(() => {
    const rooms = inc.rooms.map(normRoom), classes = inc.classes.map(normClass);
    if (how === 'replace') { data.rooms = rooms; data.classes = classes; }
    else {
      for (const r of rooms) { const i = data.rooms.findIndex(x => x.id === r.id); i >= 0 ? data.rooms[i] = r : data.rooms.push(r); }
      for (const c of classes) { const i = data.classes.findIndex(x => x.id === c.id); i >= 0 ? data.classes[i] = c : data.classes.push(c); }
    }
    fixRefs();
    if (classes[0]) data.activeClassId = classes[0].id;
    if (rooms[0]) data.activeRoomId = rooms[0].id;
    ui.view = null; ui.result = null;
  });
  toast('Imported ✓');
});
