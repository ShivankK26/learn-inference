"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// From the Llama 3 training run: ~1 unexpected interruption per 50,000 GPU-hours
const GPU_HOURS_PER_FAILURE = 50_000;
const HOURS_PER_YEAR = 8_760;

export default function GpuFailureCalc() {
  const [nodes, setNodes] = useState(1);
  const gpus = nodes * 8;
  const perYear = (gpus * HOURS_PER_YEAR) / GPU_HOURS_PER_FAILURE;
  const daysBetween = 365 / perYear;

  let cadence: string;
  if (daysBetween >= 60) cadence = `about one every ${Math.round(daysBetween / 30)} months`;
  else if (daysBetween >= 2) cadence = `about one every ${Math.round(daysBetween)} days`;
  else if (daysBetween * 24 >= 2) cadence = `about one every ${Math.round(daysBetween * 24)} hours`;
  else cadence = `more than one an hour`;

  return (
    <Widget title="How often will a GPU fail on you?" hint="Drag the fleet size">
      <label className="block text-sm">
        <div className="flex justify-between">
          <span>Nodes of 8 GPUs, running all year</span>
          <span className="tabular-nums">
            {nodes} {nodes === 1 ? "node" : "nodes"} · {gpus.toLocaleString("en-US")} GPUs
          </span>
        </div>
        <input type="range" className="w-full" min={1} max={500} value={nodes} onChange={(e) => setNodes(+e.target.value)} />
      </label>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">GPU-hours per year</div>
          <div className="text-lg">{(gpus * HOURS_PER_YEAR).toLocaleString("en-US")}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Expected failures per year</div>
          <div className="text-lg text-bad">{perYear < 10 ? perYear.toFixed(1) : Math.round(perYear).toLocaleString("en-US")}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">That’s…</div>
          <div className="text-base font-medium">{cadence}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Uses the failure rate reported in the Llama 3 paper (419 interruptions across 16,000 GPUs in 54 days). Your hardware
        will differ, but the lesson holds: at scale, failure is routine, not rare.
      </p>
    </Widget>
  );
}
