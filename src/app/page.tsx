import Link from "next/link";
import { course, allLessons } from "@/lib/course";
import { DoneCheck, ProgressBar } from "@/components/Progress";

export default function Home() {
  const first = allLessons.find((l) => l.ready)!;
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
        <p className="mb-5 text-base font-medium text-accent">A plain-English course on serving AI models</p>
        <h1 className="max-w-3xl font-serif text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-[4rem]">
          How AI models are served, explained from zero.
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-[1.2rem] leading-[1.6] text-ink-soft">
          Every time you chat with an AI, a GPU somewhere does a surprising amount of work to answer you.
          This course walks you through the whole book <cite>Inference Engineering</cite>, from
          first principles, with analogies, pictures, and things you can poke at.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={`/learn/${first.slug}`}
            className="rounded-lg bg-accent px-5 py-3 font-medium text-bg shadow-sm transition hover:opacity-90"
          >
            Start lesson 1 →
          </Link>
          <ProgressBar total={allLessons.length} />
        </div>
      </section>

      {/* How lessons work */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["TL;DR first", "Every lesson opens with the whole idea in two sentences."],
            ["An analogy", "A kitchen, a library, a highway: something you already know."],
            ["Play with it", "Sliders and simulators so you feel how it works."],
            ["Check yourself", "A quick quiz at the end, with explanations."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-card p-5">
              <div className="font-semibold">{t}</div>
              <div className="mt-1 text-sm text-ink-soft">{d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-bg-soft px-5 py-3 text-sm text-ink-soft">
          <span className="font-medium text-ink">Color key used everywhere:</span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-compute" /> Compute: the GPU doing math
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-memory" /> Memory: the GPU moving data around
          </span>
        </div>
      </section>

      {/* Course map */}
      <section id="course" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
        <h2 className="mb-8 font-serif text-[2rem] font-semibold tracking-[-0.01em]">The course</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {course.map((ch) => {
            const ready = ch.lessons.some((l) => l.ready);
            return (
              <div key={ch.num} className={`rounded-2xl border border-line bg-card p-6 ${ready ? "" : "opacity-75"}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-sm text-ink-faint">Chapter {ch.num}</div>
                  {!ready && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint">Coming soon</span>
                  )}
                </div>
                <h3 className="mt-1 font-serif text-2xl font-semibold">{ch.title}</h3>
                <p className="mt-1 font-serif text-[1.05rem] text-ink-soft italic">{ch.question}</p>
                <ol className="mt-5 space-y-1">
                  {ch.lessons.map((l) => {
                    const inner = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{l.title}</span>
                          <span className="block text-sm text-ink-soft">{l.blurb}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-ink-faint">
                          <DoneCheck slug={l.slug} />
                          {l.minutes} min
                        </span>
                      </>
                    );
                    return (
                      <li key={l.slug}>
                        {l.ready ? (
                          <Link
                            href={`/learn/${l.slug}`}
                            className="-mx-3 flex items-start gap-4 rounded-lg px-3 py-2.5 transition hover:bg-bg-soft"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="-mx-3 flex items-start gap-4 px-3 py-2.5 text-ink-soft">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
