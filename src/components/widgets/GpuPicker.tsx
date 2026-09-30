"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Spec tables from the book (FP8 dense compute)
const gpus = [
  { name: "L4", arch: "Ada Lovelace", year: 2022, tflops: 242, memGB: 24, tbps: 0.3, note: "Cheap and handy for small models like text embeddings and computer vision. No NVLink." },
  { name: "L40", arch: "Ada Lovelace", year: 2022, tflops: 362, memGB: 48, tbps: 0.864, note: "Usually not a great inference choice: a slice of an H100 (MIG) gives more compute and bandwidth for the same memory." },
  { name: "H100", arch: "Hopper", year: 2022, tflops: 1979, memGB: 80, tbps: 3.35, note: "One of the most widely used inference GPUs. Mature software, highly optimized kernels, right-sized for most workloads." },
  { name: "H200", arch: "Hopper", year: 2022, tflops: 1979, memGB: 141, tbps: 4.8, note: "Same compute as the H100, but more and faster memory, so it generates tokens faster in decode." },
  { name: "B200", arch: "Blackwell", year: 2024, tflops: 5000, memGB: 192, tbps: 8, note: "The new gold standard: highest performance for big LLMs and heavy workloads like video generation. Adds FP4." },
  { name: "B300", arch: "Blackwell", year: 2024, tflops: 5000, memGB: 288, tbps: 8, note: "A bigger Blackwell with even more memory for the largest models and longest contexts." },
];

const max = { tflops: 5000, memGB: 288, tbps: 8 };

function Bar({ label, value, pct, kind }: { label: string; value: string; pct: number; kind: "compute" | "memory" | "accent" }) {
  const color = kind === "compute" ? "bg-compute" : kind === "memory" ? "bg-memory" : "bg-accent";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-soft">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg-soft">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}

export default function GpuPicker() {
  const [sel, setSel] = useState("H100");
  const g = gpus.find((x) => x.name === sel)!;
  return (
    <Widget title="Compare datacenter GPUs" hint="Pick a GPU">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {gpus.map((x) => (
          <button
            key={x.name}
            onClick={() => setSel(x.name)}
            className={`rounded-lg border px-3 py-1 text-sm ${sel === x.name ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Bar label="Compute (FP8, dense)" value={g.tflops === 5000 ? "~5 petaFLOPS" : `${g.tflops.toLocaleString("en-US")} teraFLOPS`} pct={(g.tflops / max.tflops) * 100} kind="compute" />
          <Bar label="Memory (VRAM)" value={`${g.memGB} GB`} pct={(g.memGB / max.memGB) * 100} kind="accent" />
          <Bar label="Memory bandwidth" value={g.tbps >= 1 ? `${g.tbps} TB/s` : `${Math.round(g.tbps * 1000)} GB/s`} pct={(g.tbps / max.tbps) * 100} kind="memory" />
        </div>
        <div className="rounded-xl bg-bg-soft p-4 text-sm">
          <div className="text-lg font-semibold">{g.name}</div>
          <div className="text-ink-faint">
            {g.arch} architecture · first released {g.year}
          </div>
          <p className="mt-3">{g.note}</p>
          <p className="mt-3 text-xs text-ink-faint">
            More <span className="text-compute">compute</span> helps prefill and image/video generation. More{" "}
            <span className="text-memory">bandwidth</span> helps decode (tokens per second). More memory fits bigger models and more KV cache.
          </p>
        </div>
      </div>
    </Widget>
  );
}
