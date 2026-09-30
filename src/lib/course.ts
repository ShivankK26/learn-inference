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
        minutes: 8,
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
      { slug: "know-your-app", title: "Know your app", blurb: "Real-time vs. batch, consumer vs. business, and why it changes everything.", minutes: 7, bookSections: "1.1–1.2", ready: false },
      { slug: "choosing-a-model", title: "Choosing a model", blurb: "Evals, fine-tuning, and distillation in plain words.", minutes: 7, bookSections: "1.3", ready: false },
      { slug: "measuring-speed", title: "Measuring speed properly", blurb: "TTFT, TPS, p50 vs. p99, and why averages lie.", minutes: 8, bookSections: "1.4", ready: false },
    ],
  },
  {
    num: 2,
    title: "How Models Work",
    question: "What happens inside the model, and where does it get slow?",
    lessons: [
      { slug: "neural-networks", title: "Neural networks in 5 minutes", blurb: "Nodes, layers, matmul, and why we need activation functions.", minutes: 6, bookSections: "2.1", ready: true },
      { slug: "how-llms-write", title: "How an LLM writes, one token at a time", blurb: "Tokens, prefill, decode, and how the next word gets picked.", minutes: 10, bookSections: "2.2", ready: true },
      { slug: "attention-and-kv-cache", title: "Attention and the KV cache", blurb: "How words look at each other, and the memo pad that makes it fast.", minutes: 9, bookSections: "2.2.2–2.2.4", ready: true },
      { slug: "image-and-video-models", title: "How image & video models work", blurb: "Starting from noise and sculpting a picture in 50 steps.", minutes: 8, bookSections: "2.3", ready: true },
      { slug: "bottlenecks", title: "Finding the bottleneck", blurb: "Compute vs. memory, and the single most important idea in the book.", minutes: 10, bookSections: "2.4", ready: true },
      { slug: "faster-attention", title: "Making attention faster", blurb: "FlashAttention, PagedAttention, and cheaper attention variants.", minutes: 7, bookSections: "2.5", ready: true },
    ],
  },
  {
    num: 3,
    title: "Hardware",
    question: "What’s inside a GPU, and which one should I use?",
    lessons: [
      { slug: "gpu-anatomy", title: "Inside a GPU", blurb: "Cores, memory, and caches without the spec-sheet headache.", minutes: 8, bookSections: "3.1", ready: false },
      { slug: "gpu-generations", title: "Hopper, Blackwell, Rubin…", blurb: "What changes between GPU generations and why it matters.", minutes: 7, bookSections: "3.2", ready: false },
      { slug: "instances", title: "Renting GPUs: instances", blurb: "Multi-GPU boxes, NVLink, and slicing one GPU into many.", minutes: 6, bookSections: "3.3", ready: false },
      { slug: "beyond-nvidia", title: "Other chips & local inference", blurb: "TPUs, AMD, laptops, and phones.", minutes: 6, bookSections: "3.4–3.5", ready: false },
    ],
  },
  {
    num: 4,
    title: "Software",
    question: "What software actually runs the model?",
    lessons: [
      { slug: "cuda-and-kernels", title: "CUDA and kernels", blurb: "The tiny programs that run on the GPU, and why fusing them helps.", minutes: 8, bookSections: "4.1", ready: false },
      { slug: "frameworks", title: "PyTorch and friends", blurb: "Frameworks, model files, ONNX, and TensorRT.", minutes: 7, bookSections: "4.2", ready: false },
      { slug: "inference-engines", title: "Inference engines", blurb: "vLLM, SGLang, TensorRT-LLM, and Dynamo compared.", minutes: 9, bookSections: "4.3–4.4", ready: false },
      { slug: "benchmarking", title: "Benchmarking honestly", blurb: "Load testing and profiling without fooling yourself.", minutes: 6, bookSections: "4.5", ready: false },
    ],
  },
  {
    num: 5,
    title: "Speed-Up Techniques",
    question: "What are the big tricks for faster, cheaper inference?",
    lessons: [
      { slug: "quantization", title: "Quantization", blurb: "Smaller numbers, faster models, (almost) same quality.", minutes: 10, bookSections: "5.1", ready: false },
      { slug: "speculative-decoding", title: "Speculative decoding", blurb: "Guess ahead with a fast helper, verify in one go.", minutes: 9, bookSections: "5.2", ready: false },
      { slug: "caching", title: "Caching", blurb: "Never do the same work twice: prefix caching and smart routing.", minutes: 8, bookSections: "5.3", ready: false },
      { slug: "parallelism", title: "Using many GPUs", blurb: "Tensor, expert, and multi-node parallelism.", minutes: 9, bookSections: "5.4", ready: false },
      { slug: "disaggregation", title: "Disaggregation", blurb: "Splitting prefill and decode onto different machines.", minutes: 7, bookSections: "5.5", ready: false },
    ],
  },
  {
    num: 6,
    title: "Beyond Text",
    question: "How is serving images, voice, and video different?",
    lessons: [
      { slug: "vision-and-embeddings", title: "Vision & embedding models", blurb: "Models that see, and models that turn text into coordinates.", minutes: 8, bookSections: "6.1–6.2", ready: false },
      { slug: "speech", title: "Speech in and speech out", blurb: "Transcription (ASR) and text-to-speech in real time.", minutes: 8, bookSections: "6.3–6.4", ready: false },
      { slug: "serving-images-video", title: "Serving image & video models", blurb: "Kernel tricks, quantization, and context parallelism.", minutes: 8, bookSections: "6.5–6.6", ready: false },
    ],
  },
  {
    num: 7,
    title: "Production",
    question: "How do I run this for real users, reliably?",
    lessons: [
      { slug: "containers", title: "Packaging models", blurb: "Containers, dependencies, and NIMs.", minutes: 6, bookSections: "7.1", ready: false },
      { slug: "autoscaling", title: "Autoscaling", blurb: "Batch sizes, cold starts, queueing, and scaling to zero.", minutes: 10, bookSections: "7.2", ready: false },
      { slug: "multi-cloud", title: "Many clouds, one system", blurb: "Getting GPUs, routing globally, and staying up.", minutes: 8, bookSections: "7.3", ready: false },
      { slug: "shipping", title: "Shipping & the client side", blurb: "Zero-downtime deploys, cost math, streaming, and observability.", minutes: 9, bookSections: "7.4–7.5", ready: false },
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
