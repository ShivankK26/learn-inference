import type { Metadata } from "next";
import { nextBooks, sections, type Item } from "@/lib/reading";

export const metadata: Metadata = { title: "Further reading · Inference, Simplified" };

function Row({ item }: { item: Item }) {
  return (
    <li className="py-3">
      <a href={item.url} target="_blank" rel="noreferrer" className="group block">
        <span className="font-serif text-[1.08rem] leading-snug text-ink group-hover:text-accent group-hover:underline group-hover:underline-offset-4">
          {item.title}
        </span>
        {item.start && (
          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-medium text-accent">Start here</span>
        )}
        <span className="mt-0.5 block text-sm text-ink-faint">{item.by}</span>
      </a>
    </li>
  );
}

export default function ReadingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-[2.6rem] leading-tight font-semibold tracking-[-0.015em]">Further reading</h1>
      <p className="mt-4 font-serif text-[1.15rem] leading-relaxed text-ink-soft">
        Every resource the book recommends in Appendix B, grouped the same way. If you&rsquo;re new, look for the{" "}
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-sans text-sm font-medium text-accent">Start here</span> picks.
        They&rsquo;re the friendliest way into each topic.
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold">Your next book</h2>
        <p className="mt-2 text-ink-soft">The author’s three recommendations for what to read after this one.</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {nextBooks.map((b) => <Row key={b.title} item={b} />)}
        </ul>
      </section>

      {sections.map((s) => (
        <section key={s.name} className="mt-14">
          <h2 className="font-serif text-2xl font-semibold">{s.name}</h2>
          <p className="mt-2 text-ink-soft">{s.why}</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {s.items.map((it) => <Row key={it.title} item={it} />)}
          </ul>
        </section>
      ))}
    </main>
  );
}
