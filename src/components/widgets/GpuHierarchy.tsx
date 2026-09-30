"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Sizes are the H100 figures from the book; relative speeds are illustrative
const levels = [
  {
    name: "Tensor Cores (+ L0 cache)",
    size: "tiny instruction cache per Tensor Core",
    where: "Inside each Streaming Multiprocessor",
    speed: 100,
    kind: "compute" as const,
    plain: "Where the matrix math actually happens. The L0 cache just holds the instructions the Tensor Core is about to run.",
    analogy: "The chef’s hands.",
  },
  {
    name: "L1 cache / shared memory",
    size: "256 KB per SM",
    where: "On-chip, one per Streaming Multiprocessor",
    speed: 80,
    kind: "memory" as const,
    plain: "Very fast SRAM that all the cores in one SM share. Kernels like FlashAttention try hard to keep their working data here.",
    analogy: "The cutting board right next to the stove.",
  },
  {
    name: "L2 cache",
    size: "50 MB total",
    where: "On-chip, shared by every SM",
    speed: 50,
    kind: "memory" as const,
    plain: "A bigger on-chip SRAM cache that all the Streaming Multiprocessors share. Still much faster than VRAM, but far smaller.",
    analogy: "The kitchen counter everyone shares.",
  },
  {
    name: "VRAM (HBM)",
    size: "80 GB on an H100",
    where: "Off-chip DRAM stacked next to the GPU die",
    speed: 20,
    kind: "memory" as const,
    plain: "Where the model weights and KV cache live. Huge compared to the caches, but every trip here is slow. Its bandwidth (3.35 TB/s on an H100) is the decode bottleneck.",
    analogy: "The walk-in fridge down the hall.",
  },
];

export default function GpuHierarchy() {
  const [sel, setSel] = useState(3);
  const l = levels[sel];
  return (
    <Widget title="Inside a GPU, from fastest to biggest" hint="Click a level">
      <div className="grid gap-5 sm:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col items-center gap-2">
          {levels.map((lv, i) => (
            <button
              key={lv.name}
              onClick={() => setSel(i)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                sel === i ? "border-accent bg-accent-soft" : "border-line bg-bg-soft hover:border-ink-faint"
              }`}
              style={{ width: `${55 + i * 15}%` }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className={`text-sm font-semibold ${lv.kind === "compute" ? "text-compute" : "text-memory"}`}>{lv.name}</span>
              </div>
              <div className="text-xs text-ink-faint">{lv.size}</div>
            </button>
          ))}
          <div className="mt-1 text-center text-xs text-ink-faint">↑ faster and smaller · slower and bigger ↓</div>
        </div>
        <div className="rounded-xl bg-bg-soft p-5">
          <div className="text-lg font-semibold">{l.name}</div>
          <div className="mt-1 text-sm text-ink-faint">{l.where}</div>
          <p className="mt-3">{l.plain}</p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">Kitchen version: </span>
            {l.analogy}
          </p>
          <div className="mt-4">
            <div className="mb-1 text-xs text-ink-faint">Relative access speed (illustrative)</div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full transition-all ${l.kind === "compute" ? "bg-compute" : "bg-memory"}`} style={{ width: `${l.speed}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
