"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

type Engine = "vLLM" | "SGLang" | "TensorRT-LLM";

const questions = [
  {
    key: "model",
    q: "What are you serving?",
    options: [
      { v: "llm", label: "A regular LLM" },
      { v: "moe", label: "A giant MoE model (DeepSeek, Kimi…)" },
      { v: "media", label: "An image or video model" },
      { v: "omni", label: "An “omni” model (many input/output types)" },
    ],
  },
  {
    key: "hw",
    q: "What hardware?",
    options: [
      { v: "hopper", label: "NVIDIA Hopper or newer (H100, B200…)" },
      { v: "old", label: "An older or smaller NVIDIA GPU" },
      { v: "amd", label: "AMD GPUs" },
      { v: "tpu", label: "Google TPUs" },
    ],
  },
  {
    key: "goal",
    q: "What matters most?",
    options: [
      { v: "fast", label: "Up and running fast" },
      { v: "perf", label: "The best possible performance" },
      { v: "custom", label: "Deep control and customization" },
    ],
  },
  {
    key: "scale",
    q: "How big is the deployment?",
    options: [
      { v: "normal", label: "Normal traffic" },
      { v: "huge", label: "Huge traffic on a big model" },
    ],
  },
] as const;

type Answers = { model: string; hw: string; goal: string; scale: string };

function recommend(a: Answers) {
  const score: Record<Engine, number> = { vLLM: 0, SGLang: 0, "TensorRT-LLM": 0 };
  const out: Record<Engine, string | null> = { vLLM: null, SGLang: null, "TensorRT-LLM": null };
  const why: string[] = [];

  // hard compatibility rules
  if (a.hw === "amd") { out["TensorRT-LLM"] = "NVIDIA GPUs only"; }
  if (a.hw === "tpu") { out["TensorRT-LLM"] = "NVIDIA GPUs only"; out.SGLang = "Supports NVIDIA and AMD, not TPUs"; }
  if (a.model === "media") { out["TensorRT-LLM"] = "Doesn’t support image or video models"; }

  if (a.model === "moe") { score.SGLang += 3; why.push("SGLang has invested heavily in large MoE models and multi-node setups for high throughput."); }
  if (a.model === "media") { score.SGLang += 2; score.vLLM += 1; why.push("SGLang Diffusion and vLLM Omni both handle image and video models. TensorRT or plain PyTorch are also options."); }
  if (a.model === "omni") { score.vLLM += 3; why.push("vLLM Omni supports image, audio and video inputs and outputs."); }
  if (a.hw === "old") { score.vLLM += 2; why.push("On smaller or older GPUs, TensorRT-LLM’s performance edge mostly disappears."); }
  if (a.hw === "hopper" && a.goal === "perf") { score["TensorRT-LLM"] += 3; why.push("On Hopper or newer, TensorRT-LLM’s NVIDIA-written kernels usually give the best performance, if you’re willing to put in the extra work."); }
  if (a.goal === "fast") { score.vLLM += 2; score.SGLang += 1; why.push("vLLM is the easiest to stand up, with day-zero support for almost any open model."); }
  if (a.goal === "custom") { score.SGLang += 2; why.push("SGLang is built for swapping out individual components without rewriting everything."); }
  if (a.goal === "perf" && a.hw !== "hopper") score.SGLang += 1;

  const ranked = (Object.keys(score) as Engine[]).filter((e) => !out[e]).sort((x, y) => score[y] - score[x]);
  const dynamo = a.scale === "huge" && a.model !== "media";
  return { pick: ranked[0], ranked, out, why, dynamo };
}

export default function EngineChooser() {
  const [a, setA] = useState<Answers>({ model: "llm", hw: "hopper", goal: "fast", scale: "normal" });
  const r = recommend(a);
  return (
    <Widget title="Which inference engine should I use?" hint="Answer four questions">
      <div className="grid gap-4 sm:grid-cols-2">
        {questions.map((q) => (
          <div key={q.key}>
            <div className="mb-1.5 text-[13px] font-medium text-ink-soft">{q.q}</div>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((o) => {
                const on = a[q.key] === o.v;
                return (
                  <button
                    key={o.v}
                    onClick={() => setA((s) => ({ ...s, [q.key]: o.v }))}
                    className={`rounded-lg border px-2.5 py-1 text-left text-sm ${on ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl bg-bg-soft p-5">
        <div className="text-sm text-ink-faint">Good starting point</div>
        <div className="font-serif text-3xl font-semibold text-accent">{r.pick}</div>
        {r.dynamo && (
          <div className="mt-1 text-sm">
            …plus <b>NVIDIA Dynamo</b> on top, to coordinate KV-aware routing, disaggregation and multi-node serving at that scale.
          </div>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {r.why.map((w) => <li key={w}>{w}</li>)}
          {(Object.keys(r.out) as Engine[]).filter((e) => r.out[e]).map((e) => (
            <li key={e}><b className="text-ink">{e}</b> is ruled out: {r.out[e]}.</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-faint">
          A rule of thumb, not a verdict. Teams that serve lots of models use all three and choose per deployment, based on benchmarks.
        </p>
      </div>
    </Widget>
  );
}
