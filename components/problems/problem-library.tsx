"use client";
import { ArrowRight, BookOpen, Plus } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { examples } from "@/lib/examples";

export function ProblemLibrary() {
  const { ready, openProblem, loadExample, busy } = useEditor();

  return (
    <main className="content-page">
      <section className="content-card">
        <span className="modal-eyebrow">
          <BookOpen size={16} />
          БОДЛОГЫН САН
        </span>
        <h1>Дараагийн санаагаа эндээс.</h1>
        <p>Бэлэн жишээ сонгох эсвэл өөрийн бодлогыг эхнээс нь бүтээгээрэй.</p>
        <button
          disabled={busy || !ready}
          className="button custom-problem-button"
          onClick={() => openProblem(true)}
        >
          <Plus size={16} />
          Өөрийн бодлого үүсгэх
          <ArrowRight size={15} />
        </button>
        <div className="example-grid">
          {examples.map((ex, i) => (
            <button
              disabled={busy || !ready}
              className="example-card"
              key={ex.title}
              onClick={() => loadExample(i)}
            >
              <span className={`example-number number-${i}`}>0{i + 1}</span>
              <span className="example-level">{ex.level}</span>
              <h3>{ex.title}</h3>
              <p>{ex.description}</p>
              <div>
                {ex.tag}
                <ArrowRight size={17} />
              </div>
            </button>
          ))}
        </div>
        <p className="modal-footnote">
          Жишээ нээхэд одоогийн схем солигдоно. Буцаах товчоор сэргээж болно.
        </p>
      </section>
    </main>
  );
}
