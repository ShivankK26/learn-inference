"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const HANDSHAKE_MS = 40; // new TLS session: a few dozen milliseconds (illustrative)

export default function RequestTimeline() {
  const [reuse, setReuse] = useState(false);
  const [stream, setStream] = useState(false);
  const [net, setNet] = useState(25);
  const [ttft, setTtft] = useState(200);
  const [tokens, setTokens] = useState(250);
  const [tps, setTps] = useState(80);

  const decode = (tokens / tps) * 1000;
  const parts = [
    { name: "New session (TLS handshake)", ms: reuse ? 0 : HANDSHAKE_MS, color: "var(--bad)" },
    { name: "Network to server", ms: net, color: "var(--ink-faint)" },
    { name: "Prefill (time to first token)", ms: ttft, color: "var(--compute)" },
    { name: "Decode the rest", ms: decode, color: "var(--memory)" },
    { name: "Network back", ms: net, color: "var(--ink-faint)" },
  ];
  const total = parts.reduce((a, p) => a + p.ms, 0);
  const firstVisible = stream ? parts[0].ms + net + ttft + net : total;
  const fmt = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`);

  return (
    <Widget title="Where the time goes in one request" hint="Toggle streaming and session re-use">
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={reuse} onChange={(e) => setReuse(e.target.checked)} /> Re-use an existing session
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={stream} onChange={(e) => setStream(e.target.checked)} /> Stream tokens as they’re made
        </label>
      </div>

      <div className="flex h-9 w-full overflow-hidden rounded-lg border border-line">
        {parts.map((p) => (
          <div key={p.name} title={`${p.name}: ${fmt(p.ms)}`} className="h-full transition-all duration-300" style={{ width: `${(p.ms / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <div className="relative mt-1 h-5 text-[11px] text-ink-soft">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.min(92, Math.max(8, (firstVisible / total) * 100))}%` }}>
          ▲ user sees text
        </span>
      </div>
      <div className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
        {parts.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="text-ink-soft">{p.name}</span>
            <span className="ml-auto tabular-nums">{fmt(p.ms)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {[
          { l: "Network, one way", v: net, s: setNet, min: 5, max: 150, u: " ms" },
          { l: "Time to first token", v: ttft, s: setTtft, min: 50, max: 2000, u: " ms" },
          { l: "Answer length", v: tokens, s: setTokens, min: 10, max: 1000, u: " tokens" },
          { l: "Tokens per second", v: tps, s: setTps, min: 10, max: 300, u: "" },
        ].map((c) => (
          <label key={c.l} className="block">
            <div className="flex justify-between">
              <span>{c.l}</span>
              <span className="tabular-nums">{c.v}{c.u}</span>
            </div>
            <input type="range" className="w-full" min={c.min} max={c.max} value={c.v} onChange={(e) => c.s(+e.target.value)} />
          </label>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Until the user sees anything</div>
          <div className={`text-lg ${stream ? "text-good" : "text-bad"}`}>{fmt(firstVisible)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Whole answer delivered</div>
          <div className="text-lg">{fmt(total)}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">
        Illustrative numbers. With streaming, the first visible text only waits for the handshake, the network and prefill;
        without it, the user stares at a spinner until the very last token.
      </p>
    </Widget>
  );
}
