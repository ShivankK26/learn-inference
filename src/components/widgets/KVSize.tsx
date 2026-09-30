"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Published architecture numbers (from each model’s config.json)
const models = [
  { name: "Llama 3 8B", layers: 32, kvHeads: 8, headDim: 128, paramsB: 8 },
  { name: "Llama 3 70B", layers: 80, kvHeads: 8, headDim: 128, paramsB: 70 },
  { name: "Qwen3-235B-A22B", layers: 94, kvHeads: 4, headDim: 128, paramsB: 235 },
];
const precisions = [
  { name: "FP16", bytes: 2 },
  { name: "FP8", bytes: 1 },
];
const contexts = [1000, 4000, 8000, 32000, 128000];

function gb(bytes: number) {
  const g = bytes / 1e9;
  return g >= 100 ? g.toFixed(0) : g >= 10 ? g.toFixed(1) : g.toFixed(2);
}

export default function KVSize() {
  const [m, setM] = useState(0);
  const [p, setP] = useState(0);
  const [ci, setCi] = useState(2);
  const [users, setUsers] = useState(16);
  const model = models[m];
  const prec = precisions[p];
  const ctx = contexts[ci];

  const perToken = 2 * model.layers * model.kvHeads * model.headDim * prec.bytes;
  const perUser = perToken * ctx;
  const total = perUser * users;
  const weights = model.paramsB * 1e9 * 2; // weights kept in FP16 for comparison
  const ratio = total / weights;

  return (
    <Widget title="How big does the KV cache get?" hint="Pick a model and a workload">
      <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
        <div>
          <div className="mb-1.5 font-medium text-ink-soft">Model</div>
          <div className="flex flex-wrap gap-1.5">
            {models.map((x, i) => (
              <button key={x.name} onClick={() => setM(i)} className={`rounded-lg border px-2.5 py-1 ${m === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}>
                {x.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 font-medium text-ink-soft">KV cache precision</div>
          <div className="flex gap-1.5">
            {precisions.map((x, i) => (
              <button key={x.name} onClick={() => setP(i)} className={`rounded-lg border px-2.5 py-1 ${p === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}>
                {x.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>Tokens per conversation</span><span>{ctx.toLocaleString("en-US")}</span></div>
          <input type="range" className="w-full" min={0} max={contexts.length - 1} value={ci} onChange={(e) => setCi(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Users served at once</span><span>{users}</span></div>
          <input type="range" className="w-full" min={1} max={64} value={users} onChange={(e) => setUsers(+e.target.value)} />
        </label>
      </div>

      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
        <div className="text-ink-soft">Bytes per token</div>
        <div className="mt-1">
          2 (K and V) × {model.layers} layers × {model.kvHeads} KV heads × {model.headDim} dims × {prec.bytes} byte{prec.bytes > 1 ? "s" : ""} ={" "}
          <b className="text-memory">{(perToken / 1024).toLocaleString("en-US")} KiB</b>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">One conversation</div>
          <div className="text-lg text-memory">{gb(perUser)} GB</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">All {users} users</div>
          <div className="text-lg text-memory">{gb(total)} GB</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">vs. FP16 weights ({gb(weights)} GB)</div>
          <div className={`text-lg ${ratio >= 1 ? "text-bad" : "text-ink"}`}>{ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(2)}×</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Layer and head counts are each model’s published configuration. Real engines add some overhead (memory is reserved in
        pages), so treat these as lower bounds.
      </p>
    </Widget>
  );
}
