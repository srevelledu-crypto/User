"""Narration script for the kinetic particle model explainer (Year 10, Qld).

Each scene is a list of *beats*. A beat is one idea on screen; the Manim scene
waits for each beat's start time, so animation stays in sync with the voice.
Each beat is split into sentences for TTS and subtitles (one subtitle per
sentence, so every caption matches exactly what is being said).
"""

SCENES = {
    "S1_Hook": [
        "Here's a balloon, blown up at room temperature.",
        "Put it in the freezer for an hour, and it comes out noticeably smaller.",
        "Leave it on the bench, and it slowly puffs back up.",
        "No air got in or out. Same balloon, same air. So what's going on inside?",
    ],
    "S2_Motion": [
        "Everything around you, solids, liquids and gases, is made of tiny particles.",
        "We'll draw each particle as a simple circle.",
        "And these particles are never still. They're in constant, random motion.",
        "Follow just one, and its path is a jumble of zigzags. "
        "It changes direction every time it bumps into a neighbour.",
    ],
    "S3_States": [
        "The particle model explains the three states of matter.",
        "In a solid, particles are packed tightly in fixed positions.",
        "But they're not stationary. Each one vibrates on the spot, all the time.",
        "In a liquid, particles are still close together, but they can slide past each other. "
        "That's why liquids flow.",
        "In a gas, particles are far apart. They move fast, in straight lines, until they hit something.",
        "And the space between gas particles? It's empty. Not air. Nothing at all. "
        "The particles are the air.",
    ],
    "S4_Heating": [
        "Now let's heat a gas.",
        "As the temperature rises, the particles move faster.",
        "This graph shows how many particles have each speed. "
        "As we heat the gas, the whole graph shifts to the right.",
        "Temperature is a measure of the average kinetic energy of the particles. "
        "Hotter means faster, on average.",
        "Notice what doesn't change: the size of each particle. "
        "Particles don't expand when heated. They just speed up.",
    ],
    "S5_Pressure": [
        "Gas particles keep crashing into the walls of their container. "
        "Watch the walls light up with every hit.",
        "Each hit is a tiny push. Countless pushes every second add up to gas pressure.",
        "Heat the gas, and the particles hit the walls more often, and harder.",
        "More hits, and harder hits, mean higher pressure.",
    ],
    "S6_Balloon": [
        "So, back to the balloon.",
        "In the freezer, the air particles inside slow down. "
        "They hit the rubber less often, and less hard.",
        "The push from inside drops below the push from the air outside, "
        "so the balloon shrinks until the pushes balance.",
        "Same number of particles. Same size particles. Just slower.",
        "Warm it up, the particles speed up again, and the balloon puffs back out.",
    ],
    "S7_Recap": [
        "Let's recap.",
        "One. All matter is made of particles in constant, random motion, even in solids.",
        "Two. Solids, liquids and gases differ in how close the particles are, and how they move.",
        "Three. Temperature measures the average kinetic energy of the particles. "
        "Heating makes them faster, not bigger.",
    ],
}

SCENE_ORDER = list(SCENES)

# Words the TTS voice needs help pronouncing; subtitles keep the original text.
PRONUNCIATION = {}
