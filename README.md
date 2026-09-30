# Inference, Simplified

A plain-English, interactive study companion to *Inference Engineering* by Philip Kiely.
Built with Next.js 16 + MDX + Tailwind. Fully static, so it deploys to Vercel with zero config.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

## How it's organized

| Path | What it is |
|---|---|
| `src/lib/course.ts` | The course map: every chapter and lesson. `ready: true` makes a lesson live. |
| `src/content/<slug>.mdx` | One file per lesson, written in Markdown + components. |
| `src/components/Blocks.tsx` | Lesson building blocks: `<TLDR>`, `<Analogy>`, `<KeyPoints>`, `<Note>`, `<Term>`, `<Compute>`, `<Memory>` |
| `src/components/Quiz.tsx` | End-of-lesson quiz |
| `src/components/widgets/` | Interactive demos (roofline, KV cache, sampler, …) |
| `src/mdx-components.tsx` | Registers components so lessons can use them without imports |
| `src/lib/glossary.ts` | Glossary entries |

## Add a lesson

1. Write `src/content/<slug>.mdx` (copy an existing lesson for the structure: TL;DR → explanation + analogy → widget → key points → quiz).
2. Set `ready: true` for that slug in `src/lib/course.ts`.
3. If you built a new widget, register it in `src/mdx-components.tsx`.

## Deploy

Push to GitHub, then import the repo in Vercel. No settings needed.
