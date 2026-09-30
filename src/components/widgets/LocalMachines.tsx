"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Machines from the book's comparison table
const machines = [
  { name: "NVIDIA RTX 5090 PC", memGB: 32, gbps: 1792, cost: "$5,000" },
  { name: "Apple M3 Ultra Mac", memGB: 512, gbps: 819, cost: "$10,000" },
];

const models = [
  { name: "8B dense", total: 8, active: 8 },
  { name: "32B dense", total: 32, active: 32 },
  { name: "70B dense", total: 70, active: 70 },
  { name: "120B MoE (≈5B active)", total: 120, active: 5 },
];
const precisions = [
  { name: "16-bit", bytes: 2 },
  { name: "8-bit", bytes: 1 },
  { name: "4-bit", bytes: 0.5 },
];

export default function LocalMachines() {
  const [m, setM] = useState(0);
  const [p, setP] = useState(2);
  const model = models[m];
  const bytes = precisions[p].bytes;
  const weightGB = model.total * bytes;
  const readGB = model.active * bytes; // one user reads only the active weights per token

  return (
    <Widget title="Memory vs. speed on a desktop" hint="Pick a model and precision">
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-soft">Model</span>
          {models.map((x, i) => (
            <button key={x.name} onClick={() => setM(i)} className={`rounded-lg border px-2.5 py-1 ${m === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
              {x.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-soft">Precision</span>
          {precisions.map((x, i) => (
            <button key={x.name} onClick={() => setP(i)} className={`rounded-lg border px-2.5 py-1 ${p === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
              {x.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {machines.map((mc) => {
          const fits = weightGB <= mc.memGB * 0.9;
          const tps = mc.gbps / readGB;
          return (
            <div key={mc.name} className={`rounded-xl border p-4 ${fits ? "border-line bg-bg-soft" : "border-bad/40 bg-bad-soft"}`}>
              <div className="font-semibold">{mc.name}</div>
              <div className="text-xs text-ink-faint">
                {mc.memGB} GB memory · {mc.gbps.toLocaleString("en-US")} GB/s · about {mc.cost}
              </div>
              <div className="mt-3 text-sm">
                Needs <b>{weightGB} GB</b> for weights →{" "}
                {fits ? <span className="text-good">fits</span> : <span className="text-bad">doesn’t fit</span>}
              </div>
              <div className="mt-2">
                <div className="text-xs text-ink-faint">Max speed for one user</div>
                <div className="text-2xl font-semibold text-accent">{fits ? `${Math.round(tps)} tok/s` : "–"}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Speed ceiling = memory bandwidth ÷ bytes read per token (only the active weights, for MoE). Real speeds are lower. The
        5090 is faster when a model fits; the Mac fits far bigger models. Aggressive quantization and MoE make large models
        possible at home.
      </p>
    </Widget>
  );
}
