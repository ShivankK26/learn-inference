"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const models = [
  { name: "Llama 70B", params: 70 },
  { name: "GPT OSS 120B", params: 120 },
  { name: "Llama 405B", params: 405 },
  { name: "DeepSeek-V3.1 (671B)", params: 671 },
];
const precisions = [
  { name: "FP16", bytes: 2 },
  { name: "FP8", bytes: 1 },
  { name: "FP4", bytes: 0.5 },
];
const gpus = [
  { name: "H100", gb: 80 },
  { name: "H200", gb: 141 },
  { name: "B200", gb: 180 },
];
const SIZES = [1, 2, 4, 8, 16, 32];

function Pills({ items, value, set }: { items: string[]; value: number; set: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <button
          key={it}
          onClick={() => set(i)}
          className={`rounded-lg border px-2.5 py-1 text-sm ${value === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export default function GpuCount() {
  const [m, setM] = useState(3);
  const [p, setP] = useState(1);
  const [g, setG] = useState(2);
  const [kv, setKv] = useState(100); // KV budget as % of weight size

  const weights = models[m].params * precisions[p].bytes;
  const kvGB = (weights * kv) / 100;
  const total = weights + kvGB;
  const per = gpus[g].gb;
  const exact = total / per;
  const n = SIZES.find((s) => s * per >= total);
  const weightOnly = SIZES.find((s) => s * per >= weights);

  return (
    <Widget title="How many GPUs does this model need?" hint="Weights + room for the KV cache">
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Model</div>
          <Pills items={models.map((x) => x.name)} value={m} set={setM} />
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Precision</div>
            <Pills items={precisions.map((x) => x.name)} value={p} set={setP} />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-ink-soft">GPU</div>
            <Pills items={gpus.map((x) => `${x.name} (${x.gb} GB)`)} value={g} set={setG} />
          </div>
        </div>
        <label className="block">
          <div className="flex justify-between">
            <span>Room for KV cache (compared to the weights)</span>
            <span className="tabular-nums">{kv}%</span>
          </div>
          <input type="range" className="w-full" min={0} max={200} step={10} value={kv} onChange={(e) => setKv(+e.target.value)} />
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-full bg-bg-soft">
        <div className="flex h-4">
          <div className="h-full bg-compute" style={{ width: `${((weights / total) * 100).toFixed(1)}%` }} />
          <div className="h-full bg-memory" style={{ width: `${((kvGB / total) * 100).toFixed(1)}%` }} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-compute" /> weights {Math.round(weights).toLocaleString("en-US")} GB</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-memory" /> KV cache {Math.round(kvGB).toLocaleString("en-US")} GB</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Memory needed</div>
          <div className="text-lg tabular-nums">{Math.round(total).toLocaleString("en-US")} GB</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Exact GPU count</div>
          <div className="text-lg tabular-nums">{exact.toFixed(1)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Round up to</div>
          <div className="text-lg font-semibold text-accent tabular-nums">{n ? `${n} GPU${n > 1 ? "s" : ""}` : "32+"}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {n && n > 8
          ? "More than one 8-GPU machine: this is multi-node territory, covered at the end of this lesson."
          : weightOnly && n && weightOnly < n
            ? `The weights alone would squeeze onto ${weightOnly} GPU${weightOnly > 1 ? "s" : ""}, but with no room for the KV cache you couldn’t serve real traffic.`
            : "GPU instances come in sizes of 1, 2, 4 or 8, so you round up to the next size."}
      </p>
    </Widget>
  );
}
