"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative pipeline numbers, tuned so 1 hour on 8 GPUs lands near the book's "under 4 seconds" (RTF ~1000×)
const SILENCE = 0.1; // share of audio the VAD model removes
const CHUNK_S = 25; // average speech chunk (Whisper max is 30 s)
const PER_GPU = 8; // chunks each GPU runs at once with in-flight batching
const CHUNK_TIME = 0.9; // seconds to transcribe one wave of chunks
const VAD_TIME = 0.5;
const STITCH_TIME = 0.1;
const palette = ["var(--memory)", "var(--compute)", "var(--accent)", "var(--good)"];

export default function LongAudio() {
  const [minutes, setMinutes] = useState(60);
  const [gpus, setGpus] = useState(1);

  const speech = minutes * 60 * (1 - SILENCE);
  const chunks = Math.ceil(speech / CHUNK_S);
  const slots = gpus * PER_GPU;
  const waves = Math.ceil(chunks / slots);
  const total = VAD_TIME + waves * CHUNK_TIME + STITCH_TIME;
  const rtf = (minutes * 60) / total;

  // lay chunks out per GPU lane, per wave
  const lanes = Array.from({ length: gpus }, (_, g) => {
    const blocks: { wave: number; n: number }[] = [];
    for (let w = 0; w < waves; w++) {
      const start = w * slots + g * PER_GPU;
      const n = Math.max(0, Math.min(PER_GPU, chunks - start));
      if (n > 0) blocks.push({ wave: w, n });
    }
    return blocks;
  });

  return (
    <Widget title="Transcribing a long file in parallel" hint="Add GPUs">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>Audio length</span><span className="tabular-nums">{minutes} min</span></div>
          <input type="range" className="w-full" min={5} max={120} step={5} value={minutes} onChange={(e) => setMinutes(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>GPUs (or MIG slices)</span><span className="tabular-nums">{gpus}</span></div>
          <input type="range" className="w-full" min={1} max={8} value={gpus} onChange={(e) => setGpus(+e.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-bg-soft px-2 py-1">1 · VAD cuts out silence and splits speech into {chunks} chunks</span>
        <span className="text-ink-faint">→</span>
        <span className="rounded-md bg-bg-soft px-2 py-1">2 · Chunks transcribed in parallel</span>
        <span className="text-ink-faint">→</span>
        <span className="rounded-md bg-bg-soft px-2 py-1">3 · Stitched back together by timestamp</span>
      </div>

      <div className="mt-4 space-y-1.5 overflow-x-auto">
        {lanes.map((blocks, g) => (
          <div key={g} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-faint">GPU {g + 1}</span>
            <div className="flex flex-1 gap-[3px]">
              {blocks.map((b) => (
                <div
                  key={b.wave}
                  title={`${b.n} chunks`}
                  className="h-5 rounded-[3px]"
                  style={{ flex: `0 0 ${Math.max(6, 100 / Math.max(waves, 12))}%`, background: palette[b.wave % palette.length], opacity: 0.35 + (0.65 * b.n) / PER_GPU }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Time to transcribe</div>
          <div className="text-lg tabular-nums">{total.toFixed(1)} s</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Real-time factor</div>
          <div className="text-lg font-semibold tabular-nums text-accent">{Math.round(rtf).toLocaleString("en-US")}×</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">World’s fastest typist</div>
          <div className="text-lg tabular-nums">2×</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Each colored block is one batch of chunks running together on a GPU. More GPUs means fewer rounds, so speed grows
        roughly in line with GPU count. Timings are illustrative.
      </p>
    </Widget>
  );
}
