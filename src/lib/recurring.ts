import type { CalendarEvent } from "../types";
import { addDaysISO, parseISO } from "./date";

export interface RecurrenceSpec {
  freq: "daily" | "weekdays" | "weekly" | "monthly";
  interval: number;
  until?: string;
  count?: number;
}

export function getRule(e: CalendarEvent): RecurrenceSpec | null {
  if (!e.recurrence) return null;
  return { freq: e.recurrence, interval: 1, until: e.endDate };
}

function matchesDay(day: number, rule: RecurrenceSpec): boolean {
  switch (rule.freq) {
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "weekly":
      return true;
    case "monthly":
      return true;
  }
}

export function enumerateInstanceDates(base: CalendarEvent, viewStart: string, viewEnd: string): string[] {
  const rule = getRule(base);
  if (!rule) return [base.date];

  const dates: string[] = [];
  if (base.date <= viewEnd && base.date >= viewStart) dates.push(base.date);

  const [sy, sm, sd] = base.date.split("-").map(Number);
  const baseDay = new Date(sy, sm - 1, sd).getDay();
  const baseDate = sd;

  let d = addDaysISO(base.date, 1);
  let count = 1;
  const until = rule.until ? parseISO(rule.until) : null;
  while (d <= viewEnd) {
    if (rule.count && count >= rule.count) break;
    const [y, m, dom] = d.split("-").map(Number);
    const dt = new Date(y, m - 1, dom);
    const dow = dt.getDay();
    let ok = false;
    if (matchesDay(dow, rule)) {
      if (rule.freq === "weekly") ok = dow === baseDay;
      else if (rule.freq === "monthly") ok = dom === baseDate;
      else ok = true;
    }
    if (ok) {
      count += 1;
      if (rule.count && count > rule.count) break;
      if (d >= viewStart) dates.push(d);
    }
    if (until && dt >= until) break;
    d = addDaysISO(d, 1);
  }
  return dates;
}

export function expandEvent(
  base: CalendarEvent,
  viewStart: string,
  viewEnd: string,
): CalendarEvent[] {
  if (!base.recurrence) {
    return [base];
  }
  const rule = getRule(base);
  if (!rule) return [base];

  const dates = enumerateInstanceDates(base, viewStart, viewEnd);
  const result: CalendarEvent[] = [];
  const seen = new Set<string>();
  for (const iso of dates) {
    if (seen.has(iso)) continue;
    seen.add(iso);
    const id = iso === base.date ? base.id : `${base.id}-r-${iso}`;
    result.push({ ...base, recurrence: null, id, recurrenceId: base.id, date: iso });
  }
  return result;
}

export interface ViewInstance {
  id: string;
  base: CalendarEvent | null;
  event: CalendarEvent;
}

export function expandToView(
  events: CalendarEvent[],
  viewStart: string,
  viewEnd: string,
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const overrides = new Map<string, CalendarEvent[]>();
  const recurringBases: string[] = [];

  for (const e of events) {
    if (e.recurrenceId) {
      const arr = overrides.get(e.recurrenceId);
      if (arr) arr.push(e);
      else overrides.set(e.recurrenceId, [e]);
      continue;
    }
    if (!e.recurrence) {
      out.push(e);
      continue;
    }
    if (!recurringBases.includes(e.id)) recurringBases.push(e.id);
  }

  for (const baseId of recurringBases) {
    const base = events.find((x) => x.id === baseId);
    if (!base || !base.recurrence) continue;
    const ovs = overrides.get(baseId) ?? [];
    const instances = expandEvent(base, viewStart, viewEnd);
    for (const inst of instances) {
      if (base.exceptions?.includes(inst.date)) continue;
      const match = ovs.find((o) => o.date === inst.date);
      if (match) {
        out.push({ ...inst, ...match, id: match.id, recurrenceId: baseId });
      } else {
        out.push(inst);
      }
    }
  }
  return out;
}

export function dayInstances(events: CalendarEvent[], iso: string): CalendarEvent[] {
  const direct = events.filter((e) => e.date === iso && !e.recurrenceId);
  const recurring = expandToView(events, iso, iso);
  return [...direct, ...recurring.filter((e) => e.date === iso)];
}

export function fmtInstanceDate(iso: string, allDay: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(y, m - 1, d);
  return allDay
    ? t.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : t.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function dateRangeOf(e: CalendarEvent): { start: string; end: string } {
  const start = e.date;
  const end = e.endDate && e.endDate >= e.date ? e.endDate : e.date;
  return { start, end };
}
