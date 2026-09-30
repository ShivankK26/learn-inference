"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const volumes = ["Under 100M", "100M–1B", "Over 1B"];
const sizes = ["Under 100B", "100B–500B", "Trillion-scale"];

function Row({ label, items, value, set }: { label: string; items: string[]; value: number; set: (n: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-ink-soft">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <button
            key={it}
            onClick={() => set(i)}
            className={`rounded-lg border px-2.5 py-1 text-sm ${value === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ShouldDisagg() {
  const [v, setV] = useState(0);
  const [s, setS] = useState(0);
  const [prefillHeavy, setPrefillHeavy] = useState(false);

  const volumeOk = v >= 1;
  const sizeOk = s >= 1;
  let verdict: { t: string; cls: string; why: string };
  if (!volumeOk || !sizeOk) {
    verdict = {
      t: "Probably not worth it",
      cls: "text-bad",
      why: !volumeOk
        ? "Not enough traffic yet: you’d pay for extra GPUs and engineering for little gain."
        : "The model is too small to benefit much: the extra hardware is better spent on more replicas.",
    };
  } else if (!prefillHeavy) {
    verdict = {
      t: "Maybe, but replicas may win",
      cls: "text-compute",
      why: "With short inputs or lots of prefix-cache hits, decode engines handle prefill fine. Adding replicas is often the better use of GPUs.",
    };
  } else {
    verdict = {
      t: "Good fit for disaggregation",
      cls: "text-good",
      why: "Lots of traffic, a big model, and long inputs: the textbook case (think a frontier model inside a code editor).",
    };
  }


  return (
    <Widget title="Should you disaggregate?" hint="The book’s three checks">
      <div className="space-y-4">
        <Row label="1. Tokens served per day" items={volumes} value={v} set={setV} />
        <Row label="2. Model size (parameters)" items={sizes} value={s} set={setS} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prefillHeavy} onChange={(e) => setPrefillHeavy(e.target.checked)} />
          3. Traffic is prefill-heavy (long, varied inputs)
        </label>
      </div>
      <div className="mt-5 rounded-xl bg-bg-soft p-4">
        <div className={`font-semibold ${verdict.cls}`}>{verdict.t}</div>
        <div className="mt-1 text-sm text-ink-soft">{verdict.why}</div>
      </div>
    </Widget>
  );
}
