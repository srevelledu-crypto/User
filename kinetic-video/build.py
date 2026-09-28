"""Build pipeline: TTS -> Manim render -> mux narration -> burn subtitles -> concat.

    python build.py --quality l            # 480p15 previews (per scene + combined)
    python build.py --quality h            # final 1080p60 video
    python build.py --quality l S3_States  # just one scene

Outputs go to  out/preview/  (quality l)  or  out/final/  (quality h).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

from narration import SCENE_ORDER

ROOT = Path(__file__).parent
BUILD = ROOT / "build"
PY = sys.executable
QUAL = {"l": ("480p15", "preview"), "m": ("720p30", "preview_720"), "h": ("1080p60", "final")}

SUB_STYLE = ("FontName=Inter,FontSize=16,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,"
             "BorderStyle=4,Outline=0,Shadow=0,MarginV=12,MarginL=30,MarginR=30")


def run(cmd):
    print("+", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True)


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def write_srt(path, entries):
    lines = []
    for i, (a, b, text) in enumerate(entries, 1):
        lines += [str(i), f"{ts(a)} --> {ts(b)}", text, ""]
    path.write_text("\n".join(lines))


def scene_subs(timing, offset=0.0):
    out = []
    for beat in timing["beats"]:
        for s in beat["sentences"]:
            # hold each caption through the short pause that follows it
            out.append((offset + s["start"], offset + s["end"] + 0.25, s["text"]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quality", default="l", choices=QUAL)
    ap.add_argument("--skip-tts", action="store_true")
    ap.add_argument("--skip-render", action="store_true")
    ap.add_argument("scenes", nargs="*")
    args = ap.parse_args()
    res, outname = QUAL[args.quality]
    scenes = args.scenes or SCENE_ORDER
    out = ROOT / "out" / outname
    work = BUILD / outname
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    if not args.skip_tts and not (BUILD / "timings.json").exists():
        run([PY, ROOT / "tts.py"])
    timings = json.loads((BUILD / "timings.json").read_text())

    for sc in scenes:
        if not args.skip_render:
            run([PY, "-m", "manim", f"-q{args.quality}", "--media_dir", BUILD / "media",
                 "--disable_caching", ROOT / "scenes.py", sc])
        video = BUILD / "media" / "videos" / "scenes" / res / f"{sc}.mp4"
        dur = timings[sc]["total"]
        # mux video + narration, padding/cutting video to exactly the audio length
        muxed = work / f"{sc}.mp4"
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", BUILD / "audio" / f"{sc}.wav",
             "-vf", "tpad=stop_mode=clone:stop_duration=2", "-t", f"{dur:.3f}",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "160k",
             "-ar", "48000", muxed])
        if args.quality == "l":
            srt = work / f"{sc}.srt"
            write_srt(srt, scene_subs(timings[sc]))
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", muxed, "-vf",
                 f"subtitles={srt}:force_style='{SUB_STYLE}'", "-c:a", "copy", out / f"{sc}.mp4"])

    if args.scenes:
        return
    # full video: concat all scenes, then burn the combined subtitles once
    lst = work / "concat.txt"
    lst.write_text("".join(f"file '{(work / f'{sc}.mp4').resolve()}'\n" for sc in SCENE_ORDER))
    joined = work / "joined.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
         "-c", "copy", joined])
    subs, t = [], 0.0
    for sc in SCENE_ORDER:
        subs += scene_subs(timings[sc], t)
        t += timings[sc]["total"]
    srt = out / "kinetic_particle_model.srt"
    write_srt(srt, subs)
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", joined, "-vf",
         f"subtitles={srt}:force_style='{SUB_STYLE}'", "-c:v", "libx264", "-crf", "18",
         "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart",
         out / "kinetic_particle_model.mp4"])
    print(f"Total length: {t:.1f} s -> {out / 'kinetic_particle_model.mp4'}")


if __name__ == "__main__":
    main()
