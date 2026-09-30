"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

const N = 2000;
const BINS = 40;

// Seeded random numbers so server and browser render the same sample
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function sample(spread: number, outlierPct: number) {
  const r = rng(7);
  const out: number[] = [];
  for (let i = 0; i < N; i++) {
    // log-normal around a ~700 ms median (Box–Muller for a normal draw)
    const u1 = Math.max(r(), 1e-9), u2 = r();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let t = 700 * Math.exp(spread * z);
    if (r() < outlierPct / 100) t *= 3 + r() * 4; // occasional slow requests: queueing, long prompts, a busy GPU
    out.push(t);
  }
  return out.sort((a, b) => a - b);
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

export default function LatencyPercentiles() {
  const [spread, setSpread] = useState(0.35);
  const [outliers, setOutliers] = useState(3);
  const data = useMemo(() => sample(spread, outliers), [spread, outliers]);

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const marks = [
    { k: "P50", v: pct(data, 50), note: "1 in 2 requests is slower" },
    { k: "P90", v: pct(data, 90), note: "1 in 10 is slower" },
    { k: "P95", v: pct(data, 95), note: "1 in 20 is slower" },
    { k: "P99", v: pct(data, 99), note: "1 in 100 is slower" },
  ];
  const maxX = pct(data, 99.5) * 1.05;
  const counts = new Array(BINS).fill(0);
  for (const t of data) if (t < maxX) counts[Math.floor((t / maxX) * BINS)]++;
  const maxC = Math.max(...counts);

  const W = 520, H = 190, B = 26;
  // Rounded so server and browser produce identical SVG attributes
  const x = (t: number) => Math.round((t / maxX) * W * 100) / 100;

  return (
    <Widget title="Averages hide the slow requests" hint="2,000 simulated requests">
      <svg viewBox={`0 0 ${W} ${H + B}`} className="w-full" role="img" aria-label="Latency histogram">
        {counts.map((c, i) => (
          <rect key={i} x={(i * W) / BINS + 1} y={Math.round(H - (c / maxC) * (H - 30))} width={W / BINS - 2} height={Math.round((c / maxC) * (H - 30))} rx="2" fill="var(--memory)" opacity="0.55" />
        ))}
        {marks.map((m, i) => (
          <g key={m.k}>
            <line x1={x(m.v)} x2={x(m.v)} y1={8} y2={H} stroke="var(--compute)" strokeWidth="1.5" strokeDasharray={i === 0 ? "" : "3 3"} />
            <text x={x(m.v) + 3} y={18 + (i % 2) * 12} fontSize="10" fill="var(--compute)" fontWeight="600">{m.k}</text>
          </g>
        ))}
        <line x1={x(mean)} x2={x(mean)} y1={8} y2={H} stroke="var(--accent)" strokeWidth="2" />
        <text x={x(mean) - 3} y={42} fontSize="10" fill="var(--accent)" fontWeight="600" textAnchor="end">mean</text>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--line)" />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={Math.min(W - 16, Math.max(12, f * W))} y={H + 16} fontSize="10" textAnchor="middle" fill="var(--ink-faint)">
            {((f * maxX) / 1000).toFixed(1)}s
          </text>
        ))}
      </svg>

      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>How variable are requests?</span><span className="tabular-nums">{spread.toFixed(2)}</span></div>
          <input type="range" className="w-full" min={0.1} max={0.8} step={0.05} value={spread} onChange={(e) => setSpread(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Share of very slow outliers</span><span className="tabular-nums">{outliers}%</span></div>
          <input type="range" className="w-full" min={0} max={12} step={1} value={outliers} onChange={(e) => setOutliers(+e.target.value)} />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-lg border border-accent/40 bg-accent-soft p-2.5 text-center">
          <div className="text-xs text-ink-soft">Mean</div>
          <div className="tabular-nums font-semibold text-accent">{Math.round(mean)} ms</div>
        </div>
        {marks.map((m) => (
          <div key={m.k} className="rounded-lg border border-line p-2.5 text-center">
            <div className="text-xs text-ink-soft">{m.k}</div>
            <div className="tabular-nums font-semibold">{Math.round(m.v)} ms</div>
            <div className="text-[11px] leading-tight text-ink-faint">{m.note}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Notice the mean sits to the right of P50: a few very slow requests drag the average up. Add outliers and watch P99 run
        away while the median barely moves.
      </p>
    </Widget>
  );
}
