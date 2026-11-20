import Link from "next/link";
import { Suspense } from "react";
import { HeaderActions, MobileFab } from "@/components/header-actions";
import { DesktopNav, MobileNav, NavFallback } from "@/components/nav-links";
import { BRAND } from "@/lib/constants";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-full flex flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-white/95 backdrop-blur supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6 md:gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 justify-self-start">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-brand text-sm font-black text-white shadow-hard">
              {BRAND.shortName}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-extrabold text-ink sm:text-lg">
                {BRAND.name}
              </span>
              <span className="hidden text-xs text-ink/55 sm:block">
                Sistem manajemen laundry
              </span>
            </span>
          </Link>

          <Suspense fallback={<NavFallback />}>
            <DesktopNav />
          </Suspense>

          <Suspense
            fallback={
              <div className="min-w-[9.5rem] justify-self-end sm:min-w-[13.5rem]" />
            }
          >
            <div className="justify-self-end">
              <HeaderActions />
            </div>
          </Suspense>
        </div>

        <Suspense fallback={<NavFallback mobile />}>
          <MobileNav />
        </Suspense>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-8">
        {children}
      </main>

      <Suspense fallback={null}>
        <MobileFab />
      </Suspense>

      <footer className="border-t-2 border-ink bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 {BRAND.name} · Mobil 2</p>
          <p>Kelompok Mobil 2</p>
        </div>
      </footer>
    </div>
  );
}
