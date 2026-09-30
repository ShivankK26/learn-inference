"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative: a 70B dense model (80 layers, hidden 8,192) with a 16-bit KV cache (320 KiB per token),
// prefill on 8 × H100 in FP8 (1,979 TFLOPS each) at 50% utilization.
const PARAMS = 70e9;
const LAYERS = 80;
const D_MODEL = 8192;
const KV_PER_TOKEN = 327_680;
const PREFILL_FLOPS = 8 * 1979e12 * 0.5;
const HANDOFF_MS = 2; // extra scheduling hop, illustrative

const links = [
  { name: "NVLink (same node)", gbps: 900 },
  { name: "InfiniBand (8 × 50 GB/s in parallel)", gbps: 400 },
  { name: "InfiniBand (one 50 GB/s card)", gbps: 50 },
];
const steps = [100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : ms < 1 ? `${ms.toFixed(2)} ms` : `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;
}

export default function KVHandoff() {
  const [i, setI] = useState(5);
  const [l, setL] = useState(1);
  const n = steps[i];
  const kvBytes = n * KV_PER_TOKEN;
  const flops = 2 * PARAMS * n + 2 * LAYERS * n * n * D_MODEL;
  const prefillMs = (flops / PREFILL_FLOPS) * 1000;
  const transferMs = (kvBytes / (links[l].gbps * 1e9)) * 1000;
  const costMs = transferMs + HANDOFF_MS;
  const share = costMs / prefillMs;
  const max = Math.max(prefillMs, costMs);

  return (
    <Widget title="Is shipping the KV cache worth it?" hint="Change the uncached prompt length">
      <label className="block text-sm">
        <div className="flex justify-between">
          <span>Uncached input tokens</span>
          <span className="tabular-nums">{n.toLocaleString("en-US")} tokens · {(kvBytes / 1e9).toFixed(2)} GB of KV</span>
        </div>
        <input type="range" className="w-full" min={0} max={steps.length - 1} value={i} onChange={(e) => setI(+e.target.value)} />
      </label>
      <div className="mt-3 flex flex-wrap gap-1.5 text-sm">
        {links.map((x, k) => (
          <button
            key={x.name}
            onClick={() => setL(k)}
            className={`rounded-lg border px-2.5 py-1 ${l === k ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {x.name}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div>
          <div className="mb-1 flex justify-between">
            <span className="font-medium text-compute">Prefill work moved off the decode engine</span>
            <span className="tabular-nums">{fmt(prefillMs)}</span>
          </div>
          <div className="h-3 rounded-full bg-bg-soft">
            <div className="h-full rounded-full bg-compute" style={{ width: `${((prefillMs / max) * 100).toFixed(2)}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span className="font-medium text-memory">Cost of the handoff (transfer + extra hop)</span>
            <span className="tabular-nums">{fmt(transferMs)} + {HANDOFF_MS} ms</span>
          </div>
          <div className="h-3 rounded-full bg-bg-soft">
            <div className="h-full rounded-full bg-memory" style={{ width: `${((costMs / max) * 100).toFixed(2)}%` }} />
          </div>
        </div>
      </div>

      <div className={`mt-4 rounded-xl p-4 text-sm ${share < 0.2 ? "bg-good-soft" : "bg-bad-soft"}`}>
        The handoff costs <b className="tabular-nums">{Math.round(share * 100)}%</b> of the prefill it offloads.{" "}
        {share < 0.2
          ? "Worth disaggregating: the prefill engine takes a big job off the decode engine for a small transfer."
          : "Keep it local: with conditional disaggregation, the decode engine just prefills this itself."}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Illustrative model: 70B dense, 16-bit KV cache, prefill on 8 × H100 in FP8 at 50% utilization, 2 ms of extra
        scheduling per handoff. Real systems also overlap the transfer with prefill, layer by layer.
      </p>
    </Widget>
  );
}
