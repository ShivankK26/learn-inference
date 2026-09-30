"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const layers = [
  {
    name: "NVIDIA Dynamo",
    level: "Most abstract",
    what: "Coordinates many inference engines across many GPUs and machines for very large deployments.",
    youDo: "Configure routing, prefill/decode splits, and scaling rules.",
    examples: "Dynamo (on top of vLLM, SGLang, or TensorRT-LLM)",
    lesson: "Lesson: Inference engines",
  },
  {
    name: "Inference engines",
    level: "Ready-made servers",
    what: "Pre-optimized model servers for common architectures, packed with batching, caching, quantization and more.",
    youDo: "Pick an engine, set flags and config, benchmark, repeat.",
    examples: "vLLM, SGLang, TensorRT-LLM",
    lesson: "Lesson: Inference engines",
  },
  {
    name: "Deep learning frameworks",
    level: "Python on top of CUDA",
    what: "Write, train, compile and run neural networks in Python without touching the GPU directly.",
    youDo: "Write model code, compile it, plug in special kernels when needed.",
    examples: "PyTorch, ONNX Runtime, TensorRT, Transformers, Diffusers",
    lesson: "Lesson: PyTorch and friends",
  },
  {
    name: "CUDA",
    level: "Closest to the metal",
    what: "Talk to the NVIDIA GPU directly, with full control over every calculation and every byte of memory.",
    youDo: "Write or choose kernels (small GPU programs), fuse them, tune them for one GPU.",
    examples: "CUDA kernels, cuBLAS, CUTLASS, FlashInfer",
    lesson: "Lesson: CUDA and kernels",
  },
];

export default function SoftwareStack() {
  const [sel, setSel] = useState(1);
  const l = layers[sel];
  return (
    <Widget title="The inference software stack" hint="Click a layer">
      <div className="grid gap-5 sm:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-2">
          {layers.map((layer, i) => (
            <button
              key={layer.name}
              onClick={() => setSel(i)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                sel === i ? "border-accent bg-accent-soft" : "border-line bg-bg-soft hover:border-ink-faint"
              }`}
              style={{ marginLeft: `${i * 10}px`, marginRight: `${(3 - i) * 10}px` }}
            >
              <div className="font-semibold">{layer.name}</div>
              <div className="text-xs text-ink-faint">{layer.level}</div>
            </button>
          ))}
          <div className="mt-1 flex justify-between px-1 text-xs text-ink-faint">
            <span>↑ more convenience</span>
            <span>more control ↓</span>
          </div>
        </div>
        <div className="rounded-xl bg-bg-soft p-5">
          <div className="font-serif text-2xl font-semibold">{l.name}</div>
          <p className="mt-2">{l.what}</p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">Your job here: </span>
            {l.youDo}
          </p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">Examples: </span>
            {l.examples}
          </p>
          <p className="mt-3 text-sm text-accent">{l.lesson}</p>
        </div>
      </div>
    </Widget>
  );
}
