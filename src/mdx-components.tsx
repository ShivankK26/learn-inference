import type { MDXComponents } from "mdx/types";
import { TLDR, Analogy, KeyPoints, Note, Term, Compute, Memory, Worked } from "@/components/Blocks";
import Quiz from "@/components/Quiz";
import ThreeLayers from "@/components/widgets/ThreeLayers";
import SixTricks from "@/components/widgets/SixTricks";
import Neuron from "@/components/widgets/Neuron";
import Tokenizer from "@/components/widgets/Tokenizer";
import NextToken from "@/components/widgets/NextToken";
import PrefillDecode from "@/components/widgets/PrefillDecode";
import Attention from "@/components/widgets/Attention";
import KVCache from "@/components/widgets/KVCache";
import MoE from "@/components/widgets/MoE";
import Denoise from "@/components/widgets/Denoise";
import SpeedLimit from "@/components/widgets/SpeedLimit";
import Roofline from "@/components/widgets/Roofline";
import AttentionPatterns from "@/components/widgets/AttentionPatterns";
import FlashCompare from "@/components/widgets/FlashCompare";

// Everything here is usable in any .mdx lesson without importing.
const components: MDXComponents = {
  TLDR, Analogy, KeyPoints, Note, Term, Compute, Memory, Worked, Quiz,
  ThreeLayers, SixTricks, Neuron, Tokenizer, NextToken, PrefillDecode,
  Attention, KVCache, MoE, Denoise, SpeedLimit, Roofline, AttentionPatterns, FlashCompare,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
