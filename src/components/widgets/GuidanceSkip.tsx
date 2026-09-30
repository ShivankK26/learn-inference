"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

export default function GuidanceSkip() {
  const [steps, setSteps] = useState(50);
  const [guided, setGuided] = useState(50);
  const g = Math.min(guided, steps);
  const passes = g * 2 + (steps - g);
  const full = steps * 2;
  const saved = Math.round((1 - passes / full) * 100);

  return (
    <Widget title="Turn off guidance partway through" hint="Drag the second slider">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between"><span>Denoising steps</span><span className="tabular-nums">{steps}</span></div>
          <input type="range" className="w-full" min={20} max={50} value={steps} onChange={(e) => setSteps(+e.target.value)} />
        </label>
        <label className="block">
          <div className="flex justify-between"><span>Use prompt guidance for the first</span><span className="tabular-nums">{g} steps</span></div>
          <input type="range" className="w-full" min={0} max={steps} value={g} onChange={(e) => setGuided(+e.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex gap-[2px]">
        {Array.from({ length: steps }, (_, i) => (
          <div key={i} className="flex flex-1 flex-col gap-[2px]" title={`Step ${i + 1}: ${i < g ? "2 passes" : "1 pass"}`}>
            <div className="h-4 rounded-[2px] bg-compute" />
            <div className={`h-4 rounded-[2px] ${i < g ? "bg-compute" : "bg-bg-soft"}`} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-faint">
        <span>Step 1: rough outline</span>
        <span>Step {steps}: fine details</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Passes through the model</div>
          <div className="text-lg tabular-nums text-compute">{passes}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">With guidance everywhere</div>
          <div className="text-lg tabular-nums">{full}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Work saved</div>
          <div className="text-lg font-semibold tabular-nums text-accent">{saved}%</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {g === 0
          ? "No guidance at all: fast, but the image may ignore your prompt, since the early steps that decide the composition got no guidance."
          : g >= steps
            ? "Every step runs twice, once with the prompt and once without. Try switching guidance off for the last 20 steps."
            : g < steps * 0.3
              ? "Careful: switching off this early can hurt prompt adherence. The outline may not be settled yet."
              : "The outline is settled early, so the later steps are only adding detail and don’t need the prompt-guided pass."}
      </p>
    </Widget>
  );
}
