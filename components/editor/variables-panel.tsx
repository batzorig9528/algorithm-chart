"use client";
import { Braces, Square } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";

export function VariablesPanel() {
  const { variableNames, variables, status, speed, setSpeed, busy, reset } =
    useEditor();

  return (
    <aside className="inspector">
      <div className="inspector-tabs">
        <span className="inspector-tab-label">
          <Braces size={15} />
          Хувьсагчид
        </span>
      </div>
      <div className="inspector-content">
        <div className="inspector-heading">
          Хувьсагчдын утга<span>{variableNames.length}</span>
        </div>
        <div className="variable-table">
          <div className="variable-row table-head">
            <span>Нэр</span>
            <span>Төрөл</span>
            <span>Утга</span>
          </div>
          {variableNames.map((name) => (
            <div className="variable-row" key={name}>
              <span>
                <span className="variable-symbol">x</span>
                {name}
              </span>
              <span>
                {Object.hasOwn(variables, name)
                  ? typeof variables[name] === "number"
                    ? "Number"
                    : typeof variables[name] === "boolean"
                      ? "Boolean"
                      : "String"
                  : "Auto"}
              </span>
              <code
                className={Object.hasOwn(variables, name) ? "has-value" : ""}
              >
                {Object.hasOwn(variables, name) ? String(variables[name]) : "—"}
              </code>
            </div>
          ))}
        </div>
        {variableNames.length === 0 && (
          <p className="empty-small">Хувьсагч алга.</p>
        )}
      </div>
      <div className="execution-settings">
        <div>
          <span>
            <span className={`status-dot ${status}`} />
            {
              {
                idle: "Ажиллуулахад бэлэн",
                running: "Ажиллаж байна",
                paused: "Түр зогссон",
                input: "Оролт хүлээж байна",
                done: "Амжилттай дууслаа",
                error: "Алдаа гарлаа",
              }[status]
            }
          </span>
          {busy && (
            <IconButton title="Зогсоох" onClick={reset}>
              <Square size={12} />
            </IconButton>
          )}
        </div>
        <label>
          Алхмын хурд
          <select
            aria-label="Алхмын хурд"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={900}>0.5×</option>
            <option value={450}>1×</option>
            <option value={100}>2×</option>
            <option value={10}>Хурдан</option>
          </select>
        </label>
      </div>
    </aside>
  );
}
