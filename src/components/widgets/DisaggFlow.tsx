"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

function Box({ title, sub, active, tone }: { title: string; sub: string; active: boolean; tone: "compute" | "memory" | "plain" }) {
  const on = {
    compute: "border-compute bg-compute-soft text-compute",
    memory: "border-memory bg-memory-soft text-memory",
    plain: "border-accent bg-accent-soft text-accent",
  }[tone];
  return (
    <div className={`rounded-xl border-2 px-3 py-3 text-center transition ${active ? on : "border-line text-ink-faint"}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-0.5 text-xs">{sub}</div>
    </div>
  );
}

function Arrow({ active, label }: { active: boolean; label?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-xs ${active ? "text-ink" : "text-ink-faint/50"}`}>
      <span className="text-lg leading-none sm:hidden">↓</span>
      <span className="hidden text-lg leading-none sm:inline">→</span>
      {label && <span className="mt-0.5 whitespace-nowrap">{label}</span>}
    </div>
  );
}

export default function DisaggFlow() {
  const [isl, setIsl] = useState(12000);
  const [cached, setCached] = useState(2000);
  const [threshold, setThreshold] = useState(3000);
  const [conditional, setConditional] = useState(true);

  const cachedTok = Math.min(cached, isl);
  const newTokens = isl - cachedTok;
  const local = conditional && newTokens <= threshold;

  return (
    <Widget title="Follow one request through a disaggregated system" hint="Change the prompt">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>Input length</span><span className="tabular-nums">{isl.toLocaleString("en-US")} tokens</span></div>
          <input type="range" className="w-full" min={200} max={32000} step={200} value={isl} onChange={(e) => setIsl(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Already in the prefix cache</span><span className="tabular-nums">{cachedTok.toLocaleString("en-US")} tokens</span></div>
          <input type="range" className="w-full" min={0} max={32000} step={200} value={cached} onChange={(e) => setCached(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Local prefill threshold</span><span className="tabular-nums">{threshold.toLocaleString("en-US")} new tokens</span></div>
          <input type="range" className="w-full" min={0} max={16000} step={500} value={threshold} disabled={!conditional} onChange={(e) => setThreshold(+e.target.value)} />
        </label>
        <label className="flex items-center gap-2 self-end text-ink-soft">
          <input type="checkbox" checked={conditional} onChange={(e) => setConditional(e.target.checked)} /> Conditional disaggregation
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Box title="Request arrives" sub={`${newTokens.toLocaleString("en-US")} new tokens`} active tone="plain" />
        <Arrow active={!local} label={local ? "" : "send to prefill"} />
        <Box title="Prefill engine" sub="builds KV cache + first token" active={!local} tone="compute" />
        <Arrow active={!local} label={local ? "" : "ship KV cache"} />
        <Box title="Decode engine" sub={local ? "does prefill itself, then decodes" : "writes the rest"} active tone="memory" />
      </div>

      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
        {local ? (
          <>
            <b className="text-memory">Handled locally.</b> Only {newTokens.toLocaleString("en-US")} tokens need prefill, which is at or under
            the threshold, so the decode engine does it itself. No transfer needed.
          </>
        ) : (
          <>
            <b className="text-compute">Disaggregated.</b> {newTokens.toLocaleString("en-US")} new tokens is a big prefill job, so it goes to a
            dedicated prefill engine and the KV cache is shipped over to decode.
            {!conditional && " (Without conditional mode, every request takes this path, even tiny ones.)"}
          </>
        )}
      </div>
    </Widget>
  );
}
