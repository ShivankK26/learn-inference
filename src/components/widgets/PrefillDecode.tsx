"use client";

import { useEffect, useRef, useState } from "react";
import { Widget } from "../Blocks";

const promptWords = "Explain what inference means for AI models in simple words please and keep the answer short and friendly for a total beginner who is curious about how chatbots actually work behind the scenes today".split(" ");
const answerWords = "Inference is when a trained model answers you. It reads your whole message at once, then writes its reply one small piece at a time, each piece depending on everything before it, until it decides it is done.".split(" ");

// Illustrative timings (ms), not real hardware numbers
const PREFILL_BASE = 250;
const PREFILL_PER_TOKEN = 8;

export default function PrefillDecode() {
  const [promptLen, setPromptLen] = useState(16);
  const [outLen, setOutLen] = useState(20);
  const [msPerToken, setMsPerToken] = useState(120);
  const [t, setT] = useState<number | null>(null);
  const start = useRef(0);
  const raf = useRef(0);

  const prefillMs = PREFILL_BASE + PREFILL_PER_TOKEN * promptLen;
  const totalMs = prefillMs + outLen * msPerToken;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function run() {
    cancelAnimationFrame(raf.current);
    start.current = performance.now();
    const tick = () => {
      const e = performance.now() - start.current;
      setT(Math.min(e, totalMs));
      if (e < totalMs) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  const elapsed = t ?? 0;
  const inPrefill = t !== null && elapsed < prefillMs;
  const generated = t === null ? 0 : Math.max(0, Math.min(outLen, Math.floor((elapsed - prefillMs) / msPerToken) + (elapsed >= prefillMs ? 1 : 0)));
  const prefillPct = t === null ? 0 : Math.min(1, elapsed / prefillMs);
  const done = t !== null && elapsed >= totalMs;

  return (
    <Widget title="Watch a request: prefill, then decode" hint="Press Run">
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <label>
          <div className="flex justify-between"><span>Prompt length</span><span className="tabular-nums">{promptLen} tokens</span></div>
          <input type="range" className="w-full" min={4} max={promptWords.length} value={promptLen} onChange={(e) => setPromptLen(+e.target.value)} />
        </label>
        <label>
          <div className="flex justify-between"><span>Answer length</span><span className="tabular-nums">{outLen} tokens</span></div>
          <input type="range" className="w-full" min={4} max={answerWords.length} value={outLen} onChange={(e) => setOutLen(+e.target.value)} />
        </label>
        <label>
          <div className="flex justify-between"><span>Time per output token</span><span className="tabular-nums">{msPerToken} ms</span></div>
          <input type="range" className="w-full" min={30} max={300} step={10} value={msPerToken} onChange={(e) => setMsPerToken(+e.target.value)} />
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-bg-soft p-4">
        <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
          <span className="text-compute">Step 1 · Prefill: read the whole prompt at once</span>
          {inPrefill && <span className="text-compute">working…</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {promptWords.slice(0, promptLen).map((w, i) => (
            <span
              key={i}
              className="rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors duration-200"
              style={{
                background: prefillPct >= 1 ? "var(--compute-soft)" : `color-mix(in srgb, var(--compute) ${prefillPct * 45}%, var(--card))`,
                color: prefillPct >= 1 ? "var(--compute)" : "var(--ink-soft)",
              }}
            >
              {w}
            </span>
          ))}
        </div>

        <div className="mt-5 mb-2 text-[13px] font-semibold text-memory">
          Step 2 · Decode: write the answer one token at a time
        </div>
        <div className="min-h-[3.5rem] font-serif text-lg leading-relaxed">
          {answerWords.slice(0, generated).map((w, i) => (
            <span key={i} className={i === generated - 1 && !done ? "rounded bg-memory-soft text-memory" : ""}>
              {w}{" "}
            </span>
          ))}
          {t !== null && !done && <span className="inline-block h-5 w-2 translate-y-0.5 animate-pulse bg-memory" />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Time to first token</div>
          <div className="tabular-nums text-lg text-compute">{t !== null && generated > 0 ? `${prefillMs} ms` : "–"}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Tokens per second</div>
          <div className="tabular-nums text-lg text-memory">{(1000 / msPerToken).toFixed(1)}</div>
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="text-xs text-ink-faint">Total time</div>
          <div className="tabular-nums text-lg">{t !== null ? `${(elapsed / 1000).toFixed(2)} s` : "–"}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-ink-faint">Timings are illustrative. Notice how the prompt is processed in one go, but the answer drips out.</span>
        <button onClick={run} className="shrink-0 rounded-lg bg-accent px-5 py-2 font-medium text-bg hover:opacity-90">
          {t === null ? "Run" : "Run again"}
        </button>
      </div>
    </Widget>
  );
}
