"use client";
import { Code2, Copy, Download } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";

export function PythonView() {
  const { setToast, generated, downloadPython } = useEditor();

  return (
    <div className="code-view">
      <div>
        <span className="code-file">
          <Code2 size={16} /> main.py
        </span>
        <button disabled={!!generated.error} onClick={downloadPython}>
          <Download size={14} /> .py татах
        </button>
        <button
          disabled={!!generated.error}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(generated.code);
              setToast("Python хуулагдлаа");
            } catch {
              setToast("Хуулах боломжгүй байна");
            }
          }}
        >
          <Copy size={14} />
          Хуулах
        </button>
      </div>
      {generated.error && (
        <p className="form-error" role="alert">
          {generated.error} Блокоо засаж дахин үзнэ үү.
        </p>
      )}
      <pre>
        {generated.code.split("\n").map((line, i) => (
          <span key={i}>
            <em>{i + 1}</em>
            {line}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
