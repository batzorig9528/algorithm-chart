"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useEditorController } from "@/hooks/use-editor-controller";

type EditorContextValue = ReturnType<typeof useEditorController>;
const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const editor = useEditorController();
  return (
    <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
  );
}
export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("useEditor must be used within EditorProvider");
  return editor;
}
