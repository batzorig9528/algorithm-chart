"use client";
import { Check, Shapes, Trash2 } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { Modal } from "@/components/ui/modal";
import { definitions, splitForBounds } from "@/lib/flow";

export function BlockEditorDialog() {
  const { draft, setDraft, formError, setModal, saveBlock, remove } =
    useEditor();
  if (!draft) return null;
  return (
    <Modal onClose={() => setModal(null)}>
      <form className="block-editor modal-block-editor" onSubmit={saveBlock}>
        <span className="modal-eyebrow">
          <Shapes size={17} />
          {definitions[draft.block.kind].english}
        </span>
        <h2 id="modal-title">
          {definitions[draft.block.kind].label} {draft.slot ? "нэмэх" : "засах"}
        </h2>
        <p className="muted">
          {definitions[draft.block.kind].description}. Утгаа бичээд хадгалаарай.
        </p>
        {["declare", "assign", "input", "for"].includes(draft.block.kind) && (
          <label htmlFor="block-name">
            Хувьсагчийн нэр
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
              placeholder="Жишээ: x"
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
            {["if", "while"].includes(draft.block.kind)
              ? "Нөхцөл"
              : "Илэрхийлэл"}
            <textarea
              autoFocus={!["declare", "assign"].includes(draft.block.kind)}
              id="block-expression"
              maxLength={1000}
              value={draft.block.expression}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  block: { ...draft.block, expression: e.target.value },
                })
              }
              placeholder="Жишээ: a + b"
              rows={3}
            />
          </label>
        )}
        <div className="expression-help">
          <code>+ − * / % · == != &lt; &gt; &lt;= &gt;= · &amp;&amp; || !</code>
          <p>
            Текст: <code>"Сайн уу!"</code> · Тооцоолол: <code>a + b</code> ·
            Нөхцөл: <code>x &gt; 0</code>
          </p>
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
