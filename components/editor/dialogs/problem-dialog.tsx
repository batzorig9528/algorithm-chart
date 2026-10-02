"use client";
import { ArrowRight } from "lucide-react";
import { useEditor } from "@/contexts/editor-context";
import { Modal } from "@/components/ui/modal";

export function ProblemDialog() {
  const {
    formError,
    problemDraft,
    setProblemDraft,
    modal,
    setModal,
    saveProblem,
  } = useEditor();

  return (
    <Modal onClose={() => setModal(null)}>
      <form className="problem-form" onSubmit={saveProblem}>
        <h2 id="modal-title">
          {modal === "new" ? "Шинэ бодлого" : "Бодлогын нөхцөл"}
        </h2>
        <label htmlFor="problem-title">
          Бодлогын нэр
          <input
            autoFocus
            id="problem-title"
            maxLength={100}
            value={problemDraft.title}
            onChange={(e) =>
              setProblemDraft({ ...problemDraft, title: e.target.value })
            }
            placeholder="Жишээ: Гурван тооны хамгийн ихийг олох"
          />
        </label>
        <label htmlFor="problem-description">
          Бодлогын нөхцөл <span>(заавал биш)</span>
          <textarea
            id="problem-description"
            maxLength={5000}
            rows={4}
            value={problemDraft.description}
            onChange={(e) =>
              setProblemDraft({
                ...problemDraft,
                description: e.target.value,
              })
            }
            placeholder="Өгөгдөл, олох үр дүн, өөрийн санаагаа бичээрэй..."
          />
        </label>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button"
            onClick={() => setModal(null)}
          >
            Болих
          </button>
          <button type="submit" className="button run-button">
            {modal === "new" ? "Блок угсарч эхлэх" : "Хадгалах"}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
