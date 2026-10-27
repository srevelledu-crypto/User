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
3. **Seating Plan**: **Generate** or **Shuffle**. Seats always fill from the
   front row backwards. Drag names to swap seats or to unseat someone. Tap a
   name to lock it to its seat. Use **⟲/⟳ 90°** to turn the plan until it reads
   well, then **Print A4**, **PNG** or **PDF**.

The plan only turns in 90° steps, so tables always stay square to the page. If
the board is on an angled wall, it picks whichever orientation fills the A4
landscape page best. Names default to first name plus surname initial
("Charlotte N."). The ★ front-priority, 🔒 locked, ! broken-rule and ✕
unavailable-seat markers appear on screen while you edit. They never appear on
the printed, PNG or PDF plan.

Shortcuts (Room tab): `R` rotates, `Del` deletes, `Ctrl/⌘+D` duplicates, and
the arrow keys nudge. `Shift` while drawing walls turns off snapping. Undo and
redo (`Ctrl/⌘+Z`, `Ctrl/⌘+Shift+Z`) work everywhere.

## Furniture sizes

Furniture uses real sizes in metres, based on typical Australian secondary
school furniture. Each grid square is 0.5 m by default; change "m per square"
in the Room tab and the furniture keeps its real size. Furniture snaps to
0.25 m.

| Item | Table top | Notes |
|---|---|---|
| Single desk | 0.7 × 0.5 m | 1 student |
| Pair desk | 1.2 × 0.6 m | 2 students, 0.6 m each |
| Table of 4 | 1.2 × 1.2 m | two pair desks pushed together |
| Table of 6 | 1.8 × 1.2 m | three pair desks pushed together |
| Round table (4) | 1.2 m diameter | |
| Custom table | 0.6 m per seat along each side | at least 1.2 × 0.6 m |
| Lab bench, both sides seated | length you set × 1.2 m | island bench; default 2.4 m with 3 a side (0.8 m each for practicals) |
| Lab bench, one side or none | length you set × 0.6 m | wall bench, sink run or fume-cupboard side |
| Teacher's desk | 1.5 × 0.75 m | |
| Board / door / window | 3.6 m / 0.9 m / 2.0 m | lengths are editable |

Each seated side also gets 0.5 m of chair space, which is included in
collision checks. Benches never squeeze students below 0.45 m each. Table
height (e.g. 85 cm lab-height benches with stools) doesn't affect a floor plan.

## How the solver works

- **Seat conflicts.** Two seats conflict if they are at the same table. In
  "adjacent" mode they also conflict if they are within 1.5 m
  at a neighbouring table, measured in real distance.
- **Placement order.** Locked students are placed first. A backtracking search
  with forward checking then seats front-priority students, trying the seats
  closest to the board first. Everyone else is seated "fewest remaining options
  first", in random order.
- **Filling from the front.** "Distance from front" is measured straight
  back from the board's wall, so a whole row parallel to the board counts as
  one row. Only the N front-most seats are used at first, and the search widens
  to seats further back only if the rules need more space. If it doesn't find
  an arrangement within a node limit, it restarts with a new random order.
  After solving, students are moved forward into any empty seat in a nearer
  row whenever no rule would break, so empty seats end up at the back.
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
