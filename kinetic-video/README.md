# Kinetic particle model: Manim explainer (Year 10)

A ~3-minute explainer video for Year 10 Physics (Queensland, Australian
Curriculum) on the kinetic particle model. It has seven Manim scenes, offline
neural TTS narration and burned-in subtitles.

- **Narration script, with timings:** [`SCRIPT.md`](SCRIPT.md). The source text is in `narration.py`.
- **Low-quality previews (480p15):** `out/preview/S*.mp4` (one per scene) and
  `out/preview/kinetic_particle_model.mp4` (all scenes joined).

| # | Scene | Learning goal / misconception targeted |
|---|-------|-----------------------------------------|
| 1 | `S1_Hook` | Balloon shrinks in the freezer: "what's going on inside?" |
| 2 | `S2_Motion` | All matter is particles in constant random motion (traced zigzag path) |
| 3 | `S3_States` | Solid / liquid / gas arrangement, spacing, motion. Misconceptions: *solid particles are stationary* and *the space between gas particles is air* |
| 4 | `S4_Heating` | Temperature slider, a speed histogram that shifts right, temperature ∝ average KE. Misconception: *particles expand when heated* |
| 5 | `S5_Pressure` | Wall collisions flash and are counted; a hotter gas gives more hits that are also harder |
| 6 | `S6_Balloon` | Hook explained: inside and outside push arrows, the balloon shrinks until the pushes balance |
| 7 | `S7_Recap` | Three key points |

Colour code: solid = blue, liquid = teal, gas = orange. Neutral grey is used in
scene 2, where the particles are not tied to one state. Particles are plain
circles with the same radius in every scene and are only ever labelled
"particle".

## How it works

1. `tts.py` synthesises each sentence with Kokoro (voice `bf_emma`) and writes
   `build/audio/<scene>.wav` and `build/timings.json`.
2. Each scene in `scenes.py` subclasses `NarratedScene`, which calls
   `self.until(beat, sentence)` to hold animations until that line of narration
   starts. Every scene is therefore timed to its own audio.
3. `common.py` holds the particle physics. Gases use elastic hard-disc collisions,
   liquids use soft repulsion plus weak attraction, gravity and thermal noise,
   and solids oscillate about fixed lattice sites.
4. `build.py` renders each scene, muxes it with its narration, joins the scenes
   and burns in the subtitles (one caption per spoken sentence).

## Build

```bash
pip install -r requirements.txt          # also needs ffmpeg (with libass) and the Inter font
# Kokoro model files (from github.com/thewh1teagle/kokoro-onnx releases) go in /opt/voices/
python tts.py                            # narration + timings
python build.py --quality l              # 480p previews  -> out/preview/
python build.py --quality h              # final 1080p60   -> out/final/
python build.py --quality l S3_States    # re-render a single scene
```

Teaching note: in scene 6 the balloon shrinks more than it would in real life.
A real freezer shrinks it by about 10–15 % in volume, but the effect is
exaggerated so it is visible on screen.
