"use client";

import { useState } from "react";
import { Widget } from "../Blocks";
import { gpus, type GpuKey } from "@/lib/gpus";

// Simplified model of decode for an 8B-parameter model in FP16 (Llama-3-8B-like).
const PARAMS = 8e9;
const WEIGHT_BYTES = PARAMS * 2;
const KV_BYTES_PER_TOKEN = 131_072; // 32 layers × 8 KV heads × 128 dims × (K+V) × 2 bytes
const PREFILL_TOKENS = 2000;

// log-scale chart helpers
const W = 520, H = 300, PAD = { l: 52, r: 16, t: 16, b: 40 };
const X0 = 0, X1 = 4; // 10^0 .. 10^4 flops/byte
const Y0 = 0, Y1 = 3.5; // 10^0 .. 10^3.5 TFLOPS
const sx = (v: number) => PAD.l + ((Math.log10(v) - X0) / (X1 - X0)) * (W - PAD.l - PAD.r);
const sy = (v: number) => H - PAD.b - ((Math.log10(v) - Y0) / (Y1 - Y0)) * (H - PAD.t - PAD.b);

function fmt(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export default function Roofline() {
  const [g, setG] = useState<GpuKey>("H100");
  const [logB, setLogB] = useState(0);
  const [ctx, setCtx] = useState(0);
  const [showPrefill, setShowPrefill] = useState(true);

  const gpu = gpus[g];
  const peak = gpu.tflops; // TFLOPS
  const bw = gpu.tbps; // TB/s
  const ridge = peak / bw;

  const kvPerSeq = ctx * KV_BYTES_PER_TOKEN;
  const freeBytes = gpu.memGB * 1e9 * 0.9 - WEIGHT_BYTES;
  const maxBatch = freeBytes <= 0 ? 0 : ctx === 0 ? 1024 : Math.max(1, Math.floor(freeBytes / kvPerSeq));
  const wantB = Math.round(Math.pow(2, logB));
  const B = Math.min(wantB, Math.max(1, maxBatch));
  const oom = wantB > maxBatch;

  const flops = 2 * PARAMS * B + B * kvPerSeq;
  const bytes = WEIGHT_BYTES + B * kvPerSeq;
  const intensity = flops / bytes;
  const memTime = bytes / (bw * 1e12);
  const compTime = flops / (peak * 1e12);
  const step = Math.max(memTime, compTime);
  const perUser = 1 / step;
  const total = B / step;
  const achieved = Math.min(peak, bw * intensity);
  const bound = intensity < ridge ? "memory" : "compute";

  const prefillI = PREFILL_TOKENS;
  const prefillY = Math.min(peak, bw * prefillI);

  const xticks = [1, 10, 100, 1000, 10000];
  const yticks = [1, 10, 100, 1000];

  return (
    <Widget title="Roofline: is it compute or memory holding us back?" hint="Drag the batch size">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-faint">GPU:</span>
        {(Object.keys(gpus) as GpuKey[]).filter((k) => k !== "L4").map((k) => (
          <button
            key={k}
            onClick={() => setG(k)}
            className={`rounded-lg border px-3 py-1 ${g === k ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {k}
          </button>
        ))}
        <span className="ml-auto tabular-nums text-xs text-ink-faint">ops:byte ratio ≈ {Math.round(ridge)}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Roofline chart">
        {/* grid */}
        {xticks.map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={PAD.t} y2={H - PAD.b} stroke="var(--line)" />
            <text x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" fontSize="11" fill="var(--ink-faint)">{fmt(t)}</text>
          </g>
        ))}
        {yticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-faint)">{fmt(t)}</text>
          </g>
        ))}
        <text x={(W + PAD.l) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--ink-soft)">
          Arithmetic intensity (math per byte moved) →
        </text>
        <text x={14} y={(H - PAD.b + PAD.t) / 2} textAnchor="middle" fontSize="11" fill="var(--ink-soft)" transform={`rotate(-90 14 ${(H - PAD.b + PAD.t) / 2})`}>
          Useful work (TFLOPS) →
        </text>

        {/* regions */}
        <rect x={PAD.l} y={PAD.t} width={sx(ridge) - PAD.l} height={H - PAD.t - PAD.b} fill="var(--memory)" opacity="0.06" />
        <rect x={sx(ridge)} y={PAD.t} width={W - PAD.r - sx(ridge)} height={H - PAD.t - PAD.b} fill="var(--compute)" opacity="0.07" />
        <text x={PAD.l + 8} y={PAD.t + 16} fontSize="11" fill="var(--memory)" fontWeight="600">Memory-bound</text>
        <text x={W - PAD.r - 8} y={H - PAD.b - 10} fontSize="11" fill="var(--compute)" fontWeight="600" textAnchor="end">Compute-bound</text>

        {/* roof */}
        <line x1={sx(1)} y1={sy(bw)} x2={sx(ridge)} y2={sy(peak)} stroke="var(--memory)" strokeWidth="2.5" />
        <line x1={sx(ridge)} y1={sy(peak)} x2={sx(10000)} y2={sy(peak)} stroke="var(--compute)" strokeWidth="2.5" />
        <text x={sx(ridge) - 6} y={sy(peak) + 4} fontSize="10" textAnchor="end" fill="var(--ink-soft)">GPU’s max compute →</text>

        {/* prefill point */}
        {showPrefill && (
          <g>
            <circle cx={sx(prefillI)} cy={sy(prefillY)} r="6" fill="var(--compute)" />
            <text x={sx(prefillI)} y={sy(prefillY) + 20} fontSize="10" textAnchor="middle" fill="var(--compute)">prefill (2k-token prompt)</text>
          </g>
        )}
        {/* decode point */}
        <g style={{ transition: "all 0.2s" }}>
          <circle cx={sx(Math.max(1, intensity))} cy={sy(Math.max(1, achieved))} r="7" fill="var(--memory)" stroke="var(--card)" strokeWidth="2" />
          <text x={sx(Math.max(1, intensity)) + 10} y={sy(Math.max(1, achieved)) + 4} fontSize="11" fill="var(--memory)" fontWeight="600">
            decode, batch {B}
          </text>
        </g>
      </svg>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between">
            <span>Batch size (users served together)</span>
            <span className="tabular-nums">{wantB}</span>
          </div>
          <input type="range" className="w-full" min={0} max={10} step={1} value={logB} onChange={(e) => setLogB(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between">
            <span>Conversation length per user</span>
            <span className="tabular-nums">{ctx.toLocaleString()} tokens</span>
          </div>
          <input type="range" className="w-full" min={0} max={8000} step={500} value={ctx} onChange={(e) => setCtx(+e.target.value)} />
        </label>
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={showPrefill} onChange={(e) => setShowPrefill(e.target.checked)} /> Show a prefill for comparison
      </label>

      {oom && (
        <div className="mt-3 rounded-lg border border-bad/40 bg-bad-soft px-4 py-2 text-sm">
          ⚠ Out of GPU memory: {wantB} users × {ctx.toLocaleString()} tokens of KV cache won’t fit next to the model. Capped at {B}.
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Bottleneck</div>
          <div className={`font-semibold ${bound === "memory" ? "text-memory" : "text-compute"}`}>{bound}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Speed per user</div>
          <div className="tabular-nums text-lg">{Math.round(perUser)} <span className="text-xs">tok/s</span></div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Total throughput</div>
          <div className="tabular-nums text-lg text-accent">{fmt(total)} <span className="text-xs">tok/s</span></div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Simplified model of an 8B model in FP16 on one GPU. It ignores overheads, so real numbers are lower. The shape of the
        trade-off is what matters.
      </p>
    </Widget>
  );
}
