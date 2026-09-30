"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// H100 (80 GB): 7 compute slices, 8 memory slices of 10 GB.
const profiles = [
  { name: "1 slice", c: 1, m: 1, label: "1/7 compute · 10 GB" },
  { name: "2 slices", c: 2, m: 2, label: "2/7 compute · 20 GB" },
  { name: "3 slices", c: 3, m: 4, label: "3/7 compute · 40 GB" },
  { name: "4 slices", c: 4, m: 4, label: "4/7 compute · 40 GB" },
  { name: "Full GPU", c: 7, m: 8, label: "all compute · 80 GB" },
];
const colors = ["bg-accent", "bg-memory", "bg-compute", "bg-good", "bg-ink-soft"];

export default function MigSlicer() {
  const [parts, setParts] = useState<number[]>([2, 2]);
  const usedC = parts.reduce((a, p) => a + profiles[p].c, 0);
  const usedM = parts.reduce((a, p) => a + profiles[p].m, 0);

  function add(i: number) {
    const p = profiles[i];
    if (usedC + p.c > 7 || usedM + p.m > 8) return;
    setParts([...parts, i]);
  }

  const cCells: number[] = [];
  const mCells: number[] = [];
  parts.forEach((p, k) => {
    for (let j = 0; j < profiles[p].c; j++) cCells.push(k);
    for (let j = 0; j < profiles[p].m; j++) mCells.push(k);
  });

  return (
    <Widget title="Slice one H100 into smaller GPUs (MIG)" hint="Add instances until you run out">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-sm text-ink-soft">Compute slices (132 SMs don’t divide by 7 evenly, so a few are left idle)</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`h-10 rounded-md transition ${i < cCells.length ? colors[cCells[i] % colors.length] : "border border-dashed border-line bg-bg-soft"}`} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-ink-soft">Memory slices (8 × 10 GB)</div>
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={`h-6 rounded-md opacity-70 transition ${i < mCells.length ? colors[mCells[i] % colors.length] : "border border-dashed border-line bg-bg-soft"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {profiles.map((p, i) => {
          const fits = usedC + p.c <= 7 && usedM + p.m <= 8;
          return (
            <button
              key={p.name}
              onClick={() => add(i)}
              disabled={!fits}
              className={`rounded-lg border px-3 py-1.5 text-left text-sm ${fits ? "border-line hover:border-accent" : "cursor-not-allowed border-line opacity-40"}`}
            >
              <div className="font-medium">+ {p.name}</div>
              <div className="text-xs text-ink-faint">{p.label}</div>
            </button>
          );
        })}
        <button onClick={() => setParts([])} className="rounded-lg px-3 py-1.5 text-sm text-accent underline underline-offset-4">
          Clear
        </button>
      </div>

      <div className="mt-4 text-sm text-ink-soft">
        {parts.length === 0 ? (
          "Empty GPU. Add some instances."
        ) : (
          <>
            <b className="text-ink">{parts.length}</b> separate instance{parts.length > 1 ? "s" : ""}, each with its own share of compute, memory, CPU, RAM, and network. Using {usedC}/7 compute and {usedM}/8 memory slices.
          </>
        )}
      </div>
    </Widget>
  );
}
