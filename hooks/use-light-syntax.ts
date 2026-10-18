"use client";
import { useEffect, useRef, useState } from "react";
import type { LightIssue } from "@/lib/light-python";

export function useLightSyntax(code: string, enabled: boolean): LightIssue[] {
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const [result, setResult] = useState<{ source: string; issues: LightIssue[] } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    try { worker.current = new Worker('/pygame/light/check-worker.js'); } catch { return; }
    return () => { worker.current?.terminate(); worker.current = null; };
  }, [enabled]);
  useEffect(() => {
    const id = ++sequence.current;
    const engine = worker.current;
    if (!enabled || !engine || code.length > 100000) return;
    engine.onmessage = event => {
      if (event.data.id !== sequence.current) return;
      const issue = event.data.issue;
      const from = issue ? code.split('\n').slice(0, issue.line - 1).reduce((n, line) => n + line.length + 1, 0) : 0;
      setResult({ source: code, issues: issue ? [{ ...issue, from, to: from + (code.slice(from).split('\n')[0].length || 1) }] : [] });
    };
    const timer = setTimeout(() => engine.postMessage({ id, code }), 300);
    return () => { clearTimeout(timer); sequence.current++; };
  }, [code, enabled]);
  return enabled && result?.source === code ? result.issues : [];
}
