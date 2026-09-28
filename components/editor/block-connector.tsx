"use client";
import { Plus } from "lucide-react";
import { definitions, type Kind } from "@/lib/flow";
import { useEditor } from "@/contexts/editor-context";
import { icons } from "./block-icons";
import type { Slot } from "@/types/editor";
export function BlockConnector({ parent, branch, index }: Slot) {
  const { slot, setSlot, busy, insert } = useEditor();
  const location = { parent, branch, index };
  const isOpen =
    slot?.parent === parent && slot?.branch === branch && slot?.index === index;
  return (
    <div
      className={`connector ${isOpen ? "open" : ""}`}
      onDragOver={(e) => {
        if (!busy) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const kind = e.dataTransfer.getData("flow-kind") as Kind;
        if (Object.hasOwn(definitions, kind)) insert(kind, location);
      }}
    >
      <button
        disabled={busy}
        aria-label="Энд блок нэмэх"
        title="Блок нэмэх эсвэл чирж оруулах"
        onClick={() => setSlot(isOpen ? null : location)}
      >
        <Plus size={11} />
      </button>
      {isOpen && (
        <div className="insert-menu">
          {(Object.keys(definitions) as Kind[]).map((k) => {
            const Icon = icons[k];
            return (
              <button key={k} onClick={() => insert(k, location)}>
                <Icon size={15} />
                {definitions[k].label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
