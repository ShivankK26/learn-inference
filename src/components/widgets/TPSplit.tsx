"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const colors = ["bg-compute", "bg-memory", "bg-accent", "bg-good"];
const soft = ["bg-compute-soft", "bg-memory-soft", "bg-accent-soft", "bg-good-soft"];

function Matrix({ label, cols, rows, split, n, sub }: { label: string; cols: number; rows: number; split: "col" | "row"; n: number; sub: string }) {
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const owner = split === "col" ? Math.floor((c * n) / cols) : Math.floor((r * n) / rows);
      cells.push(<div key={`${r}-${c}`} className={`aspect-square rounded-[2px] ${colors[owner]} opacity-80`} />);
    }
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-[13px] font-medium">{label}</div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells}
      </div>
      <div className="mt-1 text-xs text-ink-faint">{sub}</div>
    </div>
  );
}

export default function TPSplit() {
  const [n, setN] = useState(2);
  const [part, setPart] = useState<"mlp" | "attn">("mlp");

  return (
    <Widget title="Where tensor parallelism cuts a layer" hint="Pick a part of the layer and a GPU count">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {(["mlp", "attn"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPart(p)}
            className={`rounded-lg border px-3 py-1.5 ${part === p ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {p === "mlp" ? "Feed-forward (MLP)" : "Attention"}
          </button>
        ))}
        <span className="ml-2 text-ink-faint">GPUs:</span>
        {[2, 4].map((k) => (
          <button
            key={k}
            onClick={() => setN(k)}
            className={`rounded-lg border px-3 py-1.5 ${n === k ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            TP{k}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Matrix
          label={part === "mlp" ? "1 · Up projection" : "1 · Q, K, V projections"}
          cols={16}
          rows={8}
          split="col"
          n={n}
          sub={part === "mlp" ? "Split by columns: each GPU makes its own slice of the hidden units. No talking needed." : "Split by heads: each GPU owns whole attention heads and their share of the KV cache."}
        />
        <div className="self-center text-lg text-ink-faint">→</div>
        <Matrix
          label={part === "mlp" ? "2 · Down projection" : "2 · Output projection"}
          cols={8}
          rows={16}
          split="row"
          n={n}
          sub="Split by rows: each GPU produces a partial version of the full output."
        />
        <div className="self-center text-lg text-ink-faint">→</div>
        <div className="min-w-0 flex-1 sm:max-w-[9rem]">
          <div className="mb-1 text-[13px] font-medium">3 · All-reduce</div>
          <div className="flex flex-col gap-1">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className={`rounded px-2 py-1 text-xs ${soft[i]}`}>
                GPU {i + 1}: partial
              </div>
            ))}
            <div className="text-center text-xs text-ink-faint">sum ↓ shared with all</div>
            <div className="rounded bg-ink px-2 py-1 text-center text-xs text-bg">Full output on every GPU</div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        Each GPU stores and reads only 1/{n} of this layer’s weights, which is why TP speeds up memory-bound decode. The
        price is one all-reduce after the attention block and one after the MLP: <b>two per layer</b>, every forward
        pass, before the next layer can start.
      </p>
    </Widget>
  );
}
