"use client";
import { Grip, PanelLeftClose, Search } from "lucide-react";
import { useState } from "react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";
import { icons } from "@/components/editor/block-icons";
import { Kind, definitions } from "@/lib/flow";

export function BlockPalette() {
  const { setSidebar, insert, busy } = useEditor();
  const [search, setSearch] = useState("");
  return (
    <aside className="sidebar">
      <div className="sidebar-title">
        <span>Блокууд</span>
        <IconButton
          title="Блокийн самбар хаах"
          onClick={() => setSidebar(false)}
        >
          <PanelLeftClose size={16} />
        </IconButton>
      </div>
      <label className="search-box">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Блок хайх..."
          aria-label="Блок хайх"
        />
        <kbd>⌕</kbd>
      </label>
      <div className="palette">
        {(Object.keys(definitions) as Kind[])
          .filter((k) =>
            `${definitions[k].label} ${definitions[k].english}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((k) => {
            const def = definitions[k];
            const Icon = icons[k];
            return (
              <button
                disabled={busy}
                draggable={!busy}
                onDragStart={(e) => e.dataTransfer.setData("flow-kind", k)}
                className="palette-item"
                key={k}
                onClick={() => insert(k)}
              >
                <span className={`palette-icon ${def.color}`}>
                  <Icon size={19} />
                </span>
                <span>
                  <strong>{def.label}</strong>
                </span>
                <Grip className="drag-grip" size={14} />
              </button>
            );
          })}
      </div>
    </aside>
  );
}
