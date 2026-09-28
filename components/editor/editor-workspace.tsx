"use client";
import { useEditor } from "@/contexts/editor-context";
import { BlockPalette } from "./block-palette";
import { ProjectToolbar } from "./project-toolbar";
import { EditorToolbar } from "./editor-toolbar";
import { FlowCanvas } from "./flow-canvas";
import { VariablesPanel } from "./variables-panel";
import { ExecutionConsole } from "./execution-console";
import { StatusBar } from "./status-bar";

export function EditorWorkspace() {
  const { sidebar } = useEditor();
  return (
    <div className="workspace">
      {sidebar && <BlockPalette />}
      <main className="main-workspace">
        <ProjectToolbar />
        <EditorToolbar />
        <div className="editor-body">
          <FlowCanvas />
          <VariablesPanel />
        </div>
        <ExecutionConsole />
        <StatusBar />
      </main>
    </div>
  );
}
