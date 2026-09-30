"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const N = 8;
// Ring order laid out as a loop: top row left→right, bottom row right→left
const layout = [0, 1, 2, 3, 7, 6, 5, 4];
const hues = ["#c46a12", "#2c64b5", "#2f5d50", "#2e7d4f", "#b3372f", "#7a4fb3", "#b38a12", "#127a8a"];

export default function ContextParallel() {
  const [step, setStep] = useState(0);
  // At step s, GPU g holds the K/V block that started on GPU (g - s) mod N
  const holding = (g: number) => (g - step + N * 10) % N;
  const seen = (g: number) => Array.from({ length: step + 1 }, (_, s) => (g - s + N * 10) % N);
  const done = step >= N - 1;

  return (
    <Widget title="Context parallelism with ring attention" hint="Step the ring">
      <div className="grid grid-cols-4 gap-2">
        {layout.map((g) => {
          const has = new Set(seen(g));
          return (
            <div key={g} className="rounded-xl border border-line bg-bg-soft p-2.5 text-xs">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">GPU {g + 1}</span>
                <span className="text-ink-faint">frames {g * 12 + 1}–{g * 12 + 12}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-memory/60" title="Full copy of the model weights" />
              <div className="mt-1 text-[10px] text-ink-faint">full copy of the weights</div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-[10px] text-ink-faint">holding</span>
                <span className="h-3 w-5 rounded-sm" style={{ background: hues[holding(g)] }} />
              </div>
              <div className="mt-1.5 flex gap-[2px]">
                {Array.from({ length: N }, (_, b) => (
                  <span key={b} className="h-2 flex-1 rounded-[1px]" style={{ background: has.has(b) ? hues[b] : "var(--line)" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs text-ink-faint">Each GPU passes its block of keys and values to the next GPU in the ring: 1 → 2 → … → 8 → 1</div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">
          {step === 0
            ? "Each GPU starts with its own slice of the video’s frames and attends to those."
            : done
              ? "Done: every GPU has attended to all 8 slices, so every frame has seen every other frame without any GPU holding the whole video."
              : `Pass ${step} of ${N - 1}: each GPU has now attended to ${step + 1} of ${N} slices.`}
        </span>
        <div className="flex gap-2">
          <button onClick={() => setStep(0)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Reset</button>
          <button
            onClick={() => setStep((s) => Math.min(N - 1, s + 1))}
            disabled={done}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
          >
            Pass blocks around
          </button>
        </div>
      </div>
    </Widget>
  );
}
