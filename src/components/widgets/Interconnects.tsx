"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// GB/s per direction. The book quotes NVLink and NVLink-C2C as totals for both directions combined
// (900 GB/s = 450 each way on Hopper); network NICs are quoted per direction in gigabits.
const links = [
  { name: "NVLink (Blackwell)", gbps: 900, total: "1,800 GB/s total", what: "GPU ↔ GPU inside one node" },
  { name: "NVLink (Hopper)", gbps: 450, total: "900 GB/s total", what: "GPU ↔ GPU inside one node" },
  { name: "NVLink-C2C (Grace)", gbps: 450, total: "900 GB/s total", what: "CPU ↔ GPU on a superchip" },
  { name: "InfiniBand (400 Gb/s NIC)", gbps: 50, total: "400 Gb/s each way", what: "Node ↔ node" },
  { name: "Ethernet (100 Gb/s NIC)", gbps: 12.5, total: "100 Gb/s each way", what: "Node ↔ node" },
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
          const pct = (Math.log10(l.gbps) / Math.log10(900)) * 100;
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
                <div className="text-xs text-ink-faint">{l.gbps.toLocaleString("en-US")} GB/s each way</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Times assume one link moving data in one direction. NVLink’s headline figures (900 and 1,800 GB/s) count both
        directions together, so per direction NVLink is about 9–18× faster than a 400 Gb/s InfiniBand NIC: the book’s
        “order of magnitude”. Bars use a log scale.
      </p>
    </Widget>
  );
}
