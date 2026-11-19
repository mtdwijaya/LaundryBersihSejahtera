"use client";

import { Button } from "@/components/ui";
import { useUi } from "@/lib/ui-store";

export function OpenTerimaButton({
  children = "+ Terima cucian",
  variant = "primary",
  className = "",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const { openTerima } = useUi();

  return (
    <Button
      variant={variant}
      className={className}
      onClick={openTerima}
    >
      {children}
    </Button>
  );
}
