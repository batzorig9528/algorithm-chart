"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { AuthDraft, AuthModal, AuthUser } from "@/types/auth";

const emptyDraft: AuthDraft = { identifier: "", password: "" };

export function useAuthController() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<AuthModal>(null);
  const [draft, setDraft] = useState<AuthDraft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  function openModal(next: Exclude<AuthModal, null>) {
    setDraft(emptyDraft);
    setFormError("");
    setModal(next);
  }

  async function submit(path: "register" | "login" | "tee-login", body: object) {
    setBusy(true);
    setFormError("");
    try {
      const res = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Тодорхойгүй алдаа гарлаа.");
        return;
      }
      setUser(data.user);
      setModal(null);
    } catch {
      setFormError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  function register(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    void submit("register", { email: draft.identifier, password: draft.password });
  }
  function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    void submit("login", { email: draft.identifier, password: draft.password });
  }
  function teeLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    void submit("tee-login", {
      identifier: draft.identifier,
      password: draft.password,
    });
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setBusy(false);
    }
  }

  return {
    user,
    ready,
    modal,
    setModal,
    draft,
    setDraft,
    formError,
    busy,
    openModal,
    register,
    login,
    teeLogin,
    logout,
  };
}
