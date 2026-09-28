import type { Block } from "@/lib/flow";

export type Slot = {
  parent: string | null;
  branch: "children" | "otherwise";
  index: number;
};
export type Log = {
  type: "system" | "output" | "input" | "error" | "success";
  text: string;
};
export type ExecutionStatus =
  "idle" | "running" | "paused" | "input" | "done" | "error";
export type EditorModal = "new" | "problem" | "block" | null;
export type BlockDraft = { block: Block; slot?: Slot };
