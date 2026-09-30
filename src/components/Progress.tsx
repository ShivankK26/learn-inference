"use client";

import { useEffect, useState } from "react";

const KEY = "completed-lessons";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("progress-change"));
  } catch {}
}

export function useCompleted() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setDone(read());
    sync();
    window.addEventListener("progress-change", sync);
    return () => window.removeEventListener("progress-change", sync);
  }, []);
  return done;
}

export function DoneCheck({ slug }: { slug: string }) {
  const done = useCompleted().includes(slug);
  if (!done) return null;
  return (
    <span title="Completed" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-good text-[11px] font-bold text-bg">
      ✓
    </span>
  );
}

export function ProgressBar({ total }: { total: number }) {
  const n = useCompleted().length;
  const pct = Math.min(100, Math.round((n / total) * 100));
  return (
    <div className="flex items-center gap-3 text-sm text-ink-soft">
      <div className="h-2 w-40 overflow-hidden rounded-full bg-bg-soft border border-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span>
        {n} of {total} lessons done
      </span>
    </div>
  );
}

export function MarkComplete({ slug }: { slug: string }) {
  const done = useCompleted().includes(slug);
  return (
    <button
      onClick={() => {
        const list = read();
        write(done ? list.filter((s) => s !== slug) : [...list, slug]);
      }}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        done ? "border-good bg-good-soft text-good" : "border-line bg-card hover:border-accent hover:text-accent"
      }`}
    >
      {done ? "✓ Completed" : "Mark lesson as complete"}
    </button>
  );
}
