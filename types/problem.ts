import type { Block } from "@/lib/flow";

export type Problem = {
  id: number;
  title: string;
  description: string;
  level: string;
  tag: string;
  blocks: Block[];
  authorName: string | null;
  createdAt: string;
};
export type ProblemInput = {
  title: string;
  description: string;
  level: string;
  tag: string;
};
