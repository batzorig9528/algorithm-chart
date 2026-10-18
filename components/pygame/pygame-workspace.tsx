"use client";

import { useRef, useState } from "react";
import { Code2, Download, Gamepad2, Play, RotateCcw } from "lucide-react";
import { downloadText } from "@/lib/download";
import { PYGAME_EXAMPLE, type PygameStatus } from "@/lib/pygame";
import { PythonEditor } from "@/components/pygame/python-editor";
import { usePygameDraft } from "@/hooks/use-pygame-draft";
import { PygameResult } from "@/components/pygame/pygame-result";

export function PygameWorkspace() {
  const { code, setCode, ready, storageError } = usePygameDraft();
  const [run, setRun] = useState<{ code: string } | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<PygameStatus>("loading");
  const editor = useRef<HTMLTextAreaElement>(null);
  const runButton = useRef<HTMLButtonElement>(null);

  return (
    <main className="content-page pygame-page">
      <section className="pygame-workspace" aria-labelledby="pygame-title">
        <div className="pygame-heading">
          <span className="pygame-badge">
            <Gamepad2 size={16} /> PYTHON × PYGAME
          </span>
          <h1 id="pygame-title">Кодоор тоглоом бүтээе</h1>
          <p>
            Python кодоо бичээд ажиллуулаарай. Тоглоом тань тусдаа цонхонд
            нээгдэнэ.
          </p>
        </div>
        <div className="pygame-editor-card">
          <div className="pygame-toolbar">
            <label htmlFor="pygame-code" className="pygame-filename">
              <Code2 size={17} /> main.py
            </label>
            <div className="pygame-actions">
              <button
                type="button"
                className="pygame-button"
                onClick={() => {
                  setCode(PYGAME_EXAMPLE);
                  if (editor.current) editor.current.scrollTop = 0;
                  editor.current?.focus();
                }}
              >
                <RotateCcw size={15} /> Жишээг сэргээх
              </button>
              <button
                type="button"
                className="pygame-button"
                onClick={() =>
                  downloadText(code, "main.py", "text/x-python;charset=utf-8")
                }
              >
                <Download size={15} /> .py татах
              </button>
              <button
                ref={runButton}
                type="button"
                className="pygame-button pygame-primary"
                disabled={!ready || !code.trim()}
                onClick={() => setRun({ code })}
              >
                <Play size={15} /> Ажиллуулах
              </button>
            </div>
          </div>
          <PythonEditor code={code} onChange={setCode} editorRef={editor} disabled={!ready} />
          <div className="pygame-editor-footer">
            <span>Python 3.12 · pygame-ce</span>
            <span>Ctrl+Space: санал · ↑↓: сонгох · Enter/Tab: оруулах · Shift+Tab: гарах</span>
          </div>
        </div>
        <p className="pygame-save-status" role="status">
          {storageError ? "Хадгалж чадсангүй. .py татах товчоор кодоо аваарай." : ready ? "Код энэ төхөөрөмжид автоматаар хадгалагдана." : "Хадгалсан кодыг сэргээж байна…"}
        </p>
        {!run && <p className="pygame-save-status" role="status">
          {runtimeStatus === "ready" ? "Pygame бэлэн — кодоо шууд ажиллуулж болно."
            : runtimeStatus === "error" ? "Pygame бэлтгэхэд алдаа гарлаа. Ажиллуулах цонхноос дахин оролдоно уу."
            : "Pygame-ийг урьдчилан бэлдэж байна. Энэ хооронд кодоо бичиж болно."}
        </p>}
        <div className="pygame-help" id="pygame-code-help">
          <p>
            <strong>Хөтөч дээр ажиллах давталт</strong> —{" "}
            <code>async def main()</code> доторх тоглоомын давталт бүрд{" "}
            <code>await asyncio.sleep(0)</code> оруулж, төгсгөлд{" "}
            <code>asyncio.run(main())</code> дуудаарай. Завсарлагагүй давталт
            хөтчийг гацааж болно.
          </p>
          <p>
            Эхний ачаалалд интернет хэрэгтэй, удаан сүлжээнд хэдэн минут болж болно. Нэг Python файл ажиллана; зураг,
            дуу оруулах боломжгүй. Хуудсаас гарахаасаа өмнө кодоо{" "}
            <strong>.py татах</strong> товчоор аваарай.
          </p>
        </div>
      </section>
      <PygameResult
        code={run?.code ?? null}
        onStatus={setRuntimeStatus}
        onClose={() => {
          setRun(null);
          requestAnimationFrame(() => runButton.current?.focus());
        }}
      />
    </main>
  );
}

