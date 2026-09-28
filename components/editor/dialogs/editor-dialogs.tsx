"use client";
import { useEditor } from "@/contexts/editor-context";
import { BlockEditorDialog } from "./block-editor-dialog";
import { ProblemDialog } from "./problem-dialog";

export function EditorDialogs() {
  const { modal } = useEditor();
  if (modal === "block") return <BlockEditorDialog />;
  if (modal === "new" || modal === "problem") return <ProblemDialog />;
  return null;
}
