"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative: batching many streams slows each one a little. The book's target: ~80–100 tokens/s per stream for real-time audio.
const REALTIME = 85;
const SOLO_TPS = 320;
const perStream = (n: number) => SOLO_TPS / (1 + (n - 1) / 18);

export default function TTSStreams() {
  const [streams, setStreams] = useState(1);
  const tps = perStream(streams);
  const ok = tps >= REALTIME;
  let maxStreams = 1;
  while (perStream(maxStreams + 1) >= REALTIME) maxStreams++;
  const scale = SOLO_TPS * 1.05;

  return (
    <Widget title="Speed vs. number of voices" hint="Add more simultaneous users">
      <label className="block text-sm">
        <div className="flex justify-between"><span>Concurrent real-time voice streams on one GPU</span><span className="tabular-nums">{streams}</span></div>
        <input type="range" className="w-full" min={1} max={80} value={streams} onChange={(e) => setStreams(+e.target.value)} />
      </label>

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-sm">
          <span>Tokens per second, per stream</span>
          <span className={`font-semibold tabular-nums ${ok ? "text-good" : "text-bad"}`}>{Math.round(tps)} tok/s</span>
        </div>
        <div className="relative h-6 overflow-hidden rounded-md bg-bg-soft">
          <div className={`h-full transition-all ${ok ? "bg-good" : "bg-bad"}`} style={{ width: `${((tps / scale) * 100).toFixed(2)}%`, opacity: 0.75 }} />
          <div className="absolute top-0 h-full w-[2px] bg-ink" style={{ left: `${((REALTIME / scale) * 100).toFixed(2)}%` }} />
        </div>
        <div className="relative mt-1 h-4 text-xs text-ink-faint">
          <span className="absolute -translate-x-1/2" style={{ left: `${((REALTIME / scale) * 100).toFixed(2)}%` }}>
            real-time line (~{REALTIME})
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Audio playback</div>
          <div className={`font-semibold ${ok ? "text-good" : "text-bad"}`}>{ok ? "Smooth" : "Stutters"}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Wasted speed</div>
          <div className="tabular-nums">{ok ? `${Math.round(tps - REALTIME)} tok/s` : "none"}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">GPU cost per user</div>
          <div className="tabular-nums">1/{streams} of a GPU</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {streams === 1
          ? "One user gets way more speed than they can hear. Everything above the line is wasted."
          : ok
            ? `Still real-time for everyone. This GPU can hold about ${maxStreams} streams before audio starts to break up.`
            : `Past about ${maxStreams} streams, each voice falls below real-time and playback stutters. Set your batch size just under this point.`}
      </p>
      <p className="mt-2 text-xs text-ink-faint">Numbers are illustrative. Measure your own model and GPU to find the real limit.</p>
    </Widget>
  );
}
