"""Shared style, narration timing and particle simulations for all scenes."""
import json
from pathlib import Path

import numpy as np
from manim import (
    DOWN, LEFT, RIGHT, UP, Arrow, Dot, Line, Scene, Text, VGroup, always_redraw,
)

ROOT = Path(__file__).parent
TIMINGS = ROOT / "build" / "timings.json"

# ---------------------------------------------------------------- style ----
BG = "#0E1117"
FG = "#E8ECF1"
MUTED = "#8B95A5"
SOLID = "#5AA9FF"    # blue
LIQUID = "#3DDBB0"   # teal
GAS = "#FFA940"      # orange
NEUTRAL = "#D5DBE3"  # generic particles (no particular state)
HILITE = "#FFE066"   # highlighted particle / path
HOT = "#FF5A5A"
COLD = "#7CC7FF"
RUBBER = "#FF5D8F"
FONT = "Inter"

R = 0.12  # particle radius used in every scene: particles never change size

# Keep everything above this y so burned-in subtitles never cover it.
SAFE_BOTTOM = -2.75


def T(text, size=30, color=FG, weight="NORMAL", **kw):
    return Text(text, font=FONT, font_size=size, color=color, weight=weight, **kw)


def particle_label(target, label_pos, text="particle", color=FG):
    """Fixed label with an arrow that tracks a (possibly moving) particle."""
    label = T(text, 24, color).move_to(label_pos)

    def make_arrow():
        tgt = target.get_center()
        src = label.get_center()
        u = (tgt - src) / (np.linalg.norm(tgt - src) + 1e-9)
        # leave the label from its side or top/bottom edge, whichever faces the target
        gap = label.width / 2 + 0.08 if abs(u[0]) > 0.6 else label.height / 2 + 0.1
        start = src + u * gap
        return Arrow(start, tgt - u * (R + 0.03), buff=0, stroke_width=3, color=color,
                     max_tip_length_to_length_ratio=0.12, tip_length=0.16)

    return VGroup(label, always_redraw(make_arrow))


# ------------------------------------------------------ narration timing ----
class NarratedScene(Scene):
    KEY = None

    def setup(self):
        self.camera.background_color = BG
        data = json.loads(TIMINGS.read_text())[self.KEY]
        self.beats = data["beats"]
        self.total = data["total"]

    @property
    def now(self):
        return self.renderer.time

    def t_of(self, beat, sentence=0, offset=0.0):
        return self.beats[beat]["sentences"][sentence]["start"] + offset

    def until(self, beat, sentence=0, offset=0.0):
        """Wait until a given beat/sentence of the narration starts."""
        dt = self.t_of(beat, sentence, offset) - self.now
        if dt > 1 / 30:
            self.wait(dt)

    def left(self, beat, sentence=0, offset=0.0, minimum=0.3):
        """Seconds from now until a beat starts (for sizing run_time)."""
        return max(minimum, self.t_of(beat, sentence, offset) - self.now)

    def finish(self):
        dt = self.total - self.now
        if dt > 1 / 30:
            self.wait(dt)


# --------------------------------------------------------- simulations ----
class ParticleSim:
    """2-D hard-disc particles in a rectangle or circle.

    mode="gas":    ballistic motion, elastic collisions (walls + each other)
    mode="liquid": soft repulsion + weak attraction + gravity + thermal noise
    """

    def __init__(self, n, bounds, r=R, speed=1.5, seed=0, mode="gas",
                 collide=True, circle=None, positions=None):
        self.rng = np.random.default_rng(seed)
        self.r = r
        self.mode = mode
        self.collide = collide
        self.bounds = bounds          # (xmin, xmax, ymin, ymax) or None
        self.circle = circle          # (cx, cy, radius_fn) or None
        self.speed_scale = 1.0
        self.paused = False
        self.hits = []                # (x, y, nx, ny, speed) since last read
        self.hit_count = 0
        self.t = 0.0
        if positions is None:
            positions = self._place(n)
        self.pos = np.array(positions, dtype=float)
        n = len(self.pos)
        ang = self.rng.uniform(0, 2 * np.pi, n)
        spd = self.rng.rayleigh(speed / 1.25, n)
        self.v = np.c_[np.cos(ang), np.sin(ang)] * spd[:, None]

    def _place(self, n):
        pts = []
        tries = 0
        while len(pts) < n and tries < 20000:
            tries += 1
            if self.circle:
                cx, cy, rf = self.circle
                rad = rf() - self.r * 1.5
                a, d = self.rng.uniform(0, 2 * np.pi), rad * np.sqrt(self.rng.uniform())
                p = np.array([cx + d * np.cos(a), cy + d * np.sin(a)])
            else:
                x0, x1, y0, y1 = self.bounds
                p = self.rng.uniform([x0 + self.r, y0 + self.r], [x1 - self.r, y1 - self.r])
            if all(np.hypot(*(p - q)) > 2.3 * self.r for q in pts):
                pts.append(p)
        return pts

    def set_speed_scale(self, s):
        if s > 0 and self.speed_scale > 0:
            self.v *= s / self.speed_scale
        self.speed_scale = s

    def step(self, dt):
        if self.paused or dt <= 0:
            return
        n_sub = max(1, int(np.ceil(dt / 0.004)))
        h = dt / n_sub
        for _ in range(n_sub):
            self._substep(h)

    def _substep(self, h):
        r = self.r
        if self.mode == "liquid":
            self._liquid_forces(h)
        self.pos += self.v * h
        self.t += h
        # walls
        if self.bounds:
            x0, x1, y0, y1 = self.bounds
            for axis, lo, hi in ((0, x0, x1), (1, y0, y1)):
                m = self.pos[:, axis] < lo + r
                if m.any():
                    self._wall_hits(m, axis, -1)
                    self.pos[m, axis] = lo + r
                    self.v[m, axis] = np.abs(self.v[m, axis])
                m = self.pos[:, axis] > hi - r
                if m.any():
                    self._wall_hits(m, axis, +1)
                    self.pos[m, axis] = hi - r
                    self.v[m, axis] = -np.abs(self.v[m, axis])
        if self.circle:
            cx, cy, rf = self.circle
            rad = rf() - r
            d = self.pos - [cx, cy]
            dist = np.hypot(d[:, 0], d[:, 1])
            m = dist > rad
            if m.any():
                nrm = d[m] / dist[m, None]
                vn = np.sum(self.v[m] * nrm, axis=1)
                out = vn > 0
                for (px, py), (nx, ny), s in zip(self.pos[m][out], nrm[out], vn[out]):
                    self.hits.append((px, py, nx, ny, s))
                    self.hit_count += 1
                self.v[m] -= 2 * np.maximum(vn, 0)[:, None] * nrm
                self.pos[m] = np.array([cx, cy]) + nrm * rad
        # particle-particle collisions (equal masses, elastic)
        if self.collide and self.mode == "gas":
            d = self.pos[:, None, :] - self.pos[None, :, :]
            d2 = np.sum(d * d, axis=2)
            ii, jj = np.nonzero(np.triu(d2 < (2 * r) ** 2, 1))
            for i, j in zip(ii, jj):
                dx = self.pos[i] - self.pos[j]
                dv = self.v[i] - self.v[j]
                dist2 = dx @ dx
                if dist2 == 0:
                    continue
                approach = dv @ dx
                if approach < 0:
                    imp = approach / dist2 * dx
                    self.v[i] -= imp
                    self.v[j] += imp
                    # separate overlapping pair
                    dist = np.sqrt(dist2)
                    corr = (2 * r - dist) / 2 * dx / dist
                    self.pos[i] += corr
                    self.pos[j] -= corr

    def _wall_hits(self, mask, axis, sign):
        for p, v in zip(self.pos[mask], self.v[mask]):
            nrm = [sign, 0] if axis == 0 else [0, sign]
            self.hits.append((p[0], p[1], nrm[0], nrm[1], abs(v[axis])))
            self.hit_count += 1

    def _liquid_forces(self, h):
        r = self.r
        d = self.pos[:, None, :] - self.pos[None, :, :]
        dist = np.sqrt(np.sum(d * d, axis=2)) + np.eye(len(self.pos))
        u = d / dist[:, :, None]
        sigma = 2.05 * r
        f = np.zeros_like(dist)
        rep = dist < sigma
        f[rep] = 900.0 * (sigma - dist[rep])                  # soft repulsion
        att = (dist >= sigma) & (dist < 1.45 * sigma)
        f[att] = -18.0 * (dist[att] - sigma)                   # weak attraction
        np.fill_diagonal(f, 0)
        acc = np.sum(f[:, :, None] * u, axis=1)
        acc[:, 1] -= 6.0                                        # gravity
        # Langevin thermostat: damping + random kicks keep it "warm"
        gamma, temp = 2.5, 0.9 * self.speed_scale ** 2
        noise = self.rng.normal(0, np.sqrt(2 * gamma * temp / h), self.v.shape)
        self.v += (acc - gamma * self.v + noise) * h

    def take_hits(self):
        h, self.hits = self.hits, []
        return h


def sim_dots(sim, color, z=2):
    """VGroup of Dots that follow a ParticleSim (steps the sim every frame)."""
    g = VGroup(*[Dot([*p, 0], radius=sim.r, color=color, stroke_width=0) for p in sim.pos])
    g.set_z_index(z)

    def upd(m, dt):
        sim.step(dt)
        for dot, p in zip(m, sim.pos):
            dot.move_to([p[0], p[1], 0])

    g.add_updater(upd)
    return g


class Vibrator:
    """Solid: particles oscillate about fixed lattice sites."""

    def __init__(self, homes, amp=0.035, seed=1):
        rng = np.random.default_rng(seed)
        self.homes = np.array(homes, dtype=float)
        n = len(self.homes)
        self.w = rng.uniform(9, 15, (n, 2))
        self.phi = rng.uniform(0, 2 * np.pi, (n, 2))
        self.w2 = rng.uniform(5, 8, (n, 2))
        self.amp = amp
        self.t = 0.0
        self.r = R

    @property
    def pos(self):
        s = self.amp * (0.7 * np.sin(self.w * self.t + self.phi)
                        + 0.3 * np.sin(self.w2 * self.t + 2 * self.phi))
        return self.homes + s

    def step(self, dt):
        self.t += dt


def lattice(cx, cy, cols, rows, spacing):
    xs = (np.arange(cols) - (cols - 1) / 2) * spacing + cx
    ys = (np.arange(rows) - (rows - 1) / 2) * spacing + cy
    return [(x, y) for y in ys for x in xs]


class FlashPool:
    """Short-lived marks where particles hit a wall; brightness ~ hit speed."""

    def __init__(self, sim, size=40, color="#FFFFFF", ref_speed=2.0):
        self.sim = sim
        self.ref = ref_speed
        self.marks = VGroup(*[Line(LEFT * 0.2, RIGHT * 0.2, stroke_width=6, color=color)
                              .set_opacity(0) for _ in range(size)])
        self.marks.set_z_index(3)
        self.life = np.zeros(size)
        self.i = 0

        def upd(m, dt):
            for x, y, nx, ny, s in sim.take_hits():
                k = self.i % size
                self.i += 1
                strength = min(1.0, s / self.ref)
                length = 0.2 + 0.45 * strength
                tangent = np.array([-ny, nx, 0.0])
                c = np.array([x + nx * sim.r, y + ny * sim.r, 0.0])
                m[k].put_start_and_end_on(c - tangent * length / 2, c + tangent * length / 2)
                m[k].set_stroke(width=3 + 7 * strength)
                self.life[k] = 0.35 + 0.35 * strength
            self.life = np.maximum(0, self.life - dt)
            for k, mk in enumerate(m):
                mk.set_opacity(min(1.0, self.life[k] / 0.35))

        self.marks.add_updater(upd)
