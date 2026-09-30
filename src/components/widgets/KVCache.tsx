"use client";

import { useEffect, useRef, useState } from "react";
import { Widget } from "../Blocks";

const PROMPT = 4;
const MAX_NEW = 12;

function Grid({ steps, cached }: { steps: number; cached: boolean }) {
  // Row r = the forward pass that produces token (PROMPT + r)
  const rows = [];
  for (let r = 0; r <= steps; r++) {
    const len = r === 0 ? PROMPT : PROMPT + r;
    const cells = [];
    for (let c = 0; c < PROMPT + MAX_NEW; c++) {
      let kind: "fresh" | "reuse" | "none" = "none";
      if (c < len) {
        if (!cached) kind = "fresh";
        else kind = r === 0 || c === len - 1 ? "fresh" : "reuse";
      }
      cells.push(
        <div
          key={c}
          className={`h-3.5 w-3.5 rounded-[3px] sm:h-4 sm:w-4 ${
            kind === "fresh" ? "bg-compute" : kind === "reuse" ? "border border-memory bg-memory-soft" : "bg-bg-soft"
          }`}
        />
      );
    }
    rows.push(
      <div key={r} className="flex items-center gap-[3px]">
        <span className="w-14 shrink-0 text-right tabular-nums text-[11px] text-ink-faint">{r === 0 ? "prefill" : `token ${r}`}</span>
        {cells}
      </div>
    );
  }
  return <div className="space-y-[3px] overflow-x-auto pb-1">{rows}</div>;
}

export default function KVCache() {
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setSteps((s) => {
        if (s >= MAX_NEW) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 450);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  // Work = number of token K/V computations
  let noCache = 0;
  for (let r = 0; r <= steps; r++) noCache += r === 0 ? PROMPT : PROMPT + r;
  const withCache = PROMPT + steps;

  return (
    <Widget title="With vs. without the KV cache" hint="Press Play or step through">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-semibold">Without cache</span>
            <span className="tabular-nums text-sm text-compute">{noCache} computations</span>
          </div>
          <Grid steps={steps} cached={false} />
          <div className="mt-2 text-xs text-ink-faint">Re-reads and re-computes every earlier token, every single time.</div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-semibold">With KV cache</span>
            <span className="tabular-nums text-sm text-compute">{withCache} computations</span>
          </div>
          <Grid steps={steps} cached />
          <div className="mt-2 text-xs text-ink-faint">Computes only the newest token and looks the rest up from the cache.</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-compute" /> computed now</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] border border-memory bg-memory-soft" /> read from the cache (memory)</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">
          {steps > 0 ? (
            <>Without the cache that’s <b className="text-ink">{(noCache / withCache).toFixed(1)}×</b> more work, and the gap keeps growing.</>
          ) : (
            "The prompt is processed once during prefill, filling the cache."
          )}
        </span>
        <div className="flex gap-2">
          <button onClick={() => { setPlaying(false); setSteps(0); }} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Reset</button>
          <button onClick={() => setSteps((s) => Math.min(MAX_NEW, s + 1))} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Step</button>
          <button
            onClick={() => { if (steps >= MAX_NEW) setSteps(0); setPlaying((p) => !p); }}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90"
          >
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </Widget>
  );
}
