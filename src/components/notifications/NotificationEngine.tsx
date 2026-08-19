import { useEffect } from "react";
import { useOS } from "../../state/os";
import { notify, rememberFired, wasFired } from "../../lib/notifications";
import type { CalendarEvent, Task, PlanItem, UpcomingItem } from "../../types";
import type { ReviewCard } from "../../lib/srs";

const TICK_MS = 30000;

function atMs(date: string, time: string | null): number | null {
  if (!time) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function checkEvents(events: CalendarEvent[]) {
  const now = Date.now();
  for (const e of events) {
    if (e.allDay || !e.reminder) continue;
    const start = atMs(e.date, e.startTime);
    if (!start) continue;
    const fireAt = start - e.reminder * 60000;
    if (now < fireAt || now >= start) continue;
    const key = `ev-${e.id}-${e.date}-${e.startTime}`;
    if (wasFired(key)) continue;
    rememberFired(key);
    notify(`${e.title} in ${e.reminder >= 60 ? `${e.reminder / 60}h` : `${e.reminder}m`}`, e.location ?? "Event reminder");
  }
}

function checkTasks(tasks: Task[]) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  for (const t of tasks) {
    if (t.status === "completed" || t.date !== today || !t.startTime) continue;
    const start = atMs(t.date, t.startTime);
    if (!start) continue;
    if (now < start || now > start + 10 * 60000) continue;
    const key = `task-${t.id}-${t.date}-${t.startTime}`;
    if (wasFired(key)) continue;
    rememberFired(key);
    notify("Task due", t.title);
  }
}

function checkReviews(dueReviews: ReviewCard[]) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `reviews-${today}`;
  if (dueReviews.length === 0 || wasFired(key)) return;
  rememberFired(key);
  notify("Flashcards due", `${dueReviews.length} card${dueReviews.length === 1 ? "" : "s"} ready to review`);
}

function checkDigest(plan: PlanItem[], overdue: Task[], upcoming: UpcomingItem[]) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `digest-${today}`;
  if (wasFired(key)) return;
  rememberFired(key);
  const parts: string[] = [];
  if (plan.length) parts.push(`${plan.length} planned`);
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  if (upcoming.length) parts.push(`${upcoming.length} upcoming`);
  if (!parts.length) return;
  notify("Your day at a glance", parts.join(" · "));
}

export function NotificationEngine() {
  const { events, tasks, dueReviews, plan, overdue, upcoming, notificationsEnabled } = useOS();

  useEffect(() => {
    if (!notificationsEnabled) return;
    const tick = () => {
      checkEvents(events);
      checkTasks(tasks);
      checkReviews(dueReviews);
      checkDigest(plan, overdue, upcoming);
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [notificationsEnabled, events, tasks, dueReviews, plan, overdue, upcoming]);

  return null;
}