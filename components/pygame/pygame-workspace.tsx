"use client";

import { useMemo, useRef, useState } from "react";
import { Code2, Download, Gamepad2, Play, RotateCcw } from "lucide-react";
import { downloadText } from "@/lib/download";
import { PYGAME_EXAMPLE, type PygameStatus } from "@/lib/pygame";
import { PythonEditor } from "@/components/pygame/python-editor";
import { usePygameDraft } from "@/hooks/use-pygame-draft";
import { LIGHT_EXAMPLE, SNAKE_EXAMPLE } from "@/lib/light-examples";
import { lightPythonIssues } from "@/lib/light-python";
import { useLightSyntax } from "@/hooks/use-light-syntax";
import { PygameResult } from "@/components/pygame/pygame-result";

export function PygameWorkspace() {
  const { code, setCode, ready, storageError } = usePygameDraft();
  const [mode, setMode] = useState<"light" | "full">("light");
  const unsupported = useMemo(() => mode === "light" ? lightPythonIssues(code) : [], [code, mode]);
  const syntax = useLightSyntax(code, mode === "light");
  const issues = [...unsupported, ...syntax];
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
        <div className="pygame-mode-toolbar">
          <label htmlFor="pygame-mode">Ажиллуулах горим</label>
          <select id="pygame-mode" value={mode} onChange={event => {
            setRun(null);
            setMode(event.target.value as "light" | "full");
          }}>
            <option value="light">Хөнгөн Python — үндсэн тоглоомууд</option>
            <option value="full">Бүрэн Pygame — Python 3.12</option>
          </select>
          <button className="pygame-button" type="button" onClick={() => { setRun(null); setMode("light"); setCode(SNAKE_EXAMPLE); }}>Snake жишээ</button>
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
                  setCode(mode === "light" ? LIGHT_EXAMPLE : PYGAME_EXAMPLE);
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
                disabled={!ready || !code.trim() || issues.length > 0}
                onClick={() => setRun({ code })}
              >
                <Play size={15} /> Ажиллуулах
              </button>
            </div>
          </div>
          <PythonEditor code={code} onChange={setCode} editorRef={editor} disabled={!ready} diagnostics={issues} light={mode === "light"} />
          <div className="pygame-editor-footer">
            <span>{mode === "light" ? "Хөнгөн Python · Canvas" : "Python 3.12 · pygame-ce"}</span>
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
          {mode === "light" ? <>
            <p><strong>Хөнгөн горим:</strong> pygame дэлгэц, дүрс, текст, mouse/keyboard, random, math болон Python-ийн үндсэн үйлдлүүд. Давталт бүрд <code>clock.tick(30)</code> ашиглана.</p>
            <p>Улаан тэмдэглэгээтэй код дэмжигдээгүй эсвэл синтаксийн алдаатай. Мэдэгдэл дээр дарж тухайн мөрөнд очно. Зураг/дууны файл, нэмэлт багц, async/await хэрэгтэй бол бүрэн горим сонгоно.</p>
          </> : <>
            <p><strong>Бүрэн Pygame:</strong> тоглоомын давталт бүрд <code>await asyncio.sleep(0)</code>, төгсгөлд <code>asyncio.run(main())</code> ашиглана.</p>
            <p>Эхний ачаалалд интернет хэрэгтэй бөгөөд хэдэн минут болж болно. Нэг Python файл ажиллана.</p>
          </>}
        </div>
      </section>
      <PygameResult
        key={mode}
        mode={mode}
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

