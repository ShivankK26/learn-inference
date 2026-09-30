"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Reproduces the book’s arithmetic-intensity exercise (section 2.4.2) and lets you vary it.
// FP16: 2 bytes per value. FLOPs for an (m×k)·(k×n) matmul = 2·m·k·n. Softmax counted at ~5 ops per score.

const BYTES = 2;
const H100_RATIO = 989 / 3.35; // ≈ 295 FLOPs per byte

type Mode = "standard" | "decode" | "fused";
type Row = { step: string; reads: number; flops: number; writes: number };

function rows(mode: Mode, N: number, d: number): Row[] {
  const nd = N * d * BYTES;
  if (mode === "standard") {
    const nn = N * N * BYTES;
    return [
      { step: "S = Q·Kᵀ", reads: 2 * nd, flops: 2 * N * N * d, writes: nn },
      { step: "P = softmax(S)", reads: nn, flops: 5 * N * N, writes: nn },
      { step: "O = P·V", reads: nn + nd, flops: 2 * N * N * d, writes: nd },
    ];
  }
  if (mode === "decode") {
    const q = d * BYTES;
    const s = N * BYTES;
    return [
      { step: "s = q·Kᵀ", reads: q + nd, flops: 2 * N * d, writes: s },
      { step: "p = softmax(s)", reads: s, flops: 5 * N, writes: s },
      { step: "o = p·V", reads: s + nd, flops: 2 * N * d, writes: q },
    ];
  }
  return [
    { step: "Read Q, K, V once", reads: 3 * nd, flops: 0, writes: 0 },
    { step: "All three steps on-chip", reads: 0, flops: 4 * N * N * d + 5 * N * N, writes: 0 },
    { step: "Write O", reads: 0, flops: 0, writes: nd },
  ];
}

function bytes(n: number) {
  if (n === 0) return "–";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GiB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(n >= 10 * 1024 ** 2 ? 0 : 1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KiB`;
  return `${n} B`;
}

function flops(n: number) {
  if (n === 0) return "–";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)} T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} G`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} K`;
  return `${n}`;
}

const lengths = [512, 1024, 2048, 4096, 8192, 16384, 32768];
const dims = [64, 128, 256];
const modes: { key: Mode; label: string; note: string }[] = [
  { key: "standard", label: "Standard attention", note: "The book’s example: the three-line algorithm, writing S and P out to GPU memory." },
  { key: "decode", label: "One new decode token", note: "What a single decode step really does: one query row against the cached K and V." },
  { key: "fused", label: "Fused (FlashAttention, ideal)", note: "Same math, but S and P never leave on-chip memory. Real kernels re-read some tiles, so real traffic is a bit higher." },
];

export default function AttentionIntensity() {
  const [N, setN] = useState(4096);
  const [d, setD] = useState(128);
  const [mode, setMode] = useState<Mode>("standard");
  const r = rows(mode, N, d);
  const mem = r.reduce((a, x) => a + x.reads + x.writes, 0);
  const work = r.reduce((a, x) => a + x.flops, 0);
  const matmulOnly = mode === "decode" ? 4 * N * d : 4 * N * N * d;
  const ai = work / mem;
  const aiMatmul = matmulOnly / mem;
  const bound = ai < H100_RATIO ? "memory" : "compute";
  const pct = Math.min(1, ai / H100_RATIO);

  return (
    <Widget title="Arithmetic intensity of attention, step by step" hint="Try the book’s numbers first: N = 4,096, d = 128">
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Sequence length N</div>
          <div className="flex flex-wrap gap-1.5">
            {lengths.map((n) => (
              <button key={n} onClick={() => setN(n)} className={`rounded-lg border px-2.5 py-1 ${N === n ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}>
                {n.toLocaleString("en-US")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Head dimension d</div>
          <div className="flex gap-1.5">
            {dims.map((x) => (
              <button key={x} onClick={() => setD(x)} className={`rounded-lg border px-2.5 py-1 ${d === x ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}>
                {x}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-sm">
        {modes.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)} className={`rounded-lg border px-3 py-1.5 ${mode === m.key ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{modes.find((m) => m.key === mode)!.note}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-b border-ink-faint text-left text-ink-soft">
              <th className="py-2 pr-3 font-semibold">Step</th>
              <th className="py-2 pr-3 text-right font-semibold text-memory">Reads</th>
              <th className="py-2 pr-3 text-right font-semibold text-compute">Compute (FLOPs)</th>
              <th className="py-2 text-right font-semibold text-memory">Writes</th>
            </tr>
          </thead>
          <tbody>
            {r.map((x) => (
              <tr key={x.step} className="border-b border-line">
                <td className="py-2 pr-3">{x.step}</td>
                <td className="py-2 pr-3 text-right text-memory">{bytes(x.reads)}</td>
                <td className="py-2 pr-3 text-right text-compute">{flops(x.flops)}</td>
                <td className="py-2 text-right text-memory">{bytes(x.writes)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2 pr-3">Total</td>
              <td className="py-2 pr-3 text-right text-memory">
                {bytes(r.reduce((a, x) => a + x.reads, 0))}
              </td>
              <td className="py-2 pr-3 text-right text-compute">{flops(work)}</td>
              <td className="py-2 text-right text-memory">{bytes(r.reduce((a, x) => a + x.writes, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Memory moved (reads + writes)</div>
          <div className="text-lg text-memory">{bytes(mem)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Arithmetic intensity</div>
          <div className="text-lg">
            {ai < 10 ? ai.toFixed(2) : ai.toFixed(1)} <span className="text-xs text-ink-faint">FLOPs/byte</span>
          </div>
          <div className="text-[11px] text-ink-faint">matmuls only: {aiMatmul < 10 ? aiMatmul.toFixed(2) : aiMatmul.toFixed(1)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">On an H100 (ops:byte ≈ 295)</div>
          <div className={`text-lg font-semibold ${bound === "memory" ? "text-memory" : "text-compute"}`}>{bound}-bound</div>
          <div className="text-[11px] text-ink-faint">math units busy at most {(pct * 100).toFixed(pct < 0.1 ? 1 : 0)}% of the time</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        FP16 (2 bytes per value), one attention head, no other overheads. Softmax is counted at about 5 operations per
        score (max, subtract, exponent, sum, divide); the book’s figure of 62 corresponds to counting the two matmuls.
      </p>
    </Widget>
  );
}
