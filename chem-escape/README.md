# The Thistlewood Game Works
### A narrative chemistry escape game for Year 10 (QCAA) — 2–4 players per laptop, ~50–65 minutes

A box arrives from Bert Nakamura-Reid, the retired caretaker of a beloved family board-game factory in Corella Creek, Queensland. Inside are eight prototype games made by the founder, chemist Augusta “Gussie” Thistlewood, before she shut the factory overnight in 1989. The chemistry puzzles are hidden inside each game’s pieces. Every finished game gives the team a little element meeple with a digit stamped underneath. The meeples open Gussie’s vault, and the vault explains why the factory really closed.

| # | Room / prototype game | Year 10 Chemistry topic | Meeple |
|---|---|---|---|
| 1 | The Sorting Line — *Sift & Sort!* | Separating mixtures, chromatography (Rf) | Cl |
| 2 | The Print Shop — *Typesetter’s Tangle* | Atomic structure, isotopes, ions, Bohr model | Na |
| 3 | The Wiring Room — *Circuit Breakers* | Electron configurations, orbital diagrams, Cr/Cu | F |
| 4 | The Dye & Paint Room — *Colour Me Curious* | Elements, compounds & mixtures, formulas, Ar, Mr, % composition, % yield, flame tests | Mg |
| 5 | The Moulding Floor — *Melt Down!* | Evidence of reactions, balancing, states, predicting products, reaction types | K |
| 6 | Quality Control & Shipping — *Special Delivery* | The mole, n = m/M, n = cV, Nₐ, limiting reagent | Si |
| 7 | The Design Studio — *Shape Shifters* | Bonding & properties, Lewis structures, shapes, polarity, intermolecular forces | Al |
| 8 | The Archive — *Trend Setters* | Periodic trends and their explanations | P |
| 9 | The Vault | Order the meeples by atomic radius → combination | — |

---

## Running it

1. Copy the whole `chem-escape` folder onto each laptop (USB, network drive or a zip from your LMS).
2. Double-click **`index.html`**. It runs in any modern browser (Chrome, Edge, Firefox, Safari). There's no install, no server and no internet needed.
   - The retro fonts come from Google Fonts. If a laptop is offline, the game falls back to built-in fonts and still works.
3. Each team types a team name and lifts the lid.

**Saving:** progress (solved puzzles, working, hints, time) is saved in the browser’s local storage after every action. A team can refresh or close the tab and pick up where they left off. If storage is blocked, the game still plays; it just won't remember progress.

**Between classes:** click **Reset game** in the top bar (it asks for confirmation), or use Reset in Teacher Mode.

**Screens:** designed for a 1366 × 768 school laptop and scales up for a projector. Everything works with a mouse, or keyboard alone:
- **Tab** moves between items, and **Enter** or **Space** activates the focused item.
- To drag-and-drop with the keyboard, select a card, then select where it goes.
- To reorder lists, use the ▲ ▼ buttons.

## How a room plays

- **Objects first:** each room is a tabletop of game pieces (a tuck box of cards, a spinner, a rule booklet, a receipt…). Picking one up shows its front; turning it over reveals the puzzle.
- **Any order:** puzzles inside a room can be done in any order. Rooms unlock in sequence.
- **Specific feedback:** wrong answers get targeted messages, for example “Hund’s rule broken in 2p…”, “Out by a factor of 1000 — did you convert mL to L?” or “Not balanced yet: count the O atoms — 4 on the left, 6 on the right.”
- **Hints:** each puzzle has three hints in Bert’s maintenance log: a nudge, then a method reminder, then a worked step (never the full answer). Hints are counted and appear on the final certificate.
- **Data Booklet:** the 📘 button opens it at any time. It has the periodic table (with an electronegativity view), common ions, solubility rules, and formulas & constants (Nₐ = 6.02 × 10²³).
- **Clock:** a discreet elapsed-time clock sits in the top bar. An optional 45-minute countdown can be switched on in Teacher Mode.
- **Ending:** opening the vault shows the story ending and a printable certificate with the team name, time, hints, and time per room.

## Teacher Mode

Press **T** at any time (when you're not typing in a box), then enter the passcode.

- **Default passcode:** `pemberton10`
- **To change it:** edit `js/config.js` (`teacherPasscode`). You can also change the countdown length and the save slot name there.

Teacher Mode shows the team, elapsed time, total hints, and a per-room table of puzzles solved, hints used, wrong attempts and completion time. From there you can:
- **Go** to any room (this unlocks every room up to it).
- **Solve room**: fills in the answers and awards that room’s meeple, useful if a team runs out of time.
- **Show answers** inside every puzzle.
- Inside an open puzzle, **mark just that puzzle solved**.
- **Turn the countdown clock on or off.**
- **Reset the game.**
- **Lock Teacher Mode** again before handing the laptop back.

## Editing the questions (`js/content.js`)

All story text, puzzles, answers, feedback and hints live in **`js/content.js`**. The game logic never needs touching. After any edit, run the checker (see *Testing* below).

Each room has an `award` (meeple symbol and digit) and 3–5 `puzzles`. Each puzzle looks like this:

```js
{ id: 'r6-rush', budget: 1.5,                       // minutes, used for the time budget
  prop: { kind: 'envelope', name: 'Rush order', sub: 'telegram', front: '…what the object looks like…', flip: 'Read the telegram' },
  title: 'The rush order', intro: 'Instructions shown above the puzzle',
  parts: [ /* one or more parts; all must be solved */ ],
  hints: ['nudge', 'method reminder', 'worked step'] }
```

`prop.kind` controls the drawing on the table. It can be:
- `tuckbox`
- `board`
- `spinner`
- `drawer`
- `card`
- `booklet`
- `receipt`
- `panel`
- `jar`
- `catalogue`
- `ledger`
- `envelope`
- `blueprint`

**Part types**

| type | What students do | Key fields |
|---|---|---|
| `fields` | type answers / choose from drop-downs | `fields: [...]` or a table with `columns` + `rows: [{label, cells:[...]}]`; `layout: 'cards'` stacks long rows; optional `fig` |
| `slots` | drag cards onto labelled spaces (`layout: 'list'` or `'diagram'`) or into bins (`layout: 'bins'`) | `tiles: [{id,label}]`, `slots: [{id,label,answer}]` (bins: `answer` is a list); `wrong: {tileId: 'message'}` |
| `order` | put items in order | `items`, `answer` (ids in order), `topLabel`, `bottomLabel`, `rules: [{a, b, msg}]` (“a must come before b”) |
| `spot` | flag the faulty lines | `count`, `lines: [{text, error, fix}]` |
| `orbital` | arrow-in-box diagrams (checks Aufbau, Pauli, Hund) | `diagrams: [{label, subshells:[{name, boxes}], expect:{'2p':3}}]` |
| `grid` | logic grid (one ✓ per row) | `rows`, `cols`, `answer: [colIndex per row]` |
| `balance` | coefficient dials + state drop-downs | `equations: [{id, answer: '4Al(s) + 3O2(g) -> 2Al2O3(s)'}]` (use `(l/g)` to accept either state) |

**Field helpers** (used inside `fields` parts):

```js
num('Mass of CaCO₃ produced =', 20.0, 'g', { tol: 0.02, traps: [{ value: 23.6, msg: 'Use the LIMITING reagent' }] })
sel('Limiting reagent', 'CaCl₂', ['Na₂CO₃', 'Neither'], { why: { 'Na₂CO₃': 'Compare moles, not grams' } })
fx('aluminium oxide', 'Al2O3')                     // formula: subscripts, spaces and ₂ are all accepted
cfg('iron (full)', '1s2 2s2 2p6 3s2 3p6 4s2 3d6')  // also accepts 1s²…, 1s^2…, no spaces, 3d before 4s
cfg('calcium (condensed)', '[Ar] 4s2', { condensed: true })
eqn('magnesium + hydrochloric acid → …', 'Mg(s) + 2HCl(aq) -> MgCl2(aq) + H2(g)')
```

- **Numbers:** `tol` is relative (0.02 = ±2 %, the default); `tolAbs` is an absolute tolerance. Numbers accept `1.5e23`, `1.5 x 10^23` and `1.5 × 10²³`.
- **Automatic feedback:** the checker spots answers out by ×1000 (mL→L), ×100 (% vs decimal), a whole-number ratio, or Nₐ.
- **`traps`:** give a message for a specific wrong value.
- **`why`:** gives a message for a specific wrong drop-down choice.
- **Drop-down order:** options are shuffled on screen, so you can always write the answer first.
- **`verify`:** optional. It tells the test script how to recompute the answer (e.g. `{ fn: 'n_m', m: 4.50, f: 'H2O' }`). Leave it out for your own questions if you like, but then the checker can’t double-check the arithmetic.

**Story:**
- Story documents are in `story` (`intro`, `afterRoom[0..7]`, `vaultNote`, `ending`).
- Keep each one to 150 words or fewer; the checker enforces this.
- Styles: `handwritten`, `newspaper`, `card`, `memo`, `notebook`, `typed`, `log`.

**Vault:**
- `vault.order` must list the eight award symbols from largest to smallest atomic radius. The checker verifies this.
- The combination is the award digits read in that order.

**Reference data:** the periodic table (Ar to 1 d.p., electronegativities) is in `js/core.js` (`ELEMENTS`). The ion chart and solubility table are in `js/figures.js`.

## Testing

```bash
node tests/check.js        # recomputes every numerical answer, checks every configuration,
                           # formula (charge balance), equation (atom balance + states),
                           # typing variants, hints, story word counts, vault order, time budget
node tests/answer-key.js   # regenerates ANSWER_KEY.md and the answer key below
NODE_PATH=$(npm root -g) node tests/e2e.js   # optional: full playthrough in Chromium via Playwright, with screenshots
```

## Time budget

Each puzzle has a `budget` (minutes) and a `// BUDGET` comment in `content.js`. `tests/check.js` prints the totals.

| Item | Minutes |
|---|---|
| Room 1 | 6.0 |
| Room 2 | 5.5 |
| Room 3 | 7.0 |
| Room 4 | 8.5 |
| Room 5 | 8.0 |
| Room 6 | 8.0 |
| Room 7 | 9.0 |
| Room 8 | 5.5 |
| Vault | ~3 |
| Reading (9 short documents) | ~3 |
| **Total** | **≈ 64** |

These are estimates for a competent team that discusses each answer. A strong team will finish in about 45–50 minutes, and a team that leans on hints will take longer. If time is tight, use Teacher Mode’s **Solve room** to move a team on.

## Chemistry conventions and simplifications

- **d and f subshells are not assessed.** Configurations, orbital diagrams and the Bohr questions use s and p only. The single exception is the two famous cases where 3d is unavoidable: 4s fills before 3d, and the Cr/Cu exceptions.
- Pitched at **Year 10**: no senior (Units 1–4) labels or content beyond your checklist. Examples stick to simple molecules (CH₄, NH₃, H₂O, CO₂, HCl, BF₃) and plain periodic trends.

- **Constants and rounding:** molar masses to 1 d.p.; Nₐ = 6.02 × 10²³; electronegativity (Pauling) to 1 d.p.
- **Bond type thresholds:** ΔEN < 0.5 is non-polar covalent; 0.5–1.7 is polar covalent; > 1.7 is ionic.
- **Line spectra are simplified** to their strongest few lines (given in nm on screen). This keeps the puzzle readable, and colourblind-accessible because every line is labelled with its wavelength.
- **States:** water from a combustion accepts (l) or (g). Molten iron from a blast furnace accepts (s) or (l).

---

## Answer key (one page)

<!-- ANSWER-KEY:START -->
#### 1. The Sorting Line (Sift & Sort!) — meeple Cl, digit 3
- **Rule cards:** Salt Pan card: get dry salt…: Evaporation (crystallisation) / The solid is dissolved and doesn’t evaporate: heat drives off…; Creek Bucket card: remove sand…: Filtration / The solid is insoluble: its particles are trapped by filter…; Cordial Line card: separate…: Distillation / The liquids have different boiling points: one boils first, is…; Felt-tip card: find out which…: Paper chromatography / The dyes differ in attraction to the paper and solubility in…
- **Game board: The Still:** A = Heat source (Bunsen burner on…; B = Round-bottom flask with mixture…; C = Thermometer, bulb level with the…; D = Liebig condenser; E = Cooling water IN; F = Cooling water OUT; G = Conical flask collecting the… ‖ 78 °C
- **Ink spinner:** 0.55; 0.3; 0.75; Teal + Mustard; Pen ink would dissolve in the solvent and run up the paper…

#### 2. The Print Shop (Typesetter’s Tangle) — meeple Na, digit 7
- **Type tray:** Slip 1: carbon-14: 14 / 6 / C; Slip 2: chlorine-37: 37 / 17 / Cl; Slip 3: copper-65: 65 / 29 / Cu; Slip 4: an atom with 20 protons…: 44 / 20 / Ca
- **Proof sheet:** 39K: 19 / 20 / 19; 35Cl−: 17 / 18 / 18; 27Al3+: 13 / 14 / 10; 56Fe2+: 26 / 30 / 24
- **Rubber stamps:** Proton: +1 / 1 / in the nucleus; Neutron: 0 / 1 / in the nucleus; Electron: −1 / 1/1836 (almost 0) / in energy levels around the nucleus; Isotopes of the same element…: neutrons; An ion forms when an atom gains…: electrons
- **Rule booklet:** wrong lines: 3 (It only works well for hydrogen (one electron).), 4 (Energy levels are split into subshells, such as…), 6 (Electrons occupy orbitals — regions where they…), 8 (n = 1 has only the 1s subshell.) ‖ 8 electrons; 2s and 2p

#### 3. The Wiring Room (Circuit Breakers) — meeple F, digit 8
- **Fuse box:** 1s → 2s → 2p → 3s → 3p → 4s → 3d ‖ 4s is slightly lower in energy than 3d
- **Junction boxes:** 1s² 2s² 2p⁶ 3s² 3p⁴; [Ar] 4s²; [Ne] 3s² 3p³; 1s² 2s² 2p⁶; 1s² 2s² 2p⁶ 3s² 3p⁶
- **Wiring panel:** Nitrogen 1s² 2s² 2p³; Oxygen 1s² 2s² 2p⁴; Silicon 3s² 3p² (singles ↑ first, then pair ↓)
- **Faulty-circuit tags:** wrong lines: 2 ([Ne] 3s²), 3 ([Ar] 3d⁵ 4s¹), 7 ([Ar] 3d¹⁰ 4s¹) ‖ [Ar] 3d⁵ 4s¹; [Ar] 3d¹⁰ 4s¹; A half-full or completely full d subshell is extra stable, so…

#### 4. The Dye & Paint Room (Colour Me Curious) — meeple Mg, digit 1
- **Particle cards:** Element = Card 1 (identical single atoms), Card 2 (identical diatomic…, Card 7 (lattice of identical +…; Compound = Card 3 (identical molecules of…, Card 6 (lattice of alternating +…; Mixture = Card 4 (single atoms + diatomic…, Card 5 (compound molecules +… ‖ Atom = the smallest particle of an…; Molecule = two or more non-metal atoms…; Ion = an atom or group of atoms with…; Element = a pure substance made of only…; Compound = a pure substance of two or more…; Mixture = two or more substances… ‖ Metallic bonding: a lattice of positive ions in a sea of…
- **Paint pots:** Al₂O₃; Ca(NO₃)₂; (NH₄)₂SO₄; Fe(OH)₃; NCl₃; magnesium + chlorine
- **Pigment invoice:** 35.5 ‖ 24.3 ‖ 159.6; 69.9 %; 82.5 %
- **Product catalogue:** potassium chloride; copper(II) chloride; calcium chloride; lithium chloride and sodium chloride; Heated electrons jump to higher energy levels, then fall back…

#### 5. The Moulding Floor (Melt Down!) — meeple K, digit 4
- **Gauge cards:** Evidence of a chemical reaction = Magnesium ribbon dropped into…, Magnesium burns with a dazzling…, A snapped glow-stick gives out…, Baking soda + vinegar fizzes and…, Two clear solutions are mixed…; Physical change only = Ice melts in your hand, taking…, Water boils and bubbles at 100 °C, Sugar stirred into tea disappears
- **The mould press:** 4Al(s) + 3O₂(g) → 2Al₂O₃(s); C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l/g); Fe₂O₃(s) + 3CO(g) → 2Fe(s/l) + 3CO₂(g)
- **Order tickets:** Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g); 2K(s) + 2H₂O(l) → 2KOH(aq) + H₂(g); CaCO₃(s) + 2HNO₃(aq) → Ca(NO₃)₂(aq) + H₂O(l) + CO₂(g)
- **Prediction cards:** 2LiOH(aq) + H₂(g); ZnSO₄(aq) + H₂(g); 2NaCl(aq) + H₂O(l) + CO₂(g); CuSO₄(aq) + H₂O(l); MgCl₂(aq) + 2H₂O(l); PbI₂(s) + 2KNO₃(aq); No precipitate — both possible new products are soluble
- **Sorting bins:** Synthesis = Fe(s) + S(s) → FeS(s); Decomposition = 2H₂O₂(aq) → 2H₂O(l) + O₂(g), CaCO₃(s) → CaO(s) + CO₂(g); Combustion = CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l); Single displacement = Zn(s) + CuSO₄(aq) → ZnSO₄(aq) +…, Cl₂(aq) + 2KBr(aq) → 2KCl(aq) +…; Double displacement (precipitation) = AgNO₃(aq) + NaCl(aq) → AgCl(s) +…; Neutralisation = HCl(aq) + NaOH(aq) → NaCl(aq) +…

#### 6. Quality Control & Shipping (Special Delivery) — meeple Si, digit 2
- **Crate labels:** 0.25 mol; 7.51 g; 0.1 mol; 1.51 × 10²³ molecules
- **Production orders:** 0.2 mol; 0.236 mol; CaCl₂; 20 g ‖ HCl; 0.1 g
- **Rush order:** 52.9 g; 200 mL
- **Stamped receipt:** wrong lines: 3 (Ratio is 2 : 2 = 1 : 1, so n(MgO) = 0.200 mol), 5 (m = n × M) ‖ 8.06 g

#### 7. The Design Studio (Shape Shifters) — meeple Al, digit 9
- **Materials test sheet:** W = Metallic lattice; X = Ionic lattice; Y = Covalent molecular; Z = Covalent network ‖ its ions are held in place in the solid lattice but are free…; layers of positive ions can slide over each other while the…; only weak intermolecular forces between its molecules need to…
- **Sketchbook:** NH₃: 8 / 3 / 1; H₂O: 8 / 2 / 2; CO₂: 16 / 4 / 4; CH₄: 8 / 4 / 0; HCl: 8 / 1 / 3 ‖ Sketch A
- **Shape cards:** Card A = bent (V-shaped); Card B = tetrahedral; Card C = linear; Card D = trigonal pyramidal; Card E = trigonal planar ‖ CH₄: 4 / tetrahedral; NH₃: 4 / trigonal pyramidal; H₂O: 4 / bent (V-shaped); CO₂: 2 / linear; BF₃: 3 / trigonal planar
- **Polarity compass:** Non-polar covalent (ΔEN < 0.5) = C–H, Cl–Cl; Polar covalent (ΔEN 0.5–1.7) = O–H, N–H, C=O; Ionic (ΔEN > 1.7) = Na–Cl, Mg–O ‖ Polar molecule = H₂O (bent), NH₃ (trigonal pyramidal), CHCl₃ (tetrahedral); Non-polar molecule = CO₂ (linear), CH₄ (tetrahedral), CCl₄ (tetrahedral) ‖ it is linear and symmetrical, so the two bond dipoles point in…
- **Melting-race board:** F₂ → HCl → H₂O → NaCl ‖ F₂: dispersion forces; HCl: dipole–dipole attractions; H₂O: hydrogen bonding; NaCl: ionic bonding ‖ water molecules are polar, so their δ− and δ+ ends attract the…; water molecules attract each other strongly by hydrogen…

#### 8. The Archive (Trend Setters) — meeple P, digit 6
- **Filing drawer:** Atomic radius ACROSS period 3…: decreases / R1; Atomic radius DOWN group 1 (Li →…: increases / R2; Electronegativity ACROSS period…: increases / R1; Electronegativity DOWN group 17…: decreases / R2; 1st ionisation energy ACROSS a…: increases / R1; 1st ionisation energy DOWN a group: decreases / R2; Na⁺ compared with a Na atom: smaller / R3; Cl⁻ compared with a Cl atom: larger / R4
- **Trend Setters deck:** K → Na → Mg → S → Cl → Ar ‖ K → Na → Mg → C → N → F ‖ Its bonding electrons are close to the nucleus (only 2…
- **Rosie’s homework:** wrong lines: 2 (Iodine has more protons; fluorine’s bonding…), 4 (Mg²⁺ is smaller: it has lost its whole outer…), 5 (Atoms get SMALLER across a period; more protons…)

#### Vault
- Order by atomic radius, largest first: K → Na → Mg → Al → Si → P → Cl → F → combination **47192638**. Explanation: K has electrons in four shells, with its outer electron well shielded from the nucleus;…
<!-- ANSWER-KEY:END -->
