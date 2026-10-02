"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import type { Problem } from "@/types/problem";

// Statement details (formats and sample tests) of the opened library problem.
export function ProblemPanel() {
  const { project, checkCount } = useEditor();
  const problemId = project.problemId;
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (!problemId) return;
    let cancelled = false;
    fetch(`/api/problems/${problemId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setProblem(data?.problem ?? null))
      .catch(() => !cancelled && setProblem(null));
    return () => {
      cancelled = true;
    };
  }, [problemId, checkCount]);

  if (!problemId || problem?.id !== problemId) return null;
  return (
    <section className="problem-panel">
      <div className="inspector-heading">
        Бодлого
        {problem.solved && (
          <span className="solved-badge">
            <CheckCircle2 size={12} /> Бодсон
          </span>
        )}
      </div>
      {problem.inputFormat && (
        <>
          <h4>Оролт</h4>
          <p>{problem.inputFormat}</p>
        </>
      )}
      {problem.outputFormat && (
        <>
          <h4>Гаралт</h4>
          <p>{problem.outputFormat}</p>
        </>
      )}
      {problem.samples.map((s, i) => (
        <div className="sample-test" key={i}>
          <h4>Жишээ {i + 1}</h4>
          <div>
            <small>Оролт</small>
            <pre>{s.input}</pre>
          </div>
          <div>
            <small>Гаралт</small>
            <pre>{s.expected}</pre>
          </div>
        </div>
      ))}
    </section>
  );
}
