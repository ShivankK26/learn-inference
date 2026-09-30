"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

type FloatFmt = { kind: "float"; name: string; e: number; m: number; specials: "ieee" | "e4m3" | "none"; note: string };
type IntFmt = { kind: "int"; name: string; bits: number; note: string };
type Fmt = FloatFmt | IntFmt;

const formats: Fmt[] = [
  { kind: "float", name: "FP16", e: 5, m: 10, specials: "ieee", note: "16 bits, the classic half precision" },
  { kind: "float", name: "BF16", e: 8, m: 7, specials: "ieee", note: "16 bits, more exponent, less mantissa" },
  { kind: "float", name: "FP8 (E4M3)", e: 4, m: 3, specials: "e4m3", note: "8 bits: 4 exponent, 3 mantissa" },
  { kind: "float", name: "FP4 (E2M1)", e: 2, m: 1, specials: "none", note: "4 bits: only 8 positive values!" },
  { kind: "int", name: "INT8", bits: 8, note: "8 bits, whole numbers × a scale factor" },
];

type Entry = { v: number; e: number; m: number };
const cache = new Map<string, Entry[]>();

// Every positive value a small float format can represent, in ascending order
function table(f: FloatFmt): Entry[] {
  const key = f.name;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: Entry[] = [];
  const bias = 2 ** (f.e - 1) - 1;
  const maxE = 2 ** f.e - 1;
  for (let e = 0; e <= maxE; e++) {
    if (f.specials === "ieee" && e === maxE) continue; // infinity / NaN
    for (let m = 0; m < 2 ** f.m; m++) {
      if (f.specials === "e4m3" && e === maxE && m === 2 ** f.m - 1) continue; // NaN
      const frac = m / 2 ** f.m;
      const v = e === 0 ? frac * 2 ** (1 - bias) : (1 + frac) * 2 ** (e - bias);
      out.push({ v, e, m });
    }
  }
  cache.set(key, out);
  return out;
}

function nearest(list: Entry[], a: number): Entry {
  let lo = 0, hi = list.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (list[mid].v <= a) lo = mid;
    else hi = mid;
  }
  return Math.abs(list[lo].v - a) <= Math.abs(list[hi].v - a) ? list[lo] : list[hi];
}

function bitsOf(n: number, width: number) {
  return n.toString(2).padStart(width, "0").split("");
}

function fmtNum(x: number) {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-4) return x.toExponential(4);
  return Number(x.toPrecision(8)).toString();
}

const presets: [string, number][] = [
  ["π", Math.PI],
  ["0.001234", 0.001234],
  ["−2.71828", -2.71828],
  ["300", 300],
  ["70,000", 70000],
];

export default function NumberFormats() {
  const [raw, setRaw] = useState("3.14159265");
  const [fi, setFi] = useState(2);
  const [blockMax, setBlockMax] = useState(4); // log10-ish slider for INT8
  const f = formats[fi];
  const x = Number.isFinite(parseFloat(raw)) ? parseFloat(raw) : 0;

  const result = useMemo(() => {
    const neg = x < 0;
    const a = Math.abs(x);
    if (f.kind === "float") {
      const list = table(f);
      const max = list[list.length - 1].v;
      const overflow = a > max;
      const ent = overflow ? list[list.length - 1] : nearest(list, a);
      const stored = (neg ? -1 : 1) * ent.v;
      return {
        stored,
        overflow,
        max,
        minPos: list[1].v,
        count: 2 ** (1 + f.e + f.m),
        bits: [
          { b: neg ? "1" : "0", kind: "sign" as const },
          ...bitsOf(ent.e, f.e).map((b) => ({ b, kind: "exp" as const })),
          ...bitsOf(ent.m, f.m).map((b) => ({ b, kind: "man" as const })),
        ],
        scale: null as number | null,
        q: null as number | null,
      };
    }
    const biggest = Math.max(a, 10 ** blockMax / 100);
    const scale = biggest / 127;
    const q = Math.max(-127, Math.min(127, Math.round(x / scale)));
    const stored = q * scale;
    const twos = q < 0 ? 256 + q : q;
    return {
      stored,
      overflow: false,
      max: 127 * scale,
      minPos: scale,
      count: 256,
      bits: bitsOf(twos, 8).map((b, i) => ({ b, kind: i === 0 ? ("sign" as const) : ("int" as const) })),
      scale,
      q,
    };
  }, [x, f, blockMax]);

  const err = Math.abs(result.stored - x);
  const rel = x === 0 ? 0 : (err / Math.abs(x)) * 100;
  const bitCls = {
    sign: "bg-bad-soft text-bad border-bad/30",
    exp: "bg-accent-soft text-accent border-accent/30",
    man: "bg-bg-soft text-ink border-line",
    int: "bg-bg-soft text-ink border-line",
  };

  return (
    <Widget title="Squeeze a number into fewer bits" hint="Pick a number and a format">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          inputMode="decimal"
          className="w-36 rounded-lg border border-line bg-bg px-3 py-1.5 tabular-nums outline-none focus:border-accent"
          aria-label="Number to store"
        />
        {presets.map(([label, v]) => (
          <button key={label} onClick={() => setRaw(String(v))} className="rounded-lg border border-line px-2.5 py-1 hover:border-accent">
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 text-sm">
        {formats.map((fm, i) => (
          <button
            key={fm.name}
            onClick={() => setFi(i)}
            className={`rounded-lg border px-3 py-1 ${fi === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {fm.name}
          </button>
        ))}
      </div>
      <div className="mt-1.5 text-xs text-ink-faint">{f.note}</div>

      {f.kind === "int" && (
        <label className="mt-4 block text-sm">
          <div className="flex justify-between">
            <span>Biggest number sharing this scale factor</span>
            <span className="tabular-nums">{fmtNum(Math.max(Math.abs(x), 10 ** blockMax / 100))}</span>
          </div>
          <input type="range" className="w-full" min={0} max={7} step={0.25} value={blockMax} onChange={(e) => setBlockMax(+e.target.value)} />
          <div className="text-xs text-ink-faint">
            INT8 only has 255 steps. The scale factor stretches them to cover the biggest value in the group, so one large
            outlier makes every step huge.
          </div>
        </label>
      )}

      <div className="mt-5 flex flex-wrap gap-1">
        {result.bits.map((bit, i) => (
          <span key={i} className={`flex h-9 w-7 items-center justify-center rounded-md border font-mono text-sm ${bitCls[bit.kind]}`}>
            {bit.b}
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-bad/30 bg-bad-soft" /> sign</span>
        {f.kind === "float" ? (
          <>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-accent/30 bg-accent-soft" /> exponent (how big)</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-line bg-bg-soft" /> mantissa (the detail)</span>
          </>
        ) : (
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-line bg-bg-soft" /> value bits (q = {result.q})</span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">You wanted</div>
          <div className="text-lg tabular-nums">{fmtNum(x)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">{f.name} actually stores</div>
          <div className="text-lg tabular-nums text-accent">{fmtNum(result.stored)}</div>
          {f.kind === "int" && result.scale !== null && (
            <div className="text-[11px] text-ink-faint tabular-nums">= {result.q} × {fmtNum(result.scale)}</div>
          )}
        </div>
        <div className={`rounded-lg border p-3 ${rel > 5 ? "border-bad/40 bg-bad-soft" : "border-line"}`}>
          <div className="text-xs text-ink-faint">Rounding error</div>
          <div className="text-lg tabular-nums">{rel < 0.0001 && rel > 0 ? "< 0.0001" : rel.toFixed(rel < 1 ? 4 : 1)}%</div>
        </div>
      </div>

      {result.overflow && (
        <div className="mt-3 rounded-lg border border-bad/40 bg-bad-soft px-4 py-2 text-sm">
          ⚠ Too big! The largest value {f.name} can hold is {fmtNum(result.max)}, so this number gets clipped
          {f.kind === "float" && f.specials === "ieee" ? " (in practice it would overflow to infinity)" : ""}.
        </div>
      )}

      <p className="mt-4 text-xs text-ink-faint">
        {f.name} has {result.count.toLocaleString("en-US")} possible bit patterns. Its range runs from about {fmtNum(result.minPos)} to{" "}
        {fmtNum(result.max)}. Try π in every format, then try 70,000 in FP16 vs. BF16.
      </p>
    </Widget>
  );
}
