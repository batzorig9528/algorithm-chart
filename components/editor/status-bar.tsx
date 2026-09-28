"use client";
import { useEditor } from "@/contexts/editor-context";

export function StatusBar() {
  const { allBlocks } = useEditor();

  return (
    <footer className="statusbar">
      <span>
        <span className="status-dot" />
        Бүх зүйл таны хөтөч дээр ажиллана
      </span>
      <span>
        {allBlocks.length + 2} блок
        <span className="footer-divider">|</span>Flow v1.0
        <span className="footer-divider">|</span>
        <span className="made-with">Бод. Бүтээ. Ойлго.</span>
      </span>
    </footer>
  );
}
