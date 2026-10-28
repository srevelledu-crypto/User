<img src="brand/classpost-logo.png" alt="ClassPost" width="220">

# ClassPost

Classroom tools for teachers, organised by class: pick a class, then use its
**seating plan**, **groups** or **random picker**. Everything runs in the
browser from a single `index.html`, with no build step and no server. Serve it
from any static host, or open the file straight from disk.

**Privacy:** class lists, rules, plans and groups are stored only in this
browser's `localStorage`. The only network requests are to Google Fonts (Inter
and Poppins), which carry no student data. Use **☰ Data → Export backup** to
save a JSON file and **Import…** to load it on another computer. Import can
merge with what's already there or replace it.

## How it's organised

- **Your classes** (home): one card per class; click a card to open it, or
  use its **⋮** menu to rename, change the icon, duplicate or delete it. The
  **＋** button (top right) creates a class or imports a backup. The left rail
  lists every class and collapses to icons with the **☰** button.
- **Class icons**: 50 subject icons. Each class gets one automatically from
  its name ("12CHEM", "Year 9 Maths", "Physical Education", "Japanese"…), and
  you can pick a different one, and the class colour, under **Students → Colour & icon** or the card's ⋮ menu.
- **Students & rules**: the class list, front-priority students and the
  **keep apart** / **keep together** rules. Seating plans and groups both use
  these rules.
- **Seating plan**: **Generate** or **Shuffle**. Drag names to swap seats or
  to unseat someone. Tap a name to lock it to its seat. Then **Print A4**,
  **PNG** or **PDF**. **Edit room** opens the class's room layout.
- **Groups**: choose a group size or a number of groups, then
  **Make groups**. Groups come out as even as possible and follow the
  keep-apart/together rules (you can switch this off). Tap a name, then
  another name to swap them, or tap a group to move them there. **Copy** puts
  the groups on the clipboard as text.
- **Random picker** (cold calling): **Pick someone** or press `Space`; a reel
  of names spins and lands on someone. By
  default nobody is picked twice until everyone has had a turn, and the same
  person is never picked twice in a row.
- **Here today**: on Groups and Random picker, tap a name to mark them absent.
  Absent students are left out of new groups and never picked.
- **Rooms** (top bar): room layouts are shared by all classes. Draw the walls
  (rectangle, L-shape or your own polygon), then drag furniture on from the
  palette. Tap a seat to mark it unavailable. Each seat shows its distance
  from the board.

Shortcuts (Rooms): `R` rotates, `Del` deletes, `Ctrl/⌘+D` duplicates, and the
arrow keys nudge. `Shift` while drawing walls turns off snapping. Undo and
redo (`Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`) work everywhere.

Data saved by the earlier Seating Planner, Class Toolkit or Classbeat (same browser, same
site) loads as-is, so existing classes, rooms and plans carry over. Backups
made by either load with **Import…**.

## How the seating solver works

- **Seat conflicts.** Two seats conflict if they are at the same table. In
  "adjacent" mode they also conflict if they are within 3 grid squares
  (≈1.5 m) at a neighbouring table.
- **Placement order.** Locked students are placed first. A backtracking search
  with forward checking then seats front-priority students, trying the seats
  closest to the board first. Everyone else is seated "fewest remaining options
  first", in random order.
- **Filling from the front.** Only the N front-most seats are used at first.
  The search widens to seats further back only if the rules need more space.
  If it doesn't find an arrangement within a node limit, it restarts with a new
  random order.
- **Impossible rule sets.** Pre-checks catch the clear-cut cases, such as
  locked students who break a rule, or a group bigger than the number of
  tables. Otherwise the solver finds the smallest set of rules that can't all
  be satisfied, names those rules, and still shows a best-effort plan with the
  broken rules marked.

## Tests

```
node classpost/tests/solver.test.mjs
```

The tests load the solver code embedded in `index.html` and check:

- a 28-student class with 6 keep-apart rules and 4 front-priority students
  (300 random seeds in each adjacency mode);
- locked seats and keep-together rules;
- empty seats being left at the back;
- several impossible rule sets;
- more students than seats;
- furniture placement inside L-shaped and lab rooms.

## Branding

`brand/` holds the ClassPost logo (`classpost-logo.png`), the favicon and the
home-screen icon. The top-bar mark is drawn as inline SVG in `index.html` so it
stays sharp at small sizes. Colours: navy `#0a1c3f`, blue `#026afa`, and the
chair colours green `#04af4f`, red `#fa3e42`, orange `#fa6002`, yellow
`#fab001` and teal `#01aab5`. Each class gets one of the six seat colours at random when it's
created (no repeats until all six are used) and can be changed under
**Colour & icon**; yellow classes use navy text so they stay readable.
