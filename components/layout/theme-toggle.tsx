"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // The inline script in the root layout has already applied the saved or system theme.
    const applied = document.documentElement.dataset.theme;
    setTheme(
      applied === "dark" || applied === "light"
        ? applied
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    );
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  if (!theme) return null;
  const dark = theme === "dark";
  return (
    <button
      type="button"
      role="menuitem"
      className="menu-item"
      onClick={toggle}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {dark ? "Цайвар горим" : "Харанхуй горим"}
    </button>
  );
}
