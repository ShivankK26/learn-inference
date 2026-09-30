"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative model: 70B dense model in FP16 (140 GB) on H100s (80 GB, 3.35 TB/s).
const WEIGHTS_GB = 140;
const GPU_GB = 80;
const BW = 3.35; // TB/s
const LAYERS = 80;
const NVLINK_US = 10; // per all-reduce, within a node (illustrative)
const IB_US = 80; // per all-reduce, across nodes (illustrative)
const DEGREES = [1, 2, 4, 8, 16];

function stepMs(n: number) {
  const readMs = (WEIGHTS_GB / n / (BW * 1000)) * 1000;
  const perReduce = n === 1 ? 0 : n > 8 ? IB_US : NVLINK_US;
  const commMs = (2 * LAYERS * perReduce) / 1000; // two all-reduces per layer
  return { readMs, commMs, total: readMs + commMs };
}

const gpuColor = ["bg-compute", "bg-memory", "bg-accent", "bg-good", "bg-bad", "bg-ink-faint", "bg-compute-soft", "bg-memory-soft"];

export default function TensorParallel() {
  const [tp, setTp] = useState(4);
  const fits = WEIGHTS_GB / tp <= GPU_GB * 0.9;
  const s = stepMs(tp);
  const maxTps = Math.max(...DEGREES.filter((d) => WEIGHTS_GB / d <= GPU_GB * 0.9).map((d) => 1000 / stepMs(d).total));
  const cols = Math.min(tp, 8);

  return (
    <Widget title="Tensor parallelism: split every layer across GPUs" hint="Pick how many GPUs">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {DEGREES.map((d) => (
          <button
            key={d}
            onClick={() => setTp(d)}
            className={`rounded-lg border px-3 py-1.5 ${tp === d ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            TP{d}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink-faint">70B model, FP16, on H100s</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">One layer’s weight matrix, split by GPU</div>
          <div className="grid h-32 gap-1 rounded-lg border border-line p-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }, (_, i) => (
              <div key={i} className={`rounded ${gpuColor[i % gpuColor.length]} opacity-80`} />
            ))}
          </div>
          <div className="mt-2 text-xs text-ink-faint">
            {tp === 1 ? "One GPU holds and reads everything." : `Each GPU holds ${tp > 8 ? "1/16" : `1/${tp}`} of every layer, then they combine results (all-reduce) before the next layer.`}
            {tp > 8 && " With 16 GPUs, the split spans two machines over InfiniBand."}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-bg-soft p-4">
            <div className="mb-2 text-[13px] font-medium text-ink-soft">Time to generate one token</div>
            {fits ? (
              <>
                <div className="flex h-5 overflow-hidden rounded bg-card">
                  <div className="h-full bg-memory" style={{ width: `${((s.readMs / 45) * 100).toFixed(1)}%` }} />
                  <div className="h-full bg-bad" style={{ width: `${((s.commMs / 45) * 100).toFixed(1)}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-ink-soft">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-memory" /> reading weights {s.readMs.toFixed(1)} ms</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-bad" /> GPUs talking {s.commMs.toFixed(1)} ms</span>
                </div>
              </>
            ) : (
              <div className="text-bad">Doesn’t fit: {WEIGHTS_GB} GB of weights on {tp} × {GPU_GB} GB.</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Weights per GPU</div>
              <div className="text-lg tabular-nums">{(WEIGHTS_GB / tp).toFixed(0)} GB</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Speed per user</div>
              <div className={`text-lg tabular-nums ${fits && 1000 / s.total >= maxTps - 0.5 ? "font-semibold text-accent" : ""}`}>
                {fits ? `${Math.round(1000 / s.total)} tok/s` : "–"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Simplified: communication costs are illustrative. The pattern is real: more GPUs means less to read each, but more
        talking, and talking across machines is far slower than inside one.
      </p>
    </Widget>
  );
}
