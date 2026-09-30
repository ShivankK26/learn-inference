"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const gpus = [
  { name: "L4", memGB: 24 },
  { name: "H100", memGB: 80 },
  { name: "H200", memGB: 141 },
  { name: "B200", memGB: 192 },
  { name: "B300", memGB: 288 },
];
const precisions = [
  { name: "FP16", bytes: 2 },
  { name: "FP8", bytes: 1 },
  { name: "FP4", bytes: 0.5 },
];
const counts = [1, 2, 4, 8];

export default function FitCalculator() {
  const [params, setParams] = useState(70);
  const [prec, setPrec] = useState("FP16");
  const [gpu, setGpu] = useState("H100");
  const [n, setN] = useState(1);

  const bytes = precisions.find((p) => p.name === prec)!.bytes;
  const mem = gpus.find((g) => g.name === gpu)!.memGB * n;
  const weights = params * bytes;
  const needed = weights * 1.5; // weights + at least 50% headroom for KV cache
  const status = weights > mem ? "oom" : needed > mem ? "tight" : "ok";
  const wPct = Math.min(100, (weights / mem) * 100);
  const hPct = Math.min(100 - wPct, ((needed - weights) / mem) * 100);

  return (
    <Widget title="Will my model fit?" hint="Weights + at least 50% headroom for the KV cache">
      <div className="grid gap-5 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between">
            <span>Model size</span>
            <span className="font-medium">{params}B parameters</span>
          </div>
          <input type="range" className="w-full" min={1} max={700} step={1} value={params} onChange={(e) => setParams(+e.target.value)} />
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[3, 8, 32, 70, 235, 671].map((v) => (
              <button key={v} onClick={() => setParams(v)} className="rounded-md border border-line px-2 py-0.5 text-xs hover:border-accent">
                {v}B
              </button>
            ))}
          </div>
        </label>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-20 text-ink-soft">Precision</span>
            {precisions.map((p) => (
              <button key={p.name} onClick={() => setPrec(p.name)} className={`rounded-lg border px-2.5 py-1 ${prec === p.name ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-20 text-ink-soft">GPU</span>
            {gpus.map((g) => (
              <button key={g.name} onClick={() => setGpu(g.name)} className={`rounded-lg border px-2.5 py-1 ${gpu === g.name ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
                {g.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-20 text-ink-soft">How many</span>
            {counts.map((c) => (
              <button key={c} onClick={() => setN(c)} className={`rounded-lg border px-2.5 py-1 ${n === c ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
                {c}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-1 flex justify-between text-xs text-ink-faint">
          <span>{n > 1 ? `${n} × ${gpu}` : gpu} VRAM</span>
          <span>{mem.toLocaleString("en-US")} GB</span>
        </div>
        <div className="flex h-7 overflow-hidden rounded-lg border border-line bg-bg-soft">
          <div className="flex h-full items-center justify-center bg-memory text-xs text-bg transition-all" style={{ width: `${wPct}%` }}>
            {wPct > 18 ? "weights" : ""}
          </div>
          <div className="h-full bg-memory-soft transition-all" style={{ width: `${hPct}%`, borderLeft: hPct > 0 ? "1px dashed var(--memory)" : undefined }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-memory" /> weights: {weights.toLocaleString("en-US")} GB</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-memory bg-memory-soft" /> 50% KV cache headroom: {(needed - weights).toLocaleString("en-US")} GB</span>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
          status === "ok" ? "border-good/40 bg-good-soft" : status === "tight" ? "border-compute/40 bg-compute-soft" : "border-bad/40 bg-bad-soft"
        }`}
      >
        {status === "ok" && <>✓ Fits, with room for the KV cache.</>}
        {status === "tight" && <>⚠ The weights load, but there’s less than 50% headroom. Expect slow inference or out-of-memory crashes under load.</>}
        {status === "oom" && <>✕ Out of memory: the weights alone ({weights.toLocaleString("en-US")} GB) don’t fit. Try more GPUs, a bigger GPU, or lower precision.</>}
      </div>
    </Widget>
  );
}
