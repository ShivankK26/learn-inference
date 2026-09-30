"use client";

import { useMemo, useState } from "react";
import { Widget } from "../Blocks";

// A toy imitation of subword tokenization: common short words stay whole,
// long or rare words get split into chunks. Real tokenizers use learned vocabularies.
const common = new Set(
  "the a an and or but of to in on at is it was be are i you he she we they this that with for as by from not have has had do does did can will would could should my your our their me him her them what which who when where how why so if then than just very about into over after before because there here all any some no yes one two new good".split(" ")
);

function toyTokenize(text: string): string[] {
  const parts = text.match(/\s*[A-Za-z]+|\s*\d|\s*[^\sA-Za-z\d]|\s+$/g) ?? [];
  const out: string[] = [];
  for (const p of parts) {
    const word = p.trim().toLowerCase();
    if (!/^[a-z]+$/.test(word) || common.has(word) || word.length <= 6) {
      out.push(p);
      continue;
    }
    const lead = p.match(/^\s*/)![0];
    const w = p.trim();
    const chunks: string[] = [];
    let i = 0;
    while (i < w.length) {
      const size = i === 0 ? Math.min(5, w.length) : 4;
      chunks.push(w.slice(i, i + size));
      i += size;
    }
    // avoid a tiny trailing chunk
    if (chunks.length > 1 && chunks[chunks.length - 1].length < 2) {
      const last = chunks.pop()!;
      chunks[chunks.length - 1] += last;
    }
    chunks[0] = lead + chunks[0];
    out.push(...chunks);
  }
  return out;
}

const palette = ["bg-compute-soft", "bg-memory-soft", "bg-accent-soft", "bg-good-soft"];

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 50021;
  return h;
}

export default function Tokenizer() {
  const [text, setText] = useState("Inference engineering is surprisingly understandable!");
  const tokens = useMemo(() => toyTokenize(text), [text]);
  return (
    <Widget title="Turn text into tokens" hint="Type anything">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
      <div className="mt-4 flex flex-wrap gap-1 font-mono text-sm">
        {tokens.map((t, i) => (
          <span key={i} className={`rounded px-1 py-0.5 whitespace-pre ${palette[i % palette.length]}`}>
            {t.replace(/ /g, "·")}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1 font-mono text-xs text-ink-faint">
        {tokens.map((t, i) => (
          <span key={i} className="rounded border border-line px-1">
            {hash(t)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-ink-soft">
        <span>
          <b className="text-ink">{text.length}</b> characters → <b className="text-ink">{tokens.length}</b> tokens
        </span>
        <span className="text-xs text-ink-faint">Toy tokenizer for intuition only; real ones differ slightly. · = space</span>
      </div>
    </Widget>
  );
}
