import type { Metadata } from "next";
import GlossaryList from "./GlossaryList";

export const metadata: Metadata = { title: "Glossary · Inference, Simplified" };

export default function GlossaryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Glossary</h1>
      <p className="mt-3 text-lg text-ink-soft">
        Every term, in plain words. The glossary grows as new chapters are added.
      </p>
      <GlossaryList />
    </main>
  );
}
