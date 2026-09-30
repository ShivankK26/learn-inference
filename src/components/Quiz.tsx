"use client";

import { useState } from "react";

export type Question = {
  q: string;
  options: string[];
  answer: number;
  why: string;
};

export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));
  const score = picked.filter((p, i) => p === questions[i].answer).length;
  const finished = picked.every((p) => p !== null);

  return (
    <div className="my-10 rounded-2xl border border-line bg-card p-6 font-sans">
      <div className="mb-5 flex items-baseline justify-between">
        <div className="font-serif text-2xl font-semibold">Check yourself</div>
        {finished && (
          <div className="text-sm text-ink-soft">
            {score}/{questions.length} {score === questions.length ? "🎉" : ""}
          </div>
        )}
      </div>
      <ol className="space-y-7" style={{ listStyle: "none", paddingLeft: 0 }}>
        {questions.map((item, qi) => {
          const p = picked[qi];
          return (
            <li key={qi}>
              <div className="mb-3 font-medium">
                {qi + 1}. {item.q}
              </div>
              <div className="grid gap-2">
                {item.options.map((opt, oi) => {
                  const chosen = p === oi;
                  const correct = oi === item.answer;
                  let cls = "border-line hover:border-accent";
                  if (p !== null) {
                    if (correct) cls = "border-good bg-good-soft";
                    else if (chosen) cls = "border-bad bg-bad-soft";
                    else cls = "border-line opacity-60";
                  }
                  return (
                    <button
                      key={oi}
                      disabled={p !== null}
                      onClick={() => setPicked((arr) => arr.map((v, i) => (i === qi ? oi : v)))}
                      className={`rounded-lg border px-4 py-2.5 text-left text-[0.97rem] transition ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {p !== null && (
                <div className="mt-3 text-[0.95rem] text-ink-soft">
                  <span className={p === item.answer ? "font-semibold text-good" : "font-semibold text-bad"}>
                    {p === item.answer ? "Correct. " : "Not quite. "}
                  </span>
                  {item.why}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {finished && (
        <button
          onClick={() => setPicked(questions.map(() => null))}
          className="mt-6 text-sm text-accent underline underline-offset-4"
        >
          Reset quiz
        </button>
      )}
    </div>
  );
}
