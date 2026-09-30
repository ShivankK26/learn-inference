"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const standard = [
  { t: "Read Q and K from slow memory", mem: true },
  { t: "Compute scores S = Q × Kᵀ", mem: false },
  { t: "Write S back to slow memory", mem: true },
  { t: "Read S again", mem: true },
  { t: "Compute P = softmax(S)", mem: false },
  { t: "Write P back to slow memory", mem: true },
  { t: "Read P and V", mem: true },
  { t: "Compute output O = P × V", mem: false },
  { t: "Write O to slow memory", mem: true },
];

const flash = [
  { t: "Read a small tile of Q, K, V into fast on-chip memory", mem: true },
  { t: "Compute scores, softmax and output for that tile, all on-chip", mem: false },
  { t: "Repeat for each tile, never saving the big S and P matrices", mem: false },
  { t: "Write only the final O to slow memory", mem: true },
];

export default function FlashCompare() {
  const [mode, setMode] = useState<"standard" | "flash">("standard");
  const steps = mode === "standard" ? standard : flash;
  const trips = steps.filter((s) => s.mem).length;
  return (
    <Widget title="Why FlashAttention is faster" hint="Same math, fewer trips to memory">
      <div className="mb-4 flex gap-2 text-sm">
        <button onClick={() => setMode("standard")} className={`rounded-lg border px-3 py-1.5 ${mode === "standard" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Standard attention
        </button>
        <button onClick={() => setMode("flash")} className={`rounded-lg border px-3 py-1.5 ${mode === "flash" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          FlashAttention
        </button>
      </div>
      <ol className="space-y-1.5" style={{ listStyle: "none", paddingLeft: 0 }}>
        {steps.map((s, i) => (
          <li key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${s.mem ? "bg-memory-soft" : "bg-compute-soft"}`}>
            <span className={`w-16 shrink-0 text-xs font-semibold ${s.mem ? "text-memory" : "text-compute"}`}>
              {s.mem ? "memory" : "compute"}
            </span>
            {s.t}
          </li>
        ))}
      </ol>
      <div className="mt-4 text-sm text-ink-soft">
        <b className="tabular-nums text-lg text-memory">{trips}</b> trips to slow GPU memory.{" "}
        {mode === "standard"
          ? "The big S and P matrices get written out and immediately read back. That’s pure waste."
          : "The answer is exactly the same (no quality loss), but most of the slow memory traffic is gone."}
        <div className="mt-2 text-xs text-ink-faint">
          In the book’s example (N = 4,096, d = 128, FP16):{" "}
          {mode === "standard"
            ? "132 MiB of memory traffic, 128 MiB of it just S and P going out and back. About 62 FLOPs per byte: memory-bound."
            : "about 4 MiB in the ideal case (read Q, K, V once, write O once). About 2,048 FLOPs per byte: compute-bound. Real kernels re-read some K and V tiles, so actual traffic is somewhat higher."}
        </div>
      </div>
    </Widget>
  );
}
