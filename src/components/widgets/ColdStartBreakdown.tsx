"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Every number here is an illustrative assumption, chosen to show the shape of the problem.
const gpuOpts = [
  { key: "warm", label: "Warm node already in the cluster", s: 15 },
  { key: "new", label: "New node from the cloud provider", s: 300 },
];
const imageOpts = [
  { key: "slim", label: "Slim image (8 GB)", gb: 8 },
  { key: "bloated", label: "Bloated image (25 GB)", gb: 25 },
];
const modelOpts = [
  { key: "8b", label: "8B · FP16", gb: 16 },
  { key: "70b16", label: "70B · FP16", gb: 140 },
  { key: "70b8", label: "70B · FP8", gb: 70 },
  { key: "671b", label: "671B · FP8", gb: 671 },
];
const sourceOpts = [
  { key: "hf", label: "Hugging Face", gbps: 0.2 },
  { key: "s3", label: "Cloud bucket (S3)", gbps: 1 },
  { key: "local", label: "Cache in the same datacenter", gbps: 5 },
];
const engineOpts = [
  { key: "vllm", label: "vLLM / SGLang", s: 45 },
  { key: "trt", label: "TensorRT-LLM, compile from scratch", s: 360 },
  { key: "trtc", label: "TensorRT-LLM, cached engine", s: 40 },
];
const IMAGE_GBPS = 1;

function Pick<T extends { key: string; label: string }>({ title, opts, value, set }: { title: string; opts: T[]; value: string; set: (k: string) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-ink-soft">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button
            key={o.key}
            onClick={() => set(o.key)}
            className={`rounded-lg border px-2.5 py-1 text-sm ${value === o.key ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function fmt(s: number) {
  if (s < 90) return `${Math.round(s)} s`;
  return `${(s / 60).toFixed(1)} min`;
}

export default function ColdStartBreakdown() {
  const [gpu, setGpu] = useState("new");
  const [image, setImage] = useState("bloated");
  const [model, setModel] = useState("70b16");
  const [source, setSource] = useState("hf");
  const [engine, setEngine] = useState("trt");

  const g = gpuOpts.find((o) => o.key === gpu)!;
  const im = imageOpts.find((o) => o.key === image)!;
  const mo = modelOpts.find((o) => o.key === model)!;
  const so = sourceOpts.find((o) => o.key === source)!;
  const en = engineOpts.find((o) => o.key === engine)!;

  const parts = [
    { name: "Get a GPU", s: g.s, color: "var(--ink-faint)" },
    { name: "Load image", s: im.gb / IMAGE_GBPS, color: "var(--accent)" },
    { name: "Load weights", s: mo.gb / so.gbps, color: "var(--memory)" },
    { name: "Start engine", s: en.s, color: "var(--compute)" },
  ];
  const total = parts.reduce((a, p) => a + p.s, 0);

  return (
    <Widget title="What a cold start is made of" hint="Pick the options, watch the total">
      <div className="grid gap-4 sm:grid-cols-2">
        <Pick title="1 · GPU procurement" opts={gpuOpts} value={gpu} set={setGpu} />
        <Pick title="2 · Container image" opts={imageOpts} value={image} set={setImage} />
        <Pick title="3 · Model weights" opts={modelOpts} value={model} set={setModel} />
        <Pick title="…loaded from" opts={sourceOpts} value={source} set={setSource} />
        <div className="sm:col-span-2">
          <Pick title="4 · Inference engine" opts={engineOpts} value={engine} set={setEngine} />
        </div>
      </div>

      <div className="mt-6 flex h-9 w-full overflow-hidden rounded-lg border border-line">
        {parts.map((p) => (
          <div
            key={p.name}
            title={`${p.name}: ${fmt(p.s)}`}
            className="h-full transition-all duration-300"
            style={{ width: `${(p.s / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {parts.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="text-ink-soft">{p.name}</span>
            <span className="ml-auto tabular-nums">{fmt(p.s)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-center">
        <div className="text-xs text-ink-faint">Total cold start</div>
        <div className="text-2xl font-semibold text-accent">{fmt(total)}</div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Illustrative numbers, not benchmarks. Weight loading assumes {so.gbps} GB/s from {so.label.toLowerCase()}; image pulls
        assume {IMAGE_GBPS} GB/s. The point is which step dominates, and how differently each one gets fixed.
      </p>
    </Widget>
  );
}
