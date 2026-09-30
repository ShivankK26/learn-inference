"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const LAYERS = 12;
const COLS = 25; // each column = 2 of 50 denoising steps

export default function SelectiveQuant() {
  const [byStep, setByStep] = useState(true);
  const [byLayer, setByLayer] = useState(true);

  let fp8 = 0;
  const cells = [];
  for (let l = 0; l < LAYERS; l++)
    for (let c = 0; c < COLS; c++) {
      const early = byStep && c < 5; // first 10 of 50 steps
      const edge = byLayer && (l === 0 || l === LAYERS - 1);
      const high = early || edge;
      if (!high) fp8++;
      cells.push(
        <div key={`${l}-${c}`} className={`aspect-square rounded-[2px] ${high ? "bg-memory" : "bg-compute"}`} style={{ opacity: high ? 0.85 : 0.7 }} />
      );
    }
  const share = fp8 / (LAYERS * COLS);
  const speedup = 1 / (1 - share + share / 2); // FP8 Tensor Cores ≈ 2× the FLOPS

  return (
    <Widget title="Quantize only where it’s safe" hint="Toggle the two rules">
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={byStep} onChange={(e) => setByStep(e.target.checked)} /> Keep early steps in FP16
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={byLayer} onChange={(e) => setByLayer(e.target.checked)} /> Keep first and last layers in FP16
        </label>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-right text-[11px] text-ink-faint">
          <span>first layer</span>
          <span>last layer</span>
        </div>
        <div className="grid flex-1 gap-[2px]" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {cells}
        </div>
      </div>
      <div className="mt-1 flex justify-between pl-16 text-[11px] text-ink-faint">
        <span>step 1</span>
        <span>denoising steps →</span>
        <span>step 50</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-memory" /> FP16 (precise)</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-compute" /> FP8 (2× the FLOPS)</span>
        <span className="ml-auto tabular-nums text-ink-soft">
          {Math.round(share * 100)}% of attention in FP8 · about <b className="text-accent">{speedup.toFixed(2)}×</b> faster attention
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {byStep || byLayer
          ? "You give up a little speed to protect the parts that matter most: the early steps that fix the composition, and the layers that take the input and produce the output."
          : "Quantizing everything is fastest, but it’s the riskiest for quality. Errors in the early steps and edge layers carry through the whole video."}
      </p>
      <p className="mt-2 text-xs text-ink-faint">Illustrative model: assumes FP8 doubles attention speed and ignores overheads.</p>
    </Widget>
  );
}
