'use strict';
/* =================================================================
   5. RANDOM PICKER (cold calling)
================================================================= */
let rolling = false;
const ROW_H = 72;
function pickerPool(cls) {
  const here = presentStudents(cls);
  return cls.picker.noRepeat ? here.filter(s => !cls.picker.picked.includes(s.id)) : here;
}
const reelOffset = idx => `translateY(${$('#reel').clientHeight / 2 - (idx + 0.5) * ROW_H}px)`;
function drawReel(st) {
  const tr = $('#reelTrack');
  tr.style.transition = 'none';
  tr.innerHTML = st.names.map((n, i) => {
    const won = st.won && i === st.idx;
    return `<div class="reel-row ${won ? 'won' : ''}">${avatar(n)}<span class="rr-name">${esc(n)}</span>${won ? '<span class="rr-tag">Your turn</span>' : ''}</div>`;
  }).join('');
  tr.style.transform = reelOffset(st.idx);
}
function renderPickerTab() {
  const cls = activeClass(), p = cls.picker, ic = SubjectIcons.get(classIconId(cls)), th = classTheme(cls);
  $('#pkBadge').innerHTML = `<span class="pk-hex" style="--c:${th.color};color:${th.ink}">${SubjectIcons.svg(ic.id)}</span>`;
  $('#pkNoRepeat').checked = !!p.noRepeat;
  const here = presentStudents(cls).length, left = pickerPool(cls).length;
  const hist = p.picked.map(id => cls.students.find(s => s.id === id)).filter(Boolean);
  $('#pkHist').innerHTML = hist.length
    ? hist.map((s, i) => `<div class="lb-row ${i === hist.length - 1 ? 'me' : ''}"><span class="lb-rank r${i + 1}">${i + 1}</span>${avatar(s.name)}<span class="lb-name">${esc(s.name)}</span></div>`).join('')
    : '<div class="muted small">Nobody yet</div>';
  $('#pkAbsent').innerHTML = attendanceHtml(cls);
  if (rolling) return;
  const last = p.last && cls.students.find(s => s.id === p.last);
  $('#pkLabel').textContent = last ? `${last.name.split(/\s+/)[0]}, you're up!` : "Who's next?";
  $('#pkSub').textContent = !here ? 'Nobody is marked here.' : p.noRepeat ? `${left} of ${here} still to have a turn this round.` : `Picking from all ${here} students here.`;
  if (!ui.reel || ui.reel.classId !== cls.id) {
    const names = presentStudents(cls).map(s => s.name).slice(0, 5);
    ui.reel = last ? { classId: cls.id, names: [last.name], idx: 0, won: true }
      : { classId: cls.id, names: names.length ? names : ['No students yet'], idx: Math.min(2, Math.max(0, names.length - 1)), won: false };
  }
  drawReel(ui.reel);
}
/* The reel scrolls through a run of random names and decelerates onto the winner. */
function pickOne() {
  if (rolling) return;
  const cls = activeClass(), here = presentStudents(cls);
  if (!here.length) return toast('Nobody is marked here to pick from.');
  let pool = pickerPool(cls), newRound = false;
  if (!pool.length) { newRound = true; pool = here; }
  if (pool.length > 1) pool = pool.filter(s => s.id !== cls.picker.last); // never the same person twice running
  const winner = pool[Math.floor(Math.random() * pool.length)];
  const names = here.map(s => s.name), rnd = () => names[Math.floor(Math.random() * names.length)];
  const N = 32, seq = [];
  for (let i = 0; i < N; i++) {
    let n = rnd();
    for (let k = 0; k < 6 && names.length > 2 && (n === seq[i - 1] || (i === N - 1 && n === winner.name)); k++) n = rnd();
    seq.push(n);
  }
  seq.push(winner.name, rnd(), rnd(), rnd());
  let done = false;
  const finish = () => {
    if (done) return;
    done = true; rolling = false;
    $('#reel').classList.remove('spinning');
    ui.reel = { classId: cls.id, names: seq, idx: N, won: true };
    mutate(() => {
      const p = cls.picker;
      if (newRound) p.picked = [];
      p.picked.push(winner.id);
      if (p.picked.length > 300) p.picked.shift();
      p.last = winner.id;
    });
    if (newRound) toast('Everyone has had a turn, so a new round has started.');
  };
  ui.reel = { classId: cls.id, names: seq, idx: 2, won: false };
  drawReel(ui.reel);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
  rolling = true;
  $('#pkLabel').textContent = 'Choosing…';
  $('#reel').classList.add('spinning');
  const tr = $('#reelTrack');
  void tr.offsetHeight; // start the transition from the first frame
  tr.style.transition = 'transform 2.6s cubic-bezier(.12,.75,.12,1)';
  tr.style.transform = reelOffset(N);
  tr.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 2900); // in case the transition never fires (e.g. hidden tab)
}
function bindPicker() {
  $('#pkGo').addEventListener('click', pickOne);
  $('#pkNoRepeat').addEventListener('change', e => mutate(() => { activeClass().picker.noRepeat = e.target.checked; }));
  $('#pkReset').addEventListener('click', () => { ui.reel = null; mutate(() => { const p = activeClass().picker; p.picked = []; p.last = null; }); });
}
