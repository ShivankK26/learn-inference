"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Widget } from "../Blocks";

const N = 72; // "latent" resolution

// A simple procedural scene: sky, sun, hills, lake
function target(x: number, y: number): [number, number, number] {
  const u = x / N, v = y / N;
  let c: [number, number, number] = [255 - v * 90, 190 - v * 40, 120 + v * 40]; // sunset sky
  const dx = u - 0.68, dy = v - 0.36;
  if (dx * dx + dy * dy < 0.012) c = [255, 226, 140];
  const hill1 = 0.62 + 0.08 * Math.sin(u * 7);
  const hill2 = 0.7 + 0.06 * Math.sin(u * 11 + 2);
  if (v > hill1) c = [70, 110, 90];
  if (v > hill2) c = [45, 85, 70];
  if (v > 0.84) c = [80 + 30 * Math.sin(u * 40), 120, 170];
  return c;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

export default function Denoise() {
  const [fewStep, setFewStep] = useState(false);
  const total = fewStep ? 4 : 50;
  const [step, setStep] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const noise = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: N * N * 3 }, () => r() * 255);
  }, []);


  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    const p = step / total;
    // few-step models get most of the way there, but keep a little roughness
    const alpha = fewStep ? Math.min(0.9, Math.pow(p, 0.6) * 0.9) : 1 - Math.pow(1 - p, 2.2);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const t = target(x, y);
        const k = (y * N + x) * 3;
        const o = (y * N + x) * 4;
        for (let ch = 0; ch < 3; ch++) img.data[o + ch] = noise[k + ch] * (1 - alpha) + t[ch] * alpha;
        img.data[o + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }, [step, total, fewStep, noise]);

  return (
    <Widget title="From noise to picture" hint="Drag the step slider">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <canvas
          ref={canvas}
          width={N}
          height={N}
          className="h-56 w-56 rounded-xl border border-line"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="space-y-4 text-sm">
          <label className="block">
            <div className="flex justify-between">
              <span>Denoising step</span>
              <span className="tabular-nums">{step} / {total}</span>
            </div>
            <input type="range" className="w-full" min={0} max={total} value={step} onChange={(e) => setStep(+e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Forward passes so far</div>
              <div className="tabular-nums text-lg text-compute">{step * 2}</div>
              <div className="text-[11px] text-ink-faint">2 per step: with and without the prompt</div>
            </div>
            <div className="rounded-lg border border-line p-3">
              <div className="text-xs text-ink-faint">Total for this image</div>
              <div className="tabular-nums text-lg">{total * 2}</div>
              <div className="text-[11px] text-ink-faint">{fewStep ? "about 90% faster" : "typical models: 30–50 steps"}</div>
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fewStep} onChange={(e) => { setFewStep(e.target.checked); setStep(0); }} />
            Use a <b>few-step</b> model (4 steps: much faster, a bit rougher)
          </label>
          <p className="text-xs text-ink-faint">
            Every step updates the <i>whole</i> image at once, unlike an LLM, which adds one token at a time.
          </p>
        </div>
      </div>
    </Widget>
  );
}
