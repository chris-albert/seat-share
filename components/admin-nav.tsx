"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Games" },
  { href: "/admin/friends", label: "Friends" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="inline-flex rounded-lg border border-line bg-surface p-1 text-sm">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              active ? "bg-fg text-bg" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
