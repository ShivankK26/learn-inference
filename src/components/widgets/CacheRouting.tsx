"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const users = ["Ana", "Ben", "Chen", "Dev"];
const userColor = ["bg-compute", "bg-memory", "bg-accent", "bg-bad"];
// A fixed stream of messages: each user keeps chatting
const stream = [0, 1, 2, 0, 3, 1, 0, 2, 1, 3, 0, 2, 3, 1, 0, 2];
const REPLICAS = 3;

function simulate(mode: "round" | "aware", n: number) {
  const cache: Set<number>[] = Array.from({ length: REPLICAS }, () => new Set());
  const home: Record<number, number> = {};
  const log: { user: number; replica: number; hit: boolean }[] = [];
  let next = 0;
  for (let i = 0; i < n; i++) {
    const u = stream[i];
    let r: number;
    if (mode === "round") {
      r = next;
      next = (next + 1) % REPLICAS;
    } else {
      if (home[u] === undefined) {
        // new user: least-loaded replica
        const load = cache.map((c) => c.size);
        home[u] = load.indexOf(Math.min(...load));
      }
      r = home[u];
    }
    const hit = cache[r].has(u);
    cache[r].add(u);
    log.push({ user: u, replica: r, hit });
  }
  return log;
}

export default function CacheRouting() {
  const [mode, setMode] = useState<"round" | "aware">("round");
  const [n, setN] = useState(8);
  const log = simulate(mode, n);
  const returning = log.filter((l, i) => log.slice(0, i).some((p) => p.user === l.user));
  const hits = log.filter((l) => l.hit).length;

  return (
    <Widget title="Routing: even split vs. cache-aware" hint="Send more messages">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setMode("round")} className={`rounded-lg border px-3 py-1.5 ${mode === "round" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Round-robin (take turns)
        </button>
        <button onClick={() => setMode("aware")} className={`rounded-lg border px-3 py-1.5 ${mode === "aware" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line"}`}>
          Cache-aware
        </button>
        <span className="ml-auto flex gap-3 text-xs text-ink-soft">
          {users.map((u, i) => (
            <span key={u} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${userColor[i]}`} />{u}</span>
          ))}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: REPLICAS }, (_, r) => (
          <div key={r} className="rounded-xl border border-line p-3">
            <div className="mb-2 text-[13px] font-semibold">Replica {r + 1}</div>
            <div className="flex min-h-8 flex-wrap gap-1.5">
              {log.map((l, i) =>
                l.replica === r ? (
                  <span
                    key={i}
                    title={l.hit ? "cache hit" : "cache miss"}
                    className={`flex h-7 items-center gap-1 rounded-md px-2 text-xs text-bg ${userColor[l.user]} ${l.hit ? "" : "opacity-50"}`}
                  >
                    {users[l.user][0]}
                    <span>{l.hit ? "✓" : "✗"}</span>
                  </span>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-ink-soft">
          Cache hits: <b className="tabular-nums text-accent">{hits}</b> of <span className="tabular-nums">{returning.length}</span> returning messages.
          {mode === "round" ? " Follow-ups often land on a replica that has never seen that conversation." : " Each user sticks to the replica that already holds their cache."}
        </span>
        <div className="flex gap-2">
          <button onClick={() => setN(1)} className="rounded-lg border border-line px-3 py-1.5 hover:border-accent">Reset</button>
          <button onClick={() => setN((x) => Math.min(stream.length, x + 1))} className="rounded-lg bg-accent px-4 py-1.5 font-medium text-bg hover:opacity-90">
            Send next message
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">✓ = cache hit (fast, cheap) · ✗ = cache miss (full prefill). Faded chips are misses.</p>
    </Widget>
  );
}
