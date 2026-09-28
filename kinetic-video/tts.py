"""Generate narration audio + timings with Kokoro (offline neural TTS).

Outputs, per scene:  build/audio/<scene>.wav
and build/timings.json with beat/sentence start & end times (seconds, scene-local).
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

from narration import PRONUNCIATION, SCENES

ROOT = Path(__file__).parent
OUT = ROOT / "build" / "audio"
MODEL = Path("/opt/voices/kokoro-v1.0.onnx")
VOICES = Path("/opt/voices/voices-v1.0.bin")
VOICE = "bf_emma"
SPEED = 0.92

LEAD_IN = 0.8        # silence before first beat
SENTENCE_GAP = 0.30  # pause between sentences within a beat
BEAT_GAP = 0.55      # pause between beats
TAIL = 1.2           # silence after last beat


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]


def trim(audio, sr, thresh=0.01):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    pad = int(0.03 * sr)
    return audio[max(0, idx[0] - pad): idx[-1] + pad]


def main(only=None):
    from kokoro_onnx import Kokoro

    kokoro = Kokoro(str(MODEL), str(VOICES))
    OUT.mkdir(parents=True, exist_ok=True)
    tpath = ROOT / "build" / "timings.json"
    timings = json.loads(tpath.read_text()) if tpath.exists() else {}
    for scene, beats in SCENES.items():
        if only and scene not in only:
            continue
        sr = 24000
        chunks = [np.zeros(int(LEAD_IN * sr), dtype=np.float32)]
        t = LEAD_IN
        beat_info = []
        for bi, beat in enumerate(beats):
            if bi:
                chunks.append(np.zeros(int(BEAT_GAP * sr), dtype=np.float32))
                t += BEAT_GAP
            b = {"start": t, "sentences": []}
            for si, sent in enumerate(sentences(beat)):
                if si:
                    chunks.append(np.zeros(int(SENTENCE_GAP * sr), dtype=np.float32))
                    t += SENTENCE_GAP
                say = sent
                for k, v in PRONUNCIATION.items():
                    say = say.replace(k, v)
                audio, sr = kokoro.create(say, voice=VOICE, speed=SPEED, lang="en-gb")
                audio = trim(audio.astype(np.float32), sr)
                dur = len(audio) / sr
                chunks.append(audio)
                b["sentences"].append({"text": sent, "start": t, "end": t + dur})
                t += dur
            b["end"] = t
            beat_info.append(b)
        chunks.append(np.zeros(int(TAIL * sr), dtype=np.float32))
        t += TAIL
        full = np.concatenate(chunks)
        sf.write(OUT / f"{scene}.wav", full, sr)
        timings[scene] = {"total": len(full) / sr, "beats": beat_info}
        print(f"{scene}: {len(full) / sr:5.1f} s")
    tpath.write_text(json.dumps(timings, indent=1))
    print(f"TOTAL: {sum(v['total'] for v in timings.values()):.1f} s")


if __name__ == "__main__":
    main(sys.argv[1:] or None)
