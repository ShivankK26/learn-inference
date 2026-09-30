"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

function Slider({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string }) {
  return (
    <label className="block text-sm">
      <div className="flex justify-between gap-3">
        <span className="text-ink-soft">{label}</span>
        <span className="tabular-nums">{fmt(value)}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );
}

export default function ReplicaSizer() {
  const [rate, setRate] = useState(20); // requests per second
  const [dur, setDur] = useState(6); // seconds per request (TTFT + full decode)
  const [target, setTarget] = useState(16); // concurrency target per replica
  const [growth, setGrowth] = useState(10); // % traffic growth per minute during a ramp
  const [cold, setCold] = useState(4); // cold start, minutes

  const inFlight = rate * dur; // Little's law: L = λ × W
  const bare = Math.max(1, Math.ceil(inFlight / target));
  const headroomPct = Math.min(300, growth * cold); // traffic can grow this much before a new replica is ready
  const withHeadroom = Math.max(1, Math.ceil((inFlight * (1 + headroomPct / 100)) / target));
  const extra = withHeadroom - bare;

  return (
    <Widget title="How many replicas do you need right now?" hint="Little’s law plus cold-start headroom">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Slider label="Arriving requests" value={rate} set={setRate} min={1} max={200} step={1} fmt={(n) => `${n} per second`} />
        <Slider label="Average time per request" value={dur} set={setDur} min={0.5} max={30} step={0.5} fmt={(n) => `${n} s`} />
        <Slider label="Concurrency target per replica" value={target} set={setTarget} min={1} max={128} step={1} fmt={(n) => `${n}`} />
        <Slider label="Cold start time" value={cold} set={setCold} min={0.5} max={15} step={0.5} fmt={(n) => `${n} min`} />
        <Slider label="How fast traffic can ramp" value={growth} set={setGrowth} min={0} max={50} step={1} fmt={(n) => `${n}% per minute`} />
      </div>

      <div className="mt-5 space-y-2 rounded-xl bg-bg-soft p-4 text-sm">
        <div>
          <span className="text-ink-soft">Requests in flight at once </span>
          <span className="tabular-nums">
            = {rate} per s × {dur} s = <b>{inFlight.toLocaleString("en-US")}</b>
          </span>
        </div>
        <div>
          <span className="text-ink-soft">Replicas to just keep up </span>
          <span className="tabular-nums">
            = ⌈{inFlight.toLocaleString("en-US")} ÷ {target}⌉ = <b>{bare}</b>
          </span>
        </div>
        <div>
          <span className="text-ink-soft">Traffic growth while one cold start finishes </span>
          <span className="tabular-nums">
            ≈ {growth}% × {cold} min = <b>{headroomPct.toFixed(0)}%</b>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Bare minimum</div>
          <div className="text-lg tabular-nums">{bare}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">With ramp headroom</div>
          <div className="text-lg tabular-nums text-accent">{withHeadroom}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Extra replicas you pay for</div>
          <div className="text-lg tabular-nums text-compute">+{extra}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Simplified: it assumes steady arrivals and a linear ramp. Shrink the cold start and watch the headroom (and the
        bill) fall. That’s why the book says cold start speed decides how confidently you can scale down.
      </p>
    </Widget>
  );
}
