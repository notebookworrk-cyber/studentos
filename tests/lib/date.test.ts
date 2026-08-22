import { describe, it, expect } from "vitest";
import { toISO, todayISO, addDaysISO, parseISO, monthGrid } from "../../src/lib/date";

describe("toISO / todayISO (local, not UTC)", () => {
  it("uses local date components", () => {
    // 2026-08-22 00:30 local time in a UTC+X timezone would be Aug 21 in UTC
    const d = new Date(2026, 7, 22, 0, 30);
    expect(toISO(d)).toBe("2026-08-22");
  });

  it("pads month and day", () => {
    expect(toISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("todayISO matches local components right now", () => {
    const d = new Date();
    expect(todayISO()).toBe(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  });
});

describe("addDaysISO", () => {
  it("rolls over months", () => {
    expect(addDaysISO("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("rolls over years", () => {
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles negative days and leap years", () => {
    expect(addDaysISO("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("parseISO roundtrip", () => {
  it("preserves the calendar day", () => {
    const iso = "2026-08-22";
    expect(toISO(parseISO(iso))).toBe(iso);
  });
});

describe("monthGrid", () => {
  it("produces full weeks of ISO strings for August 2026", () => {
    const weeks = monthGrid(2026, 7); // Aug 2026 starts on Saturday
    expect(weeks.length).toBeGreaterThan(4);
    for (const week of weeks) {
      expect(week.length).toBe(7);
    }
    expect(weeks.flat().filter(Boolean)).toContain("2026-08-22");
  });

  it("never leaks into other months", () => {
    const cells = monthGrid(2026, 1).flat().filter(Boolean) as string[];
    for (const c of cells) expect(c.startsWith("2026-02")).toBe(true);
  });
});
