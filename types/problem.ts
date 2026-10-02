import type { Block } from "@/lib/flow";

export type TestInput = { input: string; expected: string; isSample: boolean };
export type SampleTest = { input: string; expected: string };

export type Problem = {
  id: number;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  level: string;
  tag: string;
  blocks: Block[];
  authorName: string | null;
  createdAt: string;
  testCount: number;
  samples: SampleTest[];
  // Whether the signed-in viewer has passed every test.
  solved: boolean;
};
export type ProblemInput = {
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  level: string;
  tag: string;
  tests: TestInput[];
};

export type TestOutcome = {
  index: number;
  sample: boolean;
  passed: boolean;
  error?: string;
  // Only revealed for sample tests.
  input?: string;
  expected?: string;
  got?: string;
};
export type SubmitResult = {
  passed: number;
  total: number;
  allPassed: boolean;
  loggedIn: boolean;
  saved: boolean;
  results: TestOutcome[];
};
