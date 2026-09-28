"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow, BookOpen, CircleHelp } from "lucide-react";

const navigation = [
  { href: "/editor", label: "Засварлагч", icon: Workflow },
  { href: "/problems", label: "Бодлогын сан", icon: BookOpen },
  { href: "/help", label: "Тусламж", icon: CircleHelp },
];
export function AppHeader() {
  const pathname = usePathname();
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
        {navigation.map(({ href, label, icon: Icon }) => (
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
        <span className="local-badge">
          <span />
          Хувийн орон зай
        </span>
        <div className="avatar" title="Локал хэрэглэгч">
          С
        </div>
      </nav>
    </header>
  );
}
