// Headline specs (dense FP16 compute). Memory figures match the book’s Chapter 3 tables.
export const gpus = {
  L4: { name: "L4", tflops: 121, tbps: 0.3, memGB: 24 },
  H100: { name: "H100", tflops: 989, tbps: 3.35, memGB: 80 },
  H200: { name: "H200", tflops: 989, tbps: 4.8, memGB: 141 },
  B200: { name: "B200", tflops: 2250, tbps: 8, memGB: 192 },
} as const;

export type GpuKey = keyof typeof gpus;
