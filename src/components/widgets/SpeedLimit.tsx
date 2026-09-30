"use client";

import { useState } from "react";
import { Widget } from "../Blocks";
import { gpus, type GpuKey } from "@/lib/gpus";

const models = [
  { name: "8B", params: 8 },
  { name: "32B", params: 32 },
  { name: "70B", params: 70 },
  { name: "405B", params: 405 },
];
const precisions = [
  { name: "FP16", bytes: 2, note: "16-bit, the default" },
  { name: "FP8", bytes: 1, note: "8-bit, quantized" },
  { name: "FP4", bytes: 0.5, note: "4-bit, heavily quantized" },
];

function Pills<T extends string>({ items, value, set }: { items: { key: T; label: string }[]; value: T; set: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => set(it.key)}
          className={`rounded-lg border px-2.5 py-1 text-sm ${value === it.key ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function SpeedLimit() {
  const [m, setM] = useState("8B");
  const [p, setP] = useState("FP16");
  const [g, setG] = useState<GpuKey>("H100");
  const model = models.find((x) => x.name === m)!;
  const prec = precisions.find((x) => x.name === p)!;
  const gpu = gpus[g];
  const sizeGB = model.params * prec.bytes;
  const tps = (gpu.tbps * 1000) / sizeGB;
  const fits = sizeGB <= gpu.memGB * 0.9;
  const gpusNeeded = Math.ceil(sizeGB / (gpu.memGB * 0.9));

  return (
    <Widget title="The decode speed limit" hint="How fast can one user possibly go?">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Model size</div>
          <Pills items={models.map((x) => ({ key: x.name, label: x.name }))} value={m} set={setM} />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Number precision</div>
          <Pills items={precisions.map((x) => ({ key: x.name, label: x.name }))} value={p} set={setP} />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">GPU</div>
          <Pills items={(Object.keys(gpus) as GpuKey[]).map((k) => ({ key: k, label: k }))} value={g} set={setG} />
        </div>
      </div>

      <div className="mt-5 grid items-center gap-3 rounded-xl bg-bg-soft p-5 tabular-nums text-sm sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="text-center">
          <div className="font-sans text-xs text-ink-faint">Memory bandwidth</div>
          <div className="text-lg text-memory">{(gpu.tbps * 1000).toLocaleString("en-US")} GB/s</div>
        </div>
        <div className="text-center text-xl text-ink-faint">÷</div>
        <div className="text-center">
          <div className="font-sans text-xs text-ink-faint">Model weights to read</div>
          <div className="text-lg text-memory">{sizeGB} GB</div>
          <div className="font-sans text-[11px] text-ink-faint">{model.params}B × {prec.bytes} bytes</div>
        </div>
        <div className="text-center text-xl text-ink-faint">=</div>
        <div className="text-center">
          <div className="font-sans text-xs text-ink-faint">Max speed, 1 user</div>
          <div className="text-2xl font-semibold text-accent">{tps < 10 ? tps.toFixed(1) : Math.round(tps)} tok/s</div>
        </div>
      </div>

      {!fits && (
        <div className="mt-3 rounded-lg border border-bad/40 bg-bad-soft px-4 py-2 text-sm">
          ⚠ {sizeGB} GB won’t fit in one {gpu.name} ({gpu.memGB} GB). You’d need about {gpusNeeded} GPUs working together, which
          is called <i>parallelism</i> (Chapter 5).
        </div>
      )}
      <p className="mt-3 text-xs text-ink-faint">
        Every token requires reading every weight once, so this is a hard ceiling. Real speeds are lower (the KV cache also has to
        be read, and nothing is 100% efficient). Try switching FP16 → FP8 and watch the speed double.
      </p>
    </Widget>
  );
}
