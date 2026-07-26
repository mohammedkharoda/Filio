"use client";

import { useEffect } from "react";
import { useFilioStore } from "@/store";

/** Loads any saved session from IndexedDB once, on mount. Returns hydration state. */
export function useHydratedStore(): boolean {
  const hydrate = useFilioStore((s) => s.hydrate);
  const hydrated = useFilioStore((s) => s.hydrated);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return hydrated;
}
