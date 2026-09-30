"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const teacher: [string, number][] = [
  ["sunny", 0.46],
  ["cloudy", 0.24],
  ["rainy", 0.14],
  ["warm", 0.1],
  ["windy", 0.06],
];

export default function DistillCompare() {
  const [mode, setMode] = useState<"finetune" | "distill">("finetune");
  const shown = teacher.map(([w, p], i) => [w, mode === "distill" ? p : i === 0 ? 1 : 0] as [string, number]);
  return (
    <Widget title="What does the small model learn from?" hint="Switch between the two">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button onClick={() => setMode("finetune")} className={`rounded-lg border px-3 py-1.5 ${mode === "finetune" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Fine-tuning on answers
        </button>
        <button onClick={() => setMode("distill")} className={`rounded-lg border px-3 py-1.5 ${mode === "distill" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Distillation from a teacher
        </button>
      </div>
      <div className="mb-3 font-serif text-lg">“The weather today is ___”</div>
      <div className="space-y-1.5">
        {shown.map(([w, p]) => (
          <div key={w} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-right">{w}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-bg-soft">
              <div className="h-full rounded bg-accent transition-all duration-300" style={{ width: `${(p * 100).toFixed(1)}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums">{Math.round(p * 100)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        {mode === "finetune"
          ? "The training example only says the right answer was “sunny”. The student learns what to say, but nothing about the other options."
          : "The student sees the teacher’s whole probability list: “sunny” is likely, “cloudy” is a close second, “windy” is a long shot. That’s much richer information about how the teacher thinks."}
      </p>
    </Widget>
  );
}
