"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

type Step = { label: string; newShare: number; gpu: number; note: string };

const BASE_GPUS = 100;

const blueGreen: Step[] = [
  { label: "Start", newShare: 0, gpu: 100, note: "Blue (the current version) serves everyone on 100 GPUs." },
  { label: "Build green", newShare: 0, gpu: 200, note: "Green (the new version) must be fully built next to blue: another 100 GPUs, sitting idle." },
  { label: "Cut over", newShare: 100, gpu: 200, note: "All traffic flips to green at once. Blue stays ready for a rollback." },
  { label: "Retire blue", newShare: 100, gpu: 100, note: "Once green looks healthy, blue is shut down." },
];

const canary: Step[] = [
  { label: "Start", newShare: 0, gpu: 100, note: "The current version serves everyone." },
  { label: "Build new", newShare: 0, gpu: 102, note: "The new deployment starts small, just enough replicas to handle a trickle." },
  { label: "5% of traffic", newShare: 5, gpu: 102, note: "A small slice of live traffic goes to the new version. Watch errors and latency closely." },
  { label: "25%", newShare: 25, gpu: 103, note: "Still healthy, so shift more. Autoscaling shrinks the old deployment as its traffic drops." },
  { label: "50%", newShare: 50, gpu: 104, note: "Keep ramping while monitoring. Make sure the new side has enough warm replicas first." },
  { label: "100%", newShare: 100, gpu: 100, note: "The new version handles everything and the old one scales away." },
];

export default function CanaryDeploy() {
  const [strategy, setStrategy] = useState<"bg" | "canary">("canary");
  const [bug, setBug] = useState(false);
  const [i, setI] = useState(0);
  const steps = strategy === "bg" ? blueGreen : canary;
  const step = steps[Math.min(i, steps.length - 1)];

  // with a bug, monitoring catches it at the first step where real users hit the new version
  const firstExposed = steps.findIndex((s) => s.newShare > 0);
  const caught = bug && i >= firstExposed;
  const affected = caught ? steps[firstExposed].newShare : 0;
  const shownShare = caught ? 0 : step.newShare;

  function pick(s: "bg" | "canary") {
    setStrategy(s);
    setI(0);
  }

  return (
    <Widget title="Blue-green vs. canary deploys" hint="Step through a rollout">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        {(["bg", "canary"] as const).map((s) => (
          <button
            key={s}
            onClick={() => pick(s)}
            className={`rounded-lg border px-3 py-1.5 ${strategy === s ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {s === "bg" ? "Blue-green" : "Canary"}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-ink-soft">
          <input type="checkbox" checked={bug} onChange={(e) => { setBug(e.target.checked); setI(0); }} />
          The new version has a hidden bug
        </label>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {steps.map((s, k) => (
          <button
            key={s.label}
            onClick={() => setI(k)}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${k === i ? "border-accent bg-accent text-bg" : k < i ? "border-accent/40 text-accent" : "border-line text-ink-faint"}`}
          >
            {k + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-[13px] font-medium text-ink-soft">Live traffic</div>
      <div className="mt-1 flex h-8 overflow-hidden rounded-lg border border-line text-xs font-medium">
        <div className="flex items-center justify-center bg-memory-soft text-memory transition-all duration-500" style={{ width: `${100 - shownShare}%` }}>
          {100 - shownShare > 12 && `Old version · ${100 - shownShare}%`}
        </div>
        <div className="flex items-center justify-center bg-accent-soft text-accent transition-all duration-500" style={{ width: `${shownShare}%` }}>
          {shownShare > 12 && `New version · ${shownShare}%`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">GPUs in use</div>
          <div className={`text-lg ${step.gpu > 150 ? "text-bad" : ""}`}>
            {Math.round((step.gpu / 100) * BASE_GPUS)} <span className="text-xs text-ink-faint">of a normal {BASE_GPUS}</span>
          </div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Users hit by the bug</div>
          <div className={`text-lg ${affected > 0 ? "text-bad" : "text-good"}`}>{bug ? `${affected}%` : "–"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
        {caught ? (
          <span>
            <b className="text-bad">Errors spiked and the rollout was reverted.</b>{" "}
            {strategy === "bg" ? "But the cutover had already sent everyone to the broken version." : "Only the small canary slice ever saw the broken version."}
          </span>
        ) : (
          step.note
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setI(0)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">
          Reset
        </button>
        <button
          onClick={() => setI((k) => Math.min(steps.length - 1, k + 1))}
          disabled={i >= steps.length - 1 || caught}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
        >
          Next step
        </button>
      </div>
    </Widget>
  );
}
