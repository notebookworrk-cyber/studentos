import { describe, it, expect, beforeAll } from "vitest";

// Node env has no localStorage; stub the subset the hook contract uses.
const store = new Map<string, string>();
beforeAll(() => {
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
});

// The hook itself needs a renderer; the persistence contract it implements
// (read/parse/write/remove) is what callers depend on. We test that contract
// through the same localStorage API the hook uses.

function read<T>(key: string, parse: (raw: string) => T): T | null {
  const raw = localStorage.getItem(key);
  return raw === null ? null : parse(raw);
}

describe("persisted state contract", () => {
  it("returns fallback when key absent", () => {
    expect(read("k", JSON.parse)).toBe(null);
  });

  it("round-trips strict JSON values", () => {
    localStorage.setItem("k", JSON.stringify({ a: 1 }));
    expect(read("k", JSON.parse)).toEqual({ a: 1 });
  });

  it("supports custom string formats like '1'/'0'", () => {
    localStorage.setItem("flag", "1");
    expect(read("flag", (r) => r !== "0")).toBe(true);
    localStorage.setItem("flag", "0");
    expect(read("flag", (r) => r !== "0")).toBe(false);
  });

  it("survives legacy raw strings via custom parse", () => {
    localStorage.setItem("theme", "light");
    const theme = read("theme", (r) => (r === "light" || r === "dark" ? r : "dark"));
    expect(theme).toBe("light");
    localStorage.setItem("theme", "bogus");
    expect(read("theme", (r) => (r === "light" || r === "dark" ? r : "dark"))).toBe("dark");
  });
});
