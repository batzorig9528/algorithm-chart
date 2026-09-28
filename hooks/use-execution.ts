"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { execute, type Block, type Frame, type Variables } from "@/lib/flow";
import type { Log, ExecutionStatus } from "@/types/editor";

export function useExecution(blocks: Block[]) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [variables, setVariables] = useState<Variables>({});
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [active, setActive] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [speed, setSpeed] = useState(450);
  const runner = useRef<Generator<Frame, void, string | undefined> | null>(
    null,
  );
  const auto = useRef(false);

  // Each frame schedules the next step. Cleanup cancels pending work on pause/unmount.
  useEffect(() => {
    if (status !== "running") return;
    const timer = setTimeout(() => advance(), speed);
    return () => clearTimeout(timer);
  });
  function reset() {
    runner.current = null;
    auto.current = false;
    setStatus("idle");
    setActive(null);
    setPendingInput("");
    setInputValue("");
    setVariables({});
    setLogs([]);
  }
  function advance(value?: string) {
    if (!runner.current) return;
    try {
      const result = runner.current.next(value);
      if (result.done) {
        setStatus("done");
        setActive(null);
        runner.current = null;
        setLogs((l) => [
          ...l,
          { type: "success", text: "Програм амжилттай дууслаа." },
        ]);
        return;
      }
      const frame = result.value;
      setActive(frame.id);
      setVariables(frame.variables);
      if (frame.output !== undefined)
        setLogs((l) => [...l, { type: "output", text: frame.output! }]);
      if (frame.input) {
        setPendingInput(frame.input);
        setStatus("input");
      } else setStatus(auto.current ? "running" : "paused");
    } catch (error) {
      setLogs((l) => [
        ...l,
        {
          type: "error",
          text: error instanceof Error ? error.message : "Алдаа гарлаа.",
        },
      ]);
      setStatus("error");
      setPendingInput("");
      runner.current = null;
    }
  }
  function start(automatic: boolean) {
    auto.current = automatic;
    if (!runner.current) {
      runner.current = execute(blocks);
      setLogs([{ type: "system", text: "Програм эхэллээ." }]);
      setVariables({});
    }
    if (status !== "input") advance();
  }
  function submitInput(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setLogs((l) => [
      ...l,
      { type: "input", text: `${pendingInput} = ${inputValue}` },
    ]);
    setPendingInput("");
    setInputValue("");
    advance(inputValue);
  }

  function pause() {
    auto.current = false;
    setStatus("paused");
  }
  const busy = ["running", "paused", "input"].includes(status);
  return {
    logs,
    setLogs,
    variables,
    status,
    active,
    pendingInput,
    inputValue,
    setInputValue,
    speed,
    setSpeed,
    busy,
    reset,
    start,
    pause,
    submitInput,
  };
}
