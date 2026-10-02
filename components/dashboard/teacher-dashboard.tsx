"use client";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProblems } from "@/components/problems/use-problems";

const LEVELS = ["Анхан шат", "Дунд шат", "Ахисан шат"];
const emptyTest = { input: "", expected: "", isSample: false };
const emptyDraft = {
  title: "",
  description: "",
  inputFormat: "",
  outputFormat: "",
  level: LEVELS[0],
  tag: "",
  tests: [{ ...emptyTest, isSample: true }],
};

export function TeacherDashboard() {
  const { user, ready, openModal } = useAuth();
  const { problems, loading, error, reload } = useProblems();
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isTeacher = ["TEACHER", "ADMIN"].includes(
    user?.role?.toUpperCase() ?? "",
  );

  function setTest(index: number, patch: Partial<typeof emptyTest>) {
    setDraft({
      ...draft,
      tests: draft.tests.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Тодорхойгүй алдаа гарлаа.");
        return;
      }
      setDraft(emptyDraft);
      await reload();
    } catch {
      setFormError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number, title: string) {
    if (!window.confirm(`“${title}” бодлогыг устгах уу?`)) return;
    const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setFormError(data?.error || "Устгаж чадсангүй.");
      return;
    }
    await reload();
  }

  if (!ready) return <main className="content-page" />;

  if (!isTeacher) {
    return (
      <main className="content-page">
        <section className="content-card">
          <h1>Хяналтын самбар</h1>
          <p>Зөвхөн багш үзнэ.</p>
          {!user && (
            <button className="button" onClick={() => openModal("tee-login")}>
              Багшаар нэвтрэх
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="content-page">
      <section className="content-card">
        <h1>Хяналтын самбар</h1>

        <form className="problem-form dashboard-form" onSubmit={create}>
          <label htmlFor="dash-title">
            Бодлогын нэр
            <input
              id="dash-title"
              maxLength={100}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Жишээ: Гурван тооны хамгийн ихийг олох"
            />
          </label>
          <label htmlFor="dash-description">
            Нөхцөл
            <textarea
              id="dash-description"
              maxLength={5000}
              rows={4}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <label htmlFor="dash-input-format">
            Оролтын тайлбар
            <textarea
              id="dash-input-format"
              maxLength={5000}
              rows={2}
              value={draft.inputFormat}
              onChange={(e) =>
                setDraft({ ...draft, inputFormat: e.target.value })
              }
              placeholder="Жишээ: Нэг мөрөнд нэг тоо, нийт хоёр тоо."
            />
          </label>
          <label htmlFor="dash-output-format">
            Гаралтын тайлбар
            <textarea
              id="dash-output-format"
              maxLength={5000}
              rows={2}
              value={draft.outputFormat}
              onChange={(e) =>
                setDraft({ ...draft, outputFormat: e.target.value })
              }
              placeholder="Жишээ: Хоёр тооны нийлбэр."
            />
          </label>
          <label htmlFor="dash-level">
            Түвшин
            <select
              id="dash-level"
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value })}
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label htmlFor="dash-tag">
            Шошго <span>(заавал биш)</span>
            <input
              id="dash-tag"
              maxLength={60}
              value={draft.tag}
              onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
              placeholder="Жишээ: Давталт · Хувьсагч"
            />
          </label>
          <fieldset className="test-editor">
            <legend>Тестүүд</legend>
            <p className="muted">
              Оролт: мөр бүр нэг оролтын блокт өгөгдөнө. Гаралт: хүлээгдэх
              мөрүүд. “Жишээ” гэж тэмдэглэсэн тест сурагчид харагдана, бусад нь
              нууц.
            </p>
            {draft.tests.map((t, i) => (
              <div className="test-row" key={i}>
                <label>
                  Оролт
                  <textarea
                    rows={2}
                    value={t.input}
                    onChange={(e) => setTest(i, { input: e.target.value })}
                  />
                </label>
                <label>
                  Хүлээгдэх гаралт
                  <textarea
                    rows={2}
                    value={t.expected}
                    onChange={(e) => setTest(i, { expected: e.target.value })}
                  />
                </label>
                <label className="test-sample">
                  <input
                    type="checkbox"
                    checked={t.isSample}
                    onChange={(e) => setTest(i, { isSample: e.target.checked })}
                  />
                  Жишээ
                </label>
                <button
                  type="button"
                  className="button subtle"
                  aria-label={`Тест ${i + 1} устгах`}
                  disabled={draft.tests.length === 1}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      tests: draft.tests.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  tests: [...draft.tests, { ...emptyTest }],
                })
              }
            >
              <Plus size={14} />
              Тест нэмэх
            </button>
          </fieldset>
          {(formError || error) && (
            <p className="form-error" role="alert">
              {formError || error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="submit"
              className="button run-button"
              disabled={saving}
            >
              <Plus size={15} />
              Бодлого нэмэх
            </button>
          </div>
        </form>

        {loading && <p>Ачаалж байна...</p>}
        <ul className="dashboard-list">
          {problems.map((p) => (
            <li key={p.id}>
              <div>
                <strong>{p.title}</strong>
                <small>
                  {[p.level, p.tag, `${p.testCount} тест`, p.authorName]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              <button
                type="button"
                className="button subtle"
                aria-label={`${p.title} устгах`}
                onClick={() => remove(p.id, p.title)}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
