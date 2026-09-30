"use client";
import { ArrowRight, BookOpen, Plus } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { useProblems } from "@/components/problems/use-problems";

export function ProblemLibrary() {
  const { ready, openProblem, loadProblem, busy } = useEditor();
  const { problems, loading, error } = useProblems();

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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p>Ачаалж байна...</p>}
        <div className="example-grid">
          {problems.map((ex, i) => (
            <button
              disabled={busy || !ready}
              className="example-card"
              key={ex.id}
              onClick={() => loadProblem(ex)}
            >
              <span className={`example-number number-${i % 3}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
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
