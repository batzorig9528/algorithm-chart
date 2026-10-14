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
  running: "Ажиллаж байна",
  completed: "Ажиллаж дууслаа",
  stopped: "Зогсоосон",
  error: "Алдаа гарлаа",
};

export function PygameResult({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <Modal wide onClose={onClose}>
      <h2 id="modal-title">Pygame үр дүн</h2>
      <PygameRun
        key={attempt}
        code={code}
        onClose={onClose}
        onRestart={() => setAttempt((value) => value + 1)}
      />
    </Modal>
  );
}

function PygameRun({
  code,
  onClose,
  onRestart,
}: {
  code: string;
  onClose: () => void;
  onRestart: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLPreElement>(null);
  const close = useEffectEvent(onClose);
  const stopRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<PygameStatus>("loading");
  const [output, setOutput] = useState("");

  useEffect(() => {
    const runId = crypto.randomUUID();
    const iframe = document.createElement("iframe");
    iframe.title = "Pygame тоглоом";
    iframe.className = "pygame-frame";
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.src = `/pygame/runtime.html#${runId}`;
    let active = true;
    let started = false;
    const destroy = () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      iframe.remove();
    };
    const timeout = window.setTimeout(() => {
      destroy();
      setStatus("error");
      setOutput(
        "Pygame ачаалж чадсангүй. Интернет холболтоо шалгаад дахин ажиллуулна уу.",
      );
    }, PYGAME_LOAD_TIMEOUT);
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
          if (started) return;
          started = true;
          iframe.contentWindow?.postMessage(
            { channel: PYGAME_CHANNEL, runId, type: "run", code },
            "*",
          );
          break;
        case "running":
          clearTimeout(timeout);
          setStatus("running");
          iframe.focus();
          break;
        case "output":
          setOutput((previous) => appendPygameOutput(previous, message.text));
          break;
        case "error":
          clearTimeout(timeout);
          setStatus("error");
          setOutput((previous) => appendPygameOutput(previous, message.text));
          break;
        case "completed":
          clearTimeout(timeout);
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
      setStatus("stopped");
    };
    return destroy;
  }, [code]);

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
