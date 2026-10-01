"use client";
import {
  ArrowRight,
  BookOpen,
  Grip,
  MousePointer2,
  PanelLeftClose,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";
import { icons } from "@/components/editor/block-icons";
import { Kind, definitions } from "@/lib/flow";
import Link from "next/link";

export function BlockPalette() {
  const { setSidebar, insert, busy } = useEditor();
  const [search, setSearch] = useState("");
  return (
    <aside className="sidebar">
      <div className="sidebar-heading">
        <div className="sidebar-title">
          <span>Блокууд</span>
          <IconButton
            title="Блокийн самбар хаах"
            onClick={() => setSidebar(false)}
          >
            <PanelLeftClose size={16} />
          </IconButton>
        </div>
        <p className="sidebar-description">Алгоритмаа алхам алхмаар бүтээ.</p>
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
      <div className="section-label">
        ҮНДСЭН БЛОКУУД <span>{Object.keys(definitions).length}</span>
      </div>
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
                  <small>{def.description}</small>
                </span>
                <Grip className="drag-grip" size={14} />
              </button>
            );
          })}
      </div>
      <div className="palette-note">
        <MousePointer2 size={14} />
        <span>
          Блок дээр дарж эсвэл <b>+</b> тэмдэг рүү чирж нэмээрэй.
        </span>
      </div>
      <div className="sidebar-bottom">
        <div className="learn-card">
          <span className="learn-icon">
            <Sparkles size={18} />
          </span>
          <h3>
            Бяцхан алхам.
            <br />
            Том боломж.
          </h3>
          <p>
            Жишээ бодлогоос эхэлж,
            <br />
            алгоритмын сэтгэлгээгээ хөгжүүл.
          </p>
          <Link href="/problems">
            Жишээ үзэх <ArrowRight size={14} />
          </Link>
          <div className="card-decoration">
            <div />
            <div />
            <div />
          </div>
        </div>
        <Link className="guide-link" href="/help">
          <BookOpen size={15} />
          Эхлэгчийн гарын авлага
          <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
