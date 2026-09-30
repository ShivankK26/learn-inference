"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// UTC offsets (standard time); the book’s rule of thumb is ~5 ms per time zone, one way
const places = [
  { name: "San Francisco", tz: -8 },
  { name: "New York", tz: -5 },
  { name: "Toronto", tz: -5 },
  { name: "London", tz: 0 },
  { name: "Frankfurt", tz: 1 },
  { name: "Mumbai", tz: 5.5 },
  { name: "Singapore", tz: 8 },
  { name: "Tokyo", tz: 9 },
  { name: "Sydney", tz: 10 },
];
const MS_PER_ZONE = 5;

function zones(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 24 - d);
}

function Pick({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium text-ink-soft">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {places.map((p) => (
          <button
            key={p.name}
            onClick={() => set(p.name)}
            className={`rounded-lg border px-2.5 py-1 text-sm ${value === p.name ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GeoLatency() {
  const [user, setUser] = useState("Singapore");
  const [server, setServer] = useState("San Francisco");
  const [budget, setBudget] = useState(500);
  const u = places.find((p) => p.name === user)!;
  const s = places.find((p) => p.name === server)!;
  const z = zones(u.tz, s.tz);
  const oneWay = z * MS_PER_ZONE;
  const roundTrip = oneWay * 2;
  const nearest = [...places].sort((a, b) => zones(u.tz, a.tz) - zones(u.tz, b.tz))[0];
  const share = Math.min(100, (roundTrip / budget) * 100);

  return (
    <Widget title="How far is your user from the GPU?" hint="~5 ms per time zone, one way">
      <div className="space-y-4">
        <Pick label="User is in…" value={user} set={setUser} />
        <Pick label="Request is served in…" value={server} set={setServer} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Time zones apart</div>
          <div className="text-lg">{z}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">One way</div>
          <div className="text-lg">{oneWay} ms</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Round trip</div>
          <div className="text-lg text-memory">{roundTrip} ms</div>
        </div>
      </div>

      <label className="mt-5 block text-sm">
        <div className="flex justify-between">
          <span>End-to-end latency budget</span>
          <span className="tabular-nums">{budget} ms</span>
        </div>
        <input type="range" className="w-full" min={200} max={2000} step={50} value={budget} onChange={(e) => setBudget(+e.target.value)} />
      </label>
      <div className="mt-2 h-4 overflow-hidden rounded-full bg-bg-soft">
        <div className="h-full rounded-full bg-memory transition-all" style={{ width: `${share}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Just crossing the distance eats <b className="text-ink">{Math.round(share)}%</b> of the budget before any GPU work happens.
        {z > 0 && nearest.name !== server && (
          <> Serving from <b className="text-ink">{nearest.name}</b> instead would cut the travel time to about {zones(u.tz, nearest.tz) * MS_PER_ZONE * 2} ms.</>
        )}
      </p>
      <p className="mt-2 text-xs text-ink-faint">A rough rule of thumb, not a network measurement. Real routes vary.</p>
    </Widget>
  );
}
