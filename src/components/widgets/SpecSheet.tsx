"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// FP8 dense figures and bandwidth are from the book's spec tables. Other precisions and the
// sparse numbers are derived with the book's two rules: FLOPS double with each halving of
// precision, and 2:4 sparsity "often, but not always" doubles the number again.
const gpus = [
  { name: "L4", fp8: 242, tbps: 0.3, fp4: false },
  { name: "H100", fp8: 1979, tbps: 3.35, fp4: false },
  { name: "H200", fp8: 1979, tbps: 4.8, fp4: false },
  { name: "B200", fp8: 5000, tbps: 8, fp4: true },
];
const precisions = [
  { name: "FP16", mult: 0.5 },
  { name: "FP8", mult: 1 },
  { name: "FP4", mult: 2 },
];

function fmt(tflops: number) {
  if (tflops >= 4000) return `${(tflops / 1000).toFixed(tflops >= 10000 ? 0 : 1)} petaFLOPS`;
  return `${Math.round(tflops).toLocaleString("en-US")} teraFLOPS`;
}

export default function SpecSheet() {
  const [g, setG] = useState(1);
  const [p, setP] = useState(1);
  const [sparse, setSparse] = useState(true);
  const [workload, setWorkload] = useState(0); // index into precisions: what your model actually runs in

  const gpu = gpus[g];
  const prec = precisions[p];
  const supported = prec.name !== "FP4" || gpu.fp4;
  const shown = gpu.fp8 * prec.mult * (sparse ? 2 : 1);
  const dense = gpu.fp8 * prec.mult;
  const opsPerByte = (dense * 1e12) / (gpu.tbps * 1e12);
  const honest = !sparse && p === workload;

  return (
    <Widget title="Decode a spec sheet’s headline number" hint="Change the settings, watch the number move">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-ink-soft">GPU</span>
            {gpus.map((x, i) => (
              <button key={x.name} onClick={() => setG(i)} className={`rounded-lg border px-2.5 py-1 ${g === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
                {x.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-ink-soft">Precision row</span>
            {precisions.map((x, i) => (
              <button key={x.name} onClick={() => setP(i)} className={`rounded-lg border px-2.5 py-1 ${p === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
                {x.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sparse} onChange={(e) => setSparse(e.target.checked)} />
            Number quoted “with sparsity”
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-24 text-ink-soft">Your model runs in</span>
            {precisions.map((x, i) => (
              <button key={x.name} onClick={() => setWorkload(i)} className={`rounded-lg border px-2.5 py-1 ${workload === i ? "border-compute bg-compute-soft font-medium text-compute" : "border-line"}`}>
                {x.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-bg-soft p-4">
          <div className="text-xs text-ink-faint">
            {gpu.name} · {prec.name} Tensor Core compute{sparse ? " · with sparsity" : " · dense"}
          </div>
          {supported ? (
            <>
              <div className="mt-1 text-3xl font-semibold text-compute">{fmt(shown)}</div>
              <div className="mt-3 space-y-1 text-[13px] text-ink-soft">
                <div>FP8 dense (book’s table): {fmt(gpu.fp8)}</div>
                <div>× {prec.mult} for {prec.name} (FLOPS double as precision halves)</div>
                {sparse && <div>× 2 for 2:4 sparsity (half the values assumed zero)</div>}
              </div>
            </>
          ) : (
            <div className="mt-2 text-ink-soft">{gpu.name} has no FP4 Tensor Cores. FP4 arrived with Blackwell.</div>
          )}
        </div>
      </div>

      {supported && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${honest ? "border-good/40 bg-good-soft" : "border-bad/40 bg-bad-soft"}`}>
          {honest ? (
            <>✓ This is the number to plan with: dense, at the precision your model actually runs in.</>
          ) : (
            <>
              ✕ Not the number to plan with.
              {sparse && " Inference is dense by default, so drop the sparsity doubling."}
              {p !== workload && ` Your model runs in ${precisions[workload].name}, so read the ${precisions[workload].name} row.`}
            </>
          )}
        </div>
      )}

      {supported && (
        <p className="mt-3 text-sm text-ink-soft">
          Dense {prec.name} ops:byte ratio for the {gpu.name}:{" "}
          <b className="text-ink">
            {fmt(dense)} ÷ {gpu.tbps >= 1 ? `${gpu.tbps} TB/s` : `${gpu.tbps * 1000} GB/s`} ≈ {Math.round(opsPerByte)}
          </b>{" "}
          operations per byte. Work with lower arithmetic intensity than that is memory-bound on this GPU.
        </p>
      )}
      <p className="mt-2 text-xs text-ink-faint">
        FP16 and FP4 figures are derived from the book’s FP8 numbers with its halving rule, so official sheets can differ a
        little (the rule is “generally”, not exactly, true).
      </p>
    </Widget>
  );
}
