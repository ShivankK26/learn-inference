"use client";

import { useState } from "react";
import { Widget } from "../Blocks";

// Rules of thumb from the book: a high-res image ≈ 1,000 tokens; low-res ≈ 4× fewer; cinematic video = 24 fps.
const HIGH = 1000;
const LOW = 250;
const CONTEXT = 128_000;

export default function VisualTokens() {
  const [mode, setMode] = useState<"images" | "video">("images");
  const [images, setImages] = useState(1);
  const [seconds, setSeconds] = useState(4);
  const [fps, setFps] = useState(24);
  const [hiRes, setHiRes] = useState(true);
  const prompt = 200;

  const perImage = hiRes ? HIGH : LOW;
  const frames = mode === "images" ? images : seconds * fps;
  const visual = frames * perImage;
  const total = visual + prompt;
  const pct = Math.min(100, (total / CONTEXT) * 100);
  const over = total > CONTEXT;

  return (
    <Widget title="How many tokens is a picture?" hint="Try a video clip">
      <div className="mb-4 flex gap-2 text-sm">
        {(["images", "video"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 ${mode === m ? "border-accent bg-accent-soft font-medium text-accent" : "border-line hover:border-ink-faint"}`}
          >
            {m === "images" ? "Images" : "Video clip"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        {mode === "images" ? (
          <label className="block">
            <div className="flex justify-between"><span>Number of images</span><span className="tabular-nums">{images}</span></div>
            <input type="range" className="w-full" min={1} max={20} value={images} onChange={(e) => setImages(+e.target.value)} />
          </label>
        ) : (
          <>
            <label className="block">
              <div className="flex justify-between"><span>Clip length</span><span className="tabular-nums">{seconds} s</span></div>
              <input type="range" className="w-full" min={1} max={30} value={seconds} onChange={(e) => setSeconds(+e.target.value)} />
            </label>
            <label className="block">
              <div className="flex justify-between"><span>Frames sampled per second</span><span className="tabular-nums">{fps}</span></div>
              <input type="range" className="w-full" min={1} max={24} value={fps} onChange={(e) => setFps(+e.target.value)} />
            </label>
          </>
        )}
        <label className="flex items-center gap-2 self-end">
          <input type="checkbox" checked={hiRes} onChange={(e) => setHiRes(e.target.checked)} />
          High resolution (about 4× the tokens of low resolution)
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-bg-soft p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span>
            {frames.toLocaleString("en-US")} {frames === 1 ? "image" : mode === "video" ? "frames" : "images"} × {perImage.toLocaleString("en-US")} tokens
            {" "}+ {prompt} text tokens
          </span>
          <span className={`text-lg font-semibold tabular-nums ${over ? "text-bad" : "text-compute"}`}>
            {total.toLocaleString("en-US")} tokens
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
          <div className={`h-full rounded-full transition-all ${over ? "bg-bad" : "bg-compute"}`} style={{ width: `${pct.toFixed(2)}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-ink-faint">
          <span>0</span>
          <span>a 128K-token context window</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {over
          ? "Too long for one request. You’d have to downsample: fewer frames per second, lower resolution, or a shorter clip."
          : mode === "video"
            ? "Every one of these tokens goes through prefill and lives in the KV cache, which is why video inputs are almost always downsampled."
            : "Each image adds a big block of tokens to prefill and to the KV cache, even though the text prompt is tiny."}
      </p>
    </Widget>
  );
}
