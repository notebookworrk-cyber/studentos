import { addDaysISO, todayISO } from "./date";
import { fmtDuration } from "./format";
import type { CalendarEvent, Goal, PlanningInsight, Task } from "../types";

export const AVAILABLE_DAY_MIN = 360; // 6h budget per day

export function dayPlannedMin(tasks: Task[], events: CalendarEvent[], date: string): number {
  const taskMin = tasks
    .filter((t) => t.date === date)
    .reduce((a, t) => a + t.duration, 0);
  const eventMin = events
    .filter((e) => e.date === date)
    .reduce((a, e) => a + e.duration, 0);
  return taskMin + eventMin;
}

export function dayCompletedMin(tasks: Task[], date: string): number {
  return tasks
    .filter((t) => t.date === date && t.status === "completed")
    .reduce((a, t) => a + t.duration, 0);
}

export function weekDays(today: string = todayISO()): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(today, i));
}

export function weekPlannedMin(tasks: Task[], events: CalendarEvent[], today: string = todayISO()): number {
  return weekDays(today).reduce((a, d) => a + dayPlannedMin(tasks, events, d), 0);
}

export function weekCompletedMin(tasks: Task[], today: string = todayISO()): number {
  return weekDays(today).reduce((a, d) => a + dayCompletedMin(tasks, d), 0);
}

function fmtDelta(mins: number): string {
  if (mins === 0) return "nothing";
  return fmtDuration(Math.abs(mins));
}

interface ScheduleItem {
  startTime: string | null;
  duration: number;
}

export function findConflicts(items: ScheduleItem[]): { a: number; b: number; overlapMin: number }[] {
  const conflicts: { a: number; b: number; overlapMin: number }[] = [];
  const timed = items
    .map((it, i) => ({ ...it, i }))
    .filter((it) => it.startTime != null);
  for (let x = 0; x < timed.length; x++) {
    for (let y = x + 1; y < timed.length; y++) {
      const a = timed[x];
      const b = timed[y];
      const aStart = toMin(a.startTime);
      const aEnd = aStart + a.duration;
      const bStart = toMin(b.startTime);
      const bEnd = bStart + b.duration;
      const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
      if (overlap > 0) conflicts.push({ a: a.i, b: b.i, overlapMin: overlap });
    }
  }
  return conflicts;
}

function toMin(hhmm: string | null): number {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function buildInsights(
  tasks: Task[],
  events: CalendarEvent[],
  goals: Goal[],
  today: string = todayISO(),
): PlanningInsight[] {
  const insights: PlanningInsight[] = [];
  const plannedToday = dayPlannedMin(tasks, events, today);

  // Overloaded day
  if (plannedToday > AVAILABLE_DAY_MIN) {
    insights.push({
      id: "overload",
      kind: "overloaded",
      level: "warn",
      title: "Your day is overloaded",
      line: `${fmtDuration(plannedToday)} planned but only ${fmtDuration(AVAILABLE_DAY_MIN)} available.`,
    });
  }

  // Unscheduled priority goal
  for (const g of goals.filter((x) => x.active)) {
    const linked = tasks.filter((t) => t.goalId === g.id && t.status !== "completed");
    if (linked.length === 0) continue;
    const noneScheduled = linked.every((t) => !t.startTime);
    if (noneScheduled) {
      insights.push({
        id: `unsched-${g.id}`,
        kind: "unscheduled",
        level: "warn",
        title: "Unscheduled work",
        line: `${g.title} has no scheduled session yet.`,
      });
      break;
    }
  }

  // Deadline approaching (within 3 days)
  const soon = (date: string) => {
    const diff = Math.round((new Date(date + "T00:00").getTime() - new Date(today + "T00:00").getTime()) / 86400000);
    return diff > 0 && diff <= 3;
  };
  const deadline = events.find((e) => soon(e.date) && e.kind === "deadline");
  const exam = events.find((e) => soon(e.date) && e.kind === "exam");
  const taskDue = tasks.find((t) => soon(t.date) && t.status !== "completed");
  const near = taskDue ?? exam ?? deadline;
  if (near) {
    const diff = Math.round((new Date(near.date + "T00:00").getTime() - new Date(today + "T00:00").getTime()) / 86400000);
    insights.push({
      id: `deadline-${near.id}`,
      kind: "deadline",
      level: "warn",
      title: "Deadline approaching",
      line: `${near.title} is due in ${diff} ${diff === 1 ? "day" : "days"}.`,
    });
  }

  // Free capacity
  const remaining = AVAILABLE_DAY_MIN - plannedToday;
  if (remaining >= 30) {
    insights.push({
      id: "capacity",
      kind: "capacity",
      level: "info",
      title: "Free capacity today",
      line: `You have ${fmtUsage(remaining)} available this evening.`,
    });
  } else if (remaining < 0) {
    insights.push({
      id: "overrun",
      kind: "capacity",
      level: "info",
      title: "Over budget",
      line: `Your day runs ${fmtDelta(-remaining)} past the plan.`,
    });
  }

  return insights.flatMap((i) => (i ? [i] : [])).slice(0, 4);
}

function fmtUsage(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}