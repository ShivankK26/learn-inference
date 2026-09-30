"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const SYSTEM = "You are a helpful support agent for Acme . Always answer politely , cite the help center , and never share account details .".split(" ");

const presets = {
  good: {
    label: "Question at the end",
    a: [...SYSTEM, "How", "do", "I", "reset", "my", "password", "?"],
    b: [...SYSTEM, "Where", "is", "my", "order", "?"],
  },
  bad: {
    label: "Question at the start",
    a: ["How", "do", "I", "reset", "my", "password", "?", ...SYSTEM],
    b: ["Where", "is", "my", "order", "?", ...SYSTEM],
  },
};

type Key = keyof typeof presets;

function Row({ label, toks, cached }: { label: string; toks: string[]; cached: number }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-ink-soft">{label}</div>
      <div className="flex flex-wrap gap-1">
        {toks.map((t, i) => (
          <span
            key={i}
            className={`rounded px-1.5 py-0.5 text-[13px] ${
              i < cached ? "border border-memory bg-memory-soft text-memory" : "bg-compute-soft text-compute"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PrefixCache() {
  const [k, setK] = useState<Key>("good");
  const { a, b } = presets[k];
  let shared = 0;
  while (shared < Math.min(a.length, b.length) && a[shared] === b[shared]) shared++;
  const saved = Math.round((shared / b.length) * 100);


  return (
    <Widget title="Prefix caching: reuse the start of the prompt" hint="Try both orderings">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(Object.keys(presets) as Key[]).map((key) => (
          <button
            key={key}
            onClick={() => setK(key)}
            className={`rounded-lg border px-3 py-1.5 ${k === key ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {presets[key].label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <Row label="Request 1 (arrives first, fills the cache)" toks={a} cached={0} />
        <Row label="Request 2 (arrives later)" toks={b} cached={shared} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] border border-memory bg-memory-soft" /> read from cache</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-compute-soft" /> prefill computed</span>
      </div>
      <div className="mt-4 rounded-xl bg-bg-soft p-4 text-sm">
        <b className="text-lg text-accent">{saved}%</b> of request 2’s prefill is skipped ({shared} of {b.length} tokens).{" "}
        {k === "good"
          ? "The shared instructions come first, so the whole block is a cache hit."
          : "The very first token differs, so nothing can be reused, even though most of the text is identical."}
      </div>
    </Widget>
  );
}
