"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// arrival tick and how many ticks of generation each request needs
const REQS = [
  { at: 0, len: 6 },
  { at: 1, len: 3 },
  { at: 3, len: 8 },
  { at: 6, len: 2 },
  { at: 7, len: 5 },
  { at: 8, len: 3 },
  { at: 12, len: 4 },
  { at: 13, len: 6 },
];
const SLOTS = 4;
const TIMEOUT = 3;

type Mode = "static" | "dynamic" | "continuous";
type Row = { at: number; start: number; done: number; returned: number };

function schedule(mode: Mode): Row[] {
  const rows: Row[] = REQS.map((r) => ({ at: r.at, start: 0, done: 0, returned: 0 }));

  if (mode === "continuous") {
    // token-level: a request joins as soon as any slot frees up
    const slotFree = new Array(SLOTS).fill(0);
    for (let i = 0; i < REQS.length; i++) {
      let s = 0;
      for (let k = 1; k < SLOTS; k++) if (slotFree[k] < slotFree[s]) s = k;
      const start = Math.max(REQS[i].at, slotFree[s]);
      slotFree[s] = start + REQS[i].len;
      rows[i] = { at: REQS[i].at, start, done: start + REQS[i].len, returned: start + REQS[i].len };
    }
    return rows;
  }

  // static / dynamic: one batch at a time, the whole batch returns together
  let next = 0;
  let serverFree = 0;
  while (next < REQS.length) {
    const firstAt = REQS[next].at;
    let launch: number;
    if (mode === "static") {
      const fillIdx = Math.min(next + SLOTS, REQS.length) - 1;
      launch = Math.max(REQS[fillIdx].at, serverFree);
    } else {
      const fullAt = next + SLOTS - 1 < REQS.length ? REQS[next + SLOTS - 1].at : Infinity;
      launch = Math.max(Math.min(fullAt, firstAt + TIMEOUT), serverFree);
    }
    const members: number[] = [];
    for (let i = next; i < REQS.length && members.length < SLOTS && REQS[i].at <= launch; i++) members.push(i);
    const end = launch + Math.max(...members.map((i) => REQS[i].len));
    for (const i of members) rows[i] = { at: REQS[i].at, start: launch, done: launch + REQS[i].len, returned: end };
    serverFree = end;
    next += members.length;
  }
  return rows;
}

const info: Record<Mode, { name: string; desc: string }> = {
  static: { name: "Static", desc: "Wait until the batch is completely full, run it, and return everything together." },
  dynamic: { name: "Dynamic", desc: `Run the batch when it’s full or when ${TIMEOUT} ticks have passed, whichever comes first.` },
  continuous: { name: "Continuous", desc: "Work token by token: the moment a request finishes, a waiting one takes its slot." },
};

export default function BatchingModes() {
  const [mode, setMode] = useState<Mode>("static");
  const rows = schedule(mode);
  const horizon = Math.max(...rows.map((r) => r.returned)) + 1;
  const avgWait = rows.reduce((a, r) => a + (r.start - r.at), 0) / rows.length;
  const avgTotal = rows.reduce((a, r) => a + (r.returned - r.at), 0) / rows.length;
  const TICKS = 24;
  const pct = (t: number) => `${(t / TICKS) * 100}%`;

  return (
    <Widget title="Three ways to batch" hint="Same 8 requests, 4 slots">
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {(Object.keys(info) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 ${mode === m ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {info[m].name}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-ink-soft">{info[mode].desc}</p>

      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-ink-faint">Request {i + 1}</span>
            <div className="relative h-5 flex-1 rounded bg-bg-soft">
              <div className="absolute top-0 h-full rounded-l bg-line" style={{ left: pct(r.at), width: pct(r.start - r.at) }} />
              <div className="absolute top-0 h-full rounded bg-compute" style={{ left: pct(r.start), width: pct(r.done - r.start) }} />
              <div className="absolute top-0 h-full rounded-r bg-compute-soft" style={{ left: pct(r.done), width: pct(r.returned - r.done) }} />
              <div className="absolute top-[-2px] h-[24px] w-0.5 bg-ink" style={{ left: pct(r.at) }} />
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="w-16 shrink-0" />
          <div className="relative h-4 flex-1 text-[10px] text-ink-faint">
            {[0, 4, 8, 12, 16, 20].map((t) => (
              <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pct(t) }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-ink" /> arrives</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-line" /> waiting to start</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-compute" /> generating</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-compute-soft" /> finished, stuck until the batch ends</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Average wait to start</div>
          <div className="text-lg">{avgWait.toFixed(1)} ticks</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Average time to answer</div>
          <div className="text-lg text-accent">{avgTotal.toFixed(1)} ticks</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Everything done at</div>
          <div className="text-lg">tick {horizon - 1}</div>
        </div>
      </div>
    </Widget>
  );
}
