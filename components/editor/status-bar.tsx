"use client";
import { useEditor } from "@/contexts/editor-context";

export function StatusBar() {
  const { allBlocks } = useEditor();

  return (
    <footer className="statusbar">
      <span>{allBlocks.length} блок</span>
    </footer>
  );
}
