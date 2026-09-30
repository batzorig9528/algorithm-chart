"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Workflow,
  BookOpen,
  CircleHelp,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { IconButton } from "@/components/ui/icon-button";

const navigation = [
  { href: "/editor", label: "Засварлагч", icon: Workflow },
  { href: "/problems", label: "Бодлогын сан", icon: BookOpen },
  { href: "/help", label: "Тусламж", icon: CircleHelp },
];
const isTeacherRole = (role?: string) =>
  role?.toUpperCase() === "TEACHER" || role?.toUpperCase() === "ADMIN";

export function AppHeader() {
  const pathname = usePathname();
  const { user, ready, openModal, logout } = useAuth();
  return (
    <header className="topbar">
      <Link className="brand" href="/editor" aria-label="Flow нүүр">
        <span className="brand-mark">
          <Workflow size={23} />
        </span>
        flow<span className="brand-period">.</span>
      </Link>
      <span className="brand-divider" />
      <span className="workspace-label">Таны алгоритмын урлан</span>
      <nav className="top-navigation" aria-label="Үндсэн цэс">
        {[
          ...navigation,
          ...(isTeacherRole(user?.role)
            ? [
                {
                  href: "/dashboard",
                  label: "Хяналтын самбар",
                  icon: LayoutDashboard,
                },
              ]
            : []),
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
        <span className="nav-divider" />
        {ready &&
          (user ? (
            <>
              <div className="avatar" title={user.email}>
                {user.email[0].toUpperCase()}
              </div>
              <IconButton title="Гарах" onClick={logout}>
                <LogOut size={16} />
              </IconButton>
            </>
          ) : (
            <>
              <span className="local-badge">
                <span />
                Хувийн орон зай
              </span>
              <button
                type="button"
                className="button subtle"
                onClick={() => openModal("login")}
              >
                Нэвтрэх
              </button>
            </>
          ))}
      </nav>
    </header>
  );
}
