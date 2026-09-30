"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

type Layer = { key: string; name: string; gb: number; kind: "base" | "add" | "runtime"; optional?: boolean; desc: string };

// Sizes are rough, for intuition only
const layers: Layer[] = [
  { key: "container", name: "Container layer (created at runtime)", gb: 0, kind: "runtime", desc: "A thin, temporary, writable layer. Anything the running container writes lands here and disappears when the container stops." },
  { key: "weights", name: "Model weights baked into the image", gb: 140, kind: "add", optional: true, desc: "Tempting for small models, but a 70B model in FP16 is about 140 GB. That dwarfs everything else, so modern setups load weights separately." },
  { key: "junk", name: "Dev tools & unused packages", gb: 3, kind: "add", optional: true, desc: "Compilers, notebooks, test data… Nice on your laptop, dead weight in production. Pack light." },
  { key: "app", name: "Your app code & config", gb: 0.01, kind: "add", desc: "The server code that wraps the model, plus configuration files." },
  { key: "sys", name: "System packages (e.g. ffmpeg)", gb: 0.3, kind: "add", optional: true, desc: "Linux packages. Common for audio, image, and video models that need to decode media." },
  { key: "engine", name: "Inference engine (vLLM)", gb: 1, kind: "add", desc: "The pinned engine version. Engines ship official base images; starting from one is usually wise." },
  { key: "py", name: "Python packages (torch, transformers…)", gb: 5, kind: "add", desc: "Pinned to exact versions so every build resolves to the same working set." },
  { key: "cuda", name: "CUDA toolkit, cuDNN", gb: 4, kind: "base", desc: "GPU libraries whose versions must match the driver, the GPU, and everything above." },
  { key: "os", name: "Base OS (Ubuntu)", gb: 0.1, kind: "base", desc: "The bottom of the stack. Containers share the host’s Linux kernel, which keeps them lightweight." },
];

const PULL_GBPS = 1;

export default function DockerLayers() {
  const [on, setOn] = useState<Record<string, boolean>>({ weights: false, junk: true, sys: true });
  const [sel, setSel] = useState("cuda");
  const included = layers.filter((l) => !l.optional || on[l.key]);
  const size = included.reduce((a, l) => a + l.gb, 0);
  const selected = layers.find((l) => l.key === sel)!;

  return (
    <Widget title="Build an inference image, layer by layer" hint="Click a layer · toggle the optional ones">
      <div className="grid gap-5 sm:grid-cols-[1.2fr_1fr]">
        <div className="space-y-1.5">
          {layers.map((l) => {
            const active = !l.optional || on[l.key];
            const color =
              l.kind === "runtime" ? "border-dashed border-ink-faint" : l.kind === "base" ? "border-memory/40 bg-memory-soft" : "border-accent/30 bg-accent-soft";
            return (
              <div key={l.key} className={`flex items-center gap-2 ${active ? "" : "opacity-40"}`}>
                <button
                  onClick={() => setSel(l.key)}
                  className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${color} ${sel === l.key ? "ring-2 ring-accent" : ""}`}
                >
                  <span>{l.name}</span>
                  <span className="ml-3 shrink-0 tabular-nums text-xs text-ink-soft">{l.gb >= 1 ? `${l.gb} GB` : l.gb > 0 ? `${Math.round(l.gb * 1000)} MB` : "–"}</span>
                </button>
                {l.optional ? (
                  <input
                    type="checkbox"
                    aria-label={`Include ${l.name}`}
                    checked={!!on[l.key]}
                    onChange={(e) => setOn((o) => ({ ...o, [l.key]: e.target.checked }))}
                  />
                ) : (
                  <span className="w-[13px]" />
                )}
              </div>
            );
          })}
          <div className="flex gap-4 pt-1 text-xs text-ink-faint">
            <span>Blue = base image</span>
            <span>Green = your added layers</span>
            <span>Dashed = runtime only</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-bg-soft p-4">
            <div className="font-semibold">{selected.name}</div>
            <p className="mt-1 text-sm text-ink-soft">{selected.desc}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Image size</div>
              <div className={`text-lg ${size > 50 ? "text-bad" : "text-accent"}`}>{size.toFixed(1)} GB</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Pull time at {PULL_GBPS} GB/s</div>
              <div className="text-lg">{size / PULL_GBPS < 90 ? `${Math.round(size / PULL_GBPS)} s` : `${(size / PULL_GBPS / 60).toFixed(1)} min`}</div>
            </div>
          </div>
          <p className="text-xs text-ink-faint">
            Every new replica has to pull the whole image before it can serve a single request. Sizes are rough.
          </p>
        </div>
      </div>
    </Widget>
  );
}
