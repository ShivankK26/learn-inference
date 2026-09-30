"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

// Illustrative numbers: a KV cache budget of 256 blocks × 16 tokens = 4,096 token slots,
// and requests whose final lengths aren’t known when they start.
const BLOCK = 16;
const BLOCKS = 256;
const RESERVE = 1024; // what a contiguous allocator must set aside per request (the max length it might reach)
const lengths = [380, 120, 910, 260, 540, 70, 700, 310, 450, 180, 820, 95];
const hues = [28, 212, 160, 340, 265, 95, 0, 190, 48, 300, 130, 230];

type Cell = { req: number; used: boolean } | null;

function contiguous(): { cells: Cell[]; running: number } {
  const cells: Cell[] = new Array(BLOCKS).fill(null);
  const per = RESERVE / BLOCK;
  let pos = 0;
  let running = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (pos + per > BLOCKS) break;
    const usedBlocks = Math.ceil(lengths[i] / BLOCK);
    for (let b = 0; b < per; b++) cells[pos + b] = { req: i, used: b < usedBlocks };
    pos += per;
    running++;
  }
  return { cells, running };
}

function paged(): { cells: Cell[]; running: number } {
  // Admit requests while their blocks fit, then allocate blocks round-robin as tokens are generated,
  // so each request’s blocks end up scattered wherever the next free block happens to be.
  const need = lengths.map((l) => Math.ceil(l / BLOCK));
  let total = 0;
  let running = 0;
  for (const n of need) {
    if (total + n > BLOCKS) break;
    total += n;
    running++;
  }
  const cells: Cell[] = new Array(BLOCKS).fill(null);
  const got = new Array(running).fill(0);
  let next = 0;
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < running; i++) {
      if (got[i] < need[i]) {
        cells[next++] = { req: i, used: true };
        got[i]++;
        progress = true;
      }
    }
  }
  return { cells, running };
}

export default function PagedKV() {
  const [mode, setMode] = useState<"contiguous" | "paged">("contiguous");
  const { cells, running } = useMemo(() => (mode === "contiguous" ? contiguous() : paged()), [mode]);
  const allocated = cells.filter(Boolean).length;
  const tokens = lengths.slice(0, running).reduce((a, b) => a + b, 0);
  const allocatedTokens = allocated * BLOCK;
  const useful = allocatedTokens ? tokens / allocatedTokens : 0;

  return (
    <Widget title="Why paging the KV cache fits more requests" hint="Toggle the allocator">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <button onClick={() => setMode("contiguous")} className={`rounded-lg border px-3 py-1.5 ${mode === "contiguous" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          One contiguous block per request
        </button>
        <button onClick={() => setMode("paged")} className={`rounded-lg border px-3 py-1.5 ${mode === "paged" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Paged (16-token blocks)
        </button>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}>
        {cells.map((c, i) => (
          <div
            key={i}
            className="aspect-square rounded-[2px]"
            style={{
              background: c ? `hsl(${hues[c.req]} 60% 55% / ${c.used ? 0.9 : 0.18})` : "var(--bg-soft)",
              outline: c && !c.used ? `1px dashed hsl(${hues[c.req]} 60% 55% / 0.6)` : undefined,
              outlineOffset: "-1px",
            }}
            title={c ? `Request ${c.req + 1}${c.used ? "" : " (reserved, empty)"}` : "free"}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Requests running at once</div>
          <div className="text-lg text-accent">{running}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Allocated memory actually holding KV</div>
          <div className="text-lg">{(useful * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens of KV stored</div>
          <div className="text-lg">{tokens.toLocaleString("en-US")}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Each square is a block of 16 tokens of KV cache ({BLOCKS} blocks = {(BLOCKS * BLOCK).toLocaleString("en-US")} tokens). The contiguous allocator must
        reserve room for the longest answer a request might produce ({RESERVE.toLocaleString("en-US")} tokens here), so faded squares are
        reserved but empty. The paged allocator hands out one block at a time, wherever there’s space. Request lengths are
        illustrative.
      </p>
    </Widget>
  );
}
