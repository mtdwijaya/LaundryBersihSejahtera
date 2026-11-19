"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/pesanan", label: "Pesanan" },
  { href: "/pelanggan", label: "Pelanggan" },
  { href: "/laporan", label: "Laporan" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`touch-target rounded-full px-4 text-sm font-semibold transition md:text-[15px] ${
              active
                ? "bg-ink text-white"
                : "text-ink/70 hover:bg-mist hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto border-t border-ink/10 px-4 py-2 md:hidden">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`touch-target whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
              active ? "bg-brand text-white" : "bg-mist text-ink/70"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export function NavFallback({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="flex gap-2 overflow-x-auto border-t border-ink/10 px-4 py-2 md:hidden">
        {links.map((link) => (
          <span
            key={link.href}
            className="touch-target whitespace-nowrap rounded-full bg-mist px-4 text-sm font-semibold text-ink/50"
          >
            {link.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((link) => (
        <span
          key={link.href}
          className="touch-target rounded-full px-4 text-sm font-semibold text-ink/50"
        >
          {link.label}
        </span>
      ))}
    </nav>
  );
}
