"use client";

import { useLaundry } from "@/lib/store";

export function ResetDemoButton() {
  const { resetDemo } = useLaundry();

  return (
    <button
      type="button"
      onClick={resetDemo}
      className="touch-target rounded-full border-2 border-ink bg-white px-3 text-xs font-semibold text-ink shadow-hard hover:-translate-y-0.5"
      title="Reset data demo"
    >
      Reset
    </button>
  );
}
