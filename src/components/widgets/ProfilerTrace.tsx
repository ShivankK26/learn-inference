"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// A made-up profile of one transformer layer during decode. Durations in microseconds.
type K = { name: string; us: number; note?: string; kind: "gemm" | "attn" | "small" };

const LAYER: K[] = [
  { name: "rms_norm", us: 5, kind: "small" },
  { name: "qkv_proj (GEMM)", us: 35, kind: "gemm" },
  { name: "rotary_embedding", us: 4, kind: "small" },
  { name: "attention", us: 30, kind: "attn" },
  { name: "o_proj (GEMM)", us: 15, kind: "gemm" },
  { name: "residual_add", us: 3, kind: "small" },
  { name: "rms_norm", us: 5, kind: "small" },
  { name: "mlp_up (GEMM)", us: 60, kind: "gemm" },
  { name: "activation", us: 22, kind: "small", note: "Unusually slow for such simple math: it re-reads the whole MLP output from memory." },
  { name: "mlp_down (GEMM)", us: 30, kind: "gemm" },
  { name: "residual_add", us: 3, kind: "small" },
];

const LAUNCH_US = 12; // CPU time to issue one kernel from eager Python (illustrative)
const GRAPH_US = 10; // one CUDA graph launch replays everything

function kernels(fused: boolean): K[] {
  if (!fused) return LAYER;
  const out: K[] = [];
  for (let i = 0; i < LAYER.length; i++) {
    if (LAYER[i].name === "mlp_up (GEMM)") {
      out.push({ name: "mlp_up + activation (fused)", us: 64, kind: "gemm", note: "The activation now runs on data still on-chip, before it’s written out." });
      i++; // skip the activation
    } else out.push(LAYER[i]);
  }
  return out;
}

// CPU issues kernels one after another; the GPU runs each once it’s issued and the previous one is done.
function layout(ks: K[], graphs: boolean) {
  const out: (K & { start: number; end: number; issued: number; waited: boolean })[] = [];
  let gpuFree = 0;
  for (let i = 0; i < ks.length; i++) {
    const issued = graphs ? GRAPH_US : LAUNCH_US * (i + 1);
    const waited = issued > gpuFree;
    const start = Math.max(gpuFree, issued);
    const end = start + ks[i].us;
    gpuFree = end;
    out.push({ ...ks[i], start, end, issued, waited });
  }
  return out;
}

const fill = { gemm: "var(--compute)", attn: "var(--accent)", small: "var(--memory)" };

export default function ProfilerTrace() {
  const [fused, setFused] = useState(false);
  const [graphs, setGraphs] = useState(false);
  const [sel, setSel] = useState<number | null>(null);

  const ks = kernels(fused);
  const bars = layout(ks, graphs);
  const total = bars[bars.length - 1].end;
  const busy = ks.reduce((a, k) => a + k.us, 0);
  const idle = total - busy;
  const cpuEnd = graphs ? GRAPH_US : LAUNCH_US * ks.length;

  const W = 640, L = 52, R = 8;
  const span = 260;
  const x = (t: number) => Math.round((L + (t / span) * (W - L - R)) * 10) / 10;
  const table = [...ks.map((k, i) => ({ ...k, i }))].sort((a, b) => b.us - a.us).slice(0, 5);
  const selK = sel !== null ? bars[sel] : null;

  return (
    <Widget title="Reading a profiler trace" hint="Click a kernel, then try the fixes">
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={fused} onChange={(e) => { setFused(e.target.checked); setSel(null); }} />
          Fuse the activation into the matmul before it
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={graphs} onChange={(e) => setGraphs(e.target.checked)} />
          Replay the step as a CUDA graph
        </label>
      </div>

      <svg viewBox={`0 0 ${W} 112`} className="w-full" role="img" aria-label="Profiler timeline">
        {[0, 50, 100, 150, 200, 250].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={6} y2={92} stroke="var(--line)" />
            <text x={x(t)} y={106} fontSize="10" textAnchor="middle" fill="var(--ink-faint)">{t} µs</text>
          </g>
        ))}
        <text x={L - 6} y={28} fontSize="11" textAnchor="end" fill="var(--ink-soft)">CPU</text>
        <text x={L - 6} y={72} fontSize="11" textAnchor="end" fill="var(--ink-soft)">GPU</text>
        {graphs ? (
          <rect x={x(0)} y={16} width={x(GRAPH_US) - x(0)} height={18} rx="3" fill="var(--ink-faint)" opacity="0.5" />
        ) : (
          ks.map((_, i) => (
            <rect key={i} x={x(LAUNCH_US * i) + 0.5} y={16} width={x(LAUNCH_US) - x(0) - 1} height={18} rx="3" fill="var(--ink-faint)" opacity="0.45" />
          ))
        )}
        <text x={x(cpuEnd) + 4} y={29} fontSize="10" fill="var(--ink-faint)">{graphs ? "one graph launch" : "launching kernels one by one"}</text>
        {bars.map((b, i) => (
          <rect
            key={i}
            x={x(b.start) + 0.5}
            y={58}
            width={Math.max(1.5, Math.round((x(b.end) - x(b.start) - 1) * 10) / 10)}
            height={22}
            rx="3"
            fill={fill[b.kind]}
            opacity={sel === null || sel === i ? 0.9 : 0.35}
            stroke={b.note ? "var(--bad)" : "none"}
            strokeWidth={b.note && !fused ? 2 : 0}
            style={{ cursor: "pointer" }}
            onClick={() => setSel(i)}
          />
        ))}
      </svg>

      <div className="mt-2 min-h-[2.75rem] rounded-lg border border-line bg-card px-3 py-2 text-sm">
        {selK ? (
          <>
            <b>{selK.name}</b>: {selK.us} µs on the GPU, from {selK.start} to {selK.end} µs.{" "}
            {selK.waited && <span className="text-bad">The GPU sat idle waiting for the CPU to launch this one. </span>}
            {selK.note && <span className="text-ink-soft">{selK.note}</span>}
          </>
        ) : (
          <span className="text-ink-faint">Click a bar on the GPU row. Gaps on that row are moments the GPU sat idle.</span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-1 text-[13px] font-medium text-ink-soft">Top kernels by GPU time</div>
          <table className="w-full text-sm tabular-nums">
            <tbody>
              {table.map((k) => (
                <tr key={k.i} className="border-b border-line last:border-0">
                  <td className="py-1 pr-2">{k.name}</td>
                  <td className="py-1 pr-2 text-right">{k.us} µs</td>
                  <td className="py-1 text-right text-ink-faint">{Math.round((k.us / busy) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          <div className="rounded-lg border border-line p-2.5">
            <div className="text-xs text-ink-faint">Layer time</div>
            <div className="text-lg tabular-nums">{total} µs</div>
          </div>
          <div className="rounded-lg border border-line p-2.5">
            <div className="text-xs text-ink-faint">GPU idle (gaps)</div>
            <div className={`text-lg tabular-nums ${idle > 5 ? "text-bad" : "text-good"}`}>{idle} µs</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        A made-up profile of one transformer layer during decode. Real models repeat this dozens of times per token, so a few
        microseconds per layer adds up. Orange: matmuls. Green: attention. Blue: small memory-bound ops.
      </p>
    </Widget>
  );
}
