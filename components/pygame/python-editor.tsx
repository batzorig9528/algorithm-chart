"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { lightPythonIssues, type LightIssue } from "@/lib/light-python";
import { analyzePython, ASSIST_LIMIT, pythonCompletions, type PythonCompletion } from "@/lib/python-editor";

export function PythonEditor({ code, onChange, editorRef, disabled = false, diagnostics = [], light = false }: {
  code: string;
  onChange: (code: string) => void;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  diagnostics?: LightIssue[];
  light?: boolean;
}) {
  const paint = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const [suggestions, setCompletion] = useState<ReturnType<typeof pythonCompletions> & { source: string }>({ source: "", from: 0, options: [] });
  const completion = suggestions.source === code ? suggestions : { from: 0, options: [] };
  const [selection, setSelection] = useState(0);
  const [firstLine, setFirstLine] = useState(0);
  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const visibleStart = Math.min(firstLine, Math.max(0, lineCount - 1));
  const analysis = useMemo(() => analyzePython(code), [code]);
  const allIssues = [...analysis.issues, ...diagnostics];
  const oversized = code.length > ASSIST_LIMIT;
  useEffect(() => {
    if (completion.options.length) {
      document.getElementById(`python-option-${selection}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [selection, completion.options.length]);
  const highlighted = useMemo(() => {
    let end = 0;
    const parts = analysis.tokens.flatMap(token => {
      const gap = code.slice(end, token.from);
      end = token.to;
      return [gap, <span key={token.from} className={`py-${token.kind}${diagnostics.some(issue => token.from < issue.to && token.to > issue.from) ? " py-unsupported" : ""}`}>{code.slice(token.from, token.to)}</span>];
    });
    return [...parts, code.slice(end), "\n"];
  }, [analysis, code, diagnostics]);

  function dismiss() { setCompletion({ source: "", from: 0, options: [] }); }
  function suggest(value: string, cursor: number, explicit = false) {
    const result = pythonCompletions(value, cursor, explicit);
    if (light) result.options = result.options.filter(option => {
      if (option.label === "asyncio" || option.label === "async" || option.label === "await") return false;
      const candidate = value.slice(0, result.from) + option.insert + value.slice(cursor);
      return !lightPythonIssues(candidate).some(issue => issue.from < result.from + option.insert.length && issue.to > result.from);
    });
    setCompletion({ ...result, source: value });
    setSelection(0);
  }
  function insert(text: string, from: number, to: number, caret = from + text.length) {
    onChange(code.slice(0, from) + text + code.slice(to));
    dismiss();
    requestAnimationFrame(() => { editorRef.current?.focus(); editorRef.current?.setSelectionRange(caret, caret); });
  }
  function accept(option: PythonCompletion) {
    const input = editorRef.current;
    if (!input) return;
    const text = option.insert.endsWith("()") && code[input.selectionStart] === "(" ? option.label : option.insert;
    insert(text, completion.from, input.selectionStart,
      completion.from + text.length - (text.endsWith("()") ? 1 : 0));
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    const input = event.currentTarget;
    if ((event.ctrlKey || event.metaKey) && event.code === "Space") {
      event.preventDefault(); suggest(code, input.selectionStart, true); return;
    }
    if (completion.options.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setSelection(value => (value + (event.key === "ArrowDown" ? 1 : -1) + completion.options.length) % completion.options.length);
        return;
      }
      if (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey)) {
        event.preventDefault(); accept(completion.options[selection]); return;
      }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss(); return; }
    }
    if (event.key === "Tab" && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault(); insert("    ", input.selectionStart, input.selectionEnd);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const before = code.slice(0, input.selectionStart).split("\n").at(-1) ?? "";
      const indent = /^\s*/.exec(before)![0] + (before.trimEnd().endsWith(":") ? "    " : "");
      insert("\n" + indent, input.selectionStart, input.selectionEnd);
    } else if (["ArrowLeft", "ArrowRight", "Home", "End", "Tab"].includes(event.key)) dismiss();
  }

  return (
    <>
      <div className="python-editor-wrap">
        <div className="pygame-code-editor">
          <div className="pygame-line-numbers" ref={gutter} aria-hidden="true">
            <div style={{ height: lineCount * 23, paddingTop: visibleStart * 23 }}>
              {Array.from({ length: Math.min(60, lineCount - visibleStart) }, (_, offset) => {
                const index = visibleStart + offset;
                return <div key={index} className={allIssues.some(issue => issue.line === index + 1) ? "python-error-line" : undefined}>{index + 1}</div>;
              })}
            </div>
          </div>
          <div className="python-input-stack">
            <pre className="python-highlight" aria-hidden="true" ref={paint}>{highlighted}</pre>
            <textarea
              ref={editorRef} id="pygame-code" aria-label="Pygame Python код"
              aria-describedby="pygame-code-help python-diagnostics" aria-autocomplete="list"
              aria-controls={completion.options.length ? "python-completions" : undefined}
              aria-activedescendant={completion.options.length ? `python-option-${selection}` : undefined}
              value={code} disabled={disabled} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off"
              onChange={event => {
                onChange(event.target.value);
                if (!(event.nativeEvent as InputEvent).isComposing) suggest(event.target.value, event.target.selectionStart);
              }}
              onKeyDown={keyDown} onClick={dismiss} onBlur={dismiss}
              onScroll={event => {
                if (paint.current) { paint.current.scrollTop = event.currentTarget.scrollTop; paint.current.scrollLeft = event.currentTarget.scrollLeft; }
                if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop;
                setFirstLine(Math.max(0, Math.floor(event.currentTarget.scrollTop / 23) - 5));
              }}
            />
          </div>
        </div>
        {completion.options.length > 0 && (
          <div className="python-completions" role="listbox" id="python-completions" aria-label="Кодын санал">
            {completion.options.map((option, index) => (
              <div key={option.label} id={`python-option-${index}`} role="option" aria-selected={index === selection}
                onMouseDown={event => { event.preventDefault(); accept(option); }}>
                <code>{option.insert}</code><small>{option.detail}</small>
              </div>
            ))}
          </div>
        )}
      </div>
      <div id="python-diagnostics" className="python-diagnostics">
        <small>{oversized ? "Том файл: өнгө болон туслах шалгалт түр унтарсан." : "Синтакс болон дэмжих үйлдлийн шалгалт · Динамик кодыг ажиллуулах үед дахин шалгана."}</small>
        {allIssues.map((issue, index) => <button key={`${issue.from}-${index}`} type="button" onClick={() => {
          editorRef.current?.focus(); editorRef.current?.setSelectionRange(issue.from, issue.from + 1);
          if (editorRef.current) {
            editorRef.current.scrollTop = Math.max(0, (issue.line - 3) * 23);
          }
        }}>Мөр {issue.line}: {issue.message}</button>)}
      </div>
    </>
  );
}
