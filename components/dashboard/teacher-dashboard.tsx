"use client";
import { useState, type FormEvent } from "react";
import { LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useProblems } from "@/components/problems/use-problems";

const LEVELS = ["Анхан шат", "Дунд шат", "Ахисан шат"];
const emptyDraft = { title: "", description: "", level: LEVELS[0], tag: "" };

export function TeacherDashboard() {
  const { user, ready, openModal } = useAuth();
  const { problems, loading, error, reload } = useProblems();
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isTeacher = ["TEACHER", "ADMIN"].includes(
    user?.role?.toUpperCase() ?? "",
  );

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
          <p>Энэ хуудсыг зөвхөн багш эрхээр нэвтэрсэн хэрэглэгч үзнэ.</p>
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
        <span className="modal-eyebrow">
          <LayoutDashboard size={16} />
          ХЯНАЛТЫН САМБАР
        </span>
        <h1>Бодлогын сан удирдах</h1>
        <p>
          Эндээс нэмсэн бодлого “Бодлогын сан” хуудсанд сурагчдад харагдана.
          Нийт {problems.length} бодлого.
        </p>

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
            Бодлогын нөхцөл
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
                  {[p.level, p.tag, p.authorName].filter(Boolean).join(" · ")}
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
