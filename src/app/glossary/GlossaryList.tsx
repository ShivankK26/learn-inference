"use client";

import Link from "next/link";
import { useState } from "react";
import { glossary } from "@/lib/glossary";
import { readyLessons } from "@/lib/course";

export default function GlossaryList() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const items = [...glossary]
    .sort((a, b) => a.term.localeCompare(b.term))
    .filter((e) => !query || e.term.toLowerCase().includes(query) || e.def.toLowerCase().includes(query));

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms…"
        className="mt-8 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-accent"
      />
      <dl className="mt-8 divide-y divide-line">
        {items.map((e) => {
          const lesson = readyLessons.find((l) => l.slug === e.lesson);
          return (
            <div key={e.term} className="py-4">
              <dt className="font-semibold">{e.term}</dt>
              <dd className="mt-1 text-ink-soft">
                {e.def}
                {lesson && (
                  <Link href={`/learn/${lesson.slug}`} className="ml-2 whitespace-nowrap text-sm text-accent hover:underline">
                    Learn more →
                  </Link>
                )}
              </dd>
            </div>
          );
        })}
        {items.length === 0 && <p className="py-6 text-ink-faint">No matching terms yet.</p>}
      </dl>
    </>
  );
}
