"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

const candidates: [string, number][] = [
  ["mat", 3.2],
  ["floor", 2.6],
  ["couch", 2.3],
  ["bed", 1.9],
  ["roof", 1.2],
  ["keyboard", 1.0],
  ["moon", -0.5],
  ["spaceship", -1.2],
];

export default function NextToken() {
  const [temp, setTemp] = useState(1);
  const [topK, setTopK] = useState(8);
  const [topP, setTopP] = useState(1);
  const [history, setHistory] = useState<string[]>([]);

  const probs = useMemo(() => {
    const greedy = temp === 0;
    const scaled = candidates.map(([w, l]) => [w, greedy ? l : l / temp] as [string, number]);
    const max = Math.max(...scaled.map((s) => s[1]));
    let p = scaled.map(([w, l]) => ({ w, p: greedy ? 0 : Math.exp(l - max), kept: true }));
    if (greedy) p[0].p = 1;
    const sum = p.reduce((a, b) => a + b.p, 0);
    p = p.map((x) => ({ ...x, p: x.p / sum }));
    const raw = p.map((x) => x.p);
    // top-k (already sorted by logit)
    p = p.map((x, i) => ({ ...x, kept: i < topK }));
    // top-p: smallest set whose probability adds up to p
    let acc = 0;
    const withTopP: typeof p = [];
    for (const x of p) {
      if (!x.kept) {
        withTopP.push(x);
        continue;
      }
      withTopP.push({ ...x, kept: acc < topP - 1e-9 });
      acc += x.p;
    }
    p = withTopP;
    const keptSum = p.filter((x) => x.kept).reduce((a, b) => a + b.p, 0);
    return p.map((x, i) => ({ ...x, raw: raw[i], final: x.kept ? x.p / keptSum : 0 }));
  }, [temp, topK, topP]);

  function sample() {
    let r = Math.random();
    for (const x of probs) {
      r -= x.final;
      if (r <= 0 && x.final > 0) {
        setHistory((h) => [x.w, ...h].slice(0, 12));
        return;
      }
    }
    setHistory((h) => [probs.find((x) => x.final > 0)!.w, ...h].slice(0, 12));
  }

  return (
    <Widget title="How the next word gets picked" hint="Change the settings, then sample">
      <div className="mb-4 font-serif text-xl">
        “The cat sat on the <span className="rounded bg-memory-soft px-2 text-memory">{history[0] ?? "___"}</span>”
      </div>
      <div className="grid gap-6 sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-1.5">
          {probs.map((x) => (
            <div key={x.w} className={`flex items-center gap-3 text-sm ${x.final === 0 ? "opacity-35" : ""}`}>
              <span className="w-20 shrink-0 text-right tabular-nums">{x.w}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-bg-soft">
                <div className="h-full rounded bg-memory transition-all duration-300" style={{ width: `${(x.final * 100).toFixed(2)}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-xs">{(x.final * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div className="space-y-4 text-sm">
          <label className="block">
            <div className="flex justify-between">
              <span>Temperature</span>
              <span className="tabular-nums">{temp === 0 ? "0 (greedy)" : temp.toFixed(2)}</span>
            </div>
            <input type="range" className="w-full" min={0} max={2} step={0.05} value={temp} onChange={(e) => setTemp(+e.target.value)} />
            <div className="text-xs text-ink-faint">Low = safe & predictable. High = creative & random.</div>
          </label>
          <label className="block">
            <div className="flex justify-between">
              <span>Top-k</span>
              <span className="tabular-nums">{topK}</span>
            </div>
            <input type="range" className="w-full" min={1} max={8} step={1} value={topK} onChange={(e) => setTopK(+e.target.value)} />
            <div className="text-xs text-ink-faint">Only consider the k most likely words.</div>
          </label>
          <label className="block">
            <div className="flex justify-between">
              <span>Top-p</span>
              <span className="tabular-nums">{topP.toFixed(2)}</span>
            </div>
            <input type="range" className="w-full" min={0.1} max={1} step={0.05} value={topP} onChange={(e) => setTopP(+e.target.value)} />
            <div className="text-xs text-ink-faint">Keep the fewest words that add up to p of the probability.</div>
          </label>
          <button onClick={sample} className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-bg hover:opacity-90">
            Sample a word
          </button>
        </div>
      </div>
      {history.length > 0 && (
        <div className="mt-4 text-sm text-ink-soft">
          Recent picks: <span className="tabular-nums">{history.join(", ")}</span>
        </div>
      )}
    </Widget>
  );
}
