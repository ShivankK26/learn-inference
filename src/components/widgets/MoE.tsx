"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const tokens = ["The", "patient", "should", "take", "200", "mg", "of", "ibuprofen", "daily", "."];
const EXPERTS = 8;

// deterministic "router" choices per token (illustrative only)
function route(t: string, layer: number): number[] {
  let h = layer * 97;
  for (const c of t) h = (h * 131 + c.charCodeAt(0)) % 10007;
  const a = h % EXPERTS;
  let b = (Math.floor(h / EXPERTS) + 3) % EXPERTS;
  if (b === a) b = (a + 1) % EXPERTS;
  return [a, b];
}

export default function MoE() {
  const [i, setI] = useState(0);
  const [batch, setBatch] = useState(false);
  const layers = [0, 1, 2];
  const active = new Set<string>();
  const shown = batch ? tokens : [tokens[i]];
  for (const t of shown) for (const l of layers) for (const e of route(t, l)) active.add(`${l}-${e}`);
  const pct = Math.round((active.size / (layers.length * EXPERTS)) * 100);

  return (
    <Widget title="Mixture of Experts: only a few experts wake up" hint="Step through tokens">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tokens.map((t, k) => (
          <button
            key={k}
            onClick={() => { setBatch(false); setI(k); }}
            className={`rounded-md border px-2 py-0.5 tabular-nums text-sm ${!batch && k === i ? "border-accent bg-accent-soft text-accent" : "border-line"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {layers.map((l) => (
          <div key={l} className="flex items-center gap-2">
            <span className="w-14 shrink-0 tabular-nums text-xs text-ink-faint">layer {l + 1}</span>
            <span className="shrink-0 rounded bg-bg-soft px-2 py-1 text-xs text-ink-soft">router →</span>
            <div className="grid flex-1 grid-cols-8 gap-1.5">
              {Array.from({ length: EXPERTS }, (_, e) => {
                const on = active.has(`${l}-${e}`);
                return (
                  <div
                    key={e}
                    className={`flex h-9 items-center justify-center rounded-md text-xs tabular-nums transition ${on ? "bg-compute text-bg" : "bg-bg-soft text-ink-faint"}`}
                  >
                    E{e + 1}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-ink-soft">
          {batch ? (
            <>A whole <b className="text-ink">batch</b> of tokens together wakes up <b className="text-compute">{pct}%</b> of the experts. Most of the model is busy again.</>
          ) : (
            <>This token only uses <b className="text-compute">{pct}%</b> of the experts. The rest of the model sits idle.</>
          )}
        </span>
        <div className="flex gap-2">
          <button onClick={() => { setBatch(false); setI((i + 1) % tokens.length); }} className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">
            Next token
          </button>
          <button onClick={() => setBatch((b) => !b)} className={`rounded-lg px-3 py-1.5 font-medium ${batch ? "bg-accent text-bg" : "border border-line hover:border-accent"}`}>
            {batch ? "Back to one token" : "Show whole batch"}
          </button>
        </div>
      </div>
    </Widget>
  );
}
