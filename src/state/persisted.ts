import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

interface PersistOptions<T> {
  parse?: (raw: string) => T;
  serialize?: (value: T) => string | null;
}

export function usePersistedState<T>(
  key: string,
  fallback: T,
  options: PersistOptions<T> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        if (options.parse) return options.parse(raw);
        return JSON.parse(raw) as T;
      }
    } catch {
      /* corrupt storage -> fallback */
    }
    return fallback;
  });

  const { serialize } = options;
  useEffect(() => {
    const out = serialize ? serialize(value) : JSON.stringify(value);
    if (out == null) localStorage.removeItem(key);
    else localStorage.setItem(key, out);
  }, [key, value, serialize]);

  return [value, setValue];
}
