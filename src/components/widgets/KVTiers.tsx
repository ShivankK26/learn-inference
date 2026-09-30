"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Capacities are illustrative for one B200 box; speeds follow the book's table
const tiers = [
  { id: "G1", name: "GPU memory (VRAM)", speed: "terabytes/sec", gb: 64, color: "bg-accent" },
  { id: "G2", name: "CPU memory (RAM)", speed: "10s–100s of GB/sec", gb: 1000, color: "bg-memory" },
  { id: "G3", name: "Local SSD", speed: "5–10 GB/sec", gb: 8000, color: "bg-compute" },
  { id: "G4", name: "Networked SSD", speed: "a few GB/sec", gb: 40000, color: "bg-ink-faint" },
];

const PER_CONVO_GB = 2; // a long conversation’s KV cache

export default function KVTiers() {
  const [convos, setConvos] = useState(20);
  const [offload, setOffload] = useState(true);
  let left = convos * PER_CONVO_GB;
  const fills: number[] = [];
  for (let i = 0; i < tiers.length; i++) {
    const used = !offload && i > 0 ? 0 : Math.min(left, tiers[i].gb);
    left -= used;
    fills.push(used);
  }
  const evicted = Math.max(0, Math.ceil(left / PER_CONVO_GB));

  return (
    <Widget title="Where the KV cache lives" hint="Add more cached conversations">
      <label className="block text-sm">
        <div className="flex justify-between">
          <span>Conversations kept in cache ({PER_CONVO_GB} GB each)</span>
          <span className="tabular-nums">{convos.toLocaleString("en-US")}</span>
        </div>
        <input type="range" className="w-full" min={0} max={3000} step={10} value={convos} onChange={(e) => setConvos(+e.target.value)} />
      </label>
      <label className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={offload} onChange={(e) => setOffload(e.target.checked)} /> Offload to slower tiers when VRAM is full
      </label>

      <div className="mt-5 space-y-3">
        {tiers.map((t, i) => {
          const pct = (fills[i] / t.gb) * 100;
          const disabled = !offload && i > 0;
          return (
            <div key={t.id} className={disabled ? "opacity-40" : ""}>
              <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                <span><b>{t.id}</b> · {t.name}</span>
                <span className="text-ink-faint">{t.speed} · <span className="tabular-nums">{fills[i].toLocaleString("en-US")} / {t.gb.toLocaleString("en-US")} GB</span></span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-bg-soft">
                <div className={`h-full rounded-full ${t.color} transition-all`} style={{ width: `${pct.toFixed(1)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
        {evicted > 0 ? (
          <span className="text-bad">
            {evicted.toLocaleString("en-US")} conversations don’t fit and get <b>evicted</b>. Their next message is a cache miss and
            pays for prefill again.
          </span>
        ) : fills[0] < convos * PER_CONVO_GB ? (
          <span>Everything fits, but some conversations now live in slower tiers. Keep the busiest ones in G1.</span>
        ) : (
          <span>Everything fits in the fastest tier (GPU memory).</span>
        )}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        G1 here is 64 GB: the book’s example of giving 80% of the leftover memory on a B200 to the KV cache. Other sizes are
        illustrative.
      </p>
    </Widget>
  );
}
