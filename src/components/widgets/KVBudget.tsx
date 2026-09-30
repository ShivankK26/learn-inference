"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Architecture numbers from each model’s published config.json
const models = [
  { name: "Llama 3.1 8B", layers: 32, kvHeads: 8, qHeads: 32, headDim: 128 },
  { name: "Llama 3.1 70B", layers: 80, kvHeads: 8, qHeads: 64, headDim: 128 },
  { name: "Qwen3-235B-A22B", layers: 94, kvHeads: 4, qHeads: 64, headDim: 128 },
];
const precisions = [
  { name: "FP16 / BF16", bytes: 2 },
  { name: "FP8", bytes: 1 },
];
const contexts = [4_000, 32_000, 128_000];

function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(b >= 1e10 ? 0 : 1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(b >= 1e7 ? 0 : 1)} MB`;
  return `${Math.round(b / 1e3)} KB`;
}

function Pills({ items, value, set }: { items: string[]; value: number; set: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <button
          key={it}
          onClick={() => set(i)}
          className={`rounded-lg border px-2.5 py-1 text-sm ${value === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export default function KVBudget() {
  const [m, setM] = useState(1);
  const [p, setP] = useState(0);
  const [c, setC] = useState(0);
  const [gqa, setGqa] = useState(true);
  const [budget, setBudget] = useState(64);

  const model = models[m];
  const heads = gqa ? model.kvHeads : model.qHeads;
  const perToken = 2 * model.layers * heads * model.headDim * precisions[p].bytes;
  const perRequest = perToken * contexts[c];
  const tokensFit = Math.floor((budget * 1e9) / perToken);
  const requestsFit = Math.floor((budget * 1e9) / perRequest);

  return (
    <Widget title="How much fits in your KV cache budget?" hint="Pick a model, precision and request size">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Model</div>
          <Pills items={models.map((x) => x.name)} value={m} set={setM} />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">KV cache precision</div>
          <Pills items={precisions.map((x) => x.name)} value={p} set={setP} />
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-soft">Tokens per request</div>
          <Pills items={contexts.map((x) => `${x / 1000}K`)} value={c} set={setC} />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={gqa} onChange={(e) => setGqa(e.target.checked)} />
        Grouped-query attention ({model.kvHeads} KV heads). Untick to give each of the {model.qHeads} query heads its own KV head.
      </label>

      <label className="mt-4 block text-sm">
        <div className="flex justify-between">
          <span>KV cache budget</span>
          <span className="tabular-nums">{budget} GB</span>
        </div>
        <input type="range" className="w-full" min={8} max={640} step={8} value={budget} onChange={(e) => setBudget(+e.target.value)} />
        <div className="text-xs text-ink-faint">The book’s B200 example leaves 64 GB for the KV cache.</div>
      </label>

      <div className="mt-5 rounded-xl bg-bg-soft p-4 text-sm">
        <div className="text-ink-faint">Bytes per token = 2 (K and V) × layers × KV heads × head size × bytes per value</div>
        <div className="mt-1 text-[15px] tabular-nums">
          2 × {model.layers} × {heads} × {model.headDim} × {precisions[p].bytes} ={" "}
          <b className="text-memory">{(perToken / 1024).toLocaleString("en-US")} KiB</b> per token
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">One {contexts[c] / 1000}K-token request</div>
          <div className="text-lg tabular-nums text-memory">{fmtBytes(perRequest)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens that fit in {budget} GB</div>
          <div className="text-lg tabular-nums">{tokensFit.toLocaleString("en-US")}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">{contexts[c] / 1000}K-token requests that fit</div>
          <div className={`text-lg tabular-nums ${requestsFit < 2 ? "text-bad" : "text-accent"}`}>{requestsFit.toLocaleString("en-US")}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Counts only the KV cache itself. Engines store it in fixed-size blocks and keep some memory for bookkeeping, so
        real capacity is slightly lower.
      </p>
    </Widget>
  );
}
