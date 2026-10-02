"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  block,
  flatten,
  splitForBounds,
  validateProject,
  type Block,
  type Kind,
  type Project,
} from "@/lib/flow";
import type { Problem, SubmitResult } from "@/types/problem";
import { defaultValues } from "@/lib/editor-defaults";
import { pythonCode } from "@/lib/python";
import { parseExpression } from "@/lib/expression";
import { downloadText } from "@/lib/download";
import {
  insertProjectBlock,
  updateProjectBlock,
  removeProjectBlock,
} from "@/lib/project-tree";
import type { Slot, EditorModal, BlockDraft, Log } from "@/types/editor";
import { useProject } from "./use-project";
import { useExecution } from "./use-execution";

export function useEditorController() {
  const router = useRouter();
  const projectState = useProject();
  const {
    project,
    ready,
    storageError,
    savedProject,
    hasChanges,
    canUndo,
    canRedo,
    applyProject,
    undoProject,
    redoProject,
  } = projectState;
  const execution = useExecution(project.blocks);
  const { busy, reset, variables } = execution;
  const [selected, setSelected] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [tab, setTab] = useState<"flow" | "code">("flow");
  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [formError, setFormError] = useState("");
  const [problemDraft, setProblemDraft] = useState({
    title: "",
    description: "",
  });
  const [zoom, setZoom] = useState(100);
  const [modal, setModal] = useState<EditorModal>(null);
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const generated = useMemo(() => {
    try {
      return { code: pythonCode(project.blocks), error: "" };
    } catch (error) {
      return {
        code: "",
        error:
          error instanceof Error
            ? error.message
            : "Код үүсгэх боломжгүй байна.",
      };
    }
  }, [project.blocks]);
  const allBlocks = flatten(project.blocks);
  const variableNames = [
    ...new Set([
      ...allBlocks
        .filter((b) => ["declare", "assign", "input", "for"].includes(b.kind))
        .map((b) => b.name),
      ...Object.keys(variables),
    ]),
  ].filter(Boolean);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(next: Project) {
    if (busy || !ready) return;
    applyProject(next);
    reset();
  }
  function openProblem(isNew: boolean) {
    setProblemDraft(
      isNew
        ? { title: "", description: "" }
        : { title: project.title, description: project.description || "" },
    );
    setFormError("");
    setModal(isNew ? "new" : "problem");
  }
  function editBlock(b: Block) {
    if (busy) {
      setToast("Засахын өмнө ажиллуулалтыг зогсооно уу.");
      return;
    }
    setSelected(b.id);
    setDraft({ block: structuredClone(b) });
    setFormError("");
    setModal("block");
    setSlot(null);
  }
  function insert(kind: Kind, targetSlot?: Slot) {
    if (busy) return;
    setDraft({
      block: block(kind, ...defaultValues[kind]),
      slot: targetSlot ||
        slot || {
          parent: null,
          branch: "children",
          index: project.blocks.length,
        },
    });
    setFormError("");
    setModal("block");
    setSlot(null);
  }
  function saveBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || busy) return;
    const b = {
      ...draft.block,
      name: draft.block.name.trim(),
      expression: draft.block.expression.trim(),
    };
    try {
      if (
        ["declare", "assign", "input", "for"].includes(b.kind) &&
        (!/^[A-Za-z_]\w*$/.test(b.name) || ["true", "false"].includes(b.name))
      )
        throw new Error(
          "Нэр латин үсэг эсвэл _-ээр эхэлнэ. true, false нэр ашиглахгүй.",
        );
      if (b.kind === "for") {
        const [start, end, step] = splitForBounds(b.expression);
        if (!start || !end)
          throw new Error("Эхлэх болон төгсөх утгаа бичнэ үү.");
        parseExpression(start);
        parseExpression(end);
        if (step) parseExpression(step);
      } else if (b.kind !== "input") parseExpression(b.expression);
      commit(
        draft.slot
          ? insertProjectBlock(project, b, draft.slot)
          : updateProjectBlock(project, b.id, {
              name: b.name,
              expression: b.expression,
            }),
      );
      setSelected(b.id);
      setModal(null);
      setDraft(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Утгаа шалгана уу.",
      );
    }
  }

  function remove(id: string) {
    commit(removeProjectBlock(project, id));
    setSelected(null);
  }
  function undo() {
    if (!canUndo || busy) return;
    undoProject();
    setSelected(null);
    reset();
  }
  function redo() {
    if (!canRedo || busy) return;
    redoProject();
    setSelected(null);
    reset();
  }
  function download() {
    downloadText(
      JSON.stringify(project, null, 2),
      `${project.title || "algorithm"}.flow.json`,
      "application/json",
    );
    setToast("Алгоритм татагдлаа");
  }
  function downloadPython() {
    if (generated.error) return;
    downloadText(
      generated.code,
      `${project.title || "algorithm"}.py`,
      "text/x-python;charset=utf-8",
    );
    setToast("Python файл татагдлаа");
  }
  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    try {
      if (file.size > 500000) throw new Error();
      const value = JSON.parse(await file.text());
      if (!validateProject(value)) throw new Error();
      commit(value);
      setSelected(null);
      setToast("Алгоритм нээгдлээ");
    } catch {
      setToast("Файл тохирохгүй байна. .flow.json файл сонгоно уу.");
    }
    e.target.value = "";
  }
  function loadProblem(problem: Problem) {
    if (busy || !ready) return;
    commit({
      title: problem.title,
      description: problem.description,
      problemId: problem.id,
      blocks: problem.blocks,
    });
    setSelected(null);
    setModal(null);
    setZoom(100);
    setTab("flow");
    router.push("/editor");
  }
  // Sends the blocks to the server judge and prints each test's outcome in the console.
  async function check() {
    const problemId = project.problemId;
    if (!problemId || busy || checking) return;
    setChecking(true);
    execution.setLogs([{ type: "system", text: "Тестүүдээр шалгаж байна..." }]);
    try {
      const res = await fetch(`/api/problems/${problemId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: project.blocks }),
      });
      const data: SubmitResult & { error?: string } = await res.json();
      if (!res.ok) {
        execution.setLogs([
          { type: "error", text: data.error || "Шалгаж чадсангүй." },
        ]);
        return;
      }
      const lines: Log[] = data.results.map((r) => {
        const name = r.sample
          ? `Тест ${r.index + 1}`
          : `Нууц тест ${r.index + 1}`;
        if (r.passed) return { type: "success", text: `${name} ✓` };
        const detail = r.error
          ? ` — ${r.error}`
          : r.sample
            ? ` — оролт: ${r.input?.replace(/\n/g, ", ")} · хүлээгдсэн: ${r.expected?.replace(/\n/g, ", ")} · гарсан: ${r.got?.replace(/\n/g, ", ") || "—"}`
            : "";
        return { type: "error", text: `${name} ✗${detail}` };
      });
      lines.push(
        data.allPassed
          ? {
              type: "success",
              text: `Бүх тест давлаа (${data.passed}/${data.total}).${
                data.saved
                  ? " Бодлого хадгалагдлаа."
                  : " Нэвтэрч орвол бодлого хадгалагдана."
              }`,
            }
          : {
              type: "error",
              text: `${data.passed}/${data.total} тест давлаа.`,
            },
      );
      execution.setLogs(lines);
      setCheckCount((c) => c + 1);
    } catch {
      execution.setLogs([{ type: "error", text: "Сүлжээний алдаа гарлаа." }]);
    } finally {
      setChecking(false);
    }
  }
  function restoreSavedProject() {
    if (!savedProject || busy || !ready) return;
    commit(savedProject);
    setSelected(null);
    setSlot(null);
    setTab("flow");
    setToast("Өмнөх ажил нээгдлээ");
  }
  function saveProblem(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !ready) return;
    if (!problemDraft.title.trim()) {
      setFormError("Бодлогын нэрээ бичнэ үү.");
      return;
    }
    commit({
      title: problemDraft.title.trim(),
      description: problemDraft.description.trim(),
      blocks: modal === "new" ? [] : project.blocks,
    });
    setSelected(null);
    setModal(null);
    setTab("flow");
    router.push("/editor");
  }
  return {
    ...execution,
    hasChanges,
    hasSavedProject: savedProject !== null,
    restoreSavedProject,
    project,
    ready,
    storageError,
    canUndo,
    canRedo,
    selected,
    setSelected,
    slot,
    setSlot,
    tab,
    setTab,
    draft,
    setDraft,
    formError,
    problemDraft,
    setProblemDraft,
    zoom,
    setZoom,
    modal,
    setModal,
    sidebar,
    setSidebar,
    toast,
    setToast,
    generated,
    allBlocks,
    variableNames,
    commit,
    openProblem,
    editBlock,
    insert,
    saveBlock,
    remove,
    undo,
    redo,
    download,
    downloadPython,
    importFile,
    loadProblem,
    check,
    checking,
    checkCount,
    saveProblem,
  };
}
