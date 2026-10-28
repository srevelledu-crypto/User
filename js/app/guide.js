'use strict';
/* =================================================================
   9. GETTING-STARTED GUIDE
   A three-step checklist on the Classes page: create a class, add students, choose a room. Each
   step's button takes you to the right place and points at what to use. Steps tick themselves off
   as they're done; the guide can be hidden and shown again.
================================================================= */
ui.guide = Object.assign({ hidden: false, room: false }, ui.guide);

function guideSteps() {
  const mine = data.classes.filter(c => !c.sample);
  const withStudents = mine.find(c => c.students.length);
  const target = () => withStudents || mine[mine.length - 1] || activeClass();
  return [
    { done: mine.length > 0, title: 'Create your class', text: 'Give it a name and a colour. You can copy students and rules from a class you already have.', action: 'Create a class', go: () => newClass() },
    { done: !!withStudents, title: 'Add your students', text: 'Paste names, or import the CSV class list from your school system.', action: 'Add students',
      go: () => { openClass(target().id, 'students'); spotlight('#csvBtn', 'Import a CSV class list here, or paste names into the box above and press Add to class.'); } },
    { done: !!ui.guide.room, title: 'Choose a room', text: 'Pick the room this class is taught in for seating plans, or draw your own under Rooms.', action: 'Choose a room',
      go: () => { openClass(target().id, 'students'); spotlight('#classRoom', 'Pick the room for this class. To draw a new one, open Rooms in the side menu.'); } },
  ];
}
function renderGuide() {
  const el = $('#guide');
  $('#guideShow').hidden = !ui.guide.hidden;
  if (ui.guide.hidden) { el.innerHTML = ''; return; }
  const steps = guideSteps(), done = steps.filter(s => s.done).length, next = steps.findIndex(s => !s.done);
  el.innerHTML = `<section class="guide-card" aria-label="Getting started">
    <div class="guide-head"><b class="grow">Get started with ClassPost</b><span class="hint">${done} of ${steps.length} done</span><button class="btn sm ghost" data-guide-hide>Hide</button></div>
    <div class="guide-bar"><i style="width:${(100 * done) / steps.length}%"></i></div>
    <ol class="guide-steps">${steps.map((s, i) => `<li class="${s.done ? 'done' : ''} ${i === next ? 'next' : ''}">
      <span class="gs-num">${s.done ? '✓' : i + 1}</span><div class="grow"><b>${s.title}</b><div class="hint">${s.text}</div></div>
      ${s.done ? '' : `<button class="btn sm ${i === next ? 'primary' : ''}" data-guide-step="${i}">${s.action}</button>`}</li>`).join('')}</ol>
    ${next < 0 ? '<div class="msg ok guide-done"><span class="grow"><b>You’re all set ✓</b> Try the seating plan, groups or the picker from your class’s tabs.</span><button class="btn sm" data-guide-hide>Close guide</button></div>' : ''}
  </section>`;
}

/* Point at an element with a pulsing outline and a short tip. */
let spotEl = null, spotTip = null, spotTimer = null;
function clearSpot() {
  if (spotEl) spotEl.classList.remove('spot');
  if (spotTip) spotTip.remove();
  clearTimeout(spotTimer);
  spotEl = spotTip = null;
}
function spotlight(sel, text) {
  clearSpot();
  setTimeout(() => {
    const el = $(sel);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.classList.add('spot');
    spotEl = el;
    spotTip = document.createElement('div');
    spotTip.className = 'spot-tip';
    spotTip.setAttribute('role', 'status');
    spotTip.innerHTML = `<span>${esc(text)}</span><button class="btn sm">Got it</button>`;
    document.body.appendChild(spotTip);
    const place = () => {
      if (!spotTip) return;
      const r = el.getBoundingClientRect(), tw = spotTip.offsetWidth;
      spotTip.style.top = Math.min(innerHeight - spotTip.offsetHeight - 8, r.bottom + 12) + 'px';
      spotTip.style.left = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8) + 'px';
    };
    place(); setTimeout(place, 350);
    spotTip.querySelector('button').addEventListener('click', clearSpot);
    spotTimer = setTimeout(clearSpot, 15000);
  }, 80);
}

function bindGuide() {
  $('#guide').addEventListener('click', e => {
    if (e.target.closest('[data-guide-hide]')) { ui.guide.hidden = true; saveUI(); renderGuide(); return; }
    const b = e.target.closest('[data-guide-step]');
    if (b) guideSteps()[+b.dataset.guideStep].go();
  });
  $('#guideShow').addEventListener('click', () => { ui.guide.hidden = false; saveUI(); renderGuide(); });
  // choosing a room for a class (or opening Rooms once you have a class) completes step 3
  const roomDone = () => { if (!ui.guide.room && data.classes.some(c => !c.sample)) { ui.guide.room = true; saveUI(); clearSpot(); } };
  $('#classRoom').addEventListener('change', roomDone);
  $('#rail').addEventListener('click', e => { if (e.target.closest('[data-nav="room"]')) roomDone(); });
  document.addEventListener('pointerdown', e => { if (spotEl && !spotTip.contains(e.target) && !spotEl.contains(e.target)) clearSpot(); });
}
