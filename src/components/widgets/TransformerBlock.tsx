"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Shapes and parameter counts use Llama 3 8B’s published config:
// hidden size 4,096; 32 query heads, 8 KV heads, head dim 128; FFN hidden size 14,336; 32 layers.
type Part = {
  key: string;
  label: string;
  shape: string;
  params: string;
  kind: "io" | "norm" | "attn" | "ffn" | "add";
  what: string;
};

const parts: Part[] = [
  {
    key: "in",
    label: "Input hidden states",
    shape: "N × 4,096",
    params: "–",
    kind: "io",
    what: "One 4,096-number vector per token: the embedding for the first block, or the previous block’s output for every later block.",
  },
  {
    key: "norm1",
    label: "Normalization",
    shape: "N × 4,096",
    params: "4,096",
    kind: "norm",
    what: "Rescales each token’s vector to a steady size so numbers don’t drift out of range as they pass through dozens of blocks. Tiny in weight terms.",
  },
  {
    key: "attn",
    label: "Multi-head attention",
    shape: "N × 4,096 → N × 4,096",
    params: "≈ 41.9 million",
    kind: "attn",
    what: "Three weight matrices turn each token into a query, key, and value. 32 heads each compare queries against keys (softmax(QKᵀ/√d)) and blend the values; an output matrix merges the heads. Q and output matrices are 4,096 × 4,096; K and V are 4,096 × 1,024 because this model shares 8 KV heads across its 32 query heads.",
  },
  {
    key: "add1",
    label: "Add (residual)",
    shape: "N × 4,096",
    params: "–",
    kind: "add",
    what: "The attention output is added back onto the block’s input rather than replacing it. Each block makes an adjustment on top of what came before.",
  },
  {
    key: "norm2",
    label: "Normalization",
    shape: "N × 4,096",
    params: "4,096",
    kind: "norm",
    what: "Same idea as before, ahead of the feed-forward network.",
  },
  {
    key: "ffn",
    label: "Feed-forward network (MLP)",
    shape: "4,096 → 14,336 → 4,096",
    params: "≈ 176.2 million",
    kind: "ffn",
    what: "Each token on its own is widened to 14,336 numbers, passed through an activation function (SwiGLU, which uses two ‘up’ matrices), and squeezed back to 4,096. Three matrices of 4,096 × 14,336: the biggest chunk of the model’s weights.",
  },
  {
    key: "add2",
    label: "Add (residual)",
    shape: "N × 4,096",
    params: "–",
    kind: "add",
    what: "The feed-forward output is added back on, and the result goes to the next block.",
  },
  {
    key: "out",
    label: "Output hidden states",
    shape: "N × 4,096",
    params: "–",
    kind: "io",
    what: "Exactly the same shape as the input, which is why identical blocks can be stacked: Llama 3 8B has 32 of them.",
  },
];

const style: Record<Part["kind"], string> = {
  io: "border-line bg-bg-soft",
  norm: "border-line bg-card",
  attn: "border-memory/50 bg-memory-soft",
  ffn: "border-compute/50 bg-compute-soft",
  add: "border-dashed border-line bg-card",
};

export default function TransformerBlock() {
  const [sel, setSel] = useState("attn");
  const p = parts.find((x) => x.key === sel)!;
  return (
    <Widget title="Inside one transformer block" hint="Click each step">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
        <div className="flex flex-col items-stretch gap-1">
          {parts.map((x, i) => (
            <div key={x.key} className="flex flex-col items-center">
              <button
                onClick={() => setSel(x.key)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${style[x.kind]} ${sel === x.key ? "ring-2 ring-accent" : ""}`}
              >
                <div className="font-medium">{x.label}</div>
                <div className="text-xs text-ink-faint">{x.shape}</div>
              </button>
              {i < parts.length - 1 && <div className="h-2 w-px bg-ink-faint" />}
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-bg-soft p-5">
          <div className="font-serif text-xl font-semibold">{p.label}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-line bg-card p-3">
              <div className="text-xs text-ink-faint">Shape</div>
              <div>{p.shape}</div>
            </div>
            <div className="rounded-lg border border-line bg-card p-3">
              <div className="text-xs text-ink-faint">Weights (per block)</div>
              <div>{p.params}</div>
            </div>
          </div>
          <p className="mt-3 text-[0.95rem] leading-relaxed">{p.what}</p>
          <p className="mt-4 text-xs text-ink-faint">
            N = number of tokens being processed. Numbers from Llama 3 8B’s config. The 2017 paper put normalization after
            each sublayer; most modern LLMs put it before, as shown here.
          </p>
        </div>
      </div>
    </Widget>
  );
}
