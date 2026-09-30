"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

// A toy model of one GPU serving an ~8B LLM. Illustrative numbers, not real benchmarks.
const N_REQ = 40;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function pct(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

export default function LoadTest() {
  const [logC, setLogC] = useState(3); // concurrency = 2^logC
  const [longPrompts, setLongPrompts] = useState(false);
  const [bursty, setBursty] = useState(false);
  const conc = Math.pow(2, logC);
  const isl = longPrompts ? 4000 : 200;

  const r = useMemo(() => {
    const stepMs = 6 + 0.08 * conc; // decode step gets slower as the batch (and KV reads) grow
    const perUser = 1000 / stepMs;
    const total = perUser * conc;
    const prefillMs = 8 + isl * 0.05;
    const rand = rng(7);
    const ttft: number[] = [];
    for (let i = 0; i < N_REQ; i++) {
      const noise = 0.85 + rand() * 0.3;
      const load = 1 + conc / 64;
      if (bursty) {
        const posInBurst = i % 8; // requests arrive 8 at a time and queue behind each other
        ttft.push(prefillMs * load * (1 + posInBurst * 0.55 * Math.min(1, conc / 16)) * noise);
      } else {
        ttft.push(prefillMs * load * noise);
      }
    }
    const sorted = [...ttft].sort((a, b) => a - b);
    return { perUser, total, ttft, p50: pct(sorted, 0.5), p90: pct(sorted, 0.9), max: sorted[sorted.length - 1] };
  }, [conc, isl, bursty]);

  const scale = Math.max(r.max, 1);

  return (
    <Widget title="Load test a model server" hint="Change the traffic, watch the numbers">
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <label className="block">
          <div className="flex justify-between"><span>Concurrent requests</span><span className="tabular-nums">{conc}</span></div>
          <input type="range" className="w-full" min={0} max={8} value={logC} onChange={(e) => setLogC(+e.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={longPrompts} onChange={(e) => setLongPrompts(e.target.checked)} />
          Long prompts (4,000 tokens instead of 200)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={bursty} onChange={(e) => setBursty(e.target.checked)} />
          Bursty “jitter” traffic instead of a steady stream
        </label>
      </div>

      <div className="mt-5">
        <div className="mb-1 text-[13px] font-medium text-ink-soft">Time to first token for {N_REQ} requests</div>
        <div className="relative flex h-32 items-end gap-[3px] rounded-lg bg-bg-soft px-2 pt-2">
          {r.ttft.map((t, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-[2px] ${t >= r.p90 ? "bg-bad" : "bg-compute"}`}
              style={{ height: `${(t / scale) * 100}%` }}
              title={`${Math.round(t)} ms`}
            />
          ))}
          <div className="pointer-events-none absolute right-2 left-2 z-10 border-t border-dashed border-ink-soft" style={{ bottom: `${(r.p50 / scale) * 100}%` }}>
            <span className="absolute -top-2.5 right-0 rounded bg-card px-1 text-[11px] leading-none text-ink-soft">p50</span>
          </div>
          <div className="pointer-events-none absolute right-2 left-2 z-10 border-t border-dashed border-bad" style={{ bottom: `${(r.p90 / scale) * 100}%` }}>
            <span className="absolute -top-2.5 left-0 rounded bg-card px-1 text-[11px] leading-none text-bad">p90</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">TTFT p50</div>
          <div className="tabular-nums text-lg text-compute">{Math.round(r.p50)} ms</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">TTFT p90</div>
          <div className="tabular-nums text-lg text-bad">{Math.round(r.p90)} ms</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Speed per user</div>
          <div className="tabular-nums text-lg text-memory">{Math.round(r.perUser)} tok/s</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Total throughput</div>
          <div className="tabular-nums text-lg text-accent">{Math.round(r.total).toLocaleString("en-US")} tok/s</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        A toy model with made-up but realistic-shaped numbers. Notice how long prompts and bursty traffic change the results.
        If your benchmark doesn’t match production traffic, its numbers won’t either.
      </p>
    </Widget>
  );
}
