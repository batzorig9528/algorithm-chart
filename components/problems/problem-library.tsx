"use client";
import { ArrowRight, Plus } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { useProblems } from "@/components/problems/use-problems";

export function ProblemLibrary() {
  const { ready, openProblem, loadProblem, busy } = useEditor();
  const { problems, loading, error } = useProblems();

  return (
    <main className="content-page">
      <section className="content-card">
        <h1>Бодлогын сан</h1>
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
              <span className="example-level">
                {ex.solved ? "✓ Бодсон" : ex.level}
              </span>
              <h3>{ex.title}</h3>
              <p>{ex.description}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
