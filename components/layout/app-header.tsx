"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow } from "lucide-react";
import { NavMenu } from "@/components/layout/nav-menu";

export function AppHeader() {
  const pathname = usePathname();
  // The editor shows the problem in its own top bar instead of a site header.
  if (pathname === "/editor") return <NavMenu />;
  return (
    <header className="topbar">
      <Link className="brand" href="/editor" aria-label="Flow нүүр">
        <span className="brand-mark">
          <Workflow size={23} />
        </span>
        flow<span className="brand-period">.</span>
      </Link>
      <NavMenu />
    </header>
  );
}
