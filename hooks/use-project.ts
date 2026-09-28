"use client";
import { useEffect, useState } from "react";
import { type Project, validateProject } from "@/lib/flow";

const initial: Project = {
  title: "Миний бодлого",
  description: "",
  blocks: [],
};
const STORAGE_KEY = "flow-project";

export function useProject() {
  const [project, setProject] = useState<Project>(initial);
  const [savedProject, setSavedProject] = useState<Project | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [history, setHistory] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validateProject(parsed)) setSavedProject(parsed);
      }
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || !hasChanges) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSavedProject(project);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [project, ready, hasChanges]);

  function applyProject(next: Project) {
    setHasChanges(true);
    setHistory((h) => [...h.slice(-39), project]);
    setFuture([]);
    setProject(next);
  }
  function undoProject() {
    if (!history.length) return;
    setFuture((f) => [project, ...f]);
    setProject(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }
  function redoProject() {
    if (!future.length) return;
    setHistory((h) => [...h, project]);
    setProject(future[0]);
    setFuture((f) => f.slice(1));
  }
  return {
    project,
    ready,
    storageError,
    savedProject,
    hasChanges,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    applyProject,
    undoProject,
    redoProject,
  };
}
