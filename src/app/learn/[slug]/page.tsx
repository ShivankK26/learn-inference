import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { course, findLesson, readyLessons } from "@/lib/course";
import { DoneCheck, MarkComplete } from "@/components/Progress";

export const dynamicParams = false;

export function generateStaticParams() {
  return readyLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = findLesson(slug);
  return { title: found ? `${found.lesson.title} · Inference, Simplified` : "Inference, Simplified" };
}

export default async function LessonPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const found = findLesson(slug);
  if (!found) notFound();
  const { lesson, prev, next } = found;
  const { default: Content } = await import(`@/content/${slug}.mdx`);

  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4 sm:px-6">
      {/* Sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto py-10 lg:block">
        {course.map((ch) => (
          <div key={ch.num} className="mb-6">
            <div className="mb-1.5 px-2 text-[13px] font-semibold text-ink">
              <span className="mr-1.5 tabular-nums text-ink-faint">{ch.num}</span>
              {ch.title}
            </div>
            <ul className="space-y-0.5 text-sm">
              {ch.lessons.map((l) => (
                <li key={l.slug}>
                  {l.ready ? (
                    <Link
                      href={`/learn/${l.slug}`}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${
                        l.slug === slug ? "bg-accent-soft font-medium text-accent" : "text-ink-soft hover:bg-bg-soft hover:text-ink"
                      }`}
                    >
                      <span>{l.title}</span>
                      <DoneCheck slug={l.slug} />
                    </Link>
                  ) : (
                    <span className="block px-2 py-1 text-ink-faint/70">{l.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Lesson */}
      <main className="min-w-0 flex-1 py-10 sm:py-14">
        <article className="mx-auto max-w-[41rem]">
          <div className="mb-3 text-sm font-medium text-accent">
            Chapter {lesson.chapter.num} · {lesson.chapter.title}
          </div>
          <h1 className="font-serif text-[2.4rem] leading-[1.1] font-semibold tracking-[-0.015em] text-balance sm:text-[3.1rem]">{lesson.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-faint">
            <span>{lesson.minutes} min read</span>
            <span>Book: {lesson.bookSections}</span>
          </div>
          <div className="prose mt-10">
            <Content />
          </div>

          <div className="mt-14 flex justify-center">
            <MarkComplete slug={lesson.slug} />
          </div>

          <nav className="mt-10 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="rounded-xl border border-line bg-card p-4 hover:border-accent">
                <div className="text-xs text-ink-faint">← Previous</div>
                <div className="mt-1 font-medium">{prev.title}</div>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/learn/${next.slug}`} className="rounded-xl border border-line bg-card p-4 text-right hover:border-accent">
                <div className="text-xs text-ink-faint">Next →</div>
                <div className="mt-1 font-medium">{next.title}</div>
              </Link>
            ) : (
              <Link href="/reading" className="rounded-xl border border-line bg-card p-4 text-right hover:border-accent">
                <div className="text-xs text-ink-faint">You finished the course →</div>
                <div className="mt-1 font-medium">Where to go next: further reading</div>
              </Link>
            )}
          </nav>
        </article>
      </main>
    </div>
  );
}
