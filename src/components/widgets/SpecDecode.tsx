"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

const TEXT = "Speculative decoding lets a small fast helper guess the next few words so the big model can check them all at once instead of writing every single word by itself which saves a lot of time whenever the guesses are good".split(" ");
const WRONG = ["banana", "purple", "quickly", "under", "seven", "river", "maybe", "chair", "loud", "cloud"];

type Piece = { w: string; kind: "draft" | "target" };
type Step = { drafts: { w: string; ok: boolean | null }[]; bonus: string | null; accepted: number };

// Expected tokens per target forward pass with k drafts and per-token acceptance p
function expectedTokens(k: number, p: number) {
  if (p >= 0.9999) return k + 1;
  return (1 - p ** (k + 1)) / (1 - p);
}

export default function SpecDecode() {
  const [k, setK] = useState(4);
  const [p, setP] = useState(0.7);
  const [cost, setCost] = useState(0.08);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Piece[]>([]);
  const [passes, setPasses] = useState(0);
  const [last, setLast] = useState<Step | null>(null);

  const done = out.length >= TEXT.length;
  const verifyCost = busy ? 0.3 : 0.02; // extra cost of checking each draft token
  const speedup = (kk: number) => expectedTokens(kk, p) / (1 + kk * (cost + verifyCost));
  const bestK = [1, 2, 3, 4, 5, 6, 7, 8].reduce((b, kk) => (speedup(kk) > speedup(b) ? kk : b), 1);

  function step() {
    if (done) return;
    const pos = out.length;
    const drafts: Step["drafts"] = [];
    let accepted = 0;
    let rejected = false;
    for (let i = 0; i < k && pos + i < TEXT.length; i++) {
      const right = Math.random() < p;
      const w = right ? TEXT[pos + i] : WRONG[Math.floor(Math.random() * WRONG.length)];
      if (rejected) {
        drafts.push({ w, ok: null }); // thrown away without checking
      } else if (right) {
        drafts.push({ w, ok: true });
        accepted++;
      } else {
        drafts.push({ w, ok: false });
        rejected = true;
      }
    }
    const bonus = TEXT[pos + accepted] ?? null;
    const pieces: Piece[] = TEXT.slice(pos, pos + accepted).map((w) => ({ w, kind: "draft" }));
    if (bonus) pieces.push({ w: bonus, kind: "target" });
    setOut((o) => [...o, ...pieces]);
    setPasses((n) => n + 1);
    setLast({ drafts, bonus, accepted });
  }

  function reset() {
    setOut([]);
    setPasses(0);
    setLast(null);
  }

  const bars = [1, 2, 3, 4, 5, 6, 7, 8];
  const maxS = Math.max(...bars.map(speedup), 1.2);

  return (
    <Widget title="Speculative decoding, one forward pass at a time" hint="Press Next pass">
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <label>
          <div className="flex justify-between"><span>Draft tokens per pass</span><span className="tabular-nums">{k}</span></div>
          <input type="range" className="w-full" min={1} max={8} value={k} onChange={(e) => setK(+e.target.value)} />
        </label>
        <label>
          <div className="flex justify-between"><span>Acceptance rate</span><span className="tabular-nums">{Math.round(p * 100)}%</span></div>
          <input type="range" className="w-full" min={0.1} max={0.95} step={0.05} value={p} onChange={(e) => setP(+e.target.value)} />
        </label>
        <label>
          <div className="flex justify-between"><span>Cost of one draft token</span><span className="tabular-nums">{Math.round(cost * 100)}% of a pass</span></div>
          <input type="range" className="w-full" min={0.01} max={0.3} step={0.01} value={cost} onChange={(e) => setCost(+e.target.value)} />
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-bg-soft p-4">
        <div className="mb-2 text-[13px] font-semibold text-ink-soft">Last pass</div>
        {last ? (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {last.drafts.map((d, i) => (
              <span
                key={i}
                className={`rounded-md border px-2 py-0.5 ${
                  d.ok === true ? "border-good/40 bg-good-soft text-good" : d.ok === false ? "border-bad/40 bg-bad-soft text-bad line-through" : "border-line text-ink-faint line-through"
                }`}
              >
                {d.w} {d.ok === true ? "✓" : d.ok === false ? "✗" : ""}
              </span>
            ))}
            {last.bonus && (
              <>
                <span className="text-ink-faint">then the big model adds</span>
                <span className="rounded-md border border-accent/40 bg-accent-soft px-2 py-0.5 text-accent">{last.bonus}</span>
              </>
            )}
            <span className="ml-auto text-xs text-ink-faint">
              {last.accepted + (last.bonus ? 1 : 0)} token{last.accepted + (last.bonus ? 1 : 0) === 1 ? "" : "s"} from one pass
            </span>
          </div>
        ) : (
          <div className="text-sm text-ink-faint">The helper will guess {k} words; the big model checks them all in one pass.</div>
        )}

        <div className="mt-4 min-h-[4.5rem] font-serif text-lg leading-relaxed">
          {out.map((piece, i) => (
            <span key={i} className={piece.kind === "draft" ? "text-good" : ""}>
              {piece.w}{" "}
            </span>
          ))}
          {!done && <span className="inline-block h-5 w-2 translate-y-0.5 animate-pulse bg-memory" />}
        </div>
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-ink-soft">
          <span><span className="text-good">green</span> = accepted draft token</span>
          <span>regular text = token the big model produced itself</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Forward passes</div>
          <div className="text-lg tabular-nums">{passes}</div>
          <div className="text-[11px] text-ink-faint">plain decode would need {out.length}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens per pass</div>
          <div className="text-lg tabular-nums text-accent">{passes ? (out.length / passes).toFixed(2) : "–"}</div>
          <div className="text-[11px] text-ink-faint">expected {expectedTokens(k, p).toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Estimated speedup</div>
          <div className={`text-lg tabular-nums ${speedup(k) < 1 ? "text-bad" : "text-good"}`}>{speedup(k).toFixed(2)}×</div>
          <div className="text-[11px] text-ink-faint">after paying for drafts</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
          <span className="font-semibold text-ink-soft">Speedup by number of draft tokens</span>
          <label className="flex items-center gap-2 text-ink-soft">
            <input type="checkbox" checked={busy} onChange={(e) => setBusy(e.target.checked)} />
            Busy server (big batches, no spare compute)
          </label>
        </div>
        <div className="flex h-28 items-end gap-2">
          {bars.map((kk) => {
            const s = speedup(kk);
            return (
              <button key={kk} onClick={() => setK(kk)} className="flex flex-1 flex-col items-center gap-1" aria-label={`${kk} draft tokens`}>
                <span className="text-[11px] tabular-nums text-ink-faint">{s.toFixed(2)}×</span>
                <span
                  className={`w-full rounded-t ${kk === k ? "bg-accent" : s < 1 ? "bg-bad/50" : "bg-accent/35"}`}
                  style={{ height: `${Math.max(4, (s / maxS) * 72).toFixed(1)}px` }}
                />
                <span className={`text-xs tabular-nums ${kk === bestK ? "font-semibold text-accent" : "text-ink-faint"}`}>{kk}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-ink-faint">
          Best here: {bestK} draft token{bestK === 1 ? "" : "s"}. Guesses deep in the sequence rarely survive, so short drafts with a
          high acceptance rate win.{busy ? " On a busy server, checking drafts steals compute from other users, and speculation stops paying off." : ""}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-bg-soft px-4 py-3 text-[13px] leading-relaxed text-ink-soft tabular-nums">
        <div>
          Expected tokens per pass = (1 − α<sup>k+1</sup>) ÷ (1 − α) = (1 − {p.toFixed(2)}
          <sup>{k + 1}</sup>) ÷ {(1 - p).toFixed(2)} = <b className="text-ink">{expectedTokens(k, p).toFixed(2)}</b>
        </div>
        <div>
          Speedup = tokens per pass ÷ (1 + k × (draft cost + verify cost)) = {expectedTokens(k, p).toFixed(2)} ÷ (1 + {k} × (
          {cost.toFixed(2)} + {verifyCost.toFixed(2)})) = <b className="text-ink">{speedup(k).toFixed(2)}×</b>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={reset} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Reset</button>
        <button onClick={step} disabled={done} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40">
          {done ? "Done" : "Next pass"}
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Costs are illustrative. The shape of the trade-off is what matters.</p>
    </Widget>
  );
}
