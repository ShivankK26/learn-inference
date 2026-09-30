"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const N = 20;

export default function AttentionPatterns() {
  const [mode, setMode] = useState<"full" | "window">("full");
  const [w, setW] = useState(5);
  let count = 0;
  const cells = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const causal = c <= r;
      const inWin = mode === "full" ? causal : causal && r - c < w;
      if (inWin) count++;
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`aspect-square rounded-[2px] ${inWin ? "bg-compute" : causal ? "bg-compute-soft" : "bg-bg-soft"}`}
        />
      );
    }
  const full = (N * (N + 1)) / 2;
  return (
    <Widget title="Full attention vs. sliding window" hint="Each row is a token, each colored square is one comparison">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,260px)_1fr]">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
          {cells}
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex gap-2">
            {(["full", "window"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg border px-3 py-1.5 ${mode === m ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}
              >
                {m === "full" ? "Full (causal)" : "Sliding window"}
              </button>
            ))}
          </div>
          {mode === "window" && (
            <label className="block">
              <div className="flex justify-between"><span>Window size</span><span className="tabular-nums">{w} tokens</span></div>
              <input type="range" className="w-full" min={2} max={12} value={w} onChange={(e) => setW(+e.target.value)} />
            </label>
          )}
          <div className="rounded-xl bg-bg-soft p-4">
            <div className="tabular-nums text-2xl text-compute">{count}</div>
            <div className="text-ink-soft">comparisons for {N} tokens {mode === "window" && <>({Math.round((1 - count / full) * 100)}% fewer)</>}</div>
          </div>
          <p className="text-ink-soft">
            {mode === "full"
              ? "Every token compares itself to every earlier token: a triangle that grows with the square of the length. Double the text, roughly 4× the work."
              : "Each token only looks at its most recent neighbors, so work grows in a straight line. The trade-off: it can’t directly see far-back tokens."}
          </p>
        </div>
      </div>
    </Widget>
  );
}
