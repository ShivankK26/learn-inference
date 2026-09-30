"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const BLOCK_SIZES = [32, 64, 128, 256];

export default function ThreadGrid() {
  const [n, setN] = useState(600);
  const [bs, setBs] = useState(128);
  const [sel, setSel] = useState<{ b: number; t: number } | null>({ b: 1, t: 5 });

  const blocks = Math.ceil(n / bs);
  const launched = blocks * bs;
  const idle = launched - n;
  const warpsPerBlock = bs / 32;

  const selI = sel ? sel.b * bs + sel.t : null;

  return (
    <Widget title="Launching a kernel: threads, blocks, and warps" hint="Change the sizes, then click a thread">
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <label className="block">
          <div className="flex justify-between">
            <span>Array length (n)</span>
            <span className="tabular-nums">{n.toLocaleString("en-US")} elements</span>
          </div>
          <input type="range" className="w-full" min={40} max={1000} step={20} value={n} onChange={(e) => { setN(+e.target.value); setSel(null); }} />
        </label>
        <div>
          <div className="mb-1">Threads per block (blockDim.x)</div>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_SIZES.map((b) => (
              <button
                key={b}
                onClick={() => { setBs(b); setSel(null); }}
                className={`rounded-lg border px-3 py-1 ${bs === b ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-bg-soft px-4 py-3 font-mono text-[13px]">
        double_values&lt;&lt;&lt;{blocks}, {bs}&gt;&gt;&gt;(data, {n});
        <span className="ml-2 font-sans text-xs text-ink-faint">{"// "}grid of {blocks} blocks × {bs} threads</span>
      </div>

      <div className="mt-4 space-y-1.5">
        {Array.from({ length: blocks }, (_, b) => (
          <div key={b} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-ink-faint">block {b}</span>
            <div className="flex flex-1 flex-wrap gap-[2px]">
              {Array.from({ length: bs }, (_, t) => {
                const i = b * bs + t;
                const active = i < n;
                const isSel = sel?.b === b && sel?.t === t;
                const warp = Math.floor(t / 32);
                return (
                  <button
                    key={t}
                    aria-label={`block ${b} thread ${t}`}
                    onClick={() => setSel({ b, t })}
                    className={`h-2.5 w-2.5 rounded-[2px] ${isSel ? "ring-2 ring-accent" : ""} ${
                      active ? (warp % 2 === 0 ? "bg-compute" : "bg-compute/60") : "bg-line"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Threads launched</div>
          <div className="text-lg tabular-nums">{launched.toLocaleString("en-US")}</div>
          <div className="text-[11px] text-ink-faint">{blocks} blocks × {bs}, rounded up</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Threads that skip the work</div>
          <div className="text-lg tabular-nums">{idle}</div>
          <div className="text-[11px] text-ink-faint">they fail the <span className="font-mono">if (i &lt; n)</span> check</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Warps per block</div>
          <div className="text-lg tabular-nums">{warpsPerBlock}</div>
          <div className="text-[11px] text-ink-faint">groups of 32 threads (alternating shades)</div>
        </div>
      </div>

      <div className="mt-3 min-h-[3rem] rounded-lg border border-line bg-card p-3 text-sm">
        {sel && selI !== null ? (
          <>
            Thread <b className="tabular-nums">{sel.t}</b> of block <b className="tabular-nums">{sel.b}</b> computes{" "}
            <span className="font-mono text-[13px]">i = {sel.b} × {bs} + {sel.t} = {selI}</span>.{" "}
            {selI < n ? (
              <>It doubles <span className="font-mono text-[13px]">data[{selI}]</span>. It runs in warp {Math.floor(sel.t / 32)} of its block.</>
            ) : (
              <span className="text-bad">That’s past the end of the array ({n} elements), so it does nothing.</span>
            )}
          </>
        ) : (
          <span className="text-ink-faint">Click any square to see which element that thread handles.</span>
        )}
      </div>
    </Widget>
  );
}
