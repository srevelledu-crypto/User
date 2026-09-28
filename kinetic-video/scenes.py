"""Kinetic particle model — Year 10 explainer. One Manim scene per section.

Render one scene:   manim -ql scenes.py S1_Hook
Render everything:  python build.py --quality l   (see README)
"""
import numpy as np
from manim import *  # noqa: F401,F403

from common import (
    BG, COLD, FG, GAS, HILITE, HOT, LIQUID, MUTED, NEUTRAL, R, RUBBER, SOLID,
    FlashPool, NarratedScene, ParticleSim, T, Vibrator, lattice, particle_label,
    sim_dots,
)


def balloon(width=1.8, height=2.2, color=RUBBER):
    body = Ellipse(width=width, height=height, color=color, fill_opacity=0.85, stroke_width=0)
    knot = Triangle(color=color, fill_opacity=1, stroke_width=0).scale(0.13).rotate(PI)
    knot.next_to(body, DOWN, buff=-0.04)
    string = CubicBezier(knot.get_bottom(), knot.get_bottom() + [0.25, -0.4, 0],
                         knot.get_bottom() + [-0.25, -0.8, 0], knot.get_bottom() + [0.05, -1.2, 0],
                         color=MUTED, stroke_width=2)
    shine = Ellipse(width=0.3, height=0.5, color=WHITE, fill_opacity=0.25, stroke_width=0)
    shine.move_to(body.get_center() + [-0.45, 0.5, 0]).rotate(0.4)
    return VGroup(string, body, knot, shine)


def box(width, height, center, color=MUTED):
    return Rectangle(width=width, height=height, color=color, stroke_width=3).move_to(center)


def bounds_of(rect):
    return (rect.get_left()[0], rect.get_right()[0], rect.get_bottom()[1], rect.get_top()[1])


# --------------------------------------------------------------------------
class S1_Hook(NarratedScene):
    KEY = "S1_Hook"

    def construct(self):
        b = balloon().move_to([-4, 0.4, 0])
        room = T("Room: 22 °C", 26, MUTED).next_to(b, DOWN, buff=0.35)
        self.until(0, offset=-0.4)
        self.play(FadeIn(b, shift=UP * 0.3), FadeIn(room), run_time=1.2)

        # freezer
        self.until(1, offset=-0.3)
        freezer = RoundedRectangle(corner_radius=0.2, width=4.2, height=4.4, color=COLD,
                                   stroke_width=4, fill_color="#12304A", fill_opacity=0.6)
        freezer.move_to([3.4, 0.2, 0])
        f_label = T("Freezer: −18 °C", 26, COLD).next_to(freezer, UP, buff=0.2)
        self.play(FadeIn(freezer), FadeIn(f_label), run_time=0.8)
        self.play(b.animate.move_to(freezer.get_center() + UP * 0.2), FadeOut(room), run_time=1.5)
        later = T("1 hour later…", 26, MUTED).next_to(freezer, DOWN, buff=0.25)
        self.play(FadeIn(later), run_time=0.5)
        self.play(b.animate.scale(0.68).set_color(interpolate_color(ManimColor(RUBBER), ManimColor(COLD), 0.35)),
                  run_time=self.left(2, offset=-0.3, minimum=1.5))

        # back on the bench
        b_small = b.copy()
        self.play(FadeOut(later), b.animate.move_to([-4, 0.4, 0]), run_time=1.3)
        self.play(b.animate.scale(1 / 0.68).set_color(RUBBER),
                  FadeIn(room), run_time=self.left(3, offset=-0.2, minimum=1.5))

        # question
        no_air = T("No air in or out", 30, FG).move_to([-4, -2.25, 0])
        self.play(FadeIn(no_air), FadeOut(room), run_time=0.6)
        self.until(3, 2, offset=-0.2)
        lens = Circle(radius=1.35, color=FG, stroke_width=5).move_to(b[1].get_center())
        handle = Line(lens.point_at_angle(-PI / 4), lens.point_at_angle(-PI / 4) + [0.9, -0.9, 0],
                      stroke_width=10, color=FG)
        q = T("?", 72, FG, weight="BOLD").move_to(lens)
        ask = T("What's going on inside?", 44, FG, weight="BOLD").move_to([2.6, 2.9, 0])
        self.play(FadeOut(freezer), FadeOut(f_label), Create(lens), Create(handle), run_time=0.8)
        self.play(FadeIn(q, scale=0.5), Write(ask), run_time=1.2)
        self.finish()


# --------------------------------------------------------------------------
class S2_Motion(NarratedScene):
    KEY = "S2_Motion"

    def construct(self):
        title = T("All matter is made of particles", 40, FG, weight="BOLD").to_edge(UP, buff=0.45)
        frame = box(8.4, 4.4, [0, -0.35, 0])
        sim = ParticleSim(48, bounds_of(frame), speed=1.4, seed=3)
        dots = sim_dots(sim, NEUTRAL)
        tag = T("solids · liquids · gases", 26, MUTED).next_to(title, DOWN, buff=0.15)

        self.until(0, offset=-0.3)
        self.add(dots)
        self.play(Write(title), Create(frame), FadeIn(dots), run_time=1.5)
        self.play(FadeIn(tag), run_time=0.6)

        # "we'll draw each particle as a simple circle"
        self.until(1, offset=-0.1)
        me = dots[7]
        lbl = particle_label(me, [5.6, 1.2, 0])
        self.play(me.animate.set_color(HILITE), FadeIn(lbl), run_time=0.8)

        self.until(2, 1, offset=-0.2)
        motion = T("always moving, randomly", 30, HILITE).next_to(title, DOWN, buff=0.15)
        self.play(FadeOut(tag), FadeIn(motion), run_time=0.6)

        # trace one particle's zigzag path
        self.until(3, offset=-0.2)
        path = TracedPath(me.get_center, stroke_color=HILITE, stroke_width=3, dissipating_time=5)
        self.add(path)
        path_lbl = T("one particle's path", 24, HILITE).move_to([5.6, 1.2, 0])
        self.play(FadeOut(lbl[0]), FadeIn(path_lbl), run_time=0.5)
        self.remove(lbl)
        self.finish()


# --------------------------------------------------------------------------
class S3_States(NarratedScene):
    KEY = "S3_States"

    def construct(self):
        title = T("Three states of matter", 40, FG, weight="BOLD").to_edge(UP, buff=0.45)
        xs = [-4.55, 0, 4.55]
        W, H, cy = 4.0, 3.5, -0.1
        panels = VGroup(*[box(W, H, [x, cy, 0]) for x in xs])
        names = [("Solid", SOLID), ("Liquid", LIQUID), ("Gas", GAS)]
        heads = VGroup(*[T(n, 34, c, weight="BOLD").next_to(p, UP, buff=0.2)
                         for (n, c), p in zip(names, panels)])

        self.until(0, offset=-0.3)
        self.play(Write(title), LaggedStart(*[Create(p) for p in panels], lag_ratio=0.2),
                  run_time=1.4)
        self.play(LaggedStart(*[FadeIn(h, shift=DOWN * 0.2) for h in heads], lag_ratio=0.25),
                  run_time=1.0)

        def caption(text, panel, color):
            return T(text, 24, color).next_to(panel, DOWN, buff=0.18)

        # SOLID: lattice, vibrating about fixed positions
        self.until(1, offset=-0.2)
        sp = panels[0]
        vib = Vibrator(lattice(xs[0], sp.get_bottom()[1] + 1.05, 7, 7, 2.2 * R), amp=0.035)
        solid = VGroup(*[Dot([*p, 0], radius=R, color=SOLID, stroke_width=0) for p in vib.pos])

        def solid_upd(m, dt):
            vib.step(dt)
            for d, p in zip(m, vib.pos):
                d.move_to([p[0], p[1], 0])

        solid.add_updater(solid_upd)
        cap_s = caption("fixed positions", sp, SOLID)
        self.play(FadeIn(solid), FadeIn(cap_s), run_time=1.0)

        # misconception: solid particles are NOT stationary
        self.until(2, offset=-0.2)
        one = solid[24]
        ring = Circle(radius=0.36, color=HILITE, stroke_width=4).move_to(one)
        stationary = T("stationary", 28, FG).move_to([xs[0], 1.05, 0])
        strike = Line(stationary.get_left(), stationary.get_right(), color=HOT, stroke_width=5)
        self.play(Create(ring), FadeIn(stationary), run_time=0.7)
        self.play(Create(strike), run_time=0.5)
        cap_s2 = caption("vibrate on the spot", sp, SOLID)
        self.play(ReplacementTransform(cap_s, cap_s2),
                  FadeOut(stationary), FadeOut(strike), run_time=0.7)
        trail = TracedPath(one.get_center, stroke_color=HILITE, stroke_width=2, dissipating_time=0.6)
        self.add(trail)
        # boost the amplitude briefly so the vibration is easy to see, then relax
        amp = ValueTracker(0.035)
        vib_amp = lambda m: setattr(vib, "amp", amp.get_value())  # noqa: E731
        solid.add_updater(vib_amp)
        self.play(amp.animate.set_value(0.06), run_time=1.0)
        self.play(amp.animate.set_value(0.035), run_time=self.left(3, offset=-0.8, minimum=0.8))
        self.play(FadeOut(ring), FadeOut(trail), run_time=0.5)
        self.remove(trail)

        # LIQUID: close together, sliding past each other
        self.until(3, offset=-0.2)
        lp = panels[1]
        lb = bounds_of(lp)
        lsim = ParticleSim(70, (lb[0], lb[1], lb[2], lb[2] + 2.3), mode="liquid", speed=0.8, seed=5,
                           positions=lattice(0, lb[2] + 0.75, 14, 5, 2.15 * R))
        lsim.bounds = lb
        # settle the liquid before it appears
        for _ in range(200):
            lsim.step(1 / 60)
        liquid = sim_dots(lsim, LIQUID)
        cap_l = caption("close, slide past", lp, LIQUID)
        self.play(FadeIn(liquid), FadeIn(cap_l), run_time=1.0)

        # GAS: far apart, fast, straight lines between collisions
        self.until(4, offset=-0.2)
        gp = panels[2]
        gsim = ParticleSim(9, bounds_of(gp), speed=3.0, seed=8)
        gas = sim_dots(gsim, GAS)
        cap_g = caption("far apart, fast", gp, GAS)
        self.play(FadeIn(gas), FadeIn(cap_g), run_time=1.0)
        g0 = gas[0]
        gtrail = TracedPath(g0.get_center, stroke_color=GAS, stroke_width=2,
                            stroke_opacity=0.6, dissipating_time=2.0)
        self.add(gtrail)
        self.until(4, 1, offset=0.2)
        straight = T("straight lines between hits", 22, GAS).next_to(cap_g, DOWN, buff=0.08)
        straight.shift(UP * 0.02)
        self.play(FadeIn(straight), run_time=0.5)

        # misconception: the space between gas particles is empty, not air
        self.until(5, offset=-0.2)
        self.play(FadeOut(straight), FadeOut(gtrail), FadeOut(title),
                  panels[0].animate.set_stroke(opacity=0.3),
                  panels[1].animate.set_stroke(opacity=0.3), solid.animate.set_opacity(0.3),
                  liquid.animate.set_opacity(0.3), heads[:2].animate.set_opacity(0.3),
                  cap_s2.animate.set_opacity(0.3), cap_l.animate.set_opacity(0.3), run_time=0.8)
        self.remove(gtrail)
        self.until(5, 1, offset=-0.1)
        gap = DashedVMobject(Circle(radius=0.5, color=FG, stroke_width=3), num_dashes=16)
        gap.move_to(self._emptiest(gsim, gp))
        empty = T("Between gas particles: empty space", 36, FG, weight="BOLD").to_edge(UP, buff=0.4)
        self.play(Create(gap), run_time=0.6)
        not_air = T("not air — nothing at all", 28, FG).next_to(empty, DOWN, buff=0.12)
        self.play(FadeIn(empty), run_time=0.5)
        self.until(5, 2, offset=-0.2)
        self.play(FadeIn(not_air), run_time=0.5)
        self.until(5, 4, offset=-0.2)
        air = T("the particles ARE the air", 28, GAS, weight="BOLD").move_to(not_air)
        self.play(FadeOut(gap), ReplacementTransform(not_air, air), run_time=0.7)
        self.finish()

    @staticmethod
    def _emptiest(sim, panel):
        x0, x1, y0, y1 = bounds_of(panel)
        best, bp = -1, None
        for x in np.linspace(x0 + 0.9, x1 - 0.9, 9):
            for y in np.linspace(y0 + 0.9, y1 - 0.9, 7):
                d = np.min(np.hypot(sim.pos[:, 0] - x, sim.pos[:, 1] - y))
                if d > best:
                    best, bp = d, (x, y)
        return [bp[0], bp[1], 0]


# --------------------------------------------------------------------------
class S4_Heating(NarratedScene):
    KEY = "S4_Heating"
    T0, T1 = 20, 400  # °C

    def construct(self):
        title = T("Heating a gas", 40, FG, weight="BOLD").to_edge(UP, buff=0.45)
        frame = box(5.2, 4.0, [-3.8, -0.45, 0])
        sim = ParticleSim(26, bounds_of(frame), speed=1.6, seed=11)
        dots = sim_dots(sim, GAS)
        temp = ValueTracker(self.T0)
        kelvin = lambda c: c + 273.0  # noqa: E731
        scale = lambda: np.sqrt(kelvin(temp.get_value()) / kelvin(self.T0))  # noqa: E731
        dots.add_updater(lambda m: sim.set_speed_scale(scale()))

        # temperature slider
        track = Line([1.2, 1.75, 0], [6.2, 1.75, 0], stroke_width=10)
        track.set_color([HOT, COLD])  # manim applies the gradient end-to-start
        t_word = T("Temperature", 26, FG).next_to(track, UP, buff=0.22).align_to(track, LEFT)
        knob = always_redraw(lambda: Circle(radius=0.17, color=FG, fill_color=interpolate_color(
            ManimColor(COLD), ManimColor(HOT), (temp.get_value() - self.T0) / (self.T1 - self.T0)),
            fill_opacity=1, stroke_width=3).move_to(track.point_from_proportion(
                0.08 + 0.84 * (temp.get_value() - self.T0) / (self.T1 - self.T0))))
        readout = always_redraw(lambda: T(f"{temp.get_value():.0f} °C", 26, FG)
                                .next_to(track, UP, buff=0.22).align_to(track, RIGHT))

        # speed histogram (2-D Maxwell–Boltzmann: Rayleigh distribution)
        axes = Axes(x_range=[0, 6, 1], y_range=[0, 1, 0.5], x_length=5.0, y_length=2.4,
                    tips=False, axis_config={"color": MUTED, "stroke_width": 2,
                                             "include_ticks": False})
        axes.move_to([3.7, -0.9, 0])
        xl = T("speed", 22, MUTED).next_to(axes.x_axis, DOWN, buff=0.12)
        yl = T("number of particles", 22, MUTED).rotate(PI / 2).next_to(axes.y_axis, LEFT, buff=0.12)
        nb, vmax = 14, 6.0
        edges = np.linspace(0, vmax, nb + 1)

        def sigma():
            return 1.3 * scale()

        def bars():
            s = sigma()
            cdf = 1 - np.exp(-edges ** 2 / (2 * s * s))
            frac = np.diff(cdf)
            peak = 0.23  # fixed y-scale so shifts are visible
            g = VGroup()
            for k in range(nb):
                h = min(frac[k] / peak, 1.0)
                bl = axes.c2p(edges[k], 0)
                tr = axes.c2p(edges[k + 1], h)
                g.add(Rectangle(width=tr[0] - bl[0] - 0.04, height=max(tr[1] - bl[1], 0.001),
                                fill_color=GAS, fill_opacity=0.85, stroke_width=0)
                      .move_to([(bl[0] + tr[0]) / 2, (bl[1] + tr[1]) / 2, 0]))
            return g

        hist = always_redraw(bars)

        def mean_line():
            vbar = sigma() * np.sqrt(np.pi / 2)
            ln = DashedLine(axes.c2p(vbar, 0), axes.c2p(vbar, 1.02), color=FG, stroke_width=3)
            lab = T("average", 20, FG).next_to(ln, UP, buff=0.06)
            return VGroup(ln, lab)

        mline = always_redraw(mean_line)

        self.until(0, offset=-0.3)
        self.add(dots)
        self.play(Write(title), Create(frame), FadeIn(dots), run_time=1.2)
        lbl = particle_label(dots[3], [-3.8, 2.3, 0])
        self.play(Create(track), FadeIn(t_word), FadeIn(knob), FadeIn(readout), FadeIn(lbl),
                  run_time=1.0)

        # heat: particles speed up
        self.until(1, offset=-0.1)
        self.play(FadeOut(lbl), run_time=0.3)
        self.play(temp.animate.set_value(160), run_time=self.left(2, offset=-0.2), rate_func=smooth)

        # histogram appears then shifts right as we keep heating
        self.play(Create(axes), FadeIn(xl), FadeIn(yl), FadeIn(hist), run_time=1.0)
        self.add(mline)
        self.play(temp.animate.set_value(self.T0), run_time=1.2)
        ghost = VGroup(*[b.copy().set_fill(opacity=0).set_stroke(COLD, 2, opacity=0.9)
                         for b in bars()])
        ghost_lbl = T(f"at {self.T0} °C", 20, COLD).move_to(axes.c2p(0.9, 1.12))
        self.play(FadeIn(ghost), FadeIn(ghost_lbl), run_time=0.5)
        self.until(2, 1, offset=0.0)
        self.play(temp.animate.set_value(self.T1), run_time=self.left(3, offset=-0.3), rate_func=smooth)

        # temperature = average kinetic energy
        ke = T("Temperature ∝ average kinetic energy", 36, FG, weight="BOLD").to_edge(UP, buff=0.45)
        self.play(ReplacementTransform(title, ke), run_time=0.8)
        self.until(3, 1, offset=-0.2)
        hotter = T("hotter → faster (on average)", 26, HOT).next_to(ke, DOWN, buff=0.15)
        self.play(FadeIn(hotter), run_time=0.6)

        # particle size stays fixed
        self.until(4, offset=-0.2)
        self.play(FadeOut(axes), FadeOut(xl), FadeOut(yl), FadeOut(hist), FadeOut(mline),
                  FadeOut(ghost), FadeOut(ghost_lbl), FadeOut(hotter), run_time=0.6)
        self.remove(hist, mline)
        big = 0.55
        cold_p = Circle(radius=big, color=GAS, fill_opacity=1, stroke_width=0).move_to([2.3, -0.5, 0])
        hot_p = cold_p.copy().move_to([5.1, -0.5, 0])
        c_lab = T("cold", 26, COLD).next_to(cold_p, UP, buff=0.25)
        h_lab = T("hot", 26, HOT).next_to(hot_p, UP, buff=0.25)
        c_arrow = Arrow(cold_p.get_right(), cold_p.get_right() + RIGHT * 0.6, buff=0.05, color=FG,
                        stroke_width=5)
        h_arrow = Arrow(hot_p.get_right(), hot_p.get_right() + RIGHT * 1.3, buff=0.05, color=FG,
                        stroke_width=5)
        top = DashedLine([1.4, -0.5 + big, 0], [6.9, -0.5 + big, 0], color=MUTED, stroke_width=2)
        bot = DashedLine([1.4, -0.5 - big, 0], [6.9, -0.5 - big, 0], color=MUTED, stroke_width=2)
        same = T("same size", 28, FG, weight="BOLD").move_to([3.7, -1.65, 0])
        self.play(FadeIn(cold_p), FadeIn(hot_p), FadeIn(c_lab), FadeIn(h_lab), run_time=0.8)
        self.play(Create(top), Create(bot), FadeIn(same), run_time=0.8)
        self.until(4, 1, offset=-0.2)
        no_expand = T("particles don't expand", 28, HOT).move_to([3.7, -2.15, 0])
        self.play(FadeIn(no_expand), temp.animate.set_value(self.T0), run_time=1.5)
        self.until(4, 2, offset=-0.2)
        speed = T("they just speed up", 28, GAS).move_to(no_expand)
        self.play(ReplacementTransform(no_expand, speed), GrowArrow(c_arrow), GrowArrow(h_arrow),
                  temp.animate.set_value(self.T1), run_time=1.5)
        self.finish()


# --------------------------------------------------------------------------
class S5_Pressure(NarratedScene):
    KEY = "S5_Pressure"

    def construct(self):
        title = T("Gas pressure", 40, FG, weight="BOLD").to_edge(UP, buff=0.45)
        W, H = 4.6, 3.6
        lf = box(W, H, [-3.4, -0.2, 0])
        rf = box(W, H, [3.4, -0.2, 0])
        ls = ParticleSim(12, bounds_of(lf), speed=1.5, seed=21)
        rs = ParticleSim(12, bounds_of(rf), speed=1.5, seed=21)
        rs.set_speed_scale(1.8)
        ld, rd = sim_dots(ls, GAS), sim_dots(rs, GAS)
        lflash = FlashPool(ls, color=HILITE, ref_speed=3.2)
        rflash = FlashPool(rs, color=HILITE, ref_speed=3.2)

        def counter(sim, frame, color):
            word = T("wall hits:", 26, MUTED).next_to(frame, DOWN, buff=0.22).shift(LEFT * 0.3)
            num = always_redraw(lambda: T(str(sim.hit_count), 30, color, weight="BOLD")
                                .next_to(word, RIGHT, buff=0.15))
            return VGroup(word, num)

        self.until(0, offset=-0.3)
        self.add(ld, lflash.marks)
        self.play(Write(title), Create(lf), FadeIn(ld), run_time=1.2)
        lc = counter(ls, lf, FG)
        self.until(0, 1, offset=-0.3)
        self.add(lc[1])
        self.play(FadeIn(lc[0]), run_time=0.5)

        self.until(1, offset=-0.1)
        push = T("each hit = a tiny push", 30, FG).move_to([3.4, 0.6, 0])
        self.play(FadeIn(push), run_time=0.6)
        self.until(1, 1, offset=-0.1)
        press = T("many pushes → pressure", 30, GAS, weight="BOLD").next_to(push, DOWN, buff=0.35)
        self.play(FadeIn(press), run_time=0.6)

        # heat: compare a cooler and a hotter box side by side
        self.until(2, offset=-0.2)
        cool_l = T("cooler", 30, COLD, weight="BOLD").next_to(lf, UP, buff=0.15)
        hot_l = T("hotter", 30, HOT, weight="BOLD").next_to(rf, UP, buff=0.15)
        self.play(FadeOut(push), FadeOut(press), FadeOut(title), run_time=0.5)
        self.add(rd, rflash.marks)
        rc = counter(rs, rf, HOT)
        ls.hit_count = 0
        rs.hit_count = 0
        self.add(rc[1])
        self.play(Create(rf), FadeIn(rd), FadeIn(cool_l), FadeIn(hot_l), FadeIn(rc[0]), run_time=0.8)
        self.until(2, offset=2.4)
        often = T("hotter: hits more often…", 34, HOT, weight="BOLD").to_edge(UP, buff=0.45)
        often.shift(LEFT * 1.3)
        harder = T("…and harder", 34, HOT, weight="BOLD").next_to(often, RIGHT, buff=0.2)
        self.play(FadeIn(often), run_time=0.4)
        self.play(FadeIn(harder), run_time=0.4)

        self.until(3, offset=-0.2)
        lp = T("lower pressure", 30, COLD, weight="BOLD").move_to(lf).shift(UP * 2.55)
        hp = T("higher pressure", 30, HOT, weight="BOLD").move_to(rf).shift(UP * 2.55)
        self.play(FadeOut(often), FadeOut(harder),
                  ReplacementTransform(cool_l, lp), ReplacementTransform(hot_l, hp), run_time=0.8)
        self.play(Indicate(hp, color=HOT, scale_factor=1.12), run_time=1.0)
        self.finish()


# --------------------------------------------------------------------------
class S6_Balloon(NarratedScene):
    KEY = "S6_Balloon"
    R0 = 1.4
    COLD_T = 0.55   # relative temperature in the freezer (exaggerated for clarity)

    def construct(self):
        title = T("Back to the balloon", 40, FG, weight="BOLD").to_edge(UP, buff=0.45)
        c = np.array([-2.2, 0.0, 0])
        temp = ValueTracker(1.0)   # relative (kelvin) temperature
        rad = ValueTracker(self.R0)
        sim = ParticleSim(22, None, speed=2.0, seed=31, circle=(c[0], c[1], rad.get_value))
        dots = sim_dots(sim, GAS)
        dots.add_updater(lambda m: sim.set_speed_scale(np.sqrt(temp.get_value())))

        def skin():
            body = Circle(radius=rad.get_value(), color=RUBBER, stroke_width=6,
                          fill_color=RUBBER, fill_opacity=0.12).move_to(c)
            knot = Triangle(color=RUBBER, fill_opacity=1, stroke_width=0).scale(0.13).rotate(PI)
            knot.next_to(body, DOWN, buff=-0.02)
            return VGroup(body, knot)

        balloon_m = always_redraw(skin)

        # push arrows: outside air (fixed) vs inside gas (∝ T / area)
        dirs = [np.array([np.cos(a), np.sin(a), 0]) for a in np.linspace(0, 2 * PI, 8, endpoint=False) + PI / 8]
        L = 0.55

        def pushes():
            g = VGroup()
            p_in = temp.get_value() / (rad.get_value() / self.R0) ** 2
            for u in dirs:
                edge = c + u * rad.get_value()
                g.add(Arrow(edge + u * (L + 0.12), edge + u * 0.1, buff=0, color=COLD,
                            stroke_width=5, max_tip_length_to_length_ratio=0.35))
                g.add(Arrow(edge - u * 0.02, edge + u * (0.05 + L * p_in), buff=0, color=GAS,
                            stroke_width=5, max_tip_length_to_length_ratio=0.35))
            return g

        arrows = always_redraw(pushes)
        key_out = VGroup(Arrow(LEFT * 0.3, RIGHT * 0.3, color=COLD, stroke_width=5, buff=0),
                         T("push from air outside", 22, COLD)).arrange(RIGHT, buff=0.15)
        key_in = VGroup(Arrow(LEFT * 0.3, RIGHT * 0.3, color=GAS, stroke_width=5, buff=0),
                        T("push from particles inside", 22, GAS)).arrange(RIGHT, buff=0.15)
        key = VGroup(key_out, key_in).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        key.to_corner(UL, buff=0.4).shift(DOWN * 0.9)
        count = T("22 particles inside", 22, MUTED).next_to(key, DOWN, buff=0.18).align_to(key, LEFT)

        self.until(0, offset=-0.3)
        self.add(dots)
        self.play(Write(title), FadeIn(balloon_m), FadeIn(dots), run_time=1.2)
        self.play(FadeIn(arrows), FadeIn(key), FadeIn(count), run_time=0.8)

        # into the freezer: particles slow, inside push drops
        notes_x = 3.9
        self.until(1, offset=-0.2)
        freezer = Rectangle(width=14.4, height=8.2, stroke_width=0, fill_color="#0F2A44",
                            fill_opacity=0.55).set_z_index(-5)
        f_lab = T("In the freezer: −18 °C", 30, COLD, weight="BOLD").to_edge(UP, buff=0.45)
        self.play(FadeIn(freezer), ReplacementTransform(title, f_lab), run_time=0.8)
        n1 = T("particles slow down", 28, FG).move_to([notes_x, 1.5, 0])
        self.play(temp.animate.set_value(self.COLD_T), FadeIn(n1), run_time=2.0)
        self.until(1, 1, offset=-0.1)
        n2 = T("fewer, softer hits", 28, FG).next_to(n1, DOWN, buff=0.3)
        self.play(FadeIn(n2), run_time=0.5)

        # balloon shrinks until pushes balance
        self.until(2, offset=0.2)
        r_eq = self.R0 * np.sqrt(self.COLD_T)
        n3 = T("shrinks until pushes balance", 28, FG).next_to(n2, DOWN, buff=0.3)
        self.play(rad.animate.set_value(r_eq), FadeIn(n3), run_time=self.left(3, offset=-0.4, minimum=2.0))

        # same number, same size, just slower
        self.until(3, offset=-0.2)
        n4 = T("same number of particles", 28, GAS).next_to(n3, DOWN, buff=0.45)
        self.play(FadeIn(n4), Indicate(count, color=GAS), run_time=0.8)
        self.until(3, 1, offset=-0.1)
        n5 = T("same size particles", 28, GAS).next_to(n4, DOWN, buff=0.3)
        self.play(FadeIn(n5), run_time=0.5)
        self.until(3, 2, offset=-0.1)
        n6 = T("just slower", 28, GAS, weight="BOLD").next_to(n5, DOWN, buff=0.3)
        self.play(FadeIn(n6), run_time=0.5)

        # warm it up again
        self.until(4, offset=-0.2)
        warm = T("Warmed up again", 30, HOT, weight="BOLD").to_edge(UP, buff=0.45)
        self.play(FadeOut(freezer), ReplacementTransform(f_lab, warm),
                  FadeOut(VGroup(n1, n2, n3, n4, n5, n6)), run_time=0.8)
        self.play(temp.animate.set_value(1.0), run_time=1.2)
        self.play(rad.animate.set_value(self.R0), run_time=2.2)
        self.finish()


# --------------------------------------------------------------------------
class S7_Recap(NarratedScene):
    KEY = "S7_Recap"

    def construct(self):
        title = T("Recap", 44, FG, weight="BOLD").to_edge(UP, buff=0.45)
        rows = [
            ("All matter is made of particles", "in constant, random motion — even in solids", NEUTRAL),
            ("Solid, liquid, gas", "differ in particle spacing and motion", LIQUID),
            ("Temperature = average kinetic energy", "heating makes particles faster, not bigger", HOT),
        ]
        ys = [1.75, 0.15, -1.45]
        cards = []
        for i, ((head, sub, col), y) in enumerate(zip(rows, ys)):
            badge = VGroup(Circle(radius=0.36, color=col, fill_opacity=1, stroke_width=0),
                           T(str(i + 1), 30, BG, weight="BOLD"))
            badge.move_to([-5.6, y, 0])
            h = T(head, 32, FG, weight="BOLD")
            s = T(sub, 26, MUTED)
            txt = VGroup(h, s).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
            txt.next_to(badge, RIGHT, buff=0.4)
            cards.append(VGroup(badge, txt))

        # tiny icons on the right of each card
        icon1 = self._jiggle(np.array([5.3, ys[0], 0]))
        icon2 = VGroup(
            VGroup(*[Dot([4.45 + dx, ys[1] + dy, 0], radius=0.07, color=SOLID)
                     for dx in (-0.16, 0, 0.16) for dy in (-0.16, 0, 0.16)]),
            VGroup(*[Dot([5.3 + dx, ys[1] + dy, 0], radius=0.07, color=LIQUID)
                     for dx, dy in [(-0.18, -0.17), (-0.02, -0.19), (0.15, -0.15), (-0.1, -0.02),
                                    (0.07, 0.0), (0.2, 0.03), (-0.19, 0.12)]]),
            VGroup(*[Dot([6.15 + dx, ys[1] + dy, 0], radius=0.07, color=GAS)
                     for dx, dy in [(-0.25, 0.2), (0.2, 0.25), (0.05, -0.2), (-0.2, -0.25)]]),
        )
        slow = VGroup(Dot([4.6, ys[2], 0], radius=0.14, color=GAS),
                      Arrow([4.75, ys[2], 0], [5.1, ys[2], 0], buff=0, color=COLD, stroke_width=4))
        fast = VGroup(Dot([5.5, ys[2], 0], radius=0.14, color=GAS),
                      Arrow([5.65, ys[2], 0], [6.55, ys[2], 0], buff=0, color=HOT, stroke_width=4))
        icon3 = VGroup(slow, fast)
        icons = [icon1, icon2, icon3]

        self.until(0, offset=-0.3)
        self.play(Write(title), run_time=0.8)
        for i in range(3):
            self.until(i + 1, offset=-0.3)
            if i:
                self.play(cards[i - 1].animate.set_opacity(0.55), run_time=0.3)
            self.play(FadeIn(cards[i], shift=RIGHT * 0.3), FadeIn(icons[i]), run_time=0.8)
        self.until(3, 1, offset=0.3)
        self.play(*[c.animate.set_opacity(1) for c in cards[:2]], run_time=0.6)
        self.finish()

    def _jiggle(self, center):
        sim = ParticleSim(7, (center[0] - 0.55, center[0] + 0.55, center[1] - 0.4, center[1] + 0.4),
                          r=0.07, speed=0.9, seed=41)
        return sim_dots(sim, NEUTRAL)
