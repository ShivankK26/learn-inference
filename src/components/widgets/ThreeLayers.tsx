"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const layers = [
  {
    name: "Tooling",
    tag: "How engineers use it",
    plain: "The buttons, dashboards, and config files engineers use to deploy models.",
    analogy: "The restaurant’s ordering system and kitchen manager: how staff actually operate everything.",
    examples: "Deploy commands, logs, dashboards, config files",
    problem: "Too simple and you can’t fix things; too complex and nobody gets work done. You want the middle.",
  },
  {
    name: "Infrastructure",
    tag: "Many machines",
    plain: "Running lots of copies of the model across many machines, regions, and clouds without going down.",
    analogy: "Opening more restaurant branches as the crowd grows, and sending customers to whichever one has free tables.",
    examples: "Autoscaling, load balancing, multi-cloud, failover",
    problem: "One GPU always gets overwhelmed eventually. This is a systems problem, not a math problem.",
  },
  {
    name: "Runtime",
    tag: "One machine",
    plain: "Making a single model on a single GPU box run as fast and efficiently as possible.",
    analogy: "Making one kitchen cook faster: better recipes, better knife skills, cooking many orders at once.",
    examples: "CUDA, PyTorch, vLLM / SGLang, batching, quantization, caching",
    problem: "Squeezing every drop of speed out of expensive hardware.",
  },
];

export default function ThreeLayers() {
  const [open, setOpen] = useState(2);
  const l = layers[open];
  return (
    <Widget title="The three layers of inference" hint="Click a layer">
      <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-2">
          {layers.map((layer, i) => (
            <button
              key={layer.name}
              onClick={() => setOpen(i)}
              className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                open === i ? "border-accent bg-accent-soft" : "border-line bg-bg-soft hover:border-ink-faint"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{layer.name}</span>
                <span className="text-xs text-ink-faint">{layer.tag}</span>
              </div>
            </button>
          ))}
          <div className="mt-1 text-center text-xs text-ink-faint">↑ built on top of each other ↑</div>
        </div>
        <div className="rounded-xl bg-bg-soft p-5">
          <div className="font-serif text-2xl font-semibold">{l.name}</div>
          <p className="mt-2">{l.plain}</p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">Analogy: </span>
            {l.analogy}
          </p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">Examples: </span>
            {l.examples}
          </p>
          <p className="mt-3 text-ink-soft">
            <span className="font-medium text-ink">The core challenge: </span>
            {l.problem}
          </p>
        </div>
      </div>
    </Widget>
  );
}
