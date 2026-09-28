"use client";
import {
  Code2,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  SkipForward,
  Undo2,
  Workflow,
} from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";

export function EditorToolbar() {
  const {
    canUndo,
    canRedo,
    tab,
    setTab,
    undo,
    redo,
    status,
    busy,
    reset,
    start,
    pause,
  } = useEditor();

  return (
    <div className="editor-toolbar">
      <div className="view-tabs">
        <button
          className={tab === "flow" ? "active" : ""}
          onClick={() => setTab("flow")}
        >
          <Workflow size={15} />
          Блок схем
        </button>
        <button
          className={tab === "code" ? "active" : ""}
          onClick={() => setTab("code")}
        >
          <Code2 size={16} />
          Python
        </button>
      </div>
      <div className="run-tools">
        <div className="history-tools">
          <IconButton title="Буцаах" disabled={!canUndo || busy} onClick={undo}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton
            title="Дахин хийх"
            disabled={!canRedo || busy}
            onClick={redo}
          >
            <Redo2 size={16} />
          </IconButton>
        </div>
        <span className="tool-divider" />
        <IconButton title="Дахин эхлэх" onClick={reset}>
          <RotateCcw size={16} />
        </IconButton>
        <button
          className="button step-button"
          disabled={status === "running" || status === "input"}
          onClick={() => start(false)}
        >
          <SkipForward size={15} />
          Алхмаар
        </button>
        {status === "running" ? (
          <button className="button run-button" onClick={pause}>
            <Pause size={14} />
            Түр зогсоох
          </button>
        ) : (
          <button
            className="button run-button"
            disabled={status === "input"}
            onClick={() => start(true)}
          >
            <Play size={14} fill="currentColor" />
            {status === "paused" ? "Үргэлжлүүлэх" : "Ажиллуулах"}
          </button>
        )}
      </div>
    </div>
  );
}
