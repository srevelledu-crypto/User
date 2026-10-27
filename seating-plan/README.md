# Seating Planner

A classroom seating plan generator that runs entirely in the browser. Open
`index.html` straight from disk (double-click it); there is no build step and no server.

**Privacy:** class lists, rules and plans are stored only in this browser's
`localStorage`. The only network requests are to Google Fonts (Inter and
Poppins), which carry no student data. Use **☰ Data → Export backup** to save
a JSON file and **Import…** to load it on another computer. Import can merge
with what's already there or replace it.

## Using it

1. **Room**: draw the walls (rectangle, polygon, or the rectangle, L-shape and
   lab + prep-room presets), then drag furniture on from the palette. Tap a seat
   to mark it unavailable. Each seat shows its distance from the board.
2. **Students & Rules**: paste names (one per line; `Surname, First` and
   tab-separated columns are handled). Mark front-priority students. To build
   rules, tap name chips and choose **Keep apart** or **Keep together**.
3. **Seating Plan**: **Generate** or **Shuffle**. Drag names to swap seats or
   to unseat someone. Tap a name to lock it to its seat. Then **Print A4**,
   **PNG** or **PDF**.

Shortcuts (Room tab): `R` rotates, `Del` deletes, `Ctrl/⌘+D` duplicates, and
the arrow keys nudge. `Shift` while drawing walls turns off snapping. Undo and
redo (`Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`) work everywhere.

## How the solver works

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
node seating-plan/tests/solver.test.mjs
```

The tests load the solver code embedded in `index.html` and check:

- a 28-student class with 6 keep-apart rules and 4 front-priority students
  (300 random seeds in each adjacency mode);
- locked seats and keep-together rules;
- empty seats being left at the back;
- several impossible rule sets;
- more students than seats;
- furniture placement inside L-shaped and lab rooms.
