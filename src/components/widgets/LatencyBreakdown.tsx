"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

function Slider({ label, value, set, min, max, step, unit }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; unit: string }) {
  return (
    <label className="block">
      <div className="flex justify-between"><span>{label}</span><span className="tabular-nums">{value.toLocaleString("en-US")} {unit}</span></div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );
}

export default function LatencyBreakdown() {
  const [network, setNetwork] = useState(80);
  const [queue, setQueue] = useState(0);
  const [ttft, setTtft] = useState(250);
  const [itl, setItl] = useState(15);
  const [tokens, setTokens] = useState(300);

  const decode = (tokens - 1) * itl;
  const inference = ttft + decode;
  const e2e = network + queue + inference;
  const e2eFirst = network + queue + ttft;
  const tps = 1000 / itl;
  const parts = [
    { k: "Network", v: network, cls: "bg-ink-faint" },
    { k: "Queue", v: queue, cls: "bg-bad" },
    { k: "Time to first token", v: ttft, cls: "bg-compute" },
    { k: "Decode", v: decode, cls: "bg-memory" },
  ];
  const infraShare = (network + queue) / e2eFirst;

  return (
    <Widget title="Where does the time actually go?" hint="One streamed chat response">
      <div className="flex h-10 overflow-hidden rounded-lg border border-line">
        {parts.map((p) =>
          p.v > 0 ? (
            <div key={p.k} className={`${p.cls} transition-all duration-200`} style={{ width: `${((p.v / e2e) * 100).toFixed(2)}%` }} title={`${p.k}: ${Math.round(p.v)} ms`} />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        {parts.map((p) => (
          <span key={p.k} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${p.cls}`} /> {p.k} <span className="tabular-nums text-ink-faint">{Math.round(p.v).toLocaleString("en-US")} ms</span>
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <Slider label="Network round trip" value={network} set={setNetwork} min={10} max={400} step={10} unit="ms" />
        <Slider label="Waiting in a queue" value={queue} set={setQueue} min={0} max={3000} step={50} unit="ms" />
        <Slider label="Time to first token (on the GPU)" value={ttft} set={setTtft} min={50} max={2000} step={25} unit="ms" />
        <Slider label="Inter-token latency (ITL)" value={itl} set={setItl} min={5} max={60} step={1} unit="ms" />
        <Slider label="Tokens in the answer" value={tokens} set={setTokens} min={10} max={1500} step={10} unit="" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Perceived TPS</div>
          <div className="text-lg tabular-nums text-memory">{tps.toFixed(0)}</div>
          <div className="text-[11px] text-ink-faint">1000 ms ÷ {itl} ms ITL</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">First token, GPU only</div>
          <div className="text-lg tabular-nums text-compute">{ttft.toLocaleString("en-US")} ms</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">First token, as the user sees it</div>
          <div className="text-lg tabular-nums">{e2eFirst.toLocaleString("en-US")} ms</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Whole answer, end to end</div>
          <div className="text-lg tabular-nums text-accent">{(e2e / 1000).toFixed(2)} s</div>
        </div>
      </div>
      <p className={`mt-3 text-sm ${infraShare > 0.5 ? "text-bad" : "text-ink-soft"}`}>
        {infraShare > 0.5
          ? `Over half the wait before the first token (${Math.round(infraShare * 100)}%) is network and queueing, not the model. Speeding up the GPU won’t fix this; look at your infrastructure.`
          : `Most of the wait before the first token is the model itself, so model performance work (Chapters 2–5) will pay off.`}
      </p>
    </Widget>
  );
}
