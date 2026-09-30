"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Idealized FLOP count for one forward pass of a diffusion transformer.
// Shape is loosely modeled on an open ~14B video model (hidden size 5,120, 40 layers, FFN 13,824);
// latent compression: 8× in width and height, 4× in time, then 2×2 patches. Illustrative, not a benchmark.
const D = 5120;
const LAYERS = 40;
const FFN = 13824;
const LINEAR_PER_TOKEN = 2 * (4 * D * D + 2 * D * FFN); // QKV + output projections, plus the feed-forward block
const FPS = 24;

const sizes = [
  { key: "image", label: "Image 1024×1024", w: 1024, h: 1024, video: false },
  { key: "480p", label: "Video 480p", w: 832, h: 480, video: true },
  { key: "720p", label: "Video 720p", w: 1280, h: 720, video: true },
  { key: "1080p", label: "Video 1080p", w: 1920, h: 1080, video: true },
] as const;

function tokens(w: number, h: number, frames: number) {
  const latentFrames = frames <= 1 ? 1 : 1 + Math.floor((frames - 1) / 4);
  return latentFrames * Math.floor(w / 16) * Math.floor(h / 16);
}

function fmt(n: number) {
  if (n >= 1e15) return `${(n / 1e15).toFixed(1)} PFLOP`;
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TFLOP`;
  return `${(n / 1e9).toFixed(0)} GFLOP`;
}

export default function VideoAttentionCost() {
  const [size, setSize] = useState<(typeof sizes)[number]["key"]>("720p");
  const [seconds, setSeconds] = useState(5);
  const s = sizes.find((x) => x.key === size)!;
  const frames = s.video ? seconds * FPS : 1;
  const n = tokens(s.w, s.h, frames);
  const attnPerToken = 4 * n * D; // Q·Kᵀ and P·V, every token against every token
  const share = attnPerToken / (attnPerToken + LINEAR_PER_TOKEN);
  const perPass = LAYERS * n * (attnPerToken + LINEAR_PER_TOKEN);
  const base = tokens(1024, 1024, 1);

  return (
    <Widget title="Why attention takes over in video" hint="Change the size and length">
      <div className="flex flex-wrap gap-2 text-sm">
        {sizes.map((x) => (
          <button
            key={x.key}
            onClick={() => setSize(x.key)}
            className={`rounded-lg border px-3 py-1.5 ${size === x.key ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      {s.video && (
        <label className="mt-4 block text-sm">
          <div className="flex justify-between">
            <span>Clip length (at {FPS} fps)</span>
            <span className="tabular-nums">{seconds} s · {frames} frames</span>
          </div>
          <input type="range" className="w-full" min={1} max={10} value={seconds} onChange={(e) => setSeconds(+e.target.value)} />
        </label>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Latent tokens</div>
          <div className="text-lg tabular-nums">{n.toLocaleString("en-US")}</div>
          <div className="text-[11px] text-ink-faint">{(n / base).toFixed(1)}× a 1024² image</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Attention work vs. image</div>
          <div className="text-lg tabular-nums text-compute">{Math.round((n / base) ** 2).toLocaleString("en-US")}×</div>
          <div className="text-[11px] text-ink-faint">grows with tokens²</div>
        </div>
        <div className="col-span-2 rounded-lg border border-line p-3 sm:col-span-1">
          <div className="text-xs text-ink-faint">Math per forward pass</div>
          <div className="text-lg tabular-nums">{fmt(perPass)}</div>
          <div className="text-[11px] text-ink-faint">× 2 with guidance, × ~50 steps</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-sm">
          <span>Share of compute spent in attention</span>
          <span className="tabular-nums font-semibold text-compute">{Math.round(share * 100)}%</span>
        </div>
        <div className="flex h-6 overflow-hidden rounded-md border border-line">
          <div className="h-full bg-compute transition-all" style={{ width: `${(share * 100).toFixed(1)}%` }} />
          <div className="h-full flex-1 bg-memory-soft" />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-ink-faint">
          <span>attention (grows with tokens²)</span>
          <span>linear layers (grow with tokens)</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Idealized FLOP count for a made-up model shaped like an open ~14B video model; real kernels, text cross-attention, and
        the VAE are ignored. The point is the trend: double the tokens and linear work doubles, but attention work quadruples.
      </p>
    </Widget>
  );
}
