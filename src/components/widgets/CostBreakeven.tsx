"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Illustrative numbers only; real prices vary a lot by model, provider, and GPU.
const HOURS_PER_MONTH = 730;
const GPU_TOKENS_PER_SEC = 2500; // one well-batched GPU serving a mid-size model
const UTILIZATION = 0.5; // real traffic isn't flat, so GPUs sit partly idle

const W = 520, H = 260, PAD = { l: 64, r: 16, t: 14, b: 40 };
const X0 = 7, X1 = 11; // 10M .. 100B tokens / month
const Y0 = 1, Y1 = 6; // $10 .. $1M / month
// Rounded so server and browser produce identical SVG attributes
const r2 = (n: number) => Math.round(n * 100) / 100;
const sx = (v: number) => r2(PAD.l + ((Math.log10(v) - X0) / (X1 - X0)) * (W - PAD.l - PAD.r));
const sy = (v: number) => r2(H - PAD.b - ((Math.log10(Math.max(v, 10)) - Y0) / (Y1 - Y0)) * (H - PAD.t - PAD.b));

function money(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}
function tokens(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  return `${Math.round(n / 1e6)}M`;
}

export default function CostBreakeven() {
  const [logT, setLogT] = useState(8.5);
  const [price, setPrice] = useState(1);
  const [gpuHr, setGpuHr] = useState(3);

  const capPerGpu = GPU_TOKENS_PER_SEC * 3600 * HOURS_PER_MONTH * UTILIZATION;
  const sharedCost = (t: number) => (t / 1e6) * price;
  const gpusFor = (t: number) => Math.max(1, Math.ceil(t / capPerGpu));
  const dedicatedCost = (t: number) => gpusFor(t) * gpuHr * HOURS_PER_MONTH;

  const T = Math.pow(10, logT);
  const s = sharedCost(T);
  const d = dedicatedCost(T);
  const cheaper = s < d ? "shared" : "dedicated";

  // chart paths
  const pts = Array.from({ length: 161 }, (_, i) => Math.pow(10, X0 + ((X1 - X0) * i) / 160));
  const sharedPath = pts.map((t, i) => `${i ? "L" : "M"}${sx(t)},${sy(sharedCost(t))}`).join(" ");
  const dedPath = pts.map((t, i) => `${i ? "L" : "M"}${sx(t)},${sy(dedicatedCost(t))}`).join(" ");

  return (
    <Widget title="Pay per token, or rent your own GPUs?" hint="Drag the monthly traffic">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cost comparison chart">
        {[1e7, 1e8, 1e9, 1e10, 1e11].map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={PAD.t} y2={H - PAD.b} stroke="var(--line)" />
            <text x={sx(t)} y={H - PAD.b + 16} fontSize="11" textAnchor="middle" fill="var(--ink-faint)">{tokens(t)}</text>
          </g>
        ))}
        {[100, 1e3, 1e4, 1e5, 1e6].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
            <text x={PAD.l - 8} y={sy(v) + 4} fontSize="11" textAnchor="end" fill="var(--ink-faint)">{money(v)}</text>
          </g>
        ))}
        <text x={(W + PAD.l) / 2} y={H - 6} fontSize="11" textAnchor="middle" fill="var(--ink-soft)">Tokens per month →</text>
        <path d={sharedPath} fill="none" stroke="var(--memory)" strokeWidth="2.5" />
        <path d={dedPath} fill="none" stroke="var(--compute)" strokeWidth="2.5" />
        <line x1={sx(T)} x2={sx(T)} y1={PAD.t} y2={H - PAD.b} stroke="var(--accent)" strokeDasharray="4 4" />
        <circle cx={sx(T)} cy={sy(s)} r="5" fill="var(--memory)" />
        <circle cx={sx(T)} cy={sy(d)} r="5" fill="var(--compute)" />
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-memory" /> Shared API (pay per token)</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-compute" /> Dedicated GPUs (pay per hour)</span>
      </div>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <label className="block">
          <div className="flex justify-between"><span>Traffic</span><span className="tabular-nums">{tokens(T)} tokens/mo</span></div>
          <input type="range" className="w-full" min={X0} max={X1} step={0.05} value={logT} onChange={(e) => setLogT(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>API price</span><span className="tabular-nums">${price.toFixed(2)} / 1M tokens</span></div>
          <input type="range" className="w-full" min={0.2} max={5} step={0.1} value={price} onChange={(e) => setPrice(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>GPU rental</span><span className="tabular-nums">${gpuHr.toFixed(2)} / hour</span></div>
          <input type="range" className="w-full" min={1} max={8} step={0.25} value={gpuHr} onChange={(e) => setGpuHr(+e.target.value)} />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Shared API</div>
          <div className="text-lg tabular-nums text-memory">{money(s)}<span className="text-xs">/mo</span></div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Dedicated ({gpusFor(T)} GPU{gpusFor(T) > 1 ? "s" : ""})</div>
          <div className="text-lg tabular-nums text-compute">{money(d)}<span className="text-xs">/mo</span></div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Cheaper here</div>
          <div className={`text-lg font-semibold ${cheaper === "shared" ? "text-memory" : "text-compute"}`}>{cheaper}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Made-up but plausible prices, just to show the shape. Shared cost grows in a straight line with usage. Dedicated cost
        has a high floor (you pay for the GPU even when it’s idle) but grows in steps. This also leaves out the engineering
        time a dedicated setup needs.
      </p>
    </Widget>
  );
}
