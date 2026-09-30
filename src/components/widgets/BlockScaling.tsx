"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

const N = 64;
const FP4 = [0, 0.5, 1, 1.5, 2, 3, 4, 6]; // every positive value FP4 (E2M1) can hold

// Deterministic "weights": mostly small values plus one big outlier
function makeValues() {
  let seed = 7;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const v: number[] = [];
  for (let i = 0; i < N; i++) {
    const g = Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
    v.push(Math.round(g * 0.25 * 1000) / 1000); // rounded so server and browser agree exactly
  }
  v[9] = 3; // the outlier
  return v;
}

const VALUES = makeValues();

function toFp4(x: number) {
  const a = Math.min(6, Math.abs(x));
  let best = 0;
  for (const l of FP4) if (Math.abs(l - a) < Math.abs(best - a)) best = l;
  return Math.sign(x) * best;
}

const modes = [
  { key: "none", label: "No scale factor", group: 0, extraBits: 0, note: "Raw FP4: its smallest step is 0.5, so nearly every small weight rounds to zero." },
  { key: "tensor", label: "One scale for all (tensor)", group: N, extraBits: 0, note: "One scale fitted to the outlier: the steps become so big that most small values round to zero." },
  { key: "mx", label: "Blocks of 32 (MXFP4)", group: 32, extraBits: 8 / 32, note: "Each block of 32 gets its own scale. Only the outlier’s block suffers." },
  { key: "nv", label: "Blocks of 16 + global (NVFP4)", group: 16, extraBits: 8 / 16 /* the one 32-bit global scale is negligible across a real tensor */, note: "Smaller blocks of 16 plus one 32-bit global scale: the most detail survives." },
] as const;

export default function BlockScaling() {
  const values = VALUES;
  const [mi, setMi] = useState(1);
  const mode = modes[mi];

  const { q, zeroed, err, groups } = useMemo(() => {
    const q: number[] = [];
    const groups: number[] = [];
    if (mode.group === 0) {
      values.forEach((v) => q.push(toFp4(v)));
    } else {
      for (let s = 0; s < N; s += mode.group) {
        const block = values.slice(s, s + mode.group);
        const scale = Math.max(...block.map(Math.abs)) / 6;
        groups.push(s);
        block.forEach((v) => q.push(toFp4(v / scale) * scale));
      }
    }
    let zeroed = 0, err = 0;
    values.forEach((v, i) => {
      err += Math.abs(q[i] - v);
      if (i === 9) return;
      if (q[i] === 0 && Math.abs(v) > 0.02) zeroed++;
    });
    return { q, zeroed, err: err / N, groups };
  }, [values, mode]);

  // chart
  const W = 640, H = 220, pad = 8;
  const colW = (W - pad * 2) / N;
  const ymax = 0.8; // clip the outlier bar visually
  const y = (v: number) => H / 2 - (Math.max(-ymax, Math.min(ymax, v)) / ymax) * (H / 2 - pad);

  return (
    <Widget title="Why block-wise scale factors matter" hint="64 weights in FP4, one big outlier">
      <div className="flex flex-wrap gap-1.5 text-sm">
        {modes.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setMi(i)}
            className={`rounded-lg border px-3 py-1 ${mi === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Original vs quantized values">
        {mode.group > 0 &&
          groups.map((s, gi) => (
            <rect key={s} x={pad + s * colW} y={0} width={mode.group * colW} height={H} fill={gi % 2 ? "var(--bg-soft)" : "transparent"} />
          ))}
        <line x1={pad} x2={W - pad} y1={H / 2} y2={H / 2} stroke="var(--line)" />
        {values.map((v, i) => {
          const x = pad + i * colW + colW / 2;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={H / 2} y2={y(v)} stroke="var(--ink-faint)" strokeWidth={colW * 0.55} opacity={0.35} />
              <circle cx={x} cy={y(q[i])} r={3} fill={q[i] === 0 && Math.abs(v) > 0.02 ? "var(--bad)" : "var(--accent)"} />
              {i === 9 && (
                <text x={x + 6} y={14} fontSize="11" fill="var(--ink-soft)">
                  outlier = 3.0 ↑
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-2 bg-ink-faint opacity-40" /> original value</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> stored in FP4</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-bad" /> wiped out (rounded to 0)</span>
        {mode.group > 0 && mode.group < N && <span>shaded bands = blocks sharing one scale</span>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Values wiped to zero</div>
          <div className={`text-lg tabular-nums ${zeroed > 10 ? "text-bad" : ""}`}>{zeroed} / {N - 1}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Average error</div>
          <div className="text-lg tabular-nums">{err.toFixed(3)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Storage per value</div>
          <div className="text-lg tabular-nums">{(4 + mode.extraBits).toFixed(2)} bits</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">{mode.note}</p>
      <p className="mt-1 text-xs text-ink-faint">
        Simplified: real MX formats use power-of-two scales, and NVFP4 stores its block scales in FP8. The trade-off is the same:
        more scale factors keep more detail but cost a little extra memory and math.
      </p>
    </Widget>
  );
}
