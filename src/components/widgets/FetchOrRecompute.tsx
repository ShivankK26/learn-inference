"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative setup: Llama 3.1 8B in FP16 on one H100 (989 TFLOPS dense FP16) at 50% utilization.
const PARAMS = 8e9;
const LAYERS = 32;
const D_MODEL = 4096;
const KV_BYTES_PER_TOKEN = 131_072; // 2 × 32 layers × 8 KV heads × 128 × 2 bytes
const EFFECTIVE_FLOPS = 989e12 * 0.5;

// Tier bandwidths: book ranges for G2–G4; the GB200 link figure is from Chapter 3.
const tiers = [
  { id: "G2", name: "CPU RAM over PCIe", gbps: 50 },
  { id: "G2+", name: "CPU RAM on a Grace superchip", gbps: 900 },
  { id: "G3", name: "Local SSD", gbps: 7 },
  { id: "G4", name: "Networked SSD", gbps: 2 },
];

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

export default function FetchOrRecompute() {
  const [k, setK] = useState(10); // thousands of tokens
  const n = k * 1000;
  const bytes = n * KV_BYTES_PER_TOKEN;
  const flops = 2 * PARAMS * n + 2 * LAYERS * n * n * D_MODEL; // weights matmuls + causal attention
  const recomputeMs = (flops / EFFECTIVE_FLOPS) * 1000;
  const rows = tiers.map((t) => ({ ...t, ms: (bytes / (t.gbps * 1e9)) * 1000 }));
  const max = Math.max(recomputeMs, ...rows.map((r) => r.ms));

  return (
    <Widget title="Fetch the cached prefix, or recompute it?" hint="Drag the prefix length">
      <label className="block text-sm">
        <div className="flex justify-between">
          <span>Cached prefix length</span>
          <span className="tabular-nums">{n.toLocaleString("en-US")} tokens · {(bytes / 1e9).toFixed(2)} GB of KV</span>
        </div>
        <input type="range" className="w-full" min={1} max={100} value={k} onChange={(e) => setK(+e.target.value)} />
      </label>

      <div className="mt-5 space-y-2.5 text-sm">
        <div>
          <div className="mb-1 flex justify-between">
            <span className="font-medium text-compute">Recompute with prefill</span>
            <span className="tabular-nums">{fmt(recomputeMs)}</span>
          </div>
          <div className="h-3 rounded-full bg-bg-soft">
            <div className="h-full rounded-full bg-compute" style={{ width: `${((recomputeMs / max) * 100).toFixed(2)}%` }} />
          </div>
        </div>
        {rows.map((r) => {
          const wins = r.ms < recomputeMs;
          return (
            <div key={r.id}>
              <div className="mb-1 flex justify-between gap-2">
                <span>
                  Fetch from <b>{r.id}</b> · {r.name} <span className="text-ink-faint">({r.gbps} GB/s)</span>
                </span>
                <span className={`tabular-nums ${wins ? "text-good" : "text-bad"}`}>
                  {fmt(r.ms)} {wins ? `· ${(recomputeMs / r.ms).toFixed(1)}× faster` : "· slower"}
                </span>
              </div>
              <div className="h-3 rounded-full bg-bg-soft">
                <div className="h-full rounded-full bg-memory" style={{ width: `${((r.ms / max) * 100).toFixed(2)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Illustrative: an 8B model in FP16 on one H100 at 50% utilization, counting the weight matmuls plus causal attention.
        Real speeds vary. A busy GPU also changes the answer: recomputing steals compute from other users, while a fetch
        mostly uses idle links.
      </p>
    </Widget>
  );
}
