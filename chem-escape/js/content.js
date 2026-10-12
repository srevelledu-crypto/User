/* ==========================================================================
   THE THISTLEWOOD GAME WORKS — content file
   --------------------------------------------------------------------------
   Everything students read, every answer and every hint lives in this file.
   You can edit it without touching the game logic. See README.md, which
   explains each puzzle "part" type and its fields.

   Handy helpers (defined just below):
     num(label, answer, units, extra)            → a number box (±2 % by default)
     sel(label, answer, [wrong options], extra)  → a drop-down. Options are
                                                    shuffled on screen, so you can
                                                    always write the answer first.
     fx(label, answer, extra)                    → a chemical formula box
     cfg(label, answer, extra)                   → an electron-configuration box
     eqn(label, answer, extra)                   → a full equation with states

   TIME BUDGET (competent team of 3, minutes — see "BUDGET" comment on each puzzle):
     Room 1  6.0  | Room 2  5.5  | Room 3  7.0  | Room 4  8.5
     Room 5  8.0  | Room 6  8.0  | Room 7  9.0  | Room 8  5.5
     Puzzles 57.5 + vault ~3 + reading 9 short documents ~3  ≈ 64 min
     (A strong team will finish in ~45–50 min; tests/check.js prints the totals.)
   ========================================================================== */
(function (root) {
  'use strict';

  function num(label, answer, units, extra) { return Object.assign({ kind: 'number', label: label, answer: answer, units: units || '' }, extra || {}); }
  function sel(label, answer, wrong, extra) { return Object.assign({ kind: 'select', label: label, answer: answer, options: [answer].concat(wrong) }, extra || {}); }
  function fx(label, answer, extra) { return Object.assign({ kind: 'formula', label: label, answer: answer }, extra || {}); }
  function cfg(label, answer, extra) { return Object.assign({ kind: 'config', label: label, answer: answer }, extra || {}); }
  function eqn(label, answer, extra) { return Object.assign({ kind: 'equation', label: label, answer: answer }, extra || {}); }
  function exact(label, answer, extra) { return num(label, answer, '', Object.assign({ tol: 0, tolAbs: 0 }, extra || {})); }

  var CONTENT = {
    title: 'The Thistlewood Game Works',
    subtitle: 'A chemistry escape game in eight prototypes',

    /* ======================================================================
       STORY  (each document ≤ 150 words)
       style: 'handwritten' | 'newspaper' | 'card' | 'memo' | 'notebook' | 'typed' | 'log'
       ====================================================================== */
    story: {
      intro: {
        style: 'handwritten', heading: 'A letter, folded into the lid',
        from: 'Bert Nakamura-Reid',
        body: [
          'Dear Friends of the Chemistry Class,',
          'You won’t know me. I was caretaker at the Thistlewood Game Works in Corella Creek for thirty-seven years, until the night it shut in March 1989.',
          'That night Mrs Augusta Thistlewood — Gussie — pressed this box into my hands. “Eight prototypes, Bert,” she said. “Whoever plays them properly will open the vault. Make sure they know their chemistry.” Then she locked the gates.',
          'I’ve kept the box under my bed ever since. My knees are too old for puzzles and my chemistry is older still. So it’s yours now.',
          'If you get stuck, my maintenance log is in here too. I wrote down every fix I ever made. Some might help.',
          'Go gently with the pieces. They meant the world to her.',
          'Yours faithfully,'
        ],
        sign: 'Bert Nakamura-Reid (retired)'
      },
      afterRoom: [
        { style: 'newspaper', masthead: 'The Corella Creek Courier', date: 'Friday 9 May 1952', heading: 'LOCAL CHEMIST TURNS PLAYFUL',
          body: ['Mrs Augusta Thistlewood, until recently an industrial chemist at a Brisbane dye works, has opened a board-game factory in the old butter factory on Railway Street.',
            '“Every family deserves a game night,” she told the Courier, “and every game deserves good ink.”',
            'Mrs Thistlewood mixes her own inks and dyes and moulds her own playing pieces. Her first game, Sift & Sort!, is on sale now at Hendry’s Haberdashery for seven shillings and sixpence.',
            'She employs six local women and a young caretaker, Mr Bert Nakamura-Reid, who “can fix anything except his own tie”.'] },
        { style: 'card', heading: 'A birthday card, crayon on cardboard', date: 'June 1987',
          body: ['Dear Gran, HAPPY BIRTHDAY!!!',
            'I am 7¾ now. When I grow up I want to make games like you AND be a chemist. Dad says chemists don’t make money. You said “Neither do games, darling, but they make people happy.” So I will do both.',
            'Love from Rosie',
            'P.S. I put the blue meeple back. Sorry.'],
          note: 'Pinned to it, in fountain pen: “Keep this one safe, Bert. — G.”' },
        { style: 'memo', heading: 'MEMO — From the desk of W. Thistlewood', date: '14 September 1988',
          body: ['Mum —',
            'I’ve been through the books three times. Sales are down for the fourth year running. Kids want computer games now, and our Christmas orders have halved.',
            'We owe the bank more than the building is worth. The presses need replacing and Bert says the boiler is “held together with hope and fencing wire”.',
            'I know you don’t want to hear it. Goliath Amalgamated Toys have asked to meet. They’re big, and they’re interested in us. Please, just hear them out.',
            '— Wal'] },
        { style: 'notebook', heading: 'Gussie’s lab notebook, p. 211', date: 'Oct 1988',
          body: ['Teal No. 7 — better. Mustard still too green; less chrome, more patience.',
            'Rosie says the brick red “looks like a sunburnt tomato”. She is right.',
            'Note to self: Doreen has worked the dye vats for thirty-one years. Joan’s daughter runs the press now. Mr Okoro’s boy sweeps on Saturdays. Bert knows which floorboard squeaks.',
            'A factory isn’t the building. It’s the people who know where the squeaky floorboard is.',
            'Must remember that on Thursday.'] },
        { style: 'typed', heading: 'GOLIATH AMALGAMATED TOYS PTY LTD', date: '23 January 1989',
          body: ['Dear Mrs Thistlewood,',
            'Further to our meeting, Goliath is pleased to offer to acquire the Thistlewood brand, catalogue and trademarks.',
            'Following acquisition, manufacturing will be rationalised to our overseas facilities and the Corella Creek site will be vacated and sold. We anticipate redundancy for all 41 current staff.',
            'Settlement is proposed for 14 March 1989, on the condition that the factory is operating at the time of sale.',
            'We are confident the Thistlewood name will live on.',
            'K. Bramwell, Acquisitions'],
          note: 'Scrawled across the bottom in green ink: “Live on.” Hmph.' },
        { style: 'memo', heading: 'Note left on the kitchen table', date: 'Friday 10 March 1989',
          body: ['Mum, I’m sorry. I’ve agreed to the sale. The bank won’t wait any longer. I know what it means for everyone and I hate it, but if we don’t sell we lose the house as well.',
            'I’ll come by Monday to box up the moulds. Please don’t do anything stubborn.',
            '— Wal'],
          note: 'Underneath, in Gussie’s hand: “Stubborn? Me?” and then: “Condition: operating. Co-op papers need one signature… and a safe place.”' },
        { style: 'log', heading: 'Maintenance log — B. Nakamura-Reid', date: 'Mon 13 March 1989, 11.40 pm',
          body: ['Mrs T came down to the boiler room in her good coat. Asked me to shut the boiler down “for good”.',
            'Asked me to help carry a crate into the old vault. Wouldn’t say what was in it.',
            'Then she gave me the box, with a little meeple tucked into each game. “They can’t buy a factory that isn’t operating, Bert, and they can’t buy what’s locked away.”',
            'She was smiling. First time in months.',
            'Gates locked 12.15 am. Boiler cold. Floorboard still squeaks.'] },
        { style: 'newspaper', masthead: 'The Corella Creek Courier', date: 'Thursday 16 March 1989', heading: 'GAME WORKS SHUTS — SALE COLLAPSES',
          body: ['The Thistlewood Game Works closed suddenly on Tuesday, the day of its planned sale to Goliath Amalgamated Toys.',
            'A Goliath spokesman said the company was “no longer interested in a closed factory” and has withdrawn its offer.',
            'Mrs Thistlewood, 74, declined to comment, except to say that “everything is exactly where it ought to be.”',
            'The factory gates remain locked. Locals report Mr Nakamura-Reid was seen polishing them anyway.'] }
      ],
      vaultNote: {
        style: 'handwritten', heading: 'Taped to the vault door', from: 'Gussie',
        body: ['The combination is in the meeples — one digit stamped under each.', 'Line them up and read them left to right.', 'The biggest always go first.', '(Atoms, darling. Not the people.)'],
        sign: '— G.'
      },
      ending: [
        { style: 'typed', heading: 'Inside the vault: a crate, a deed, and an envelope', from: 'Augusta Thistlewood',
          body: ['To whoever opened this — thank you.',
            'Under this letter is a deed. It hands the Thistlewood Game Works to the Thistlewood Workers’ Co-operative — every person who ever worked here — from the day this vault is opened. By my arithmetic, that is today.',
            'The rest of the crate is my last game, Elementary, My Dear Rosie. It is for my granddaughter. Tell her the blue meeple is hers to keep.',
            'A factory is its people. Look after each other.',
            'Play nicely,'],
          sign: 'Augusta “Gussie” Thistlewood' },
        { style: 'handwritten', heading: 'And a postscript', from: 'Bert',
          body: ['P.S. from Bert — I rang Rosie. She’s 46 now, and a chemist (and yes, she makes games on weekends).',
            'She cried a bit, then laughed a lot, then said she’ll have the presses running by Christmas. Doreen’s grand-daughter has already asked for a job.',
            'Rosie asked if I’d come back as caretaker. I said only if somebody finally fixes that squeaky floorboard.',
            'She said absolutely not. It’s heritage now.'],
          sign: 'Bert' }
      ]
    },

    /* Bert's maintenance-log entries for the vault */
    vault: {
      // Order by atomic radius, largest → smallest. (Checked in tests/check.js against radius data.)
      order: ['K', 'Na', 'Mg', 'Al', 'Si', 'P', 'Cl', 'F'],
      explain: sel('Before the wheel will turn, Gussie’s dial asks: why is potassium the biggest meeple and fluorine the smallest?',
        'K has electrons in four shells, with its outer electron well shielded from the nucleus; F has only two shells and the greatest nuclear charge in its period, so its electrons are pulled in tightly',
        ['K has the most neutrons, which push the electrons outwards',
          'F is the heaviest atom, so gravity pulls its electrons inwards',
          'K has the most protons, and more protons always make an atom bigger']),
      hints: [
        'Bert’s log, 1971: “Mrs T always lined up the shop window biggest-first. Said it was ‘only physics, Bert — well, chemistry.’” Which property of an atom is its size?',
        'Atomic radius gets BIGGER going DOWN a group (more shells) and SMALLER going ACROSS a period (more protons, same shell). Put the period 4 atom first, then period 3 from left to right, then period 2.',
        'Biggest first: K (period 4) → Na → Mg → Al → Si → P → Cl (period 3, left to right) → F (period 2, smallest). Now read the digit under each meeple in that order.'
      ]
    },

    /* ======================================================================
       ROOMS
       Each puzzle: { id, budget (min), prop: {kind, name, sub, front, flip}, title, intro, parts: [...], hints: [nudge, method, worked step] }
       Part types: 'fields' | 'slots' | 'order' | 'spot' | 'orbital' | 'grid' | 'balance'
       ====================================================================== */
    rooms: [
      /* -------------------------------------------------------------- ROOM 1 */
      {
        id: 'r1', number: 1, name: 'The Sorting Line', game: 'Sift & Sort!', year: 1952,
        tagline: 'The conveyor-belt race game! Every mixture has its method.',
        topic: 'Year 10 Chemistry — Separating mixtures', theme: 'conveyor',
        award: { symbol: 'Cl', name: 'chlorine', digit: 3, color: '#2f7f7a' },
        puzzles: [
          { // BUDGET 1.5 min — matching technique + justification (conceptual)
            id: 'r1-rules', budget: 1.5,
            prop: { kind: 'tuckbox', name: 'Rule cards', sub: 'Sift & Sort! · 4 cards', front: 'A tuck box of slightly sticky rule cards. Each card shows a mixture rolling down the conveyor. Someone has pencilled “method?” and “why?” on the backs.', flip: 'Slide the cards out and turn them over' },
            title: 'Every mixture has its method',
            intro: 'To move your pawn down the Sorting Line you must name the right separation method for each mixture card — AND give the reason. (Choose the reason from Gussie’s reason cards.)',
            parts: [{
              type: 'fields', layout: 'cards', columns: ['Method', 'Because…'],
              rows: [
                { label: 'Salt Pan card: get dry salt crystals from sea water (we don’t need the water)', cells: [
                  sel('Method', 'Evaporation (crystallisation)', ['Filtration', 'Distillation', 'Paper chromatography'], { why: { 'Filtration': 'Dissolved salt passes straight through filter paper.', 'Distillation': 'Distillation would work, but it’s for collecting the liquid. We only want the salt.' } }),
                  sel('Because', 'The solid is dissolved and doesn’t evaporate: heat drives off the solvent and leaves the solid', ['The solid is insoluble: its particles are trapped by filter paper while the liquid passes through', 'The liquids have different boiling points: one boils first, is condensed and collected', 'The dyes differ in attraction to the paper and solubility in the solvent, so they travel different distances', 'The particles have different densities, so the heavier ones sink'])] },
                { label: 'Creek Bucket card: remove sand from muddy creek water', cells: [
                  sel('Method', 'Filtration', ['Evaporation (crystallisation)', 'Distillation', 'Paper chromatography'], { why: { 'Evaporation (crystallisation)': 'Evaporation would leave the sand AND anything dissolved behind, and loses the water.' } }),
                  sel('Because', 'The solid is insoluble: its particles are trapped by filter paper while the liquid passes through', ['The solid is dissolved and doesn’t evaporate: heat drives off the solvent and leaves the solid', 'The liquids have different boiling points: one boils first, is condensed and collected', 'The dyes differ in attraction to the paper and solubility in the solvent, so they travel different distances', 'The particles have different densities, so the heavier ones sink'])] },
                { label: 'Cordial Line card: separate ethanol (b.p. 78 °C) from water (b.p. 100 °C)', cells: [
                  sel('Method', 'Distillation', ['Filtration', 'Evaporation (crystallisation)', 'Paper chromatography'], { why: { 'Filtration': 'Both are liquids that mix completely — nothing to catch in a filter.', 'Evaporation (crystallisation)': 'Evaporation would just lose both liquids into the air.' } }),
                  sel('Because', 'The liquids have different boiling points: one boils first, is condensed and collected', ['The solid is insoluble: its particles are trapped by filter paper while the liquid passes through', 'The solid is dissolved and doesn’t evaporate: heat drives off the solvent and leaves the solid', 'The dyes differ in attraction to the paper and solubility in the solvent, so they travel different distances', 'The particles have different densities, so the heavier ones sink'])] },
                { label: 'Felt-tip card: find out which dyes are in Rosie’s brown felt-tip pen', cells: [
                  sel('Method', 'Paper chromatography', ['Filtration', 'Evaporation (crystallisation)', 'Distillation']),
                  sel('Because', 'The dyes differ in attraction to the paper and solubility in the solvent, so they travel different distances', ['The solid is insoluble: its particles are trapped by filter paper while the liquid passes through', 'The solid is dissolved and doesn’t evaporate: heat drives off the solvent and leaves the solid', 'The liquids have different boiling points: one boils first, is condensed and collected', 'The particles have different densities, so the heavier ones sink'])] }
              ]
            }],
            hints: [
              'Bert’s log, 1953: “Mrs T says the trick is to ask: what do I want to KEEP, and what is it mixed with — undissolved solid, dissolved solid, another liquid, or other dyes?”',
              'Insoluble solid + liquid → filtration. Dissolved solid, keep the solid → evaporation. Two liquids with different boiling points → distillation. Several dyes → chromatography. The reason card should describe the property that is different.',
              'Worked step: sea water = salt DISSOLVED in water, and we only want the salt. Salt is non-volatile, so heat it: the water evaporates and salt crystals are left → Evaporation, “solute is a dissolved, non-volatile solid…”.'
            ]
          },
          { // BUDGET 2 min — diagram building (drag parts into place) + conceptual
            id: 'r1-still', budget: 2,
            prop: { kind: 'board', name: 'Game board: The Still', sub: 'Assembly square 7', front: 'A folded board square showing a half-drawn piece of glassware, with seven empty dotted outlines labelled A–G. A bag of cardboard parts is taped to the back.', flip: 'Unfold the board and tip out the parts' },
            title: 'Assemble the still',
            intro: 'Board square 7 says: “Build the distillation apparatus to separate the Cordial Line mixture (ethanol and water). Place each part on its outline.” Drag a part onto a letter, or click a part and then click a letter. Two of the parts are decoys.',
            parts: [
              {
                type: 'slots', layout: 'diagram', fig: { name: 'still' },
                tiles: [
                  { id: 'heat', label: 'Heat source (Bunsen burner on tripod & gauze)' },
                  { id: 'flask', label: 'Round-bottom flask with mixture + boiling chips' },
                  { id: 'thermo', label: 'Thermometer, bulb level with the side arm' },
                  { id: 'thermoBad', label: 'Thermometer, bulb dipping into the boiling liquid' },
                  { id: 'cond', label: 'Liebig condenser' },
                  { id: 'win', label: 'Cooling water IN' },
                  { id: 'wout', label: 'Cooling water OUT' },
                  { id: 'recv', label: 'Conical flask collecting the distillate' },
                  { id: 'funnel', label: 'Filter funnel and filter paper' }
                ],
                slots: [
                  { id: 'A', label: 'A', x: 16, y: 84, answer: 'heat' },
                  { id: 'B', label: 'B', x: 16, y: 58, answer: 'flask' },
                  { id: 'C', label: 'C', x: 24, y: 9, answer: 'thermo', wrong: { thermoBad: 'We want the temperature of the VAPOUR that is about to be condensed, so the bulb goes level with the side arm, not in the liquid.' } },
                  { id: 'D', label: 'D', x: 54, y: 34, answer: 'cond' },
                  { id: 'E', label: 'E', x: 74, y: 61, answer: 'win', wrong: { wout: 'Cooling water goes IN at the lower end so the condenser jacket stays completely full of cold water.' } },
                  { id: 'F', label: 'F', x: 40, y: 12, answer: 'wout', wrong: { win: 'Cooling water goes IN at the lower end so the condenser jacket stays completely full of cold water.' } },
                  { id: 'G', label: 'G', x: 85, y: 84, answer: 'recv' }
                ]
              },
              {
                type: 'fields', fields: [
                  sel('While pure ethanol is dripping into the collecting flask, the thermometer should read about…', '78 °C', ['100 °C', '0 °C', '89 °C (halfway between)'], { why: { '100 °C': 'That’s the boiling point of water. Water stays in the flask until the ethanol has gone.', '89 °C (halfway between)': 'The vapour coming over is (mostly) ethanol, so its temperature is ethanol’s boiling point.' } })
                ]
              }
            ],
            hints: [
              'Bert’s log, 1954: “Fixed the still again. Mrs T says if the water goes in the top it just runs out the bottom and the condenser is only half cold. Funny old thing, plumbing.”',
              'Heat at the bottom, then the flask, then the still head with the thermometer at the side arm. The condenser slopes DOWN to the collecting flask. Cooling water enters at the LOW end and leaves at the HIGH end.',
              'Worked step: A = heat source, B = round-bottom flask, G = conical flask at the end of the condenser. The thermometer’s bulb sits level with the side arm (C), so it reads the vapour’s temperature. Now place D, E and F.'
            ]
          },
          { // BUDGET 2.5 min — calculation (Rf) + matching + conceptual
            id: 'r1-chroma', budget: 2.5,
            prop: { kind: 'spinner', name: 'Ink spinner', sub: 'with ruler', front: 'A cardboard spinner. Its arrow is a strip of paper covered in coloured dots, with a little wooden ruler clipped beside it. Label: “QC test — which inks are in the Factory Floor ink?”', flip: 'Unclip the paper strip and hold it against the ruler' },
            title: 'The ink spinner',
            intro: 'Gussie ran a chromatogram of three factory inks and the mystery “Factory Floor” ink. The ruler’s zero is on the baseline. Measure carefully, to the nearest millimetre.',
            parts: [{
              type: 'fields', fig: { name: 'chromatogram', front: 8.0, lanes: [
                { label: 'Mustard', spots: [6.0], color: '#d9a53b' },
                { label: 'Teal', spots: [2.4], color: '#2f7f7a' },
                { label: 'Brick', spots: [4.4], color: '#b5482f' },
                { label: 'Mystery', spots: [2.4, 6.0], color: '#6b6158' }
              ] },
              fields: [
                num('R<sub>f</sub> of the Brick ink spot', 0.55, '', { tolAbs: 0.03, verify: { fn: 'rf', d: 4.4, front: 8.0 }, traps: [{ value: 8.0 / 4.4, msg: 'Upside down! Rf = distance moved by the SPOT ÷ distance moved by the SOLVENT, so it is always less than 1.' }] }),
                num('R<sub>f</sub> of the Mystery ink’s LOWER spot', 0.30, '', { tolAbs: 0.03, verify: { fn: 'rf', d: 2.4, front: 8.0 }, traps: [{ value: 8.0 / 2.4, msg: 'Upside down! Rf = distance moved by the SPOT ÷ distance moved by the SOLVENT.' }] }),
                num('R<sub>f</sub> of the Mystery ink’s UPPER spot', 0.75, '', { tolAbs: 0.03, verify: { fn: 'rf', d: 6.0, front: 8.0 }, traps: [{ value: 8.0 / 6.0, msg: 'Upside down! Rf = distance moved by the SPOT ÷ distance moved by the SOLVENT.' }] }),
                sel('So the Mystery ink contains…', 'Teal + Mustard', ['Teal + Brick', 'Brick + Mustard', 'All three inks'], { verify: { fn: 'chromaMatch' } }),
                sel('Why is the baseline drawn in pencil, not pen?', 'Pen ink would dissolve in the solvent and run up the paper with the samples', ['Pencil is easier to rub out if you make a mistake', 'Pen would make the paper too wet', 'Graphite makes the solvent travel faster'])
              ]
            }],
            hints: [
              'Bert’s log, 1958: “Mrs T measures every ink twice: once to the spot, once to the wet line at the top. Then she divides. Never the other way, she says — ‘Rf is never more than one, Bert.’”',
              'Rf = distance moved by the spot ÷ distance moved by the solvent front, both measured from the baseline (0 cm). Find the solvent front first. Spots with the same Rf (same solvent, same paper) are the same substance.',
              'Worked step: the solvent front is at 8.0 cm. The Brick spot’s centre is at 4.4 cm, so Rf = 4.4 ÷ 8.0 = 0.55. Now do the same for each Mystery spot and compare it with the known inks.'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 2 */
      {
        id: 'r2', number: 2, name: 'The Print Shop', game: 'Typesetter’s Tangle', year: 1956,
        tagline: 'The letterpress tile game! Set your type before the ink dries.',
        topic: 'Year 10 Chemistry — Atomic structure', theme: 'letterpress',
        award: { symbol: 'Na', name: 'sodium', digit: 7, color: '#d9a53b' },
        puzzles: [
          { // BUDGET 1.5 min — input values from periodic table (calculation-lite)
            id: 'r2-type', budget: 1.5,
            prop: { kind: 'drawer', name: 'Type tray', sub: 'drawer of metal letters', front: 'A shallow wooden drawer of tiny lead letters and numbers. Four order slips are tucked in the corner, each asking for a nuclide to be “set in type”.', flip: 'Pull out the order slips' },
            title: 'Set it in type',
            intro: 'Each order slip asks for a nuclide in standard notation: mass number A on top, atomic number Z on the bottom, then the symbol. Use the periodic table in the Data Booklet.',
            parts: [{
              type: 'fields', layout: 'table', fig: { name: 'notation' }, columns: ['Mass number A', 'Atomic number Z', 'Symbol'],
              rows: [
                { label: 'Slip 1: carbon-14', cells: [exact('A', 14), exact('Z', 6, { wrong: 'Z is the atomic number — look it up on the periodic table.' }), { kind: 'symbol', label: 'Symbol', answer: 'C' }], verify: { fn: 'notation', sym: 'C', A: 14 } },
                { label: 'Slip 2: chlorine-37', cells: [exact('A', 37), exact('Z', 17, { wrong: 'Z is the atomic number (protons), not the mass.' }), { kind: 'symbol', label: 'Symbol', answer: 'Cl' }], verify: { fn: 'notation', sym: 'Cl', A: 37 } },
                { label: 'Slip 3: copper-65', cells: [exact('A', 65), exact('Z', 29, { wrong: 'Z is the atomic number — look it up on the periodic table.' }), { kind: 'symbol', label: 'Symbol', answer: 'Cu' }], verify: { fn: 'notation', sym: 'Cu', A: 65 } },
                { label: 'Slip 4: an atom with 20 protons and 24 neutrons', cells: [exact('A', 44, { wrong: 'Mass number A = protons + neutrons.' }), exact('Z', 20), { kind: 'symbol', label: 'Symbol', answer: 'Ca', wrong: 'Which element has 20 protons?' }], verify: { fn: 'notation', sym: 'Ca', A: 44, n: 24 } }
              ]
            }],
            hints: [
              'Bert’s log, 1956: “Mrs T says the number in the NAME (carbon-14) is the big one on top. The small one underneath comes off the periodic table.”',
              'A = mass number = protons + neutrons (the number after the name). Z = atomic number = protons (from the periodic table). The symbol has a capital first letter and a lower-case second letter.',
              'Worked step: chlorine-37 → A = 37. Chlorine is element 17, so Z = 17. Symbol Cl. Slip 4: Z = 20 is calcium, and A = 20 + 24.'
            ]
          },
          { // BUDGET 1.5 min — calculation table incl. ions
            id: 'r2-proof', budget: 1.5,
            prop: { kind: 'card', name: 'Proof sheet', sub: 'smudged', front: 'A smudged proof sheet from the press. A table of particles for the game’s “Atom Cards” is half filled in — the typesetter ran out of ink.', flip: 'Look closely at the table' },
            title: 'Fill in the proof',
            intro: 'Finish the table for the Atom Cards: protons, neutrons and electrons for each atom or ion.',
            parts: [{
              type: 'fields', layout: 'table', columns: ['Protons', 'Neutrons', 'Electrons'],
              rows: [
                { label: '<sup>39</sup>K', cells: pne(19, 20, 19, 'K', 39, 0) },
                { label: '<sup>35</sup>Cl<sup>−</sup>', cells: pne(17, 18, 18, 'Cl', 35, -1) },
                { label: '<sup>27</sup>Al<sup>3+</sup>', cells: pne(13, 14, 10, 'Al', 27, 3) },
                { label: '<sup>56</sup>Fe<sup>2+</sup>', cells: pne(26, 30, 24, 'Fe', 56, 2) }
              ]
            }],
            hints: [
              'Bert’s log, 1957: “Typesetter muddled the Atom Cards again. Mrs T: ‘Protons never change, Bert. Electrons come and go. Neutrons are just the leftovers.’”',
              'Protons = Z (from the periodic table). Neutrons = A − Z. Electrons = Z − charge: a 3+ ion has LOST 3 electrons, a 2− ion has GAINED 2.',
              'Worked step: ²⁷Al³⁺ → Al has Z = 13, so 13 protons; neutrons = 27 − 13 = 14; it has lost 3 electrons, so electrons = 13 − 3 = 10.'
            ]
          },
          { // BUDGET 1 min — matching (conceptual)
            id: 'r2-stamps', budget: 1,
            prop: { kind: 'card', name: 'Rubber stamps', sub: 'three little stamps', front: 'Three rubber stamps on a wooden rack: a plus sign, a circle and a tiny minus sign. A card on the rack is labelled “Stamp key — please complete”.', flip: 'Read the stamp key' },
            title: 'The stamp key',
            intro: 'Complete Gussie’s stamp key for the three subatomic particles, then answer her two questions.',
            parts: [{
              type: 'fields', layout: 'table', columns: ['Relative charge', 'Relative mass', 'Found…'],
              rows: [
                { label: 'Proton', cells: [sel('charge', '+1', ['0', '−1']), sel('mass', '1', ['1/1836 (almost 0)', '0']), sel('location', 'in the nucleus', ['in energy levels around the nucleus'])] },
                { label: 'Neutron', cells: [sel('charge', '0', ['+1', '−1']), sel('mass', '1', ['1/1836 (almost 0)', '0']), sel('location', 'in the nucleus', ['in energy levels around the nucleus'])] },
                { label: 'Electron', cells: [sel('charge', '−1', ['+1', '0']), sel('mass', '1/1836 (almost 0)', ['1', '0']), sel('location', 'in energy levels around the nucleus', ['in the nucleus'])] },
                { label: 'Isotopes of the same element have different numbers of…', cells: [sel('isotopes', 'neutrons', ['protons', 'electrons'], { why: { protons: 'Change the protons and you change the element!' } }), null, null] },
                { label: 'An ion forms when an atom gains or loses…', cells: [sel('ions', 'electrons', ['protons', 'neutrons']), null, null] }
              ]
            }],
            hints: [
              'Bert’s log, 1959: “Rosie’s dad asked why the electron stamp is so small. Mrs T said, ‘Because it weighs about nothing, Walter.’”',
              'Protons and neutrons are in the nucleus and each have a relative mass of 1. Electrons are about 1836 times lighter. Charges: proton +1, neutron 0, electron −1.',
              'Worked step: Proton = +1, mass 1, nucleus. Neutron = 0, mass 1, nucleus. Now think about the electron. Same element means same protons, so isotopes differ in…?'
            ]
          },
          { // BUDGET 1.5 min — spot-the-error (conceptual) + one value
            id: 'r2-errata', budget: 1.5,
            prop: { kind: 'booklet', name: 'Rule booklet', sub: 'with an errata slip', front: 'The “Typesetter’s Tangle” rule booklet. Page 3 has a cheerful leaflet: “THE BOHR MODEL EXPLAINS EVERYTHING!” Tucked inside is Gussie’s blank errata slip — she never finished it.', flip: 'Open to page 3' },
            title: 'Gussie’s errata slip',
            intro: 'The leaflet was written by an over-excited salesman. Gussie said exactly FOUR lines are wrong. Click the wrong lines to flag them, then answer the two questions underneath.',
            parts: [
              { type: 'spot', count: 4, lines: [
                { text: 'Electrons are found in fixed energy levels (shells) around the nucleus.', error: false },
                { text: 'An electron can jump to a higher energy level by absorbing a specific amount of energy.', error: false },
                { text: 'The Bohr model accurately predicts the line spectra of every element.', error: true, fix: 'It only works well for hydrogen (one electron).' },
                { text: 'Each energy level is a single orbit with no internal structure.', error: true, fix: 'Energy levels are split into subshells: s, p, d, f.' },
                { text: 'An s subshell holds 2 electrons, p holds 6, d holds 10 and f holds 14.', error: false },
                { text: 'Electrons travel in neat circular paths, so we always know exactly where an electron is.', error: true, fix: 'Electrons occupy orbitals — regions where they are likely to be found.' },
                { text: 'Higher energy levels are, on average, further from the nucleus.', error: false },
                { text: 'The second energy level (n = 2) contains s, p and d subshells.', error: true, fix: 'n = 2 has only 2s and 2p.' }
              ] },
              { type: 'fields', fields: [
                num('Maximum number of electrons in the n = 3 energy level', 18, 'electrons', { tol: 0, verify: { fn: 'shellMax', n: 3 }, wrong: 'Add up the subshells in n = 3: 3s + 3p + 3d.' }),
                sel('Which subshells make up the n = 3 energy level?', '3s, 3p and 3d', ['3s and 3p only', '3s, 3p, 3d and 3f', '3s only'])
              ] }
            ],
            hints: [
              'Bert’s log, 1961: “Salesman says the Bohr model explains everything. Mrs T laughed so hard she spilled her tea. Said it’s ‘lovely for hydrogen and hopeless for everything else’.”',
              'The Bohr model is too simple: it only works for one-electron atoms, it treats electrons as planets on circular paths, and it ignores subshells. Level n contains n kinds of subshell (n = 1: s; n = 2: s, p; n = 3: s, p, d; n = 4: s, p, d, f).',
              'Worked step: the line about predicting the spectra of EVERY element is wrong — Bohr only works for hydrogen. Check the n = 2 line against “level n contains n kinds of subshell”. For n = 3: 3s + 3p + 3d = 2 + 6 + 10 = ?'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 3 */
      {
        id: 'r3', number: 3, name: 'The Wiring Room', game: 'Circuit Breakers', year: 1963,
        tagline: 'The electric fuse-box game! Don’t blow a fuse.',
        topic: 'Year 10 Chemistry — Electron configurations', theme: 'circuit',
        award: { symbol: 'F', name: 'fluorine', digit: 8, color: '#7b8a3a' },
        puzzles: [
          { // BUDGET 1 min — sorting (Aufbau order)
            id: 'r3-fuses', budget: 1,
            prop: { kind: 'panel', name: 'Fuse box', sub: 'nine loose fuses', front: 'A tin fuse box with nine fuses rattling about inside. Painted on the lid: “Fit fuses in the order they fill — lowest energy first.”', flip: 'Open the lid' },
            title: 'Fit the fuses',
            intro: 'Put the subshell fuses in the order electrons fill them (lowest energy at the top). Drag them, or use the ▲ ▼ buttons.',
            parts: [
              { type: 'order', topLabel: 'fills FIRST (lowest energy)', bottomLabel: 'fills LAST',
                items: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s'].map(function (s) { return { id: s, label: s }; }),
                answer: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s'],
                rules: [{ a: '4s', b: '3d', msg: 'Fuse blown! 4s is slightly lower in energy than 3d, so it fills first.' }, { a: '3d', b: '4p', msg: 'Fuse blown! 3d fills before 4p.' }, { a: '2p', b: '3s', msg: 'Fuse blown! A shell’s p subshell fills before the next shell’s s.' }] },
              { type: 'fields', fields: [
                sel('So why does 4s fill before 3d?', '4s is slightly lower in energy than 3d', ['4s is in a lower shell than 3d', 'd subshells only fill after f subshells', 's subshells always fill before everything else in every shell'])
              ] }
            ],
            hints: [
              'Bert’s log, 1963: “Wired the new panel. Mrs T made me fit the fuses in ‘Aufbau order’. I said ‘Bless you.’ She did not laugh.”',
              'Aufbau: electrons fill the lowest-energy subshell first. The order is 1s 2s 2p 3s 3p 4s 3d 4p 5s… 4s is slightly lower in energy than 3d, so it fills first.',
              'Worked step: the first five are 1s, 2s, 2p, 3s, 3p. The tricky one is next: 4s comes BEFORE 3d.'
            ]
          },
          { // BUDGET 2 min — input configurations (full + condensed + ion)
            id: 'r3-junction', budget: 2,
            prop: { kind: 'panel', name: 'Junction boxes', sub: 'five unlabelled', front: 'A row of five junction boxes, each with a blank brass label plate. A wiring diagram is pinned up: “Label every box with its full electron configuration — or the short one, where marked.”', flip: 'Get out the label maker' },
            title: 'Label the junction boxes',
            intro: 'Type each electron configuration. Any style works: 1s2 2s2 2p6, 1s² 2s² 2p⁶ or 1s^2 2s^2 2p^6. Condensed form starts with a noble gas core, e.g. [Ne]3s2.',
            parts: [{ type: 'fields', fields: [
              cfg('Box 1 — sulfur, S (full)', '1s2 2s2 2p6 3s2 3p4', { verify: { fn: 'config', sym: 'S' } }),
              cfg('Box 2 — calcium, Ca (condensed)', '[Ar] 4s2', { condensed: true, verify: { fn: 'config', sym: 'Ca' } }),
              cfg('Box 3 — iron, Fe (full)', '1s2 2s2 2p6 3s2 3p6 4s2 3d6', { verify: { fn: 'config', sym: 'Fe' } }),
              cfg('Box 4 — bromine, Br (condensed)', '[Ar] 4s2 3d10 4p5', { condensed: true, verify: { fn: 'config', sym: 'Br' } }),
              cfg('Box 5 — the potassium ion, K⁺ (full)', '1s2 2s2 2p6 3s2 3p6', { ion: true, verify: { fn: 'config', sym: 'K', charge: 1 }, traps: [{ value: '1s2 2s2 2p6 3s2 3p6 4s1', msg: 'That’s the neutral potassium atom. K⁺ has LOST its outer electron.' }] })
            ] }],
            hints: [
              'Bert’s log, 1964: “Labelled the junction boxes. Mrs T checked every one by adding up the little numbers. ‘They must come to the atomic number, Bert, or the factory burns down.’ (It did not.)”',
              'Fill in Aufbau order (1s 2s 2p 3s 3p 4s 3d 4p) with s = 2, p = 6, d = 10. The little numbers must add up to the number of electrons. Condensed: replace everything up to the previous noble gas with [He], [Ne] or [Ar].',
              'Worked step: S has 16 electrons → 1s² 2s² 2p⁶ 3s² 3p⁴ (2 + 2 + 6 + 2 + 4 = 16). For Ca, argon has the first 18 electrons, so Ca is [Ar] then 2 more. K⁺ has 19 − 1 = 18 electrons.'
            ]
          },
          { // BUDGET 2 min — orbital diagram builder with Hund/Pauli feedback
            id: 'r3-wiring', budget: 2,
            prop: { kind: 'board', name: 'Wiring panel', sub: 'loose arrow-plugs', front: 'A pegboard with rows of little two-socket boxes, plus a tin of red arrow-shaped plugs — some pointing up, some down. A note says: “Wire these exactly to code.”', flip: 'Tip out the arrow-plugs' },
            title: 'Wire it to code',
            intro: 'Each box is an orbital with two sockets. Drag an ↑ or ↓ arrow into a socket, or click a socket to cycle ↑ → ↓ → empty. Wire each atom correctly. The inspector will tell you which rule you broke.',
            parts: [{ type: 'orbital', diagrams: [
              { id: 'N', label: 'Nitrogen (Z = 7)', subshells: [{ name: '1s', boxes: 1 }, { name: '2s', boxes: 1 }, { name: '2p', boxes: 3 }], expect: { '1s': 2, '2s': 2, '2p': 3 }, verify: { fn: 'orbital', sym: 'N' } },
              { id: 'O', label: 'Oxygen (Z = 8)', subshells: [{ name: '1s', boxes: 1 }, { name: '2s', boxes: 1 }, { name: '2p', boxes: 3 }], expect: { '1s': 2, '2s': 2, '2p': 4 }, verify: { fn: 'orbital', sym: 'O' } },
              { id: 'Fe', label: 'Iron (Z = 26): [Ar] + …', core: '[Ar]', subshells: [{ name: '4s', boxes: 1 }, { name: '3d', boxes: 5 }], expect: { '4s': 2, '3d': 6 }, verify: { fn: 'orbital', sym: 'Fe', core: 'Ar' } }
            ] }],
            hints: [
              'Bert’s log, 1965: “Mrs T calls it the bus-seat rule: on a bus, nobody sits next to a stranger while there’s still an empty double seat. Electrons are the same.”',
              'Aufbau: fill lower-energy subshells first. Pauli: at most 2 electrons per box, with opposite spins (↑↓). Hund: in a p or d subshell, put one ↑ in every box before pairing any.',
              'Worked step: nitrogen 1s² 2s² 2p³ → 1s ↑↓, 2s ↑↓, then 2p gets ONE ↑ in each of its three boxes. Oxygen has one more electron: it pairs up (↓) in the first 2p box.'
            ]
          },
          { // BUDGET 2 min — spot-the-error (Cr/Cu exceptions) + configs
            id: 'r3-faults', budget: 2,
            prop: { kind: 'receipt', name: 'Faulty-circuit tags', sub: 'stamped REJECT', front: 'A bundle of brown cardboard tags on a string, each with a transition metal and its “standard wiring”. Some are stamped REJECT in red, but the stamp has smudged.', flip: 'Untie the bundle' },
            title: 'Find the faulty circuits',
            intro: 'Exactly THREE of these “standard wirings” are faulty. Flag them, then fix the two famous exceptions.',
            parts: [
              { type: 'spot', count: 3, lines: [
                { text: 'Sc: [Ar] 3d¹ 4s²', error: false, check: 'Sc' },
                { text: 'V: [Ar] 3d⁵', error: true, fix: '[Ar] 3d³ 4s²', check: 'V' },
                { text: 'Cr: [Ar] 3d⁴ 4s²', error: true, fix: '[Ar] 3d⁵ 4s¹', check: 'Cr' },
                { text: 'Mn: [Ar] 3d⁵ 4s²', error: false, check: 'Mn' },
                { text: 'Cu: [Ar] 3d⁹ 4s²', error: true, fix: '[Ar] 3d¹⁰ 4s¹', check: 'Cu' },
                { text: 'Zn: [Ar] 3d¹⁰ 4s²', error: false, check: 'Zn' },
                { text: 'Ga: [Ar] 3d¹⁰ 4s² 4p¹', error: false, check: 'Ga' }
              ] },
              { type: 'fields', fields: [
                cfg('Correct wiring for chromium, Cr (condensed)', '[Ar] 3d5 4s1', { condensed: true, verify: { fn: 'config', sym: 'Cr' }, traps: [{ value: '[Ar] 3d4 4s2', msg: 'That’s the “expected” one, but chromium is an exception. Moving one electron makes the d subshell exactly half full.' }] }),
                cfg('Correct wiring for copper, Cu (condensed)', '[Ar] 3d10 4s1', { condensed: true, verify: { fn: 'config', sym: 'Cu' }, traps: [{ value: '[Ar] 3d9 4s2', msg: 'That’s the “expected” one, but copper is an exception. Moving one electron makes the d subshell completely full.' }] }),
                sel('Why are Cr and Cu exceptions?', 'A half-full or completely full d subshell is extra stable, so one 4s electron moves into 3d', ['4s is always empty in transition metals', 'Cr and Cu have extra neutrons', 'The 3d subshell can hold 12 electrons in these atoms'])
              ] }
            ],
            hints: [
              'Bert’s log, 1966: “Two circuits always trip: number 24 and number 29. Mrs T says they ‘borrow from 4s to tidy up 3d’. Rosie’s grandpa called them the cheaters.”',
              'Check each tag: do the electrons add up to Z (Ar = 18)? Does it follow Aufbau (4s² before 3d)? Then remember the two exceptions: Cr and Cu move one 4s electron into 3d to get a half-full (d⁵) or full (d¹⁰) subshell.',
              'Worked step: V is element 23, so it needs 23 − 18 = 5 electrons after [Ar]. Those go 4s² then 3d³, so “[Ar] 3d⁵” is faulty. Cr (24) would “expect” 3d⁴ 4s² but is actually [Ar] 3d⁵ 4s¹.'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 4 */
      {
        id: 'r4', number: 4, name: 'The Dye & Paint Room', game: 'Colour Me Curious', year: 1968,
        tagline: 'The paint-mixing card game! Mix it, match it, make it.',
        topic: 'Year 10 Chemistry — Elements, compounds & mixtures', theme: 'paint',
        award: { symbol: 'Mg', name: 'magnesium', digit: 1, color: '#b5482f' },
        puzzles: [
          { // BUDGET 2 min — classify particle diagrams + definitions + metallic bonding (conceptual)
            id: 'r4-particles', budget: 2,
            prop: { kind: 'tuckbox', name: 'Particle cards', sub: 'Colour Me Curious · 7 cards', front: 'A deck of glossy cards printed with coloured circles: “Pigment Particles — collect a full set!” The back of the box asks you to sort them.', flip: 'Deal the cards out' },
            title: 'Sort the pigment particles',
            intro: 'Each circle is an atom; touching circles are bonded. Sort the cards into the three paint pots, then match the glossary words and answer the last question.',
            parts: [
              { type: 'slots', layout: 'bins',
                tiles: [
                  { id: 'c1', label: 'Card 1', fig: { name: 'particles', kind: 'atoms' }, alt: 'Card 1 (identical single atoms)' },
                  { id: 'c2', label: 'Card 2', fig: { name: 'particles', kind: 'diatomic' }, alt: 'Card 2 (identical diatomic molecules)' },
                  { id: 'c3', label: 'Card 3', fig: { name: 'particles', kind: 'compound' }, alt: 'Card 3 (identical molecules of two elements)' },
                  { id: 'c4', label: 'Card 4', fig: { name: 'particles', kind: 'mixElements' }, alt: 'Card 4 (single atoms + diatomic molecules)' },
                  { id: 'c5', label: 'Card 5', fig: { name: 'particles', kind: 'mixCompound' }, alt: 'Card 5 (compound molecules + element molecules)' },
                  { id: 'c6', label: 'Card 6', fig: { name: 'particles', kind: 'ionic' }, alt: 'Card 6 (lattice of alternating + and − ions)' },
                  { id: 'c7', label: 'Card 7', fig: { name: 'particles', kind: 'metallic' }, alt: 'Card 7 (lattice of identical + ions in a sea of electrons)' }
                ],
                slots: [
                  { id: 'el', label: 'Element', answer: ['c1', 'c2', 'c7'] },
                  { id: 'co', label: 'Compound', answer: ['c3', 'c6'] },
                  { id: 'mx', label: 'Mixture', answer: ['c4', 'c5'] }
                ] },
              { type: 'slots', layout: 'list',
                tiles: [
                  { id: 'd1', label: 'the smallest particle of an element that keeps its chemical identity' },
                  { id: 'd2', label: 'two or more non-metal atoms covalently bonded together' },
                  { id: 'd3', label: 'an atom or group of atoms with an overall electric charge' },
                  { id: 'd4', label: 'a pure substance made of only one type of atom' },
                  { id: 'd5', label: 'a pure substance of two or more elements chemically bonded in a fixed ratio' },
                  { id: 'd6', label: 'two or more substances physically combined, in no fixed ratio' }
                ],
                slots: [
                  { id: 'atom', label: 'Atom', answer: 'd1' }, { id: 'molecule', label: 'Molecule', answer: 'd2' }, { id: 'ion', label: 'Ion', answer: 'd3' },
                  { id: 'element', label: 'Element', answer: 'd4' }, { id: 'compound', label: 'Compound', answer: 'd5' }, { id: 'mixture', label: 'Mixture', answer: 'd6' }
                ] },
              { type: 'fields', fields: [
                sel('Card 7 is a bar of copper pigment. What holds it together?', 'Metallic bonding: a lattice of positive ions in a sea of delocalised electrons', ['Ionic bonding: attraction between positive and negative ions', 'Covalent bonding: shared pairs of electrons between non-metal atoms', 'Dispersion forces only'])
              ] }
            ],
            hints: [
              'Bert’s log, 1968: “Rosie’s dad sorted the particle cards by colour. Mrs T sorted them again by ‘what’s joined to what’. Hers was right.”',
              'Element: only ONE kind of atom (separate, in molecules, or in a metal lattice). Compound: every particle contains two or more kinds of atom bonded in a fixed ratio (molecules or an ionic lattice). Mixture: more than one kind of particle.',
              'Worked step: Card 2 has molecules made of two identical atoms (like O₂), so it’s an element. Card 4 has two different kinds of particle, so it’s a mixture. Card 6 has two kinds of ion in a fixed ratio, so it’s a compound.'
            ]
          },
          { // BUDGET 2 min — build ionic + covalent formulas
            id: 'r4-pots', budget: 2,
            prop: { kind: 'jar', name: 'Paint pots', sub: 'five labelled pots', front: 'A wire rack of five little paint pots. Each lid has a pigment name, but the chemical formula on each label has worn off. A chart of ion “tiles” is glued inside the rack.', flip: 'Look at the labels and the ion chart' },
            title: 'Relabel the paint pots',
            intro: 'Write the chemical formula for each pigment. Type numbers normally (Al2O3) and use brackets for polyatomic ions (Ca(NO3)2). The ion chart is printed below and in the Data Booklet.',
            parts: [{ type: 'fields', fig: { name: 'ionChart' }, fields: [
              fx('Pot 1 — aluminium oxide (white)', 'Al2O3', { verify: { fn: 'ionic', ions: [['Al', 3], ['O', -2]] } }),
              fx('Pot 2 — calcium nitrate (fixer)', 'Ca(NO3)2', { verify: { fn: 'ionic', ions: [['Ca', 2], ['NO3', -1]] } }),
              fx('Pot 3 — ammonium sulfate (fertiliser for the factory garden)', '(NH4)2SO4', { verify: { fn: 'ionic', ions: [['NH4', 1], ['SO4', -2]] } }),
              fx('Pot 4 — iron(III) hydroxide (rust-brown)', 'Fe(OH)3', { verify: { fn: 'ionic', ions: [['Fe', 3], ['OH', -1]] } }),
              fx('Pot 5 — nitrogen trichloride (covalent; a dangerous one — never opened!)', 'NCl3', { bond: 'covalent', verify: { fn: 'covalent' } }),
              sel('Which pair of elements would form an IONIC compound?', 'magnesium + chlorine', ['carbon + oxygen', 'nitrogen + hydrogen', 'sulfur + oxygen'], { why: { 'carbon + oxygen': 'Two non-metals share electrons, so the bond is covalent.', 'nitrogen + hydrogen': 'Two non-metals share electrons, so the bond is covalent.', 'sulfur + oxygen': 'Two non-metals share electrons, so the bond is covalent.' } })
            ] }],
            hints: [
              'Bert’s log, 1969: “Labels came off in the steam again. Mrs T rewrote them all in five minutes with her ‘criss-cross’ trick. I still don’t trust it.”',
              'Ionic: write the cation and anion with their charges, then choose the smallest numbers that make the total charge zero. Keep polyatomic ions (NO₃⁻, SO₄²⁻, OH⁻, CO₃²⁻, NH₄⁺) together, in brackets if you need more than one. Covalent: use the prefixes (tri = 3).',
              'Worked step: Al³⁺ and O²⁻. Two Al give +6 and three O give −6, so Al₂O₃. Calcium nitrate is Ca²⁺ and NO₃⁻, so you need two nitrates: Ca(NO₃)₂.'
            ]
          },
          { // BUDGET 2.5 min — calculations: Ar (abundance + spectrum), Mr, % composition, % yield
            id: 'r4-invoice', budget: 2.5,
            prop: { kind: 'receipt', name: 'Pigment invoice', sub: 'Brick Red, batch 88', front: 'A stamped supplier’s invoice for chlorine and magnesium pigments, plus a lab report. The totals column has been left blank. Stamped: “ACCOUNTS — PLEASE COMPLETE”.', flip: 'Unfold the invoice' },
            title: 'Finish the invoice',
            intro: 'Work out each total. Use the 1 d.p. molar masses from the Data Booklet. Answers within about 1 % are accepted.',
            parts: [
              { type: 'fields', fields: [
                num('Line 1 — chlorine is 75.8 % <sup>35</sup>Cl and 24.2 % <sup>37</sup>Cl. Relative atomic mass of chlorine =', 35.5, '', { tolAbs: 0.05, verify: { fn: 'arAbund', iso: [[35, 75.8], [37, 24.2]] }, traps: [{ value: 36, tolAbs: 0.02, msg: 'That’s a plain average. Weight each isotope by its % abundance.' }] })
              ] },
              { type: 'fields', fig: { name: 'massSpectrum', peaks: [[24, 63.2], [25, 8.0], [26, 8.8]], label: 'Mass spectrum of the magnesium pigment' }, fields: [
                num('Line 2 — from the mass spectrum, relative atomic mass of magnesium =', 24.3, '', { tolAbs: 0.03, verify: { fn: 'arAbund', iso: [[24, 63.2], [25, 8.0], [26, 8.8]] }, traps: [{ value: (24 * 63.2 + 25 * 8 + 26 * 8.8) / 100, msg: 'The peak heights add up to 80, not 100. Divide by the TOTAL peak height.' }, { value: 25, tolAbs: 0.02, msg: 'That’s a plain average. Weight each mass by its peak height.' }] })
              ] },
              { type: 'fields', fields: [
                num('Line 3 — relative formula mass of iron(III) oxide, Fe<sub>2</sub>O<sub>3</sub> (Brick Red)', 159.6, '', { tol: 0.01, verify: { fn: 'mr', f: 'Fe2O3' }, traps: [{ value: 55.8 + 48, msg: 'There are TWO iron atoms in Fe₂O₃.' }, { value: 111.6 + 16, msg: 'There are THREE oxygen atoms in Fe₂O₃.' }] }),
                num('Line 4 — percentage by mass of iron in Fe<sub>2</sub>O<sub>3</sub>', 69.9, '%', { tol: 0.01, verify: { fn: 'pct', f: 'Fe2O3', el: 'Fe' }, traps: [{ value: 34.96, msg: 'Remember there are TWO Fe atoms: use 2 × 55.8.' }] }),
                num('Line 5 — batch 88 should have made 64.0 g of Brick Red but only 52.8 g came out. Percentage yield =', 82.5, '%', { tol: 0.01, verify: { fn: 'yield', actual: 52.8, theo: 64.0 }, traps: [{ value: 121.2, msg: '% yield = actual ÷ theoretical × 100. It can’t be more than 100 %.' }] })
              ] }
            ],
            hints: [
              'Bert’s log, 1970: “Accounts lady off sick. Mrs T did the invoice herself: ‘It’s all just weighted averages and fractions, Bert.’ Took her four minutes.”',
              'Ar = Σ(isotope mass × abundance) ÷ Σ(abundances). That works for percentages AND for peak heights that don’t add to 100. Mr = add up the Ar of every atom. % by mass = (number of atoms × Ar) ÷ Mr × 100. % yield = actual ÷ theoretical × 100.',
              'Worked step: Mg = (24 × 63.2 + 25 × 8.0 + 26 × 8.8) ÷ (63.2 + 8.0 + 8.8) = 1945.6 ÷ 80.0. Fe₂O₃ = 2 × 55.8 + 3 × 16.0 = 159.6, so %Fe = 111.6 ÷ 159.6 × 100.'
            ]
          },
          { // BUDGET 2 min — flame tests + emission spectra (colourblind-accessible)
            id: 'r4-flames', budget: 2,
            prop: { kind: 'catalogue', name: 'Product catalogue', sub: '“Fireworks Night” page', front: 'The 1968 Thistlewood catalogue, open at a page advertising “Fireworks Night — the colourful flame game!” Four pigment samples are taped to the page with Gussie’s test notes.', flip: 'Read the test notes' },
            title: 'Fireworks Night',
            intro: 'Gussie flame-tested four unlabelled pigment samples (all chlorides). Use the flame chart and the line spectra. Every line’s wavelength is printed, so you don’t need to rely on colour.',
            parts: [{ type: 'fields', fig: { name: 'flames', refs: {
                Li: [460, 610, 671], Na: [589], K: [404, 767], Ca: [423, 616, 644], Sr: [408, 461, 641]
              }, sample: [460, 589, 610, 671] },
              fields: [
                sel('Sample A gave a lilac flame. It is…', 'potassium chloride', ['sodium chloride', 'copper(II) chloride', 'calcium chloride', 'barium chloride']),
                sel('Sample B gave a blue-green flame. It is…', 'copper(II) chloride', ['barium chloride', 'potassium chloride', 'lithium chloride', 'sodium chloride']),
                sel('Sample C gave an orange-red (brick-red) flame. It is…', 'calcium chloride', ['sodium chloride', 'strontium chloride', 'potassium chloride', 'barium chloride']),
                sel('Sample D gave a red flame with yellow flashes. Its line spectrum is shown. It contains…', 'lithium chloride and sodium chloride', ['strontium chloride and sodium chloride', 'calcium chloride and sodium chloride', 'lithium chloride and potassium chloride'], { verify: { fn: 'spectrum' }, why: { 'strontium chloride and sodium chloride': 'Strontium would also give lines at 408 nm and 641 nm. Are they in Sample D?', 'calcium chloride and sodium chloride': 'Calcium would also give lines at 423 nm and 644 nm. Are they there?', 'lithium chloride and potassium chloride': 'Potassium would give lines at 404 nm and 767 nm. Are they there?' } }),
                sel('Why does each element give its own particular colours?', 'Heated electrons jump to higher energy levels, then fall back and emit light of specific energies, which are different for each element', ['The metal burns, and the flame changes to the metal’s colour', 'The heat breaks up the nucleus and releases coloured light', 'Electrons absorb the colour of light they appear to be'])
              ] }],
            hints: [
              'Bert’s log, 1972: “Fireworks Night prototype. Mrs T: ‘Every element has a barcode, Bert. Match ALL the lines, not just one.’ I set my eyebrows on fire.”',
              'Use the flame chart for A–C. For D: an element is present only if EVERY one of its lines appears in the sample. Then check that every sample line is accounted for.',
              'Worked step: Sample D has lines at 460, 589, 610 and 671 nm. Lithium’s lines (460, 610, 671) are all there. Strontium needs 408, 461 and 641 — 641 is missing, so no strontium. Which element gives the line at 589 nm?'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 5 */
      {
        id: 'r5', number: 5, name: 'The Moulding Floor', game: 'Melt Down!', year: 1971,
        tagline: 'The press-and-mould game! Pour it, press it, pop it out.',
        topic: 'Year 10 Chemistry — Chemical reactions & equations', theme: 'mould',
        award: { symbol: 'K', name: 'potassium', digit: 4, color: '#7a4a6b' },
        puzzles: [
          { // BUDGET 1 min — evidence of reaction (conceptual sorting)
            id: 'r5-gauges', budget: 1,
            prop: { kind: 'panel', name: 'Gauge cards', sub: 'thermometer & glow-meter', front: 'Eight “Gauge” cards from the game, each with a little picture of a thermometer or a glowing bulb. In Melt Down! you only score a card if it shows a real chemical reaction.', flip: 'Spread out the gauge cards' },
            title: 'Which gauges score?',
            intro: 'Sort each gauge card: does it show evidence of a CHEMICAL reaction (a new substance forming), or not?',
            parts: [{ type: 'slots', layout: 'bins',
              tiles: [
                { id: 'g1', label: 'Magnesium ribbon dropped into acid: the test tube gets hot' },
                { id: 'g2', label: 'Magnesium burns with a dazzling white light' },
                { id: 'g3', label: 'A snapped glow-stick gives out green light without getting hot' },
                { id: 'g4', label: 'Baking soda + vinegar fizzes and the mixture gets COLDER' },
                { id: 'g5', label: 'Two clear solutions are mixed and a yellow solid appears' },
                { id: 'g6', label: 'Ice melts in your hand, taking heat from your skin' },
                { id: 'g7', label: 'Water boils and bubbles at 100 °C' },
                { id: 'g8', label: 'Sugar stirred into tea disappears' }
              ],
              slots: [
                { id: 'yes', label: 'Evidence of a chemical reaction', answer: ['g1', 'g2', 'g3', 'g4', 'g5'] },
                { id: 'no', label: 'Physical change only', answer: ['g6', 'g7', 'g8'] }
              ] }],
            hints: [
              'Bert’s log, 1971: “Mrs T says a hot kettle is NOT a reaction, but a hot hand-warmer IS. Something about ‘new substances, Bert’.”',
              'Evidence of a chemical reaction: an energy change you didn’t supply (getting hotter OR colder, giving out light), gas being produced, a precipitate, or a colour change. Melting, boiling and dissolving are physical changes — no new substance.',
              'Worked step: the baking soda card gets colder AND fizzes, so a gas is being made — that’s an (endothermic) reaction. Boiling water is still water, so it’s physical.'
            ]
          },
          { // BUDGET 2 min — balance equations + states (dials)
            id: 'r5-press', budget: 2,
            prop: { kind: 'board', name: 'The mould press', sub: 'three dials per mould', front: 'A cardboard press with brass-coloured number dials in front of each chemical. A sticker says: “Moulds only pop out when the atoms balance — and don’t forget the states!”', flip: 'Step up to the press' },
            title: 'Balance the press',
            intro: 'Set the coefficient dials (blank = 1) and choose a state for every species. Lowest whole numbers only.',
            parts: [{ type: 'balance', equations: [
              { id: 'e1', answer: '4Al(s) + 3O2(g) -> 2Al2O3(s)' },
              { id: 'e2', answer: 'C3H8(g) + 5O2(g) -> 3CO2(g) + 4H2O(l/g)' },
              { id: 'e3', answer: 'Fe2O3(s) + 3CO(g) -> 2Fe(s/l) + 3CO2(g)' }
            ] }],
            hints: [
              'Bert’s log, 1973: “Press jammed. Mrs T: ‘Count the atoms on both sides, Bert, and never, EVER change the little numbers.’”',
              'Only change coefficients (big numbers in front), never subscripts. Balance the element that appears in the fewest places first, and leave H and O (or lone elements like O₂) until last. States: (s), (l), (g), (aq).',
              'Worked step: propane, C₃H₈: 3 C means 3CO₂. 8 H means 4H₂O. Now count the O on the right: 3 × 2 + 4 × 1 = 10, so you need 5O₂.'
            ]
          },
          { // BUDGET 2.5 min — word equations → balanced symbol equations with states
            id: 'r5-tickets', budget: 2.5,
            prop: { kind: 'receipt', name: 'Order tickets', sub: 'written in words', front: 'Three order tickets from the moulding floor, written in words by the new apprentice. The press only reads chemical equations.', flip: 'Read the tickets' },
            title: 'Translate the tickets',
            intro: 'Write each as a balanced chemical equation with state symbols. Type -> for the arrow, e.g. 2Na(s) + Cl2(g) -> 2NaCl(s). Use the solubility table if you need it.',
            parts: [{ type: 'fields', fig: { name: 'solubility' }, fields: [
              eqn('Ticket 1: magnesium + hydrochloric acid → magnesium chloride + hydrogen', 'Mg(s) + 2HCl(aq) -> MgCl2(aq) + H2(g)'),
              eqn('Ticket 2: potassium + water → potassium hydroxide + hydrogen', '2K(s) + 2H2O(l) -> 2KOH(aq) + H2(g)'),
              eqn('Ticket 3: calcium carbonate + nitric acid → calcium nitrate + water + carbon dioxide', 'CaCO3(s) + 2HNO3(aq) -> Ca(NO3)2(aq) + H2O(l) + CO2(g)')
            ] }],
            hints: [
              'Bert’s log, 1974: “Apprentice wrote ‘magnesium + acid’ on every ticket. Mrs T made him write formulas for a week. He’s a foreman now.”',
              'Step 1: write every formula (diatomic gases: H₂, O₂; ionic formulas from charges: Mg²⁺ + Cl⁻ → MgCl₂). Step 2: balance with coefficients. Step 3: add states. Acids and soluble salts are (aq), water is (l), H₂ and CO₂ are (g), metals and insoluble carbonates are (s).',
              'Worked step: Ticket 1 → Mg + HCl → MgCl₂ + H₂. There are 2 Cl on the right, so use 2HCl. Final: Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g).'
            ]
          },
          { // BUDGET 1.5 min — predict products & states (solubility table)
            id: 'r5-predict', budget: 1.5,
            prop: { kind: 'tuckbox', name: 'Prediction cards', sub: '“What pops out?”', front: 'A deck called “What Pops Out?” Each card shows two reactants going into the mould. You must predict the products, states and all.', flip: 'Draw the cards' },
            title: 'What pops out?',
            intro: 'Predict what comes out of each mould. Use the solubility table to decide (s) or (aq).',
            parts: [{ type: 'fields', fig: { name: 'solubility' }, fields: [
              sel('2Li(s) + 2H₂O(l) →', '2LiOH(aq) + H₂(g)', ['Li₂O(s) + 2H₂(g)', '2LiH(s) + O₂(g)', '2LiOH(s) + H₂O(l)'], { verify: { eq: '2Li(s) + 2H2O(l) -> 2LiOH(aq) + H2(g)' }, why: { 'Li₂O(s) + 2H₂(g)': 'Group 1 metal + water → metal HYDROXIDE + hydrogen.' } }),
              sel('Zn(s) + H₂SO₄(aq) →', 'ZnSO₄(aq) + H₂(g)', ['ZnSO₄(s) + H₂O(l)', 'ZnO(s) + SO₂(g) + H₂(g)', 'ZnH₂(s) + SO₄(g)'], { verify: { eq: 'Zn(s) + H2SO4(aq) -> ZnSO4(aq) + H2(g)' }, why: { 'ZnSO₄(s) + H₂O(l)': 'Metal + acid → salt + HYDROGEN gas. (Water comes from oxides, hydroxides and carbonates.)' } }),
              sel('Na₂CO₃(aq) + 2HCl(aq) →', '2NaCl(aq) + H₂O(l) + CO₂(g)', ['2NaCl(aq) + H₂(g) + CO₂(g)', '2NaCl(s) + H₂O(l) + CO₂(g)', 'Na₂Cl₂(aq) + H₂CO₃(s)'], { verify: { eq: 'Na2CO3(aq) + 2HCl(aq) -> 2NaCl(aq) + H2O(l) + CO2(g)' }, why: { '2NaCl(s) + H₂O(l) + CO₂(g)': 'All sodium salts are soluble, so NaCl stays dissolved: (aq).' } }),
              sel('CuO(s) + H₂SO₄(aq) →', 'CuSO₄(aq) + H₂O(l)', ['CuSO₄(aq) + H₂(g)', 'Cu(s) + SO₃(g) + H₂O(l)', 'CuS(s) + H₂O(l) + O₂(g)'], { verify: { eq: 'CuO(s) + H2SO4(aq) -> CuSO4(aq) + H2O(l)' }, why: { 'CuSO₄(aq) + H₂(g)': 'Metal OXIDE + acid → salt + WATER (no hydrogen gas).' } }),
              sel('Mg(OH)₂(s) + 2HCl(aq) →', 'MgCl₂(aq) + 2H₂O(l)', ['MgCl₂(aq) + H₂(g) + O₂(g)', 'MgO(s) + 2HCl(aq) + H₂O(l)', 'MgH₂(s) + 2HClO(aq)'], { verify: { eq: 'Mg(OH)2(s) + 2HCl(aq) -> MgCl2(aq) + 2H2O(l)' }, why: { 'MgCl₂(aq) + H₂(g) + O₂(g)': 'Hydroxide + acid is a neutralisation: salt + WATER.' } }),
              sel('Pb(NO₃)₂(aq) + 2KI(aq) →', 'PbI₂(s) + 2KNO₃(aq)', ['PbI₂(aq) + 2KNO₃(s)', 'PbI₂(aq) + 2KNO₃(aq) — no precipitate', 'Pb(s) + I₂(s) + 2KNO₃(aq)'], { verify: { eq: 'Pb(NO3)2(aq) + 2KI(aq) -> PbI2(s) + 2KNO3(aq)' }, why: { 'PbI₂(aq) + 2KNO₃(s)': 'Check the table: all nitrates are soluble, but lead iodide is not.', 'PbI₂(aq) + 2KNO₃(aq) — no precipitate': 'Check the table: iodides are soluble EXCEPT with Ag⁺ and Pb²⁺.' } }),
              sel('NaOH(aq) + KCl(aq) →', 'No precipitate — both possible new products are soluble', ['NaCl(s) + KOH(aq)', 'KOH(s) + NaCl(aq)', 'NaK(s) + HClO(aq)'], { why: { 'NaCl(s) + KOH(aq)': 'All Group 1 compounds are soluble, so nothing precipitates.', 'KOH(s) + NaCl(aq)': 'All Group 1 compounds are soluble, so nothing precipitates.' } })
            ] }],
            hints: [
              'Bert’s log, 1975: “Mrs T’s rhyme, painted above the press: ‘Metal and acid make salt and a squeak; carbonate fizzes; with oxides it’s weak.’ (The squeak is hydrogen.)”',
              'Group 1 metal + water → hydroxide + H₂. Metal + acid → salt + H₂. Carbonate + acid → salt + H₂O + CO₂. Oxide or hydroxide + acid → salt + H₂O. Precipitation: swap partners, then check the solubility table — insoluble products are (s).',
              'Worked step: Pb(NO₃)₂ + KI → swap partners: PbI₂ and KNO₃. Nitrates are always soluble (aq). Iodides are soluble EXCEPT with Pb²⁺ and Ag⁺, so PbI₂ is a yellow solid (s).'
            ]
          },
          { // BUDGET 1 min — classify reaction types
            id: 'r5-bins', budget: 1,
            prop: { kind: 'jar', name: 'Sorting bins', sub: 'six chutes', front: 'Six tin chutes at the end of the moulding line, labelled with reaction types. A heap of finished “reaction tokens” waits to be sorted.', flip: 'Start sorting the tokens' },
            title: 'Down the right chute',
            intro: 'Send each reaction token down the right chute. Choose the MOST specific type: an acid + base reaction is neutralisation, even though it also swaps partners.',
            parts: [{ type: 'slots', layout: 'bins',
              tiles: [
                { id: 'k1', label: 'Fe(s) + S(s) → FeS(s)', eq: 'Fe(s) + S(s) -> FeS(s)' },
                { id: 'k2', label: '2H₂O₂(aq) → 2H₂O(l) + O₂(g)', eq: '2H2O2(aq) -> 2H2O(l) + O2(g)' },
                { id: 'k3', label: 'CaCO₃(s) → CaO(s) + CO₂(g)', eq: 'CaCO3(s) -> CaO(s) + CO2(g)' },
                { id: 'k4', label: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)', eq: 'CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)' },
                { id: 'k5', label: 'Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)', eq: 'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)' },
                { id: 'k6', label: 'Cl₂(aq) + 2KBr(aq) → 2KCl(aq) + Br₂(aq)', eq: 'Cl2(aq) + 2KBr(aq) -> 2KCl(aq) + Br2(aq)' },
                { id: 'k7', label: 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)', eq: 'AgNO3(aq) + NaCl(aq) -> AgCl(s) + NaNO3(aq)' },
                { id: 'k8', label: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)', eq: 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)' }
              ],
              slots: [
                { id: 'syn', label: 'Synthesis', answer: ['k1'] },
                { id: 'dec', label: 'Decomposition', answer: ['k2', 'k3'] },
                { id: 'com', label: 'Combustion', answer: ['k4'] },
                { id: 'sd', label: 'Single displacement', answer: ['k5', 'k6'] },
                { id: 'dd', label: 'Double displacement (precipitation)', answer: ['k7'] },
                { id: 'neu', label: 'Neutralisation', answer: ['k8'] }
              ] }],
            hints: [
              'Bert’s log, 1976: “Tokens jammed in the chutes. Mrs T: ‘Look at how many things go IN and how many come OUT.’”',
              'Synthesis: A + B → AB. Decomposition: AB → A + B. Combustion: fuel + O₂ → oxides (CO₂ + H₂O). Single displacement: element + compound → new element + new compound. Double displacement: two compounds swap partners (often a precipitate). Neutralisation: acid + base → salt + water.',
              'Worked step: Zn + CuSO₄ → ZnSO₄ + Cu — the element zinc pushes copper out of its compound, so it’s single displacement. Cl₂ + KBr is the same pattern.'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 6 */
      {
        id: 'r6', number: 6, name: 'Quality Control & Shipping', game: 'Special Delivery', year: 1977,
        tagline: 'The shipping-dockets game! Count it, weigh it, ship it.',
        topic: 'Year 10 Chemistry — The mole & calculations', theme: 'shipping',
        award: { symbol: 'Si', name: 'silicon', digit: 2, color: '#2c3e5c' },
        puzzles: [
          { // BUDGET 2 min — mole calculations with unit conversions
            id: 'r6-crates', budget: 2,
            prop: { kind: 'card', name: 'Crate labels', sub: 'four shipping labels', front: 'Four brown shipping labels, each for a crate of chemicals headed to the factory. The “amount” boxes are blank and the courier is waiting.', flip: 'Turn the labels over' },
            title: 'Label the crates',
            intro: 'Fill in each shipping label. Nₐ = 6.02 × 10²³ mol⁻¹. For big numbers, type e.g. 1.5e23 or 1.5 x 10^23. Answers within 2 % are accepted.',
            parts: [{ type: 'fields', fields: [
              num('Crate 1: 4.50 g of water, H₂O. Amount =', 0.250, 'mol', { verify: { fn: 'n_m', m: 4.50, f: 'H2O' }, traps: [{ value: 81, msg: 'n = m ÷ M — divide, don’t multiply.' }, { value: 4.5 / 17, msg: 'Check the molar mass of H₂O: 2 × 1.0 + 16.0.' }] }),
              num('Crate 2: 0.0750 mol of calcium carbonate, CaCO₃. Mass =', 7.51, 'g', { verify: { fn: 'm_n', n: 0.075, f: 'CaCO3' }, traps: [{ value: 0.075 / 100.1, msg: 'm = n × M — multiply here.' }] }),
              num('Crate 3: 250 mL of 0.400 mol L⁻¹ salt solution. Amount of NaCl =', 0.100, 'mol', { verify: { fn: 'n_cv', c: 0.400, VmL: 250 } }),
              num('Crate 4: 0.250 mol of carbon dioxide gas. Number of CO₂ molecules =', 1.51e23, 'molecules', { verify: { fn: 'N', n: 0.250 } })
            ] }],
            hints: [
              'Bert’s log, 1977: “New courier asked what a ‘mole’ was. Mrs T said ‘six hundred and two thousand million million million of anything, dear.’ He drove off quite pale.”',
              'n = m ÷ M (g ÷ g mol⁻¹). m = n × M. n = c × V with V in LITRES (mL ÷ 1000). N = n × Nₐ and n = N ÷ Nₐ.',
              'Worked step: Crate 3 → V = 250 mL = 0.250 L, so n = 0.400 × 0.250. Crate 1 → M(H₂O) = 18.0 g mol⁻¹, so n = 4.50 ÷ 18.0.'
            ]
          },
          { // BUDGET 3 min — limiting reagent, product mass (production orders)
            id: 'r6-orders', budget: 3,
            prop: { kind: 'ledger', name: 'Production orders', sub: 'two dockets on a spike', front: 'Two production dockets on a desk spike. The shipping clerk has scribbled “WHICH RUNS OUT FIRST??” across both of them.', flip: 'Pull the dockets off the spike' },
            title: 'Which runs out first?',
            intro: 'For each docket, find the limiting reagent and how much product the factory will get.',
            parts: [
              { type: 'fields', heading: 'Docket A — chalk filler for game pieces: CaCl₂(aq) + Na₂CO₃(aq) → CaCO₃(s) + 2NaCl(aq). Mix 22.2 g of CaCl₂ with 25.0 g of Na₂CO₃.', fields: [
                num('Amount of CaCl₂ =', 0.200, 'mol', { verify: { fn: 'n_m', m: 22.2, f: 'CaCl2' } }),
                num('Amount of Na₂CO₃ =', 0.236, 'mol', { verify: { fn: 'n_m', m: 25.0, f: 'Na2CO3' } }),
                sel('Limiting reagent', 'CaCl₂', ['Na₂CO₃', 'Neither — exactly the right amounts'], { verify: { fn: 'limiting', eq: 'CaCl2(aq) + Na2CO3(aq) -> CaCO3(s) + 2NaCl(aq)', reactants: [{ f: 'CaCl2', m: 22.2 }, { f: 'Na2CO3', m: 25.0 }], expect: 'CaCl2' } }),
                num('Mass of CaCO₃ produced =', 20.0, 'g', { verify: { fn: 'product', eq: 'CaCl2(aq) + Na2CO3(aq) -> CaCO3(s) + 2NaCl(aq)', reactants: [{ f: 'CaCl2', m: 22.2 }, { f: 'Na2CO3', m: 25.0 }], product: 'CaCO3' }, traps: [{ value: 0.236 * 100.1, msg: 'Use the LIMITING reagent’s moles to calculate the product.' }] })
              ] },
              { type: 'fields', heading: 'Docket B — shiny zinc pawns, cleaned in acid: Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g). 6.54 g of zinc with 100.0 mL of 1.00 mol L⁻¹ HCl.', fields: [
                sel('Limiting reagent', 'HCl', ['Zn', 'Neither — exactly the right amounts'], { verify: { fn: 'limiting', eq: 'Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g)', reactants: [{ f: 'Zn', m: 6.54 }, { f: 'HCl', c: 1.00, VmL: 100.0 }], expect: 'HCl' }, why: { 'Zn': 'Both have 0.100 mol — but the ratio is 1 Zn : 2 HCl, so 0.100 mol Zn would need 0.200 mol HCl.', 'Neither — exactly the right amounts': 'Both have 0.100 mol — but the ratio is 1 Zn : 2 HCl.' } }),
                num('Mass of hydrogen gas produced =', 0.100, 'g', { verify: { fn: 'product', eq: 'Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g)', reactants: [{ f: 'Zn', m: 6.54 }, { f: 'HCl', c: 1.00, VmL: 100.0 }], product: 'H2' } })
              ] }
            ],
            hints: [
              'Bert’s log, 1978: “Ran out of chalk halfway through a batch. Mrs T: ‘Never compare grams, Bert. Compare moles — and mind the ratio.’”',
              'Convert each reactant to moles. Divide each by its coefficient in the equation; the smaller result is the limiting reagent. Use the limiting reagent’s moles × the mole ratio to get the product’s moles, then m = n × M.',
              'Worked step: Docket A → n(CaCl₂) = 22.2 ÷ 111.1 = 0.200 mol; n(Na₂CO₃) = 25.0 ÷ 106.0 = 0.236 mol. The ratio is 1 : 1, so CaCl₂ runs out first, giving 0.200 mol CaCO₃ × 100.1 g mol⁻¹.'
            ]
          },
          { // BUDGET 1.5 min — reagent requirements (reverse stoichiometry)
            id: 'r6-rush', budget: 1.5,
            prop: { kind: 'envelope', name: 'Rush order', sub: 'telegram', front: 'A telegram marked RUSH: “TOY FAIR FRIDAY STOP NEED 50.0 G CHALK FILLER AND 13.1 G ZINC CLEANED STOP HOW MUCH TO ORDER STOP”', flip: 'Read the telegram' },
            title: 'The rush order',
            intro: 'Work backwards from what the factory needs. Use the same equations as the production dockets.',
            parts: [{ type: 'fields', fields: [
              num('Mass of Na₂CO₃ needed to make 50.0 g of CaCO₃ (with plenty of CaCl₂)', 52.9, 'g', { verify: { fn: 'reagent', eq: 'CaCl2(aq) + Na2CO3(aq) -> CaCO3(s) + 2NaCl(aq)', given: { f: 'CaCO3', m: 50.0 }, target: 'Na2CO3', out: 'm' } }),
              num('Volume of 2.00 mol L⁻¹ HCl needed to react completely with 13.1 g of zinc', 200, 'mL', { verify: { fn: 'reagent', eq: 'Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g)', given: { f: 'Zn', m: 13.1 }, target: 'HCl', out: 'VmL', c: 2.00 }, unitsMsg: 'Out by 1000 — the answer box is in mL. (V in L × 1000 = V in mL.)', traps: [{ value: 0.200, msg: 'That’s in litres. The answer box wants mL.' }, { value: 100, msg: 'Check the ratio: 1 Zn needs 2 HCl.' }] })
            ] }],
            hints: [
              'Bert’s log, 1979: “Toy fair panic. Mrs T did the sums backwards on the back of a telegram: ‘what we want → moles → ratio → what we need.’”',
              'n(wanted product) = m ÷ M. Use the mole ratio to get n(reagent). Then m = n × M, or V = n ÷ c (in L, then × 1000 for mL).',
              'Worked step: n(Zn) = 13.1 ÷ 65.4 = 0.200 mol. The ratio is Zn : HCl = 1 : 2, so n(HCl) = 0.401 mol. V = 0.401 ÷ 2.00 = 0.200 L. Now convert to mL.'
            ]
          },
          { // BUDGET 1.5 min — spot-the-error in working + corrected calculation
            id: 'r6-receipt', budget: 1.5,
            prop: { kind: 'receipt', name: 'Stamped receipt', sub: 'QC: CHECK WORKING', front: 'A receipt for a magnesium oxide order, stamped “QC — CHECK WORKING” in red. The clerk showed his working on the back.', flip: 'Turn the receipt over' },
            title: 'Check the clerk’s working',
            intro: 'The clerk calculated the mass of MgO made by burning 4.86 g of magnesium: 2Mg(s) + O₂(g) → 2MgO(s). Exactly TWO lines are wrong. Flag them, then give the correct answer.',
            parts: [
              { type: 'spot', count: 2, lines: [
                { text: 'M(Mg) = 24.3 g mol⁻¹', error: false },
                { text: 'n(Mg) = 4.86 ÷ 24.3 = 0.200 mol', error: false },
                { text: 'Mole ratio Mg : MgO = 2 : 1, so n(MgO) = 0.100 mol', error: true, fix: 'Ratio is 2 : 2 = 1 : 1, so n(MgO) = 0.200 mol' },
                { text: 'M(MgO) = 24.3 + 16.0 = 40.3 g mol⁻¹', error: false },
                { text: 'm(MgO) = M ÷ n = 40.3 ÷ 0.100 = 403 g', error: true, fix: 'm = n × M' },
                { text: 'Number of Mg atoms used = 0.200 × 6.02 × 10²³ = 1.20 × 10²³', error: false }
              ] },
              { type: 'fields', fields: [
                num('Correct mass of MgO =', 8.06, 'g', { verify: { fn: 'product', eq: '2Mg(s) + O2(g) -> 2MgO(s)', reactants: [{ f: 'Mg', m: 4.86 }], product: 'MgO' }, traps: [{ value: 4.03, msg: 'That uses the clerk’s wrong mole ratio.' }] })
              ] }
            ],
            hints: [
              'Bert’s log, 1980: “Clerk shipped 403 g of magnesium oxide from 5 g of magnesium. Mrs T asked if he’d also discovered how to make gold.”',
              'Check each line: the molar masses, n = m ÷ M, the mole ratio from the COEFFICIENTS, and m = n × M (not M ÷ n). Mass can’t grow from 4.86 g to hundreds of grams.',
              'Worked step: the coefficients are 2Mg → 2MgO, so the ratio is 1 : 1 and n(MgO) = 0.200 mol. Then m = 0.200 × 40.3.'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 7 */
      {
        id: 'r7', number: 7, name: 'The Design Studio', game: 'Shape Shifters', year: 1982,
        tagline: 'The sculpting-and-design game! Every shape has its reasons.',
        topic: 'Year 10 Chemistry — Bonding & molecules', theme: 'drafting',
        award: { symbol: 'Al', name: 'aluminium', digit: 9, color: '#6aa3b5' },
        puzzles: [
          { // BUDGET 2 min — logic grid + conceptual explanations
            id: 'r7-grid', budget: 2,
            prop: { kind: 'blueprint', name: 'Materials test sheet', sub: 'four mystery samples', front: 'A test sheet from the designers: four mystery materials (W, X, Y, Z) being tried out for new game pieces. Someone has started a logic grid in the corner.', flip: 'Read the test results' },
            title: 'Mystery materials',
            intro: 'Use the test data to decide what kind of substance each sample is. Click a grid square to mark ✓ (and again for ✗). Each sample gets exactly one ✓. Then explain three of the results.',
            parts: [
              { type: 'grid', fig: { name: 'dataTable', head: ['Sample', 'Melting point (°C)', 'Conducts as solid?', 'Conducts as liquid?', 'In water', 'Notes'], rows: [
                  ['W', '1085', 'yes', 'yes', 'insoluble', 'can be hammered into sheets and drawn into wire'],
                  ['X', '801', 'no', 'yes', 'dissolves; solution conducts', 'brittle crystals that shatter'],
                  ['Y', '−95', 'no', 'no', 'insoluble', 'clear liquid; evaporates quickly'],
                  ['Z', '1710', 'no', 'no', 'insoluble', 'extremely hard; scratches glass']] },
                rows: ['W', 'X', 'Y', 'Z'], cols: ['Ionic lattice', 'Covalent molecular', 'Covalent network', 'Metallic lattice'], answer: [3, 0, 1, 2] },
              { type: 'fields', fields: [
                sel('X conducts when molten or dissolved, but not as a solid, because…', 'its ions are held in place in the solid lattice but are free to move when melted or dissolved', ['its electrons are only delocalised when hot', 'its molecules break into atoms in water', 'solids never conduct electricity']),
                sel('W can be hammered into sheets because…', 'layers of positive ions can slide over each other while the sea of delocalised electrons keeps holding them together', ['its ions repel each other when hit', 'its molecules are held by weak forces', 'its covalent bonds are very flexible']),
                sel('Y has a very low melting point because…', 'only weak intermolecular forces between its molecules need to be overcome — the covalent bonds inside them don’t break', ['its covalent bonds are very weak', 'it has no electrons', 'its ions are very small'])
              ] }
            ],
            hints: [
              'Bert’s log, 1982: “Designers tested four new materials for pawns. One melted in my hand, one shattered, one bent, and one scratched my glasses. Mrs T knew what each one was from that alone.”',
              'Metals conduct as solids and are malleable. Ionic compounds have high melting points, are brittle, and conduct only when molten or dissolved. Covalent networks have very high melting points and don’t conduct (graphite aside). Covalent molecular substances have low melting points and don’t conduct.',
              'Worked step: Y melts at −95 °C, so only weak forces hold its particles together: covalent molecular. W conducts as a solid and bends, so it’s metallic. Now X and Z.'
            ]
          },
          { // BUDGET 2 min — Lewis structures: count electrons, bonding & lone pairs
            id: 'r7-lewis', budget: 2,
            prop: { kind: 'booklet', name: 'Sketchbook', sub: 'dot-and-cross designs', front: 'A designer’s sketchbook full of dot-and-cross drawings of molecules, planned as “Molecule Meeples”. The parts list for each is unfinished.', flip: 'Open the sketchbook' },
            title: 'Molecule meeples',
            intro: 'Draw each Lewis structure on scrap paper, then complete the parts list (count for the WHOLE molecule). A double bond is 2 bonding pairs and a triple bond is 3. Then pick the correct drawing of CO₂.',
            parts: [
              { type: 'fields', layout: 'table', columns: ['Total valence electrons', 'Bonding pairs', 'Lone pairs'],
                rows: [
                  { label: 'NH₃', cells: lewis(8, 3, 1, 'NH3') },
                  { label: 'H₂O', cells: lewis(8, 2, 2, 'H2O') },
                  { label: 'CO₂', cells: lewis(16, 4, 4, 'CO2') },
                  { label: 'CH₄', cells: lewis(8, 4, 0, 'CH4') },
                  { label: 'HCl', cells: lewis(8, 1, 3, 'HCl') }
                ] },
              { type: 'fields', fig: { name: 'lewisChoices' }, fields: [
                sel('Which sketch is the correct Lewis structure of CO₂?', 'Sketch A', ['Sketch B', 'Sketch C'], { why: { 'Sketch B': 'Count the electrons in Sketch B: it uses 20, but CO₂ only has 16 valence electrons.', 'Sketch C': 'In Sketch C, carbon is surrounded by 5 pairs — more than an octet.' } })
              ] }
            ],
            hints: [
              'Bert’s log, 1983: “Molecule Meeples prototype. Mrs T counted dots on every sketch. ‘Every atom wants eight, Bert — except hydrogen, who is happy with two.’”',
              'Valence electrons = the last digit of the group number (H 1, C 4, N 5, O 6, Cl 7). Add them up and halve to get the total pairs. Bonding pairs = the number of bonds (double = 2). Lone pairs = total pairs − bonding pairs.',
              'Worked step: NH₃ → 5 + 3 × 1 = 8 electrons = 4 pairs. Three N–H bonds = 3 bonding pairs, so 1 lone pair. HCl → 1 + 7 = 8 electrons = 4 pairs; 1 bond, so 3 lone pairs (all on Cl).'
            ]
          },
          { // BUDGET 2 min — VSEPR names + diagrams
            id: 'r7-vsepr', budget: 2,
            prop: { kind: 'card', name: 'Shape cards', sub: 'unnamed', front: 'Five ink drawings of molecule shapes on thick card, with no names. A sticky note says: “Name the shapes, then tell me which meeple gets which mould.”', flip: 'Lay out the shape cards' },
            title: 'Shape Shifters',
            intro: 'First name each shape card (drag a name onto it). Then, for each molecule, count the electron groups (pairs) around the central atom and choose its shape.',
            parts: [
              { type: 'slots', layout: 'list',
                tiles: [
                  { id: 'lin', label: 'linear' }, { id: 'tp', label: 'trigonal planar' }, { id: 'tet', label: 'tetrahedral' },
                  { id: 'pyr', label: 'trigonal pyramidal' }, { id: 'bent', label: 'bent (V-shaped)' }, { id: 'oct', label: 'octahedral' }
                ],
                slots: [
                  { id: 'A', label: 'Card A', fig: { name: 'shape', kind: 'bent' }, answer: 'bent' },
                  { id: 'B', label: 'Card B', fig: { name: 'shape', kind: 'tetrahedral' }, answer: 'tet' },
                  { id: 'C', label: 'Card C', fig: { name: 'shape', kind: 'linear' }, answer: 'lin' },
                  { id: 'D', label: 'Card D', fig: { name: 'shape', kind: 'pyramidal' }, answer: 'pyr' },
                  { id: 'E', label: 'Card E', fig: { name: 'shape', kind: 'planar' }, answer: 'tp' }
                ] },
              { type: 'fields', layout: 'table', columns: ['Electron groups around central atom', 'Shape'],
                rows: [
                  { label: 'CH₄', cells: [exact('groups', 4), shapeSel('tetrahedral')] },
                  { label: 'NH₃', cells: [exact('groups', 4), shapeSel('trigonal pyramidal')] },
                  { label: 'H₂O', cells: [exact('groups', 4), shapeSel('bent (V-shaped)')] },
                  { label: 'CO₂', cells: [exact('groups', 2, { wrong: 'A double bond counts as ONE electron group.' }), shapeSel('linear')] },
                  { label: 'BF₃', cells: [exact('groups', 3, { wrong: 'Boron has 3 bonding pairs and no lone pairs.' }), shapeSel('trigonal planar')] }
                ] }
            ],
            hints: [
              'Bert’s log, 1984: “Mrs T says electron pairs are like balloons tied together — they push each other as far apart as they can. Then you only name the shape made by the ATOMS.”',
              'VSEPR: count electron groups around the central atom (a single, double or triple bond counts as ONE group; each lone pair is one group). 2 → linear. 3 → trigonal planar. 4 with 0 lone pairs → tetrahedral, with 1 → trigonal pyramidal, with 2 → bent.',
              'Worked step: NH₃ has 3 bonds + 1 lone pair = 4 groups, arranged tetrahedrally. But you only “see” the atoms: a pyramid with N on top — trigonal pyramidal. H₂O has 2 bonds + 2 lone pairs, so it’s bent.'
            ]
          },
          { // BUDGET 1.5 min — bond polarity (calc ΔEN) + molecular polarity
            id: 'r7-polar', budget: 1.5,
            prop: { kind: 'spinner', name: 'Polarity compass', sub: 'magnetic-looking', front: 'A brass-look compass from the game. Its needle is labelled “δ+” and “δ−”. Round the rim: “Find the tug-of-war — then see if it cancels.”', flip: 'Spin the compass' },
            title: 'The polarity compass',
            intro: 'Use the electronegativity values (Data Booklet) and the rule card: ΔEN below 0.5 → non-polar covalent; 0.5 to 1.7 → polar covalent; above 1.7 → ionic. Then sort the molecules.',
            parts: [
              { type: 'slots', layout: 'bins', fig: { name: 'enMini' },
                tiles: [
                  { id: 'b1', label: 'C–H', bond: ['C', 'H'] }, { id: 'b2', label: 'Cl–Cl', bond: ['Cl', 'Cl'] }, { id: 'b3', label: 'O–H', bond: ['O', 'H'] },
                  { id: 'b4', label: 'N–H', bond: ['N', 'H'] }, { id: 'b5', label: 'C=O', bond: ['C', 'O'] }, { id: 'b6', label: 'Na–Cl', bond: ['Na', 'Cl'] }, { id: 'b7', label: 'Mg–O', bond: ['Mg', 'O'] }
                ],
                slots: [
                  { id: 'np', label: 'Non-polar covalent (ΔEN < 0.5)', answer: ['b1', 'b2'] },
                  { id: 'p', label: 'Polar covalent (ΔEN 0.5–1.7)', answer: ['b3', 'b4', 'b5'] },
                  { id: 'i', label: 'Ionic (ΔEN > 1.7)', answer: ['b6', 'b7'] }
                ] },
              { type: 'slots', layout: 'bins',
                tiles: [
                  { id: 'm1', label: 'H₂O (bent)' }, { id: 'm2', label: 'NH₃ (trigonal pyramidal)' }, { id: 'm3', label: 'CHCl₃ (tetrahedral)' },
                  { id: 'm4', label: 'CO₂ (linear)' }, { id: 'm5', label: 'CH₄ (tetrahedral)' }, { id: 'm6', label: 'CCl₄ (tetrahedral)' }
                ],
                slots: [
                  { id: 'pol', label: 'Polar molecule', answer: ['m1', 'm2', 'm3'] },
                  { id: 'non', label: 'Non-polar molecule', answer: ['m4', 'm5', 'm6'] }
                ] },
              { type: 'fields', fields: [
                sel('CO₂ has polar C=O bonds but is a non-polar molecule because…', 'it is linear and symmetrical, so the two bond dipoles point in opposite directions and cancel', ['carbon and oxygen have the same electronegativity', 'double bonds are never polar', 'it has lone pairs on the carbon atom'])
              ] }
            ],
            hints: [
              'Bert’s log, 1985: “Mrs T and Rosie played tug-of-war with two of us pulling on each side. Nobody moved. ‘That’s carbon dioxide,’ said Mrs T. Rosie said ‘That’s boring.’”',
              'ΔEN = the difference between the two electronegativity values. A molecule is polar if it has polar bonds AND an unsymmetrical shape (or lone pairs on the central atom), so the dipoles don’t cancel.',
              'Worked step: O–H → 3.4 − 2.2 = 1.2, polar covalent. C–H → 2.6 − 2.2 = 0.4, non-polar. CCl₄ has four identical polar bonds pointing symmetrically, so they cancel: non-polar. CHCl₃ has one C–H instead, so they don’t cancel.'
            ]
          },
          { // BUDGET 1.5 min — intermolecular forces: order bp + explain + solubility
            id: 'r7-imf', budget: 1.5,
            prop: { kind: 'board', name: 'Melting-race board', sub: '“First to boil loses!”', front: 'A board game where four counters race up a thermometer track. The rules say the counter with the WEAKEST forces between its particles boils first and loses.', flip: 'Set up the race' },
            title: 'The boiling race',
            intro: 'Line the racers up from LOWEST to HIGHEST boiling point, name the strongest attraction between the particles of each, then answer the two dissolving questions.',
            parts: [
              { type: 'order', topLabel: 'LOWEST boiling point', bottomLabel: 'HIGHEST boiling point',
                items: [{ id: 'F2', label: 'F₂' }, { id: 'HCl', label: 'HCl' }, { id: 'H2O', label: 'H₂O' }, { id: 'NaCl', label: 'NaCl' }],
                answer: ['F2', 'HCl', 'H2O', 'NaCl'],
                rules: [{ a: 'HCl', b: 'H2O', msg: 'Water has hydrogen bonding (H bonded to O), which is stronger than HCl’s dipole–dipole attraction.' }, { a: 'H2O', b: 'NaCl', msg: 'NaCl is an ionic lattice: boiling it means overcoming strong ionic bonds, not just intermolecular forces.' }] },
              { type: 'fields', layout: 'table', columns: ['Strongest attraction between particles'],
                rows: [
                  { label: 'F₂', cells: [imfSel('dispersion forces')] },
                  { label: 'HCl', cells: [imfSel('dipole–dipole attractions')] },
                  { label: 'H₂O', cells: [imfSel('hydrogen bonding')] },
                  { label: 'NaCl', cells: [imfSel('ionic bonding')] }
                ] },
              { type: 'fields', fields: [
                sel('Salt (NaCl) dissolves in water because…', 'water molecules are polar, so their δ− and δ+ ends attract the Na⁺ and Cl⁻ ions and pull them out of the crystal', ['the water melts the salt crystals', 'NaCl molecules form hydrogen bonds with water', 'the ions react with water to make new substances']),
                sel('Candle wax (non-polar) does not dissolve in water because…', 'water molecules attract each other strongly by hydrogen bonding and wax can’t form attractions that strong with water', ['wax molecules are too big to fit between water molecules', 'wax is an ionic compound', 'wax has a higher boiling point than water'])
              ] }
            ],
            hints: [
              'Bert’s log, 1986: “Race board kept giving water the win. Rosie said it was cheating. Mrs T said water has ‘very sticky hydrogens’.”',
              'From weakest to strongest: dispersion forces (all molecules) < dipole–dipole (polar molecules) < hydrogen bonding (H bonded to N, O or F) < ionic bonds in a lattice. Stronger attractions → higher melting and boiling points. “Like dissolves like.”',
              'Worked step: F₂ is non-polar, so it has dispersion forces only and the lowest boiling point. HCl is polar (dipole–dipole). H₂O has H–O bonds, so hydrogen bonding. NaCl is held by ionic bonds — highest of all.'
            ]
          }
        ]
      },

      /* -------------------------------------------------------------- ROOM 8 */
      {
        id: 'r8', number: 8, name: 'The Archive', game: 'Trend Setters', year: 1987,
        tagline: 'The card-filing game! File it right and the trend is your friend.',
        topic: 'Year 10 Chemistry — The periodic table & trends', theme: 'archive',
        award: { symbol: 'P', name: 'phosphorus', digit: 6, color: '#d27d6a' },
        puzzles: [
          { // BUDGET 2.5 min — trend + explanation matching (conceptual)
            id: 'r8-files', budget: 2.5,
            prop: { kind: 'drawer', name: 'Filing drawer', sub: '8 trend cards', front: 'A long wooden filing drawer of index cards. Each card names a periodic trend; each needs a direction AND a reason before it can be filed.', flip: 'Pull out the drawer' },
            title: 'File the trends',
            intro: 'For each card, choose the direction of the trend and the reason card (R1–R6) that best EXPLAINS it. Reason cards can be used more than once.',
            parts: [{ type: 'fields', layout: 'table', fig: { name: 'reasons' }, columns: ['Direction', 'Reason card'],
              rows: [
                { label: 'Atomic radius ACROSS period 3 (Na → Cl)', cells: [dir('decreases'), rsn('R1')] },
                { label: 'Atomic radius DOWN group 1 (Li → Cs)', cells: [dir('increases'), rsn('R2')] },
                { label: 'Electronegativity ACROSS period 2 (Li → F)', cells: [dir('increases'), rsn('R1')] },
                { label: 'Electronegativity DOWN group 17 (F → I)', cells: [dir('decreases'), rsn('R2')] },
                { label: '1st ionisation energy ACROSS a period (general trend)', cells: [dir('increases'), rsn('R1')] },
                { label: '1st ionisation energy DOWN a group', cells: [dir('decreases'), rsn('R2')] },
                { label: 'Na⁺ compared with a Na atom', cells: [sel('size', 'smaller', ['larger', 'same size']), rsn('R3')] },
                { label: 'Cl⁻ compared with a Cl atom', cells: [sel('size', 'larger', ['smaller', 'same size']), rsn('R4')] }
              ] }],
            hints: [
              'Bert’s log, 1987: “Re-filed the archive. Mrs T: ‘Only three things matter, Bert — how many protons, how many shells, and how much shielding. Everything else is a red herring.’ (R5 and R6 are red herrings.)”',
              'Across a period: protons increase but electrons go into the SAME shell (similar shielding), so the electrons are pulled closer and held more tightly. Down a group: a NEW SHELL is added, so the outer electrons are further away and more shielded. Ions: losing a whole outer shell shrinks the ion; extra electrons repel each other and it grows.',
              'Worked step: atomic radius across period 3 → decreases, because of R1 (more protons, same shell). Ionisation energy down a group → decreases, because of R2 (the outer electron is further out and more shielded, so it’s easier to remove).'
            ]
          },
          { // BUDGET 1.5 min — ranking (ionisation energy, electronegativity)
            id: 'r8-rank', budget: 1.5,
            prop: { kind: 'tuckbox', name: 'Trend Setters deck', sub: 'two hands to sort', front: 'The game deck. Two hands of element cards are clipped together with a note: “Sort each hand — this is how you win the game.”', flip: 'Unclip the two hands' },
            title: 'Sort the hands',
            intro: 'Sort each hand in the order shown. Drag, or use ▲ ▼.',
            parts: [
              { type: 'order', heading: 'Hand 1 — first ionisation energy', topLabel: 'LOWEST 1st ionisation energy', bottomLabel: 'HIGHEST',
                items: ['K', 'Na', 'Mg', 'S', 'Cl', 'Ar'].map(function (s) { return { id: s, label: s }; }),
                answer: ['K', 'Na', 'Mg', 'S', 'Cl', 'Ar'],
                rules: [{ a: 'K', b: 'Na', msg: 'K’s outer electron is in the 4th shell, further out and more shielded than Na’s, so it’s easier to remove.' }, { a: 'Cl', b: 'Ar', msg: 'Noble gases have the highest ionisation energy in their period.' }] },
              { type: 'order', heading: 'Hand 2 — electronegativity', topLabel: 'LOWEST electronegativity', bottomLabel: 'HIGHEST',
                items: ['K', 'Na', 'Mg', 'C', 'N', 'F'].map(function (x) { return { id: x, label: x }; }),
                answer: ['K', 'Na', 'Mg', 'C', 'N', 'F'],
                rules: [{ a: 'K', b: 'Na', msg: 'Electronegativity decreases DOWN a group, so K (period 4) is lower than Na (period 3).' }, { a: 'N', b: 'F', msg: 'Fluorine is the most electronegative element of all.' }] },
              { type: 'fields', fields: [
                sel('Why is fluorine the most electronegative element?', 'Its bonding electrons are close to the nucleus (only 2 shells), with little shielding and the most protons in its period', ['It has the most electrons of any element', 'It is the heaviest non-metal', 'It has a full outer shell'])
              ] }
            ],
            hints: [
              'Bert’s log, 1988: “Rosie beat me at Trend Setters nine times in a row. Her secret: ‘Count the shells first, Bert, THEN the protons.’”',
              'Ionisation energy increases across a period and decreases down a group. The noble gas is the highest in its period; a period 4 metal is lowest. Electronegativity follows the same pattern: up and to the right (fluorine) is highest.',
              'Worked step: K (period 4, group 1) is lowest, then Na (period 3, group 1). Across period 3, Mg < S < Cl < Ar. Hand 2: K is lowest, then Na, then across the table to F.'
            ]
          },
          { // BUDGET 1.5 min — spot-the-error explanations
            id: 'r8-homework', budget: 1.5,
            prop: { kind: 'booklet', name: 'Rosie’s homework', sub: 'Year 10, 1996', front: 'An exercise book: “Rosie Thistlewood, 10C — Periodicity”. Tucked in the archive, with a teacher’s note: “3 statements need fixing!” She must have come back to visit.', flip: 'Open the exercise book' },
            title: 'Rosie’s homework',
            intro: 'Rosie’s teacher said exactly THREE statements are wrong. The trend might be right but the REASON wrong — read carefully! Flag them.',
            parts: [
              { type: 'spot', count: 3, lines: [
                { text: 'Atomic radius decreases across period 3 because more protons pull electrons in the same shell closer.', error: false },
                { text: 'Fluorine is more electronegative than iodine because fluorine has more protons.', error: true, fix: 'Iodine has more protons; fluorine’s bonding electrons are closer to the nucleus and less shielded.' },
                { text: 'Potassium has a lower first ionisation energy than sodium because its outer electron is further from the nucleus and more shielded.', error: false },
                { text: 'A Mg²⁺ ion is larger than a Mg atom because it has a positive charge.', error: true, fix: 'Mg²⁺ is smaller: it has lost its whole outer shell.' },
                { text: 'Electronegativity increases across a period because the atoms get bigger.', error: true, fix: 'Atoms get SMALLER across a period; more protons attract the bonding electrons more strongly.' },
                { text: 'The noble gas in each period has the highest first ionisation energy in that period.', error: false }
              ] }
            ],
            hints: [
              'Bert’s log, 1996: “Rosie came by after school with her homework. Three red crosses. Mrs T said, ‘The TREND was right, darling — check the BECAUSE.’”',
              'Check each statement twice: (1) is the trend right? (2) does the reason use the right idea — protons, shells or shielding? Remember iodine has MORE protons than fluorine, and positive ions are SMALLER than their atoms.',
              'Worked step: “Fluorine is more electronegative than iodine” is a true trend, but “because fluorine has more protons” is false — iodine has 53 protons. That’s one error. Now look hard at the Mg²⁺ line and the “bigger atoms” line.'
            ]
          }
        ]
      }
    ]
  };

  /* ---- small builders used above (kept here so the content stays readable) ---- */
  function pne(p, n, e, sym, A, charge) {
    return [
      exact('protons', p, { wrong: 'Protons = atomic number Z (look it up). The charge doesn’t change it.', verify: { fn: 'pne', sym: sym, A: A, charge: charge, what: 'p' } }),
      exact('neutrons', n, { wrong: 'Neutrons = mass number − atomic number (A − Z).', verify: { fn: 'pne', sym: sym, A: A, charge: charge, what: 'n' } }),
      exact('electrons', e, { wrong: charge === 0 ? 'A neutral atom has as many electrons as protons.' : (charge > 0 ? 'A positive ion has LOST electrons: electrons = Z − charge.' : 'A negative ion has GAINED electrons: electrons = Z + size of the charge.'), verify: { fn: 'pne', sym: sym, A: A, charge: charge, what: 'e' } })
    ];
  }
  function lewis(ve, bp, lp, f) {
    return [
      exact('valence e⁻', ve, { wrong: 'Add up the valence electrons: H 1, C 4, N 5, O 6, Cl 7.', verify: { fn: 'valence', f: f } }),
      exact('bonding pairs', bp, { wrong: 'Count bonds: single = 1 pair, double = 2, triple = 3.', verify: { fn: 'lewis', f: f, ve: ve, bp: bp, lp: lp } }),
      exact('lone pairs', lp, { wrong: 'Lone pairs = (total valence electrons ÷ 2) − bonding pairs.' })
    ];
  }
  function shapeSel(ans) { return sel('shape', ans, ['linear', 'trigonal planar', 'tetrahedral', 'trigonal pyramidal', 'bent (V-shaped)'].filter(function (x) { return x !== ans; })); }
  function imfSel(ans) { return sel('IMF', ans, ['dispersion forces', 'dipole–dipole attractions', 'hydrogen bonding', 'ionic bonding'].filter(function (x) { return x !== ans; }), { why: { 'hydrogen bonding': 'Hydrogen bonding needs H bonded directly to N, O or F.' } }); }
  function dir(ans) { return sel('direction', ans, [ans === 'increases' ? 'decreases' : 'increases', 'stays the same']); }
  function rsn(ans) {
    return sel('reason', ans, ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].filter(function (x) { return x !== ans; }), { noShuffle: true, why: { R5: 'Mass has nothing to do with it — think about charge and distance.', R6: 'Neutrons have no charge, so they can’t shield electrons.' } });
  }

  /* Reason cards for the Archive (displayed by the 'reasons' figure) */
  CONTENT.reasons = {
    R1: 'More protons in the nucleus, while electrons are added to the SAME shell (shielding stays about the same), so the outer electrons are pulled closer and held more tightly.',
    R2: 'An extra electron SHELL is added, so the outer electrons are further from the nucleus and more shielded by inner electrons.',
    R3: 'Losing electrons empties the outer shell; the remaining electrons are pulled closer by the same number of protons.',
    R4: 'The extra electron increases repulsion between electrons, while the number of protons stays the same, so the electron cloud spreads out.',
    R5: 'The atoms get heavier, and heavier atoms pull their electrons closer.',
    R6: 'Extra neutrons shield the outer electrons from the nucleus.'
  };

  if (typeof module === 'object' && module.exports) module.exports = CONTENT;
  else root.GAME_CONTENT = CONTENT;
})(typeof self !== 'undefined' ? self : this);
