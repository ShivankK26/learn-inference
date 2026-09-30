"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const ENGINES = 8;

export default function XPyD() {
  const [prefillShare, setPrefillShare] = useState(60); // % of work that is prefill
  const [x, setX] = useState(4);
  const y = ENGINES - x;

  // Demand in "engine-loads": total work of 7 engines' worth, split by prefill share
  const TOTAL = 7;
  const pDemand = (TOTAL * prefillShare) / 100;
  const dDemand = TOTAL - pDemand;
  const pLoad = x === 0 ? Infinity : pDemand / x;
  const dLoad = y === 0 ? Infinity : dDemand / y;

  const status = (load: number) =>
    load > 1 ? { text: "overloaded", cls: "text-bad" } : load > 0.85 ? { text: "tight", cls: "text-compute" } : { text: "healthy", cls: "text-good" };
  const ps = status(pLoad);
  const ds = status(dLoad);
  const queue = pLoad > 1 ? Math.min(100, Math.round((pLoad - 1) * 120)) : 0;

  return (
    <Widget title="Splitting engines: xPyD" hint="Match the split to your traffic">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>How prefill-heavy is traffic?</span><span className="tabular-nums">{prefillShare}% prefill work</span></div>
          <input type="range" className="w-full" min={10} max={90} step={5} value={prefillShare} onChange={(e) => setPrefillShare(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Prefill engines (of {ENGINES})</span><span className="tabular-nums">{x}P{y}D</span></div>
          <input type="range" className="w-full" min={1} max={ENGINES - 1} step={1} value={x} onChange={(e) => setX(+e.target.value)} />
        </label>
      </div>

      <div className="mt-5 grid grid-cols-8 gap-1.5">
        {Array.from({ length: ENGINES }, (_, i) => (
          <div
            key={i}
            className={`flex h-12 items-center justify-center rounded-lg text-xs font-semibold text-bg ${i < x ? "bg-compute" : "bg-memory"}`}
          >
            {i < x ? "P" : "D"}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Prefill engines</div>
          <div className={`font-semibold ${ps.cls}`}>{ps.text}</div>
          <div className="text-xs text-ink-faint tabular-nums">{Number.isFinite(pLoad) ? `${Math.round(pLoad * 100)}% busy` : ""}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Decode engines</div>
          <div className={`font-semibold ${ds.cls}`}>{ds.text}</div>
          <div className="text-xs text-ink-faint tabular-nums">{Number.isFinite(dLoad) ? `${Math.round(dLoad * 100)}% busy` : ""}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Prefill queue</div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg-soft">
            <div className={`h-full rounded-full ${queue > 0 ? "bg-bad" : "bg-good"}`} style={{ width: `${Math.max(4, queue)}%` }} />
          </div>
          <div className="mt-1 text-xs text-ink-faint">{queue > 0 ? "growing: requests wait for TTFT" : "empty"}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {pLoad > 1
          ? "Too few prefill engines: the prefill queue grows. Move an engine over to prefill, or let decode engines prefill short requests locally."
          : dLoad > 1
            ? "Too few decode engines: they run out of room for KV caches and speed. Move an engine back to decode."
            : "Balanced. When traffic shifts, dynamic disaggregation can change this split at runtime."}
      </p>
      <p className="mt-2 text-xs text-ink-faint">Toy load model for intuition: real capacity depends on the model, hardware and request mix.</p>
    </Widget>
  );
}
