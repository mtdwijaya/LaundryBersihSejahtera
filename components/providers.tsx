"use client";

import { TerimaOverlay } from "@/components/terima-overlay";
import { LaundryProvider } from "@/lib/store";
import { UiProvider } from "@/lib/ui-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LaundryProvider>
      <UiProvider>
        {children}
        <TerimaOverlay />
      </UiProvider>
    </LaundryProvider>
  );
}
