"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useState that mirrors to localStorage. The stored value is read once after
 * mount (not during render) so server and first client render stay identical
 * and hydration doesn't mismatch.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Storage unavailable or value corrupt; keep the default.
    }
    hydrated.current = true;
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota / unavailable storage.
    }
  }, [key, value]);

  return [value, setValue];
}
