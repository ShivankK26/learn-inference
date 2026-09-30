"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const HOURS_PER_MONTH = 730;

function Num({ label, value, set, step = 1, suffix }: { label: string; value: number; set: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink-soft">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={(e) => set(Math.max(0, +e.target.value || 0))}
          className="w-full rounded-lg border border-line bg-bg px-3 py-1.5 tabular-nums outline-none focus:border-accent"
        />
        {suffix && <span className="shrink-0 text-xs text-ink-faint">{suffix}</span>}
      </div>
    </label>
  );
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function ApiVsDedicated() {
  // made-up example numbers, per month
  const [inTok, setInTok] = useState(4000);
  const [outTok, setOutTok] = useState(800);
  const [cachedPct, setCachedPct] = useState(30);
  const [priceIn, setPriceIn] = useState(0.6);
  const [priceCached, setPriceCached] = useState(0.15);
  const [priceOut, setPriceOut] = useState(2.4);
  const [gpus, setGpus] = useState(2);
  const [gpuHr, setGpuHr] = useState(3.5);
  const [eng, setEng] = useState(1500);

  const cached = (inTok * cachedPct) / 100;
  const api = (inTok - cached) * priceIn + cached * priceCached + outTok * priceOut;
  const gpuCost = gpus * gpuHr * HOURS_PER_MONTH;
  const dedicated = gpuCost + eng;
  const max = Math.max(api, dedicated, 1);
  const cheaper = api < dedicated ? "api" : "dedicated";

  return (
    <Widget title="Per-token API vs. your own GPUs" hint="Compare total monthly cost">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="font-semibold">Pay per token</div>
          <div className="grid grid-cols-2 gap-3">
            <Num label="Input tokens / month" value={inTok} set={setInTok} step={100} suffix="M" />
            <Num label="Output tokens / month" value={outTok} set={setOutTok} step={50} suffix="M" />
            <Num label="Input that hits the cache" value={cachedPct} set={setCachedPct} suffix="%" />
            <Num label="Output price" value={priceOut} set={setPriceOut} step={0.1} suffix="$ / M" />
            <Num label="Input price" value={priceIn} set={setPriceIn} step={0.05} suffix="$ / M" />
            <Num label="Cached input price" value={priceCached} set={setPriceCached} step={0.05} suffix="$ / M" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="font-semibold">Dedicated deployment</div>
          <div className="grid grid-cols-2 gap-3">
            <Num label="GPUs running (on average)" value={gpus} set={setGpus} />
            <Num label="Price per GPU-hour" value={gpuHr} set={setGpuHr} step={0.25} suffix="$" />
          </div>
          <Num label="Engineering time to build & run it" value={eng} set={setEng} step={100} suffix="$ / month" />
          <p className="text-xs text-ink-faint">
            How many GPUs you need comes from your own benchmarks at your real batch sizes, traffic pattern and sequence lengths.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        {[
          { key: "api", label: "Per-token API", v: api, color: "var(--memory)" },
          { key: "dedicated", label: "Dedicated (GPUs + engineering)", v: dedicated, color: "var(--accent)" },
        ].map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-52 shrink-0 text-ink-soft">{r.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-bg-soft">
              <div className="h-full rounded transition-all duration-300" style={{ width: `${(r.v / max) * 100}%`, background: r.color }} />
            </div>
            <span className={`w-24 shrink-0 text-right font-medium ${cheaper === r.key ? "text-good" : ""}`}>{money(r.v)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        GPUs alone: <b className="text-ink">{money(gpuCost)}</b> ({gpus} × ${gpuHr}/hr × {HOURS_PER_MONTH} hours). At these numbers the{" "}
        <b className="text-ink">{cheaper === "api" ? "per-token API" : "dedicated deployment"}</b> is cheaper by{" "}
        {money(Math.abs(api - dedicated))} a month.
      </p>
      <p className="mt-2 text-xs text-ink-faint">All prices are made-up placeholders. Plug in your own quotes and at least a week of real usage.</p>
    </Widget>
  );
}
