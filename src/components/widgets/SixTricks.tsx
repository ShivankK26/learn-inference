"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const tricks = [
  {
    name: "Batching",
    one: "Serve many users at the same time.",
    analogy: "A bus instead of a taxi. The trip costs about the same, but 40 people ride.",
    ch: "Ch. 2 & 7",
  },
  {
    name: "Caching",
    one: "Don’t redo work you’ve already done.",
    analogy: "Keeping your notes from yesterday’s meeting instead of re-reading every email.",
    ch: "Ch. 5",
  },
  {
    name: "Quantization",
    one: "Store the model’s numbers with less precision.",
    analogy: "Saying “about 3.14” instead of “3.14159265…”. Smaller, faster, almost as accurate.",
    ch: "Ch. 5",
  },
  {
    name: "Speculation",
    one: "Guess several words ahead, then check them all at once.",
    analogy: "A junior writer drafts the next sentence; the senior editor approves it in one glance.",
    ch: "Ch. 5",
  },
  {
    name: "Parallelism",
    one: "Split one model across several GPUs.",
    analogy: "Several chefs each handle part of the same dish so it’s done sooner.",
    ch: "Ch. 5",
  },
  {
    name: "Disaggregation",
    one: "Run the two phases of answering on separate machines.",
    analogy: "One team reads the order, another team cooks, and each team can grow on its own.",
    ch: "Ch. 5",
  },
];

export default function SixTricks() {
  const [flipped, setFlipped] = useState<number | null>(null);
  return (
    <Widget title="The six big speed-up tricks" hint="Click a card to see the analogy">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tricks.map((t, i) => {
          const on = flipped === i;
          return (
            <button
              key={t.name}
              onClick={() => setFlipped(on ? null : i)}
              className={`min-h-[8.5rem] rounded-xl border p-4 text-left transition ${
                on ? "border-accent bg-accent-soft" : "border-line bg-bg-soft hover:border-ink-faint"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{t.name}</span>
                <span className="text-xs text-ink-faint">{t.ch}</span>
              </div>
              <div className="mt-2 text-sm text-ink-soft">{on ? t.analogy : t.one}</div>
            </button>
          );
        })}
      </div>
    </Widget>
  );
}
