"use client";
import { useCallback, useEffect, useState } from "react";
import type { Problem } from "@/types/problem";

export function useProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/problems");
      if (!res.ok) throw new Error();
      setProblems((await res.json()).problems);
      setError("");
    } catch {
      setError("Бодлогын жагсаалт ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { problems, loading, error, reload };
}
