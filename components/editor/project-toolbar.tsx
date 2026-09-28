"use client";
import {
  CheckCheck,
  ChevronDown,
  Download,
  FolderOpen,
  Plus,
  Shapes,
  Workflow,
} from "lucide-react";
import { useState, useRef } from "react";
import { useEditor } from "@/contexts/editor-context";
import { IconButton } from "@/components/ui/icon-button";

export function ProjectToolbar() {
  const {
    project,
    storageError,
    hasChanges,
    hasSavedProject,
    restoreSavedProject,
    sidebar,
    setSidebar,
    commit,
    openProblem,
    download,
    importFile,
    busy,
  } = useEditor();
  const [menu, setMenu] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="project-toolbar">
      <div className="project-heading">
        {!sidebar && (
          <IconButton
            title="Блокийн самбар нээх"
            onClick={() => setSidebar(true)}
          >
            <Shapes size={19} />
          </IconButton>
        )}
        <span className="project-icon">
          <Workflow size={20} />
        </span>
        <div>
          <div className="title-row">
            <input
              aria-label="Алгоритмын нэр"
              value={project.title}
              disabled={busy}
              maxLength={100}
              onChange={(e) => commit({ ...project, title: e.target.value })}
            />
            <button
              className="title-menu"
              title="Файлын цэс"
              onClick={() => setMenu(!menu)}
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <span className="save-status">
            <CheckCheck size={12} />
            {storageError
              ? "Хадгалах боломжгүй · Файл татаж аваарай"
              : hasChanges
                ? "Энэ төхөөрөмжид хадгалагдсан"
                : "Хоосон схем · Блокоос эхлээрэй"}
          </span>
        </div>
      </div>
      <div className="project-actions">
        <button
          className="button subtle export-button"
          onClick={() => {
            download();
            setMenu(false);
          }}
        >
          <Download size={15} />
          Экспорт
        </button>
        <button
          className="button new-button"
          disabled={busy}
          onClick={() => openProblem(true)}
        >
          <Plus size={16} />
          Өөрийн бодлого
        </button>
      </div>
      {menu && (
        <div className="file-menu">
          <button
            disabled={busy || !hasSavedProject}
            onClick={() => {
              restoreSavedProject();
              setMenu(false);
            }}
          >
            <FolderOpen size={15} />
            Өмнөх ажлыг нээх
          </button>
          <button
            onClick={() => {
              download();
              setMenu(false);
            }}
          >
            <Download size={15} />
            Файл татах
          </button>
          <button
            disabled={busy}
            onClick={() => {
              fileInput.current?.click();
              setMenu(false);
            }}
          >
            <FolderOpen size={15} />
            Файл нээх
          </button>
        </div>
      )}
      <input
        hidden
        type="file"
        accept=".json"
        ref={fileInput}
        onChange={importFile}
      />
    </div>
  );
}
