import type { Kind } from "./flow";
export const defaultValues: Record<Kind, [string, string]> = {
  declare: ["x", "0"],
  input: ["x", ""],
  output: ["", '"Сайн байна уу!"'],
  assign: ["x", "x + 1"],
  if: ["", "x > 0"],
  while: ["", "x < 10"],
  for: ["i", "1; 10"],
};
