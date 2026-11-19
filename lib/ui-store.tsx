"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type UiContextValue = {
  terimaOpen: boolean;
  openTerima: () => void;
  closeTerima: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [terimaOpen, setTerimaOpen] = useState(false);

  const openTerima = useCallback(() => setTerimaOpen(true), []);
  const closeTerima = useCallback(() => setTerimaOpen(false), []);

  const value = useMemo(
    () => ({ terimaOpen, openTerima, closeTerima }),
    [terimaOpen, openTerima, closeTerima],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUi harus dipakai di dalam UiProvider");
  }
  return ctx;
}
