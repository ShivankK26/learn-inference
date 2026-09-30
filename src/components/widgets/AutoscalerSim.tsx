"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

const MINUTES = 1440; // one simulated day

// Concurrent requests over a day: quiet night, busy afternoon, and a viral spike at 8pm.
function demandAt(m: number): number {
  const daily = 20 + 180 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (m - 240)) / MINUTES));
  const wiggle = 8 * Math.sin(m / 7) + 5 * Math.sin(m / 23);
  const spikeStart = 20 * 60;
  let spike = 0;
  if (m >= spikeStart && m < spikeStart + 8) spike = 260 * ((m - spikeStart) / 8);
  else if (m >= spikeStart + 8) spike = 260 * Math.exp(-(m - spikeStart - 8) / 45);
  return Math.max(0, daily + wiggle + spike);
}

const DEMAND = Array.from({ length: MINUTES }, (_, m) => demandAt(m));

type Params = {
  mode: "auto" | "fixed";
  fixed: number;
  target: number;
  minR: number;
  maxR: number;
  window: number;
  delay: number;
  cold: number;
};

function simulate(p: Params) {
  const capacity: number[] = [];
  const queue: number[] = [];
  let paidMinutes = 0;
  let queuedWork = 0;
  let totalWork = 0;
  let served = 0;
  let offered = 0;
  const clamp = (n: number) => Math.min(p.maxR, Math.max(p.minR, n));

  let active = p.mode === "fixed" ? p.fixed : clamp(Math.ceil(DEMAND[0] / p.target));
  let pending: number[] = [];
  let lowSince: number | null = null;
  let windowSum = 0;

  for (let m = 0; m < MINUTES; m++) {
    windowSum += DEMAND[m];
    if (m >= p.window) windowSum -= DEMAND[m - p.window];
    const avg = windowSum / Math.min(m + 1, p.window);

    if (p.mode === "auto") {
      // replicas that finished their cold start come online
      const ready = pending.filter((t) => t <= m).length;
      active += ready;
      pending = pending.filter((t) => t > m);

      const desired = clamp(Math.ceil(avg / p.target));
      if (desired > active + pending.length) {
        for (let k = 0; k < desired - active - pending.length; k++) pending.push(m + p.cold);
      }
      if (desired < active) {
        if (lowSince === null) lowSince = m;
        if (m - lowSince >= p.delay) {
          active = desired;
          lowSince = null;
        }
      } else {
        lowSince = null;
      }
    }

    const cap = active * p.target;
    const d = DEMAND[m];
    capacity.push(cap);
    const q = Math.max(0, d - cap);
    queue.push(q);
    queuedWork += q;
    totalWork += d;
    paidMinutes += active + (p.mode === "auto" ? pending.length : 0);
    served += Math.min(d, cap);
    offered += cap;
  }

  return {
    capacity,
    queue,
    replicaHours: paidMinutes / 60,
    waitedShare: totalWork > 0 ? queuedWork / totalWork : 0,
    utilization: offered > 0 ? served / offered : 0,
  };
}

function Slider({ label, value, set, min, max, unit = "" }: { label: string; value: number; set: (n: number) => void; min: number; max: number; unit?: string }) {
  return (
    <label className="block text-sm">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input type="range" className="w-full" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );
}

const W = 560, H = 220, PAD = { l: 40, r: 10, t: 10, b: 26 };
const YMAX = 520;
const sx = (m: number) => PAD.l + (m / MINUTES) * (W - PAD.l - PAD.r);
const sy = (v: number) => H - PAD.b - (Math.min(v, YMAX) / YMAX) * (H - PAD.t - PAD.b);

function path(values: number[], step = 4) {
  let d = "";
  for (let m = 0; m < values.length; m += step) d += `${d ? "L" : "M"}${sx(m).toFixed(1)},${sy(values[m]).toFixed(1)}`;
  return d;
}

export default function AutoscalerSim() {
  const [mode, setMode] = useState<"auto" | "fixed">("auto");
  const [fixed, setFixed] = useState(12);
  const [target, setTarget] = useState(16);
  const [minR, setMinR] = useState(2);
  const [maxR, setMaxR] = useState(40);
  const [win, setWin] = useState(5);
  const [delay, setDelay] = useState(15);
  const [cold, setCold] = useState(5);

  const sim = useMemo(
    () => simulate({ mode, fixed, target, minR, maxR, window: win, delay, cold }),
    [mode, fixed, target, minR, maxR, win, delay, cold]
  );

  // queue area = the gap between demand and capacity, where demand is higher
  let queueArea = "";
  for (let m = 0; m < MINUTES; m += 2) {
    if (sim.queue[m] > 0.5) {
      const x = sx(m).toFixed(1);
      queueArea += `M${x},${sy(sim.capacity[m]).toFixed(1)}L${x},${sy(DEMAND[m]).toFixed(1)}`;
    }
  }

  return (
    <Widget title="Autoscaler simulator: one day of traffic" hint="Tune the five settings">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["fixed", "auto"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 ${mode === m ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {m === "fixed" ? "Fixed number of replicas" : "Autoscaling"}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Traffic, capacity and queue over one day">
        {[0, 100, 200, 300, 400, 500].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
            <text x={PAD.l - 6} y={sy(v) + 4} fontSize="10" textAnchor="end" fill="var(--ink-faint)">{v}</text>
          </g>
        ))}
        {[0, 6, 12, 18, 24].map((h) => (
          <text key={h} x={sx(h * 60)} y={H - 8} fontSize="10" textAnchor={h === 24 ? "end" : h === 0 ? "start" : "middle"} fill="var(--ink-faint)">
            {h === 24 ? "midnight" : `${String(h).padStart(2, "0")}:00`}
          </text>
        ))}
        <path d={queueArea} stroke="var(--bad)" strokeWidth="2" opacity="0.5" />
        <path d={path(sim.capacity, 2)} fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d={path(DEMAND)} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-ink" /> Requests in flight</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-accent" /> Capacity (replicas × concurrency)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-bad opacity-60" /> Requests stuck in the queue</span>
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <Slider label="Concurrency target per replica" value={target} set={setTarget} min={4} max={48} />
        {mode === "fixed" ? (
          <Slider label="Replicas (always on)" value={fixed} set={setFixed} min={1} max={40} />
        ) : (
          <>
            <Slider label="Min replicas" value={minR} set={setMinR} min={0} max={10} />
            <Slider label="Max replicas" value={maxR} set={setMaxR} min={4} max={60} />
            <Slider label="Autoscaling window" value={win} set={setWin} min={1} max={30} unit=" min" />
            <Slider label="Scale-down delay" value={delay} set={setDelay} min={0} max={60} unit=" min" />
            <Slider label="Cold start time" value={cold} set={setCold} min={1} max={20} unit=" min" />
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Replica-hours paid</div>
          <div className="text-lg">{Math.round(sim.replicaHours)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Requests that had to wait</div>
          <div className={`text-lg ${sim.waitedShare > 0.01 ? "text-bad" : "text-good"}`}>{(sim.waitedShare * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Average utilization</div>
          <div className="text-lg text-accent">{Math.round(sim.utilization * 100)}%</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        A toy model: each replica handles exactly its concurrency target, and anything above capacity waits in a queue. Try a
        fixed fleet first (you either waste GPUs at night or drown during the 8pm spike), then switch to autoscaling and
        stretch the cold start time.
      </p>
    </Widget>
  );
}
