"use client";
import {
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Square,
  Workflow,
} from "lucide-react";
import { useRef } from "react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";
import { FlowDiagram } from "./flow-diagram";
import { PythonView } from "./python-view";
export function FlowCanvas() {
  const { project, setSelected, setSlot, tab, zoom, setZoom, insert, busy } =
    useEditor();
  const canvas = useRef<HTMLDivElement>(null);
  return (
    <section className="canvas-section">
      <div
        className="canvas"
        ref={canvas}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelected(null);
            setSlot(null);
          }
        }}
      >
        <div className="canvas-caption">
          <span className="main-function-dot" />
          Main<span>Үндсэн функц</span>
        </div>
        {tab === "flow" ? (
          <div className="diagram" style={{ zoom: zoom / 100 }}>
            {project.blocks.length === 0 && (
              <div className="empty-workspace">
                <span>
                  <Workflow size={24} />
                </span>
                <h3>Өөрийн шийдлийг бүтээе</h3>
                <p>
                  Оролт, тооцоолол, нөхцөл, давталт —<br />
                  ямар ч дарааллаар блокуудаа угсар.
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => insert("input")}
                >
                  <Plus size={14} />
                  Эхний блок нэмэх
                </button>
              </div>
            )}
            <div className="terminator start">
              <span />
              Эхлэх
            </div>
            <FlowDiagram list={project.blocks} />
            <div className="terminator end">
              <Square size={11} />
              Дуусах
            </div>
          </div>
        ) : (
          <PythonView />
        )}
      </div>
      <div className="canvas-bottom">
        <span className="canvas-tip">
          <MousePointer2 size={13} />
          Блок дээр дарж тохируулна
        </span>
        <div className="zoom-controls">
          <IconButton
            title="Жижигрүүлэх"
            onClick={() => setZoom((z) => Math.max(40, z - 10))}
          >
            <Minus size={14} />
          </IconButton>
          <span>{zoom}%</span>
          <IconButton
            title="Томруулах"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
          >
            <Plus size={14} />
          </IconButton>
          <i />
          <IconButton
            title="Хэмжээ сэргээх"
            onClick={() => {
              setZoom(100);
              canvas.current?.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            }}
          >
            <Maximize size={14} />
          </IconButton>
        </div>
      </div>
    </section>
  );
}
