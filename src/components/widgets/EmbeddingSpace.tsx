"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// A hand-placed 2D "meaning space" for illustration. Real embeddings have hundreds to thousands of dimensions.
const items = [
  { text: "How do I reset my password?", x: 0.78, y: 0.34 },
  { text: "I forgot my login details", x: 0.72, y: 0.4 },
  { text: "Can’t sign in to my account", x: 0.82, y: 0.46 },
  { text: "Best pizza near me", x: -0.7, y: 0.55 },
  { text: "Italian restaurants open late", x: -0.62, y: 0.7 },
  { text: "Recipe for margherita pizza", x: -0.8, y: 0.3 },
  { text: "How fast is an H100 GPU?", x: 0.15, y: -0.85 },
  { text: "GPU memory bandwidth explained", x: 0.3, y: -0.78 },
  { text: "Rent a cloud GPU by the hour", x: 0.42, y: -0.6 },
];

const queries = [
  { text: "locked out of my account", x: 0.8, y: 0.38 },
  { text: "where should I get dinner?", x: -0.66, y: 0.6 },
  { text: "fastest chip for AI", x: 0.24, y: -0.8 },
];

function cosine(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
}

const S = 260;
const px = (v: number) => S / 2 + v * (S / 2 - 18);
const py = (v: number) => S / 2 - v * (S / 2 - 18);

export default function EmbeddingSpace() {
  const [qi, setQi] = useState(0);
  const q = queries[qi];
  const ranked = items
    .map((it) => ({ ...it, sim: cosine(q, it) }))
    .sort((a, b) => b.sim - a.sim);
  const top = new Set(ranked.slice(0, 3).map((r) => r.text));

  return (
    <Widget title="Search by meaning" hint="Pick a search query">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {queries.map((qq, i) => (
          <button
            key={qq.text}
            onClick={() => setQi(i)}
            className={`rounded-lg border px-3 py-1.5 ${qi === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            “{qq.text}”
          </button>
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto h-64 w-64" role="img" aria-label="Embedding space">
          <rect x="0" y="0" width={S} height={S} rx="12" fill="var(--bg-soft)" />
          <line x1={S / 2} x2={S / 2} y1="10" y2={S - 10} stroke="var(--line)" />
          <line y1={S / 2} y2={S / 2} x1="10" x2={S - 10} stroke="var(--line)" />
          {ranked.slice(0, 3).map((r) => (
            <line key={r.text} x1={S / 2} y1={S / 2} x2={px(r.x)} y2={py(r.y)} stroke="var(--accent)" strokeOpacity="0.35" strokeDasharray="3 3" />
          ))}
          <line x1={S / 2} y1={S / 2} x2={px(q.x)} y2={py(q.y)} stroke="var(--compute)" strokeWidth="2" />
          {items.map((it) => (
            <circle key={it.text} cx={px(it.x)} cy={py(it.y)} r={top.has(it.text) ? 6 : 4.5} fill={top.has(it.text) ? "var(--accent)" : "var(--ink-faint)"} />
          ))}
          <circle cx={px(q.x)} cy={py(q.y)} r="7" fill="var(--compute)" stroke="var(--card)" strokeWidth="2" />
        </svg>
        <div className="text-sm">
          <div className="mb-2 text-ink-soft">Closest documents (cosine similarity):</div>
          <ol className="space-y-1.5" style={{ listStyle: "none", paddingLeft: 0 }}>
            {ranked.map((r, i) => (
              <li key={r.text} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 ${i < 3 ? "bg-accent-soft" : "opacity-50"}`}>
                <span>{r.text}</span>
                <span className="tabular-nums text-ink-soft">{r.sim.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        None of the matches share words with the query. They’re close because they <i>mean</i> similar things. This toy
        uses 2 dimensions; real embedding vectors have hundreds to thousands.
      </p>
    </Widget>
  );
}
