"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Toy engine timings (illustrative, not measured):
const DECODE_MS = 10; // one decode iteration for the users already generating
const PREFILL_MS = 400; // total prefill work for the long prompt
const ARRIVE_MS = 50; // when the long prompt shows up
const END_MS = 700;
const USERS = 4;
const CHUNKS = [1, 2, 4, 8, 16];

const W = 640, H = 190, L = 92, R = 12, ROW = 30, TOP = 14;
const x = (t: number) => Math.round((L + (t / END_MS) * (W - L - R)) * 10) / 10;

type Iter = { start: number; end: number; prefill: boolean };

function schedule(k: number) {
  const iters: Iter[] = [];
  let t = 0;
  while (t < ARRIVE_MS) {
    iters.push({ start: t, end: t + DECODE_MS, prefill: false });
    t += DECODE_MS;
  }
  const chunk = PREFILL_MS / k;
  for (let c = 0; c < k; c++) {
    iters.push({ start: t, end: t + chunk + DECODE_MS, prefill: true });
    t += chunk + DECODE_MS;
  }
  const firstToken = t;
  while (t < END_MS) {
    iters.push({ start: t, end: t + DECODE_MS, prefill: false });
    t += DECODE_MS;
  }
  return { iters, firstToken };
}

export default function ChunkedPrefill() {
  const [ci, setCi] = useState(0);
  const k = CHUNKS[ci];
  const { iters, firstToken } = schedule(k);
  const worstGap = Math.max(...iters.map((it) => it.end - it.start));

  return (
    <Widget title="One long prompt vs. everyone else" hint="Change how the prefill is chunked">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-soft">Split the 32K-token prefill into:</span>
        {CHUNKS.map((c, i) => (
          <button
            key={c}
            onClick={() => setCi(i)}
            className={`rounded-lg border px-3 py-1 ${ci === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {c === 1 ? "no chunking" : `${c} chunks`}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Engine timeline">
        {[0, 100, 200, 300, 400, 500, 600, 700].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={TOP - 4} y2={TOP + ROW * (USERS + 1)} stroke="var(--line)" />
            <text x={x(t)} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--ink-faint)">{t} ms</text>
          </g>
        ))}
        {/* long prompt row */}
        <text x={L - 8} y={TOP + 18} fontSize="11" textAnchor="end" fill="var(--compute)">long prompt</text>
        {iters.filter((it) => it.prefill).map((it, i) => (
          <rect key={i} x={x(it.start) + 0.5} y={TOP + 6} width={Math.max(1, Math.round((x(it.end - DECODE_MS) - x(it.start) - 1) * 10) / 10)} height={16} rx="3" fill="var(--compute)" opacity="0.85" />
        ))}
        {iters.filter((it) => !it.prefill && it.start >= firstToken).map((it, i) => (
          <line key={i} x1={x(it.end)} x2={x(it.end)} y1={TOP + 8} y2={TOP + 20} stroke="var(--compute)" strokeWidth="1.5" />
        ))}
        {/* decoding users */}
        {Array.from({ length: USERS }, (_, u) => {
          const y = TOP + ROW * (u + 1);
          return (
            <g key={u}>
              <text x={L - 8} y={y + 18} fontSize="11" textAnchor="end" fill="var(--memory)">user {u + 1}</text>
              {iters.map((it, i) => (
                <line key={i} x1={x(it.end)} x2={x(it.end)} y1={y + 8} y2={y + 20} stroke="var(--memory)" strokeWidth="1.5" />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Worst gap between tokens for users 1–4</div>
          <div className={`text-lg tabular-nums ${worstGap > 100 ? "text-bad" : "text-memory"}`}>{worstGap} ms</div>
          <div className="text-[11px] text-ink-faint">normally {DECODE_MS} ms: this is the stall they feel mid-sentence</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Long prompt’s time to first token</div>
          <div className="text-lg tabular-nums text-compute">{firstToken - ARRIVE_MS} ms</div>
          <div className="text-[11px] text-ink-faint">each chunk also waits for a decode step, so more chunks = slightly later</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Each tick is a token arriving. Illustrative timings: a {PREFILL_MS} ms prefill and {DECODE_MS} ms decode steps. Chunking
        trades a little TTFT for the long prompt against much smoother streaming for everyone else.
      </p>
    </Widget>
  );
}
