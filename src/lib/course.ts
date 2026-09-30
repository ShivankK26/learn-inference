// The whole course map. Lessons with `ready: true` have an MDX file in src/content/<slug>.mdx.
// To add a lesson: write the MDX file, then flip `ready` to true.

export type Lesson = {
  slug: string;
  title: string;
  blurb: string;
  minutes: number;
  bookSections: string; // which part of the book this covers
  ready: boolean;
};

export type Chapter = {
  num: number;
  title: string;
  question: string; // the one question this chapter answers, in plain words
  lessons: Lesson[];
};

export const course: Chapter[] = [
  {
    num: 0,
    title: "The Big Picture",
    question: "What is inference, and why is it its own job?",
    lessons: [
      {
        slug: "big-picture",
        title: "What inference engineering actually is",
        blurb: "Training vs. inference, the three layers, and the six tricks you’ll learn.",
        minutes: 19,
        bookSections: "Preface, Chapter 0",
        ready: true,
      },
    ],
  },
  {
    num: 1,
    title: "Before You Optimize",
    question: "What does my app actually need?",
    lessons: [
      { slug: "know-your-app", title: "Know your app", blurb: "Shared APIs vs. your own GPUs, online vs. offline, consumer vs. business.", minutes: 18, bookSections: "1.1–1.2", ready: true },
      { slug: "choosing-a-model", title: "Choosing a model", blurb: "Evals, fine-tuning, and distillation in plain words.", minutes: 14, bookSections: "1.3", ready: true },
      { slug: "measuring-speed", title: "Measuring speed properly", blurb: "TTFT, TPS, ITL, percentiles, and why averages lie.", minutes: 12, bookSections: "1.4", ready: true },
    ],
  },
  {
    num: 2,
    title: "How Models Work",
    question: "What happens inside the model, and where does it get slow?",
    lessons: [
      { slug: "neural-networks", title: "Neural networks from the ground up", blurb: "Nodes, layers, matmul, and why we need activation functions.", minutes: 16, bookSections: "2.1", ready: true },
      { slug: "how-llms-write", title: "How an LLM writes, one token at a time", blurb: "Tokens, prefill, decode, and how the next word gets picked.", minutes: 17, bookSections: "2.2", ready: true },
      { slug: "attention-and-kv-cache", title: "Attention and the KV cache", blurb: "How words look at each other, and the memo pad that makes it fast.", minutes: 18, bookSections: "2.2.2–2.2.4", ready: true },
      { slug: "image-and-video-models", title: "How image & video models work", blurb: "Starting from noise and sculpting a picture in 50 steps.", minutes: 20, bookSections: "2.3", ready: true },
      { slug: "bottlenecks", title: "Finding the bottleneck", blurb: "Compute vs. memory, and the single most important idea in the book.", minutes: 21, bookSections: "2.4", ready: true },
      { slug: "faster-attention", title: "Making attention faster", blurb: "FlashAttention, PagedAttention, and cheaper attention variants.", minutes: 17, bookSections: "2.5", ready: true },
    ],
  },
  {
    num: 3,
    title: "Hardware",
    question: "What’s inside a GPU, and which one should I use?",
    lessons: [
      { slug: "gpu-anatomy", title: "Inside a GPU", blurb: "Cores, memory, caches, and whether your model fits.", minutes: 19, bookSections: "3.1", ready: true },
      { slug: "gpu-generations", title: "Hopper, Blackwell, Rubin…", blurb: "What changes between GPU generations and why it matters.", minutes: 18, bookSections: "3.2", ready: true },
      { slug: "instances", title: "Renting GPUs: instances, nodes, and MIG", blurb: "Multi-GPU boxes, NVLink, and slicing one GPU into many.", minutes: 14, bookSections: "3.3", ready: true },
      { slug: "beyond-nvidia", title: "Other chips & local inference", blurb: "AMD, TPUs, startups, laptops, and phones.", minutes: 15, bookSections: "3.4–3.5", ready: true },
    ],
  },
  {
    num: 4,
    title: "Software",
    question: "What software actually runs the model?",
    lessons: [
      { slug: "cuda-and-kernels", title: "CUDA and kernels", blurb: "The tiny programs that run on the GPU, and why fusing them helps.", minutes: 20, bookSections: "4.1", ready: true },
      { slug: "frameworks", title: "PyTorch and friends", blurb: "PyTorch, safetensors vs. ONNX, TensorRT, and Hugging Face’s libraries.", minutes: 16, bookSections: "4.2", ready: true },
      { slug: "inference-engines", title: "Inference engines", blurb: "vLLM, SGLang, TensorRT-LLM compared, plus NVIDIA Dynamo on top.", minutes: 19, bookSections: "4.3–4.4", ready: true },
      { slug: "benchmarking", title: "Benchmarking & profiling", blurb: "Load testing and profiling without fooling yourself.", minutes: 16, bookSections: "4.5", ready: true },
    ],
  },
  {
    num: 5,
    title: "Speed-Up Techniques",
    question: "What are the big tricks for faster, cheaper inference?",
    lessons: [
      { slug: "quantization", title: "Quantization", blurb: "Number formats, scale factors, what’s safe to shrink, and how to prove quality held.", minutes: 28, bookSections: "5.1", ready: true },
      { slug: "speculative-decoding", title: "Speculative decoding", blurb: "Draft-target, Medusa, EAGLE, and n-gram: guess ahead, verify in one pass.", minutes: 23, bookSections: "5.2", ready: true },
      { slug: "caching", title: "Caching", blurb: "Reuse work across requests: prefix caching, KV cache storage tiers, cache-aware routing, and long context.", minutes: 22, bookSections: "5.3", ready: true },
      { slug: "parallelism", title: "Using many GPUs", blurb: "Tensor, expert, and multi-node parallelism.", minutes: 18, bookSections: "5.4", ready: true },
      { slug: "disaggregation", title: "Disaggregation", blurb: "Splitting prefill and decode onto separate engines, and when it’s worth it.", minutes: 15, bookSections: "5.5", ready: true },
    ],
  },
  {
    num: 6,
    title: "Beyond Text",
    question: "How is serving images, voice, and video different?",
    lessons: [
      { slug: "vision-and-embeddings", title: "Vision & embedding models", blurb: "Why pictures cost thousands of tokens, and how to serve embeddings at scale.", minutes: 25, bookSections: "6.1–6.2", ready: true },
      { slug: "speech", title: "Speech in and speech out", blurb: "Transcription and text-to-speech: streaming, parallel chunks, and real-time voices.", minutes: 23, bookSections: "6.3–6.4", ready: true },
      { slug: "serving-images-video", title: "Serving image & video models", blurb: "Kernel tricks, quantization, and context parallelism.", minutes: 23, bookSections: "6.5–6.6", ready: true },
    ],
  },
  {
    num: 7,
    title: "Production",
    question: "How do I run this for real users, reliably?",
    lessons: [
      { slug: "containers", title: "Packaging models", blurb: "Containers, image layers, pinned dependencies, and NIMs.", minutes: 16, bookSections: "7.1", ready: true },
      { slug: "autoscaling", title: "Autoscaling", blurb: "Replicas, batching styles, cold starts, routing and queues, scale to zero.", minutes: 25, bookSections: "7.2", ready: true },
      { slug: "multi-cloud", title: "Many clouds, one system", blurb: "Getting GPUs, routing globally, surviving failures, and compliance.", minutes: 19, bookSections: "7.3", ready: true },
      { slug: "shipping", title: "Shipping, cost & the client side", blurb: "Testing, canary deploys, cost math, observability, streaming, and protocols.", minutes: 23, bookSections: "7.4–7.6", ready: true },
    ],
  },
];

export const allLessons = course.flatMap((c) =>
  c.lessons.map((l) => ({ ...l, chapter: c }))
);

export const readyLessons = allLessons.filter((l) => l.ready);

export function findLesson(slug: string) {
  const i = readyLessons.findIndex((l) => l.slug === slug);
  if (i === -1) return null;
  return {
    lesson: readyLessons[i],
    prev: readyLessons[i - 1] ?? null,
    next: readyLessons[i + 1] ?? null,
  };
}
