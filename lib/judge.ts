import { execute, type Block } from "./flow";

export type JudgeResult = { output: string[]; error?: string };

// Runs the blocks without a UI: each `input` block consumes the next line of `input`.
export function runBlocks(blocks: Block[], input: string): JudgeResult {
  const lines = input.split("\n");
  const output: string[] = [];
  let next = 0;
  try {
    const run = execute(blocks);
    let step = run.next();
    while (!step.done) {
      const frame = step.value;
      if (frame.output !== undefined) output.push(frame.output);
      if (frame.input !== undefined) {
        if (next >= lines.length)
          return { output, error: "Тестийн оролт хүрэлцэхгүй байна." };
        step = run.next(lines[next++]);
      } else step = run.next();
    }
  } catch (error) {
    return {
      output,
      error: error instanceof Error ? error.message : "Алдаа гарлаа.",
    };
  }
  return { output };
}

const lineList = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, all) => line !== "" || i < all.length - 1);

// Whitespace at line ends and trailing blank lines don't matter.
export function sameOutput(output: string[], expected: string): boolean {
  const want = lineList(expected);
  const got = lineList(output.join("\n"));
  return want.length === got.length && want.every((l, i) => l === got[i]);
}
