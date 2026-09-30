"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

const N = 4; // each dictionary entry stores the next 4 tokens

const scenarios = [
  {
    key: "code",
    label: "Editing code",
    task: "Add a tax parameter to this function",
    input: "def total ( items ) : return sum ( item . price for item in items )",
    output: "def total ( items , tax ) : return sum ( item . price for item in items ) * ( 1 + tax )",
  },
  {
    key: "prose",
    label: "Writing something new",
    task: "Summarize this sentence in your own words",
    input: "the cat sat on the mat and stared at the door for an hour",
    output: "a patient cat waited by the door for a long time",
  },
] as const;

type Pass = { key: string | null; drafts: string[]; accepted: number; bonus: string };

function buildDict(tokens: string[]) {
  const d = new Map<string, string[]>();
  tokens.forEach((t, i) => {
    if (!d.has(t) && i < tokens.length - 1) d.set(t, tokens.slice(i + 1, i + 1 + N));
  });
  return d;
}

// Run the whole generation up front; the UI just reveals it pass by pass
function simulate(input: string[], output: string[]) {
  const dict = buildDict(input);
  const passes: Pass[] = [];
  let pos = 0;
  while (pos < output.length) {
    const key = pos > 0 ? output[pos - 1] : null;
    const drafts = key ? dict.get(key) ?? [] : [];
    let accepted = 0;
    while (accepted < drafts.length && output[pos + accepted] === drafts[accepted]) accepted++;
    const bonus = output[pos + accepted];
    passes.push({ key, drafts, accepted, bonus });
    pos += accepted + (bonus ? 1 : 0);
  }
  return { dict, passes };
}

export default function NgramSpec() {
  const [si, setSi] = useState(0);
  const [shown, setShown] = useState(0);
  const sc = scenarios[si];
  const input = useMemo(() => sc.input.split(" "), [sc]);
  const output = useMemo(() => sc.output.split(" "), [sc]);
  const { dict, passes } = useMemo(() => simulate(input, output), [input, output]);
  const visible = passes.slice(0, shown);
  const tokensSoFar = visible.reduce((a, p) => a + p.accepted + (p.bonus ? 1 : 0), 0);
  const current = visible[visible.length - 1];
  const done = shown >= passes.length;
  const dictEntries = [...dict.entries()].slice(0, 8);

  return (
    <Widget title="N-gram speculation: copy from the prompt" hint="Step through the passes">
      <div className="flex flex-wrap gap-1.5 text-sm">
        {scenarios.map((s, i) => (
          <button
            key={s.key}
            onClick={() => { setSi(i); setShown(0); }}
            className={`rounded-lg border px-3 py-1 ${si === i ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-ink-soft">Prompt: “{sc.task}”</div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-bg-soft p-3 font-mono text-[12px]">
            {input.map((t, i) => (
              <span key={i} className={`rounded px-1 ${current?.key === t && current.drafts.length ? "bg-accent-soft text-accent" : ""}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[13px] font-semibold text-ink-soft">N-gram dictionary (built during prefill)</div>
          <div className="space-y-0.5 rounded-xl border border-line p-3 font-mono text-[12px]">
            {dictEntries.map(([k, v]) => (
              <div key={k} className={`flex gap-2 rounded px-1 ${current?.key === k ? "bg-accent-soft" : ""}`}>
                <span className="w-14 shrink-0 text-right text-accent">{k}</span>
                <span className="text-ink-faint">→</span>
                <span className="truncate">{v.join(" ")}</span>
              </div>
            ))}
            {dict.size > dictEntries.length && <div className="px-1 text-ink-faint">… {dict.size - dictEntries.length} more</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-bg-soft p-4">
        <div className="mb-2 text-[13px] font-semibold text-ink-soft">Model output</div>
        <div className="flex min-h-[2.5rem] flex-wrap gap-1 font-mono text-[13px]">
          {visible.map((p, pi) => (
            <span key={pi} className="flex gap-1 rounded-md border border-line bg-card px-1 py-0.5">
              {p.drafts.slice(0, p.accepted).map((t, i) => (
                <span key={i} className="text-good">{t}</span>
              ))}
              {p.bonus && <span>{p.bonus}</span>}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs text-ink-soft">
          {current ? (
            current.drafts.length ? (
              <>
                Last token <b className="font-mono">{current.key}</b> is in the dictionary, so its 4 followers were proposed as drafts:{" "}
                <b className="text-good">{current.accepted}</b> accepted.
              </>
            ) : (
              <>{current.key ? <>No dictionary entry for <b className="font-mono">{current.key}</b></> : "First token"}, so this pass made just one token.</>
            )
          ) : (
            "Each box is one forward pass. Green tokens came free from the dictionary."
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Forward passes</div>
          <div className="text-lg tabular-nums">{shown}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens written</div>
          <div className="text-lg tabular-nums">{tokensSoFar} / {output.length}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens per pass</div>
          <div className="text-lg tabular-nums text-accent">{shown ? (tokensSoFar / shown).toFixed(2) : "–"}</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={() => setShown(0)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Reset</button>
        <button onClick={() => setShown(passes.length)} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-accent">Finish</button>
        <button onClick={() => setShown((s) => Math.min(passes.length, s + 1))} disabled={done} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40">
          {done ? "Done" : "Next pass"}
        </button>
      </div>
    </Widget>
  );
}
