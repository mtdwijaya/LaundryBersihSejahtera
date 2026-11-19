"use client";

import { startTransition, useEffect, useState } from "react";

/** Tanggal "hari ini" hanya dihitung setelah mount (aman untuk prerender Next.js 16). */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    startTransition(() => {
      setNow(new Date());
    });
  }, []);

  return now;
}
