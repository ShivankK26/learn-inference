"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

function Slider({ label, value, set, min, max, step = 0.1 }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(1)}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );
}

export default function Neuron() {
  const [x, setX] = useState(2);
  const [w, setW] = useState(1.5);
  const [b, setB] = useState(-1);
  const [relu, setRelu] = useState(true);
  const raw = x * w + b;
  const out = relu ? Math.max(0, raw) : raw;

  return (
    <Widget title="One neuron, up close" hint="Drag the sliders">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Input (x)" value={x} set={setX} min={-3} max={3} />
          <Slider label="Weight (w), learned in training" value={w} set={setW} min={-3} max={3} />
          <Slider label="Bias (b), learned in training" value={b} set={setB} min={-3} max={3} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
            Apply ReLU (turn negatives into 0)
          </label>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-bg-soft p-5 font-mono text-[13px]">
          <div className="text-ink-soft">x × w + b</div>
          <div className="mt-1 text-lg">
            {x.toFixed(1)} × {w.toFixed(1)} + {b.toFixed(1)} = <span className="text-compute">{raw.toFixed(2)}</span>
          </div>
          {relu && (
            <>
              <div className="mt-4 text-ink-soft">ReLU(result)</div>
              <div className="mt-1 text-lg">
                max(0, {raw.toFixed(2)}) = <span className="text-accent">{out.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, Math.max(0, (out + 10) * 5))}%` }} />
          </div>
          <div className="mt-2 font-sans text-xs text-ink-faint">
            That’s all one neuron does. A big model does this billions of times per word.
          </div>
        </div>
      </div>
    </Widget>
  );
}
