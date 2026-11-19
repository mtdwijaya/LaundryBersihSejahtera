"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUi } from "@/lib/ui-store";

/** Route lama dialihkan: form sekarang overlay. */
export default function TerimaRedirectPage() {
  const router = useRouter();
  const { openTerima } = useUi();

  useEffect(() => {
    openTerima();
    router.replace("/");
  }, [openTerima, router]);

  return (
    <p className="text-ink/60">Membuka form terima cucian…</p>
  );
}
