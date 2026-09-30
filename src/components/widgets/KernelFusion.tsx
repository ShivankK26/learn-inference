"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

type Step = { kind: "read" | "write" | "compute"; text: string };

function steps(nOps: number, fused: boolean): Step[] {
  const ops = [2, 3, 5, 7].slice(0, nOps);
  let v = [1, 2, 3];
  const show = (a: number[]) => `[${a.join(", ")}]`;
  if (fused) {
    const factor = ops.reduce((a, b) => a * b, 1);
    const out = v.map((x) => x * factor);
    return [
      { kind: "read", text: `Read ${show(v)} from memory` },
      { kind: "compute", text: `Run multiply_by_${factor} (one fused kernel)` },
      { kind: "write", text: `Write ${show(out)} to memory` },
    ];
  }
  const s: Step[] = [];
  for (const k of ops) {
    const out = v.map((x) => x * k);
    s.push({ kind: "read", text: `Read ${show(v)} from memory` });
    s.push({ kind: "compute", text: `Run multiply_by_${k}` });
    s.push({ kind: "write", text: `Write ${show(out)} to memory` });
    v = out;
  }
  return s;
}

export default function KernelFusion() {
  const [fused, setFused] = useState(false);
  const [nOps, setNOps] = useState(2);
  const list = steps(nOps, fused);
  const trips = list.filter((s) => s.kind !== "compute").length;
  const unfusedTrips = nOps * 2;
  return (
    <Widget title="Kernel fusion: skip the pointless round trips" hint="Toggle fusion">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex gap-2">
          <button onClick={() => setFused(false)} className={`rounded-lg border px-3 py-1.5 ${!fused ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
            Separate kernels
          </button>
          <button onClick={() => setFused(true)} className={`rounded-lg border px-3 py-1.5 ${fused ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
            Fused kernel
          </button>
        </div>
        <label className="flex items-center gap-2">
          <span>Operations in a row</span>
          <input type="range" min={2} max={4} value={nOps} onChange={(e) => setNOps(+e.target.value)} />
          <span className="tabular-nums">{nOps}</span>
        </label>
      </div>
      <ol className="space-y-1.5" style={{ listStyle: "none", paddingLeft: 0 }}>
        {list.map((s, i) => (
          <li key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${s.kind === "compute" ? "bg-compute-soft" : "bg-memory-soft"}`}>
            <span className={`w-16 shrink-0 text-xs font-semibold ${s.kind === "compute" ? "text-compute" : "text-memory"}`}>
              {s.kind === "compute" ? "compute" : "memory"}
            </span>
            <span className="tabular-nums">{s.text}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 text-sm text-ink-soft">
        <b className="tabular-nums text-lg text-memory">{trips}</b> trips to GPU memory
        {fused ? (
          <> instead of <b className="tabular-nums">{unfusedTrips}</b>. Same answer, {Math.round((1 - trips / unfusedTrips) * 100)}% less memory traffic.</>
        ) : (
          <>. Every “write, then read it straight back” pair in the middle is wasted work, and during memory-bound decode that waste costs real time.</>
        )}
      </div>
    </Widget>
  );
}
