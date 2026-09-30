"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const words = "I decided to write a book because I thought it would be easy , but it was actually hard .".split(" ");

// Hand-made attention patterns for illustration (a real model has many heads, each with its own pattern)
const special: Record<number, Record<number, number>> = {
  5: { 3: 0.45, 4: 0.25 }, // book → write, a
  8: { 7: 0.55 }, // thought → I
  9: { 5: 0.45, 3: 0.3 }, // it → book, write
  12: { 9: 0.3, 11: 0.25, 8: 0.2 }, // easy → it, be, thought
  15: { 3: 0.35, 5: 0.35, 9: 0.15 }, // it → write, book
  18: { 12: 0.3, 15: 0.25, 17: 0.2, 14: 0.1 }, // hard → easy, it, actually, but
};

function weights(target: number): number[] {
  const w: number[] = new Array(words.length).fill(0);
  const s = special[target];
  if (s) {
    let used = 0;
    for (const [k, v] of Object.entries(s)) {
      w[+k] = v;
      used += v;
    }
    // spread the rest across recent words
    const rest = 1 - used;
    const others = words.map((_, i) => i).filter((i) => i <= target && !(i in s));
    const decay = others.map((i) => Math.exp(-(target - i) / 2));
    const dsum = decay.reduce((a, b) => a + b, 0);
    others.forEach((i, j) => (w[i] = (rest * decay[j]) / dsum));
  } else {
    const decay = words.map((_, i) => (i <= target ? Math.exp(-(target - i) / 1.5) : 0));
    const dsum = decay.reduce((a, b) => a + b, 0);
    decay.forEach((d, i) => (w[i] = d / dsum));
  }
  return w;
}

export default function Attention() {
  const [sel, setSel] = useState(15);
  const w = weights(sel);
  const top = w
    .map((v, i) => [v, i] as [number, number])
    .filter(([, i]) => i !== sel)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2);

  return (
    <Widget title="Which words does each word look at?" hint="Click any word">
      <div className="flex flex-wrap gap-x-1.5 gap-y-2 font-serif text-xl leading-loose">
        {words.map((word, i) => {
          const future = i > sel;
          const isSel = i === sel;
          return (
            <button
              key={i}
              onClick={() => setSel(i)}
              className={`rounded-md px-1.5 transition ${isSel ? "ring-2 ring-accent" : ""} ${future ? "text-ink-faint/50" : ""}`}
              style={{
                background: future || isSel ? "transparent" : `color-mix(in srgb, var(--compute) ${Math.round(w[i] * 140)}%, transparent)`,
              }}
            >
              {word}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl bg-bg-soft p-4 text-sm">
        When the model is working on <b className="text-accent">“{words[sel]}”</b>, it pays the most attention to{" "}
        {top.map(([v, i], k) => (
          <span key={i}>
            <b>“{words[i]}”</b> ({Math.round(v * 100)}%){k === 0 && top.length > 1 ? " and " : ""}
          </span>
        ))}
        .
        <div className="mt-2 text-xs text-ink-faint">
          Greyed-out words come later in the sentence, and an LLM is never allowed to look ahead. Weights here are hand-made to
          show the idea; real models learn them.
        </div>
      </div>
    </Widget>
  );
}
