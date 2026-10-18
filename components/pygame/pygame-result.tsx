"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { LoaderCircle, RotateCcw, Square, Terminal } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  appendPygameOutput,
  isPygameMessage,
  PYGAME_CHANNEL,
  PYGAME_LOAD_TIMEOUT,
  type PygameStatus,
} from "@/lib/pygame";

const labels: Record<PygameStatus, string> = {
  loading: "Pygame ачаалж байна…",
  ready: "Ажиллуулахад бэлэн",
  running: "Ажиллаж байна",
  completed: "Ажиллаж дууслаа",
  stopped: "Зогсоосон",
  error: "Алдаа гарлаа",
};

export function PygameResult({
  code,
  onClose,
  onStatus,
  mode,
}: {
  mode: "light" | "full";
  code: string | null;
  onClose: () => void;
  onStatus: (status: PygameStatus) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  function close() {
    onClose();
    // Dispose the user's environment and prepare one clean instance.
    setAttempt(value => value + 1);
  }
  return (
    <Modal wide open={code !== null} onClose={close}>
      <h2 id="modal-title">Pygame үр дүн</h2>
      <PygameRun
        key={attempt}
        mode={mode}
        code={code}
        onClose={close}
        onStatus={onStatus}
        onRestart={() => setAttempt((value) => value + 1)}
      />
    </Modal>
  );
}

function PygameRun({
  code,
  onClose,
  onRestart,
  onStatus,
  mode,
}: {
  mode: "light" | "full";
  code: string | null;
  onClose: () => void;
  onRestart: () => void;
  onStatus: (status: PygameStatus) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLPreElement>(null);
  const close = useEffectEvent(onClose);
  const stopRef = useRef<() => void>(() => {});
  const waitRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});
  const sourceRef = useRef(code);
  const reportStatus = useEffectEvent(onStatus);
  const [status, setStatus] = useState<PygameStatus>("loading");
  const [output, setOutput] = useState("");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const runId = crypto.randomUUID();
    const iframe = document.createElement("iframe");
    iframe.title = "Pygame тоглоом";
    iframe.className = "pygame-frame";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.src = `${mode === "light" ? "/pygame/light/runtime.html" : "/pygame/runtime.html"}#${runId}`;
    let active = true;
    let started = false;
    let ready = false;
    const destroy = () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      iframe.remove();
    };
    // A slow download/compile is not a failed run. Preserve the iframe and let
    // the user keep waiting or explicitly stop; do not discard download work.
    let timeout = window.setTimeout(() => setSlow(true), PYGAME_LOAD_TIMEOUT);
    waitRef.current = () => {
      setSlow(false);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => setSlow(true), PYGAME_LOAD_TIMEOUT);
    };
    function start() {
      const source = sourceRef.current;
      if (!active || !ready || started || source === null) return;
      started = true;
      setStatus("loading");
      waitRef.current();
      iframe.contentWindow?.postMessage(
        { channel: PYGAME_CHANNEL, runId, type: "run", code: source }, "*",
      );
    }
    startRef.current = start;
    function receive(event: MessageEvent<unknown>) {
      if (
        !active ||
        event.source !== iframe.contentWindow ||
        !isPygameMessage(event.data) ||
        event.data.runId !== runId
      )
        return;
      const message = event.data;
      switch (message.type) {
        case "ready":
          if (ready) return;
          ready = true;
          clearTimeout(timeout);
          setSlow(false);
          setStatus("ready");
          start();
          break;
        case "running":
          clearTimeout(timeout);
          setSlow(false);
          setStatus("running");
          iframe.focus();
          break;
        case "output":
          setOutput((previous) => appendPygameOutput(previous, message.text));
          break;
        case "error":
          destroy();
          setSlow(false);
          setStatus("error");
          setOutput((previous) => appendPygameOutput(previous, message.text));
          break;
        case "completed":
          destroy();
          setSlow(false);
          setStatus("completed");
          break;
        case "close":
          close();
          break;
      }
    }
    window.addEventListener("message", receive);
    host.current?.appendChild(iframe);
    stopRef.current = () => {
      destroy();
      setSlow(false);
      setStatus("stopped");
    };
    return destroy;
  }, [mode]);

  useEffect(() => {
    sourceRef.current = code;
    startRef.current();
  }, [code]);

  useEffect(() => { reportStatus(status); }, [status]);

  useEffect(() => {
    const console = consoleRef.current;
    if (console) console.scrollTop = console.scrollHeight;
  }, [output]);

  return (
    <div className="pygame-result">
      <div className="pygame-run-toolbar">
        <p role="status" className={`pygame-status pygame-status-${status}`}>
          {status === "loading" && (
            <LoaderCircle size={15} className="pygame-spinner" />
          )}
          {labels[status]}
        </p>
        <div className="pygame-actions">
          <button
            type="button"
            className="pygame-button"
            disabled={status !== "running" && status !== "loading"}
            onClick={() => stopRef.current()}
          >
            <Square size={14} /> Зогсоох
          </button>
          <button type="button" className="pygame-button" onClick={onRestart}>
            <RotateCcw size={14} /> Дахин ажиллуулах
          </button>
        </div>
      </div>
      {slow && status === "loading" && (
        <div className="pygame-slow-load" role="status">
          <p>Ачаалал удаж байна. Удаан интернет эсвэл сул төхөөрөмж дээр нэмэлт хугацаа хэрэгтэй байж болно.</p>
          <button type="button" className="pygame-button" onClick={() => waitRef.current()}>Үргэлжлүүлэн хүлээх</button>
          <button type="button" className="pygame-button" onClick={() => stopRef.current()}>Цуцлах</button>
        </div>
      )}
      <div className="pygame-stage" ref={host}>
        {status === "loading" && (
          <div className="pygame-stage-message">
            Анхны ачаалал бага зэрэг удаж болно…
          </div>
        )}
        {status === "stopped" && (
          <div className="pygame-stage-message">
            Дахин ажиллуулахад тоглоом эхнээсээ эхэлнэ.
          </div>
        )}
        {status === "completed" && <div className="pygame-stage-message">Програм дууслаа. Үр дүнг консолд харна уу.</div>}
        {status === "error" && <div className="pygame-stage-message">Алдааны мэдээллийг консолд харна уу.</div>}
      </div>
      <p className="pygame-input-help">
        Тоглоом дээр дарж гар, хулганаар удирдана. Esc: цонх хаах.
      </p>
      <div className="pygame-console-heading">
        <Terminal size={15} />
        <h3>Консол</h3>
        <span>Сүүлийн 500 мөр</span>
      </div>
      <pre
        className="pygame-console"
        aria-label="Pygame консол"
        ref={consoleRef}
        tabIndex={0}
      >
        {output || "print() гаралт болон алдааны мэдээлэл энд харагдана."}
      </pre>
    </div>
  );
}

