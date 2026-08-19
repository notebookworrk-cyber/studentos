import { describe, it, expect } from "vitest";
import { CalendarEvent } from "../../src/types";
import { expandToView, expandEvent, enumerateInstanceDates, getRule } from "../../src/lib/recurring";

const base = (over: Partial<CalendarEvent> & { id: string; title: string; date: string; startTime: string }): CalendarEvent =>
  ({
    kind: "event" as const,
    category: "Life",
    recurrence: null,
    duration: 60,
    exceptions: undefined,
    recurrenceId: undefined,
    allDay: undefined,
    location: undefined,
    description: undefined,
    reminder: undefined,
    endDate: undefined,
    taskId: undefined,
    ...over,
  } as CalendarEvent);

describe("recurring.getRule", () => {
  it("returns null for non-recurring", () => {
    expect(getRule(base({ id: "1", title: "t", date: "2026-08-10", startTime: "09:00" }))).toBeNull();
  });
});

describe("recurring.enumerateInstanceDates", () => {
  it("daily: every day in range", () => {
    const e = base({ id: "e1", title: "Daily", date: "2026-08-11", startTime: "09:00", recurrence: "daily" });
    const dates = enumerateInstanceDates(e, "2026-08-11", "2026-08-15");
    expect(dates).toEqual(["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15"]);
  });

  it("weekdays: excludes weekends", () => {
    const e = base({ id: "e2", title: "Work", date: "2026-08-11", startTime: "09:00", recurrence: "weekdays" });
    const dates = enumerateInstanceDates(e, "2026-08-11", "2026-08-17");
    expect(dates).toEqual(["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-17"]);
  });

  it("weekly: same weekday every 7 days", () => {
    const e = base({ id: "e3", title: "Standup", date: "2026-08-11", startTime: "09:00", recurrence: "weekly" });
    const dates = enumerateInstanceDates(e, "2026-08-11", "2026-08-31");
    expect(dates).toEqual(["2026-08-11", "2026-08-18", "2026-08-25"]);
  });

  it("monthly: same day-of-month each month", () => {
    const e = base({ id: "e4", title: "Review", date: "2026-08-15", startTime: "09:00", recurrence: "monthly" });
    const dates = enumerateInstanceDates(e, "2026-08-15", "2026-11-20");
    expect(dates).toEqual(["2026-08-15", "2026-09-15", "2026-10-15", "2026-11-15"]);
  });

  it("stops at endDate", () => {
    const e = base({ id: "e5", title: "Limited", date: "2026-08-11", startTime: "09:00", recurrence: "daily", endDate: "2026-08-13" });
    expect(enumerateInstanceDates(e, "2026-08-11", "2026-08-31")).toEqual(["2026-08-11", "2026-08-12", "2026-08-13"]);
  });
});

describe("recurring.expandEvent", () => {
  it("non-recurring returns base only", () => {
    const e = base({ id: "1", title: "t", date: "2026-08-10", startTime: "09:00" });
    const out = expandEvent(e, "2026-08-01", "2026-08-31");
    expect(out).toEqual([e]);
  });

  it("weekly recurrence generates instances with recurrenceId", () => {
    const e = base({ id: "w1", title: "Standup", date: "2026-08-11", startTime: "09:00", recurrence: "weekly" });
    const out = expandEvent(e, "2026-08-11", "2026-08-25");
    expect(out).toHaveLength(3);
    expect(out.every((x) => x.recurrenceId === "w1")).toBe(true);
    expect(out.every((x) => x.recurrence === null)).toBe(true);
    expect(out.map((x) => x.id)).toEqual(["w1", "w1-r-2026-08-18", "w1-r-2026-08-25"]);
  });
});

describe("recurring.expandToView with exceptions & overrides", () => {
  it("skips exception dates", () => {
    const e = base({ id: "w1", title: "Standup", date: "2026-08-11", startTime: "09:00", recurrence: "weekly", exceptions: ["2026-08-18"] });
    const out = expandToView([e], "2026-08-11", "2026-08-25");
    expect(out.map((x) => x.date)).toEqual(["2026-08-11", "2026-08-25"]);
  });

  it("overrides replace matching instance", () => {
    const baseEv = base({ id: "w1", title: "Standup", date: "2026-08-11", startTime: "09:00", recurrence: "weekly" });
    const override = base({ id: "ov", title: "Standup REMOTE", date: "2026-08-18", startTime: "10:00", recurrenceId: "w1" });
    const out = expandToView([baseEv, override], "2026-08-11", "2026-08-25");
    const on18 = out.find((x) => x.date === "2026-08-18");
    expect(on18).toBeTruthy();
    expect(on18!.title).toBe("Standup REMOTE");
    expect(on18!.startTime).toBe("10:00");
    expect(on18!.id).toBe("ov");
  });

  it("does not apply override for unmatched dates", () => {
    const baseEv = base({ id: "w1", title: "Standup", date: "2026-08-11", startTime: "09:00", recurrence: "weekly" });
    const override = base({ id: "ov", title: "X", date: "2026-09-01", startTime: "10:00", recurrenceId: "w1" });
    const out = expandToView([baseEv, override], "2026-08-11", "2026-08-25");
    expect(out.map((x) => x.date)).toEqual(["2026-08-11", "2026-08-18", "2026-08-25"]);
  });
});
