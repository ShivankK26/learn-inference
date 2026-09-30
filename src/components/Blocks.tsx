import type { ReactNode } from "react";

export function TLDR({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose rounded-2xl border border-accent/30 bg-accent-soft px-6 py-5">
      <div className="mb-1.5 font-sans text-sm font-semibold text-accent">In short</div>
      <div className="font-serif text-[1.3rem] leading-[1.55] text-ink">{children}</div>
    </div>
  );
}

export function Analogy({ title = "Think of it like…", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-soft px-6 py-5">
      <div className="mb-2 flex items-center gap-2 font-sans text-sm font-semibold text-ink-soft">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
        </svg>
        {title}
      </div>
      <div className="space-y-3 [&_p]:text-ink">{children}</div>
    </div>
  );
}

export function KeyPoints({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-6 py-5">
      <div className="mb-2 font-sans text-sm font-semibold text-ink-soft">Remember this</div>
      <div className="[&_li]:mt-1.5">{children}</div>
    </div>
  );
}

export function Note({ kind = "tip", children }: { kind?: "tip" | "warn" | "deeper"; children: ReactNode }) {
  const style = {
    tip: { label: "Tip", cls: "border-good/40 bg-good-soft", lcls: "text-good" },
    warn: { label: "Watch out", cls: "border-bad/40 bg-bad-soft", lcls: "text-bad" },
    deeper: { label: "Going deeper (optional)", cls: "border-line bg-bg-soft", lcls: "text-ink-soft" },
  }[kind];
  return (
    <div className={`rounded-xl border px-5 py-4 text-[0.98rem] ${style.cls}`}>
      <div className={`mb-1 font-sans text-sm font-semibold ${style.lcls}`}>{style.label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** Inline term with a hover/tap definition */
export function Term({ children, def }: { children: ReactNode; def: string }) {
  return (
    <span className="group relative cursor-help underline decoration-ink-faint decoration-dotted decoration-1 underline-offset-[5px]" tabIndex={0}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-card p-3 font-sans text-sm leading-snug font-normal no-underline text-ink opacity-0 shadow-lg transition group-hover:opacity-100 group-focus:opacity-100">
        {def}
      </span>
    </span>
  );
}

export function Compute({ children }: { children: ReactNode }) {
  return <span className="rounded bg-compute-soft px-1 font-medium text-compute">{children}</span>;
}

export function Memory({ children }: { children: ReactNode }) {
  return <span className="rounded bg-memory-soft px-1 font-medium text-memory">{children}</span>;
}

export function Widget({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <figure className="widget my-9 overflow-hidden rounded-2xl border border-line bg-card font-sans shadow-sm">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line bg-bg-soft px-5 py-3">
        <span className="flex items-center gap-2 font-semibold">
          <span className="whitespace-nowrap text-sm font-medium text-accent">Try it</span>
          <span className="text-ink-faint">·</span>
          {title}
        </span>
        {hint && <span className="text-sm text-ink-faint">{hint}</span>}
      </figcaption>
      <div className="p-5 text-[0.95rem] leading-normal">{children}</div>
    </figure>
  );
}
