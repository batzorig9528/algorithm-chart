"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CircleHelp,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Workflow,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navigation = [
  { href: "/editor", label: "Засварлагч", icon: Workflow },
  { href: "/problems", label: "Бодлогын сан", icon: BookOpen },
  { href: "/help", label: "Тусламж", icon: CircleHelp },
];
const isTeacherRole = (role?: string) =>
  role?.toUpperCase() === "TEACHER" || role?.toUpperCase() === "ADMIN";

// Floating menu in the bottom-right corner; replaces the old top navigation.
export function NavMenu() {
  const pathname = usePathname();
  const { user, ready, openModal, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = isTeacherRole(user?.role)
    ? [
        ...navigation,
        {
          href: "/dashboard",
          label: "Хяналтын самбар",
          icon: LayoutDashboard,
        },
      ]
    : navigation;

  return (
    <div className="nav-menu" ref={root}>
      {open && (
        <nav className="nav-menu-panel" role="menu" aria-label="Үндсэн цэс">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="menu-item"
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <span className="menu-separator" />
          <ThemeToggle />
          <span className="menu-separator" />
          {ready &&
            (user ? (
              <>
                <span className="menu-user" title={user.email}>
                  {user.name || user.email}
                </span>
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} />
                  Гарах
                </button>
              </>
            ) : (
              <>
                <span className="menu-user">Хувийн орон зай</span>
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setOpen(false);
                    openModal("login");
                  }}
                >
                  <LogIn size={16} />
                  Нэвтрэх
                </button>
              </>
            ))}
        </nav>
      )}
      <button
        type="button"
        className="nav-menu-button"
        aria-label="Цэс"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
}
