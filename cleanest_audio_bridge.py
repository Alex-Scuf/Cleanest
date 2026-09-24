"""
Cleanest Settings — local audio bridge (Windows only)
======================================================

Why this exists
----------------
Spotify's desktop client decodes and plays audio natively, entirely outside
the page's DOM — there is no <audio>/<video> element a Spicetify theme could
attach a Web Audio AnalyserNode to, and getUserMedia/getDisplayMedia are not
usable from Spotify's own renderer at all (confirmed independently by another
Spicetify visualizer author: https://github.com/Dr1mS/spicetify-vizualizer).
Spotify's internal per-track analysis endpoint
(spclient.wg.spotify.com/audio-attributes/v1/audio-analysis) — the thing
Spicetify.getAudioData() normally uses — has also started failing outright
("Resolver not found!") as of this week, across the whole Spicetify ecosystem,
not just this theme.

This script is the only remaining path to *real*, live audio reactivity: it
runs OUTSIDE Spotify, as its own process, and captures whatever Windows is
actually sending to your speakers (WASAPI loopback) — independent of every
Spotify/Spicetify API above. It measures bass/mid/treble energy and detects
beats itself, then streams that over a local WebSocket
(ws://127.0.0.1:8787) that the theme connects to.

Caveats, so there are no surprises:
  - This captures your system's OUTPUT device as a whole, not Spotify
    specifically — Windows has no simple, dependency-free way to grab just
    one app's audio. If something else is also making sound, it gets picked
    up too. In practice this is rarely noticeable, since you'd normally be
    listening to Spotify as your only/primary audio.
  - This has to be running for the reactive glow to be "live". No bridge
    process = the theme just falls back to whatever its other fallbacks are
    set to (BPM pulse, or flat).
  - Windows only, via WASAPI loopback (PyAudioWPatch). Not tested from this
    environment (written and validated in isolation, on Linux, since the
    actual WASAPI capture can only run on Windows) — if device selection
    behaves unexpectedly on your machine, run with --list-devices and report
    back what it prints.

Install (once):
    pip install PyAudioWPatch websockets numpy

Run:
    python cleanest_audio_bridge.py
    (leave the window open while you listen; Ctrl+C to stop)

    python cleanest_audio_bridge.py --list-devices   # troubleshooting
"""

import argparse
import asyncio
import json
import queue
import sys
import time

import numpy as np

try:
    import pyaudiowpatch as pyaudio
except ImportError:
    print("Missing dependency. Run: pip install PyAudioWPatch websockets numpy")
    sys.exit(1)

try:
    import websockets
except ImportError:
    print("Missing dependency. Run: pip install PyAudioWPatch websockets numpy")
    sys.exit(1)

CHUNK = 1024            # samples per analysis frame (~21ms @ 48kHz, ~47 updates/sec)
WS_HOST = "127.0.0.1"
WS_PORT = 8787
BEAT_HISTORY_SECONDS = 1.0
BEAT_REFRACTORY_SECONDS = 0.12
BEAT_MIN_ENERGY = 0.02   # bass-band floor: ignore near-silent bass fluctuations
MIN_OVERALL_ENERGY_FOR_BEAT = 0.03  # overall RMS floor: don't detect beats when nothing's really playing


def band_energy(spectrum, freqs, lo, hi):
    mask = (freqs >= lo) & (freqs < hi)
    if not np.any(mask):
        return 0.0
    return float(np.mean(spectrum[mask]))


def analyze_chunk(samples, sample_rate):
    """samples: 1D float32 array in [-1, 1], mono. Returns (bass, mid, treble, energy), each roughly 0..1 for typical music."""
    n = len(samples)
    windowed = samples * np.hanning(n)
    spectrum = np.abs(np.fft.rfft(windowed))
    freqs = np.fft.rfftfreq(n, d=1.0 / sample_rate)

    bass = band_energy(spectrum, freqs, 20, 250)
    mid = band_energy(spectrum, freqs, 250, 2000)
    treble = band_energy(spectrum, freqs, 2000, 8000)
    energy = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))  # RMS loudness

    # Soft exponential compression instead of a hard linear clip: values
    # approach 1.0 smoothly as raw energy grows, rather than pegging flat
    # at a ceiling for the whole duration of a loud passage (which, besides
    # looking flat visually, was also what destabilized the beat detector's
    # baseline in testing — see BeatDetector below). k is just "how much
    # raw energy maps to a noticeably strong reading", picked empirically
    # against synthetic test signals, not calibrated against real mixes.
    def soft_norm(x, k):
        return 1.0 - np.exp(-x / k)

    return (
        float(soft_norm(bass, 6.0)),
        float(soft_norm(mid, 6.0)),
        float(soft_norm(treble, 6.0)),
        float(soft_norm(energy, 0.25)),
    )


class BeatDetector:
    """Adaptive threshold on bass-band energy: a beat is a bass hit that
    stands out from its own recent history, not a fixed loudness cutoff —
    so it keeps working whether the track is generally quiet or loud."""

    def __init__(self, frames_per_second, history_seconds=BEAT_HISTORY_SECONDS):
        self.history_len = max(4, int(frames_per_second * history_seconds))
        self.history = []
        self.refractory_frames = max(1, int(frames_per_second * BEAT_REFRACTORY_SECONDS))
        self.refractory = 0

    def update(self, bass_energy, overall_energy):
        if self.refractory > 0:
            self.refractory -= 1
            return False

        if self.history:
            avg = sum(self.history) / len(self.history)
            variance = sum((x - avg) ** 2 for x in self.history) / len(self.history)
            threshold = avg + 1.5 * (variance ** 0.5)
        else:
            threshold = float("inf")

        # Gated on overall loudness, not just the bass-relative threshold:
        # near-silence still has *some* random bass-band energy, and it can
        # exceed a tiny history-derived threshold purely by chance — this
        # makes sure nothing fires at all unless something's actually
        # audibly playing.
        is_beat = (
            overall_energy > MIN_OVERALL_ENERGY_FOR_BEAT
            and bass_energy > threshold
            and bass_energy > BEAT_MIN_ENERGY
        )

        # Baseline only ever sees the quiet-between-beats energy — while
        # refractory is active (i.e. we're still inside a beat's decay
        # tail), history is intentionally NOT updated, so a loud, sustained
        # decay can't drag the "normal" baseline up and mask the next
        # transient's onset.
        self.history.append(bass_energy)
        if len(self.history) > self.history_len:
            self.history.pop(0)

        if is_beat:
            self.refractory = self.refractory_frames
        return is_beat


def list_devices():
    p = pyaudio.PyAudio()
    print("Loopback-capable devices:")
    try:
        for dev in p.get_loopback_device_info_generator():
            print(f"  [{dev['index']}] {dev['name']}  ({int(dev['defaultSampleRate'])} Hz, {dev['maxInputChannels']} ch)")
    except OSError:
        print("  (none found — is WASAPI available on this system?)")
    p.terminate()


def get_default_loopback_device(p):
    wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
    if not default_speakers.get("isLoopbackDevice"):
        for loopback in p.get_loopback_device_info_generator():
            if default_speakers["name"] in loopback["name"]:
                return loopback
        raise RuntimeError(
            "Could not find a loopback device matching your default output "
            f'("{default_speakers["name"]}"). Run with --list-devices and '
            "pick one manually with --device <index>."
        )
    return default_speakers


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--list-devices", action="store_true")
    parser.add_argument("--device", type=int, default=None, help="Loopback device index (see --list-devices)")
    parser.add_argument("--port", type=int, default=WS_PORT)
    args = parser.parse_args()

    if args.list_devices:
        list_devices()
        return

    p = pyaudio.PyAudio()
    if args.device is not None:
        device = p.get_device_info_by_index(args.device)
    else:
        device = get_default_loopback_device(p)

    sample_rate = int(device["defaultSampleRate"])
    channels = device["maxInputChannels"]
    print(f"Capturing: {device['name']}  ({sample_rate} Hz, {channels} ch)")

    frames_per_second = sample_rate / CHUNK
    detector = BeatDetector(frames_per_second)
    audio_queue = queue.Queue(maxsize=32)
    clients = set()

    def pyaudio_callback(in_data, frame_count, time_info, status):
        try:
            audio_queue.put_nowait(in_data)
        except queue.Full:
            pass  # drop the frame rather than block the audio thread
        return (None, pyaudio.paContinue)

    stream = p.open(
        format=pyaudio.paFloat32,
        channels=channels,
        rate=sample_rate,
        frames_per_buffer=CHUNK,
        input=True,
        input_device_index=device["index"],
        stream_callback=pyaudio_callback,
    )

    async def handle_client(websocket):
        clients.add(websocket)
        print(f"Theme connected ({len(clients)} active).")
        try:
            await websocket.wait_closed()
        finally:
            clients.discard(websocket)
            print(f"Theme disconnected ({len(clients)} active).")

    async def broadcast_loop():
        loop = asyncio.get_running_loop()
        last_log = time.time()
        frame_count = 0
        while True:
            raw = await loop.run_in_executor(None, audio_queue.get)
            samples = np.frombuffer(raw, dtype=np.float32)
            if channels > 1:
                samples = samples.reshape(-1, channels).mean(axis=1)
            bass, mid, treble, energy = analyze_chunk(samples, sample_rate)
            is_beat = detector.update(bass, energy)

            if clients:
                message = json.dumps({
                    "bass": round(bass, 4),
                    "mid": round(mid, 4),
                    "treble": round(treble, 4),
                    "energy": round(energy, 4),
                    "beat": is_beat,
                })
                dead = []
                for ws in clients:
                    try:
                        await ws.send(message)
                    except websockets.exceptions.ConnectionClosed:
                        dead.append(ws)
                for ws in dead:
                    clients.discard(ws)

            frame_count += 1
            if time.time() - last_log > 10:
                print(f"~{frame_count / 10:.0f} frames/sec, {len(clients)} client(s) connected.")
                frame_count = 0
                last_log = time.time()

    print(f"Listening on ws://{WS_HOST}:{args.port} — leave this running while you listen.")
    async with websockets.serve(handle_client, WS_HOST, args.port):
        try:
            await broadcast_loop()
        finally:
            stream.stop_stream()
            stream.close()
            p.terminate()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")
