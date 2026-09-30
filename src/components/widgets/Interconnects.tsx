"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// GB/s. Network specs are quoted in gigabits (Gb/s); divide by 8 for gigabytes.
const links = [
  { name: "NVLink (Blackwell)", gbps: 1800, what: "GPU ↔ GPU inside one node" },
  { name: "NVLink (Hopper)", gbps: 900, what: "GPU ↔ GPU inside one node" },
  { name: "NVLink-C2C (Grace)", gbps: 900, what: "CPU ↔ GPU on a superchip" },
  { name: "InfiniBand (400 Gb/s NIC)", gbps: 50, what: "Node ↔ node" },
  { name: "Ethernet (100 Gb/s NIC)", gbps: 12.5, what: "Node ↔ node" },
];

export default function Interconnects() {
  const [gb, setGb] = useState(10);
  return (
    <Widget title="How long to move data between chips?" hint="Pick an amount of data">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Data to move:</span>
        {[1, 10, 140].map((v) => (
          <button key={v} onClick={() => setGb(v)} className={`rounded-lg border px-3 py-1 ${gb === v ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
            {v} GB{v === 140 ? " (a 70B model in FP16)" : ""}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {links.map((l) => {
          const ms = (gb / l.gbps) * 1000;
          const pct = (Math.log10(l.gbps) / Math.log10(1800)) * 100;
          return (
            <div key={l.name} className="grid grid-cols-[minmax(0,11rem)_1fr_5.5rem] items-center gap-3 text-sm">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-ink-faint">{l.what}</div>
              </div>
              <div className="h-4 overflow-hidden rounded bg-bg-soft">
                <div className="h-full rounded bg-memory transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right">
                <div className="font-medium">{ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms.toFixed(ms < 10 ? 1 : 0)} ms`}</div>
                <div className="text-xs text-ink-faint">{l.gbps.toLocaleString("en-US")} GB/s</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Bars use a log scale; the real gaps are even bigger than they look. NVLink is roughly 18–36× faster than InfiniBand,
        which is why splitting one model across GPUs works best inside a single node.
      </p>
    </Widget>
  );
}
