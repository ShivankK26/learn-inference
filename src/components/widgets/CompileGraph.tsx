"use client";

import { useState, type ReactNode } from "react";
import { Widget } from "../Blocks";

// A toy forward pass. kind: "gemm" = library matmul kernel, "point" = small elementwise op,
// "plugin" = a handwritten plugin kernel (like FlashAttention) that torch.compile can’t fuse into.
type Op = { name: string; kind: "gemm" | "point" | "plugin" | "python" };

const BASE: Op[] = [
  { name: "matmul (x @ W)", kind: "gemm" },
  { name: "+ bias", kind: "point" },
  { name: "GELU", kind: "point" },
  { name: "× scale", kind: "point" },
  { name: "FlashAttention", kind: "plugin" },
  { name: "+ residual", kind: "point" },
  { name: "norm", kind: "point" },
  { name: "matmul (h @ W2)", kind: "gemm" },
];

type Group = { ops: Op[]; fused: boolean; kind: Op["kind"] };

function plan(ops: Op[], compiled: boolean): Group[] {
  if (!compiled) return ops.filter((o) => o.kind !== "python").map((o) => ({ ops: [o], fused: false, kind: o.kind }));
  const groups: Group[] = [];
  let run: Op[] = [];
  const flush = () => {
    if (run.length) groups.push({ ops: run, fused: run.length > 1, kind: "point" });
    run = [];
  };
  for (const o of ops) {
    if (o.kind === "point") run.push(o);
    else {
      flush(); // a matmul, plugin, or graph break ends the fusable run
      if (o.kind !== "python") groups.push({ ops: [o], fused: false, kind: o.kind });
    }
  }
  flush();
  return groups;
}

const color = {
  gemm: "border-compute/50 bg-compute-soft text-compute",
  point: "border-memory/50 bg-memory-soft text-memory",
  plugin: "border-accent/50 bg-accent-soft text-accent",
  python: "",
};

export default function CompileGraph() {
  const [compiled, setCompiled] = useState(false);
  const [graphBreak, setGraphBreak] = useState(false);

  const ops: Op[] = graphBreak ? [...BASE.slice(0, 2), { name: "print(x.sum().item())", kind: "python" }, ...BASE.slice(2)] : BASE;
  const groups = plan(ops, compiled);
  const launches = groups.length;
  // every separate elementwise kernel reads and writes the whole activation once
  const pointPasses = groups.filter((g) => g.kind === "point").length * 2;
  const graphs = compiled ? (graphBreak ? 2 : 1) : 0;

  return (
    <Widget title="What torch.compile actually changes" hint="Toggle compile and the graph break">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => setCompiled(false)}
          className={`rounded-lg border px-3 py-1.5 ${!compiled ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}
        >
          Eager PyTorch
        </button>
        <button
          onClick={() => setCompiled(true)}
          className={`rounded-lg border px-3 py-1.5 ${compiled ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}
        >
          torch.compile
        </button>
        <label className="ml-auto flex items-center gap-2">
          <input type="checkbox" checked={graphBreak} onChange={(e) => setGraphBreak(e.target.checked)} />
          Add a Python-only line (causes a graph break)
        </label>
      </div>

      <div className="flex flex-wrap items-stretch gap-1.5">
        {(() => {
          // render groups, inserting the python op where it sits
          const out: ReactNode[] = [];
          let gi = 0;
          let consumed = 0;
          for (let idx = 0; idx < ops.length; idx++) {
            const o = ops[idx];
            if (o.kind === "python") {
              out.push(
                <div key={`py${idx}`} className="flex items-center rounded-lg border border-dashed border-bad/60 bg-bad-soft px-2 py-1.5 text-xs text-bad">
                  <span className="font-mono">{o.name}</span>
                  {compiled && <span className="ml-1.5 font-semibold">graph break</span>}
                </div>
              );
              continue;
            }
            const g = groups[gi];
            if (!g) continue;
            if (consumed === 0) {
              out.push(
                <div key={`g${gi}`} className={`rounded-lg border px-2.5 py-1.5 text-xs ${color[g.kind]} ${g.fused ? "ring-2 ring-memory/40" : ""}`}>
                  {g.fused && <div className="mb-0.5 text-[10px] font-semibold">1 fused kernel</div>}
                  {g.ops.map((x) => x.name).join(" → ")}
                  {g.kind === "plugin" && <div className="mt-0.5 text-[10px]">plugin: left as-is</div>}
                </div>
              );
            }
            consumed++;
            if (consumed === g.ops.length) {
              gi++;
              consumed = 0;
            }
          }
          return out;
        })()}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">GPU kernel launches</div>
          <div className="text-lg tabular-nums">{launches}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Full passes over memory by small ops</div>
          <div className="text-lg tabular-nums text-memory">{pointPasses}</div>
          <div className="text-[11px] text-ink-faint">each separate small kernel reads and writes the whole tensor</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Compiled graphs</div>
          <div className="text-lg tabular-nums">{compiled ? graphs : "none (eager)"}</div>
          <div className="text-[11px] text-ink-faint">{graphBreak && compiled ? "the break splits the model in two" : " "}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-compute-soft ring-1 ring-compute/50" /> library matmul (cuBLAS)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-memory-soft ring-1 ring-memory/50" /> small elementwise op (memory-bound)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-accent-soft ring-1 ring-accent/50" /> plugin kernel (torch.compile can’t fuse it)</span>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        A toy model to show the idea. Real compilers make more complicated decisions (and can sometimes fuse small ops into a
        matmul’s final step), but the pattern holds: runs of small ops merge, and plugins and graph breaks act as walls.
      </p>
    </Widget>
  );
}
