"use client";
import { RotateCcw } from "lucide-react";
import { definitions, type Block } from "@/lib/flow";
import { useEditor } from "@/contexts/editor-context";
import { icons } from "./block-icons";
import { BlockConnector } from "./block-connector";
export function FlowDiagram({
  list,
  parent = null,
  branch = "children",
}: {
  list: Block[];
  parent?: string | null;
  branch?: "children" | "otherwise";
}) {
  const { editBlock, selected, active } = useEditor();
  return (
    <div className="flow-list">
      <BlockConnector parent={parent} branch={branch} index={0} />
      {list.map((b, i) => {
        const def = definitions[b.kind];
        const Icon = icons[b.kind];
        const expression =
          b.kind === "input"
            ? b.name
            : b.kind === "declare" || b.kind === "assign"
              ? `${b.name} = ${b.expression}`
              : b.expression;
        return (
          <div className="flow-item" key={b.id}>
            <button
              onClick={() => {
                editBlock(b);
              }}
              className={`flow-block ${def.color} kind-${b.kind} ${selected === b.id ? "selected" : ""} ${active === b.id ? "executing" : ""}`}
              aria-label={`${def.label}: ${expression}`}
            >
              <span className="block-icon">
                <Icon size={16} />
              </span>
              <span className="block-content">
                <small>{def.english}</small>
                <strong>{expression || "…"}</strong>
              </span>
              <span className="block-dot" />
            </button>
            {(b.kind === "if" || b.kind === "while") && (
              <div className={`branches ${b.kind === "while" ? "loop" : ""}`}>
                <div className="branch">
                  <span className="branch-label">Тийм</span>
                  <FlowDiagram
                    list={b.children}
                    parent={b.id}
                    branch="children"
                  />
                </div>
                {b.kind === "if" ? (
                  <div className="branch">
                    <span className="branch-label no">Үгүй</span>
                    <FlowDiagram
                      list={b.otherwise}
                      parent={b.id}
                      branch="otherwise"
                    />
                  </div>
                ) : (
                  <span className="loop-return">
                    <RotateCcw size={15} /> Давтах
                  </span>
                )}
              </div>
            )}
            <BlockConnector parent={parent} branch={branch} index={i + 1} />
          </div>
        );
      })}
    </div>
  );
}
