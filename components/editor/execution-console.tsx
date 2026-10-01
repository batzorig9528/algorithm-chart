"use client";
import { Play, Send, Terminal, Trash2 } from "lucide-react";
import { useRef, useEffect } from "react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";

export function ExecutionConsole() {
  const {
    logs,
    setLogs,
    status,
    pendingInput,
    inputValue,
    setInputValue,
    submitInput,
  } = useEditor();
  const consoleEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    consoleEnd.current?.scrollIntoView({ block: "nearest" });
  }, [logs, pendingInput]);
  return (
    <section className="console-panel">
      <div className="console-header">
        <div>
          <Terminal size={16} />
          <strong>Консол</strong>
          <span>Оролт / Гаралт</span>
          {logs.filter((l) => l.type === "output").length > 0 && (
            <b className="console-count">
              {logs.filter((l) => l.type === "output").length}
            </b>
          )}
        </div>
        <IconButton title="Консол цэвэрлэх" onClick={() => setLogs([])}>
          <Trash2 size={14} />
        </IconButton>
      </div>
      <div className="console-content" aria-live="polite">
        {logs.length === 0 ? (
          <div className="console-empty" tabIndex={0}>
            <span className="terminal-icon">
              <Terminal size={21} />
            </span>
            <div>
              <p>Таны алгоритм амилж эхлэхэд бэлэн.</p>
              <span>
                <b>Ажиллуулах</b> товчийг дарж үр дүнг энд хараарай.
              </span>
            </div>
            <span className="empty-play">
              <Play size={12} /> Let’s make it flow
            </span>
          </div>
        ) : (
          <div className="console-logs">
            {logs.map((log, i) => (
              <div className={`log-line ${log.type}`} key={i}>
                <span>
                  {log.type === "output"
                    ? "›"
                    : log.type === "input"
                      ? "←"
                      : log.type === "success"
                        ? "✓"
                        : log.type === "error"
                          ? "!"
                          : "·"}
                </span>
                <pre>{log.text}</pre>
              </div>
            ))}
            {status === "input" && (
              <form onSubmit={submitInput} className="console-input">
                <label htmlFor="runtime-input">{pendingInput} =</label>
                <input
                  id="runtime-input"
                  key={pendingInput}
                  autoFocus
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Утга оруулаад Enter дарна уу"
                />
                <button aria-label="Утга оруулах" type="submit">
                  <Send size={15} />
                </button>
              </form>
            )}
            <div ref={consoleEnd} />
          </div>
        )}
      </div>
    </section>
  );
}
