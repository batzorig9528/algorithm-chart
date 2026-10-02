"use client";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Modal } from "@/components/ui/modal";

export function AuthDialog() {
  const {
    modal,
    setModal,
    draft,
    setDraft,
    formError,
    busy,
    login,
    register,
    teeLogin,
  } = useAuth();
  if (!modal) return null;

  if (modal === "tee-login") {
    return (
      <Modal onClose={() => setModal(null)}>
        <form className="auth-form" onSubmit={teeLogin}>
          <h2 id="modal-title">TEE акаунтаар нэвтрэх</h2>
          <label htmlFor="auth-identifier">
            Нэвтрэх нэр эсвэл имэйл
            <input
              autoFocus
              id="auth-identifier"
              type="text"
              required
              value={draft.identifier}
              onChange={(e) =>
                setDraft({ ...draft, identifier: e.target.value })
              }
            />
          </label>
          <label htmlFor="auth-password">
            Нууц үг
            <input
              id="auth-password"
              type="password"
              required
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
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
              className="button subtle"
              onClick={() => setModal("login")}
            >
              Имэйлээр нэвтрэх
            </button>
            <button type="submit" className="button run-button" disabled={busy}>
              {busy ? "Түр хүлээнэ үү..." : "TEE-ээр нэвтрэх"}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  const isLogin = modal === "login";
  return (
    <Modal onClose={() => setModal(null)}>
      <form className="auth-form" onSubmit={isLogin ? login : register}>
        <h2 id="modal-title">{isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}</h2>
        <label htmlFor="auth-email">
          Имэйл
          <input
            autoFocus
            id="auth-email"
            type="email"
            required
            value={draft.identifier}
            onChange={(e) => setDraft({ ...draft, identifier: e.target.value })}
          />
        </label>
        <label htmlFor="auth-password">
          Нууц үг
          <input
            id="auth-password"
            type="password"
            required
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
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
            className="button subtle"
            onClick={() => setModal(isLogin ? "register" : "login")}
          >
            {isLogin ? "Бүртгэл үүсгэх" : "Нэвтрэх рүү очих"}
          </button>
          <button type="submit" className="button run-button" disabled={busy}>
            {busy ? "Түр хүлээнэ үү..." : isLogin ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        </div>
        {isLogin && (
          <p className="modal-footnote">
            <button
              type="button"
              className="button subtle"
              onClick={() => setModal("tee-login")}
            >
              <GraduationCap size={14} />
              TEE акаунтаар нэвтрэх
            </button>
          </p>
        )}
      </form>
    </Modal>
  );
}
