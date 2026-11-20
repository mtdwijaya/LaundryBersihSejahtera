"use client";

import { usePathname } from "next/navigation";
import { OpenTerimaButton } from "@/components/open-terima-button";
import { ResetDemoButton } from "@/components/reset-demo-button";

export function HeaderActions() {
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  return (
    <div className="flex min-w-[9.5rem] items-center justify-end gap-2 sm:min-w-[13.5rem]">
      {!onDashboard ? (
        <>
          <OpenTerimaButton className="hidden sm:inline-flex" />
          <ResetDemoButton />
        </>
      ) : null}
    </div>
  );
}

export function MobileFab() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="fab-bar sm:hidden">
      <OpenTerimaButton className="w-full">+ Terima cucian</OpenTerimaButton>
    </div>
  );
}
