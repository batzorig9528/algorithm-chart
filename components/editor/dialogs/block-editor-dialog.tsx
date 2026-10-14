"use client";
import { Check, Trash2 } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { Modal } from "@/components/ui/modal";
import {
  definitions,
  splitForBounds,
  variableTypes,
  type VariableType,
} from "@/lib/flow";

export function BlockEditorDialog() {
  const { draft, setDraft, formError, setModal, saveBlock, remove } =
    useEditor();
  if (!draft) return null;
  return (
    <Modal onClose={() => setModal(null)}>
      <form className="block-editor modal-block-editor" onSubmit={saveBlock}>
        <h2 id="modal-title">
          {definitions[draft.block.kind].label} {draft.slot ? "нэмэх" : "засах"}
        </h2>
        {draft.block.kind === "declare" && (
          <label htmlFor="block-type">
            Төрөл
            <select
              id="block-type"
              value={draft.block.type ?? "int"}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  block: {
                    ...draft.block,
                    type: e.target.value as VariableType,
                  },
                })
              }
            >
              {(Object.keys(variableTypes) as VariableType[]).map((t) => (
                <option key={t} value={t}>
                  {variableTypes[t]}
                </option>
              ))}
            </select>
          </label>
        )}
        {["declare", "assign", "input", "for", "function", "call"].includes(
          draft.block.kind,
        ) && (
          <label htmlFor="block-name">
            {draft.block.kind === "declare"
              ? "Хувьсагчийн нэрс (таслалаар тусгаарла)"
              : draft.block.kind === "function"
                ? "Функцийн нэр"
                : draft.block.kind === "call"
                  ? "Дуудах функцийн нэр"
                  : "Хувьсагчийн нэр"}
            <input
              autoFocus
              id="block-name"
              maxLength={100}
              value={draft.block.name}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  block: { ...draft.block, name: e.target.value },
                })
              }
              placeholder={
                draft.block.kind === "declare"
                  ? "Жишээ: a, b, c"
                  : draft.block.kind === "function" ||
                      draft.block.kind === "call"
                    ? "Жишээ: sum"
                    : "Жишээ: x"
              }
            />
          </label>
        )}
        {draft.block.kind === "call" && (
          <label htmlFor="block-result">
            Үр дүнг хадгалах хувьсагч <span>(заавал биш)</span>
            <input
              id="block-result"
              maxLength={100}
              value={draft.block.result ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  block: { ...draft.block, result: e.target.value },
                })
              }
              placeholder="Жишээ: total"
            />
          </label>
        )}
        {draft.block.kind === "for" &&
          (() => {
            const [start, end, step] = splitForBounds(draft.block.expression);
            const set = (a: string, b: string, c: string) =>
              setDraft({
                ...draft,
                block: {
                  ...draft.block,
                  expression: c ? `${a}; ${b}; ${c}` : `${a}; ${b}`,
                },
              });
            return (
              <>
                <label htmlFor="block-start">
                  Эхлэх утга
                  <input
                    id="block-start"
                    maxLength={500}
                    value={start}
                    onChange={(e) => set(e.target.value, end, step)}
                    placeholder="Жишээ: 1"
                  />
                </label>
                <label htmlFor="block-end">
                  Төгсөх утга (орно)
                  <input
                    id="block-end"
                    maxLength={500}
                    value={end}
                    onChange={(e) => set(start, e.target.value, step)}
                    placeholder="Жишээ: n"
                  />
                </label>
                <label htmlFor="block-step">
                  Өөрчлөлт <span>(заавал биш, анхны утга 1)</span>
                  <input
                    id="block-step"
                    maxLength={500}
                    value={step}
                    onChange={(e) => set(start, end, e.target.value)}
                    placeholder="Жишээ: 2 эсвэл -1"
                  />
                </label>
              </>
            );
          })()}
        {draft.block.kind !== "input" && draft.block.kind !== "for" && (
          <label htmlFor="block-expression">
            {["if", "while", "dowhile"].includes(draft.block.kind)
              ? "Нөхцөл"
              : draft.block.kind === "declare"
                ? "Эхний утга (заавал биш)"
                : draft.block.kind === "function"
                  ? "Параметрүүд (таслалаар тусгаарла)"
                  : draft.block.kind === "call"
                    ? "Дамжуулах утгууд (таслалаар тусгаарла)"
                    : draft.block.kind === "return"
                      ? "Буцаах утга (заавал биш)"
                      : "Илэрхийлэл"}
            <textarea
              autoFocus={
                !["declare", "assign", "function", "call"].includes(
                  draft.block.kind,
                )
              }
              id="block-expression"
              maxLength={1000}
              value={draft.block.expression}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  block: { ...draft.block, expression: e.target.value },
                })
              }
              placeholder={
                draft.block.kind === "function"
                  ? "Жишээ: a, b"
                  : draft.block.kind === "call"
                    ? "Жишээ: 3, x + 1"
                    : "Жишээ: a + b"
              }
              rows={3}
            />
          </label>
        )}
        <div className="expression-help">
          <code>+ − * / % · == != &lt; &gt; &lt;= &gt;= · &amp;&amp; || !</code>
        </div>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="modal-actions">
          {!draft.slot && (
            <button
              type="button"
              className="button danger-button"
              onClick={() => {
                remove(draft.block.id);
                setModal(null);
                setDraft(null);
              }}
            >
              <Trash2 size={14} />
              Устгах
            </button>
          )}
          <button
            type="button"
            className="button"
            onClick={() => setModal(null)}
          >
            Болих
          </button>
          <button type="submit" className="button run-button">
            <Check size={15} />
            Хадгалах
          </button>
        </div>
      </form>
    </Modal>
  );
}
