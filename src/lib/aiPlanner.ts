import type { CalendarEvent, Goal, Task } from "../types";

export function buildPlanPrompt(tasks: Task[], events: CalendarEvent[], goals: Goal[], today: string): string {
  const todayTasks = tasks
    .filter((t) => t.date === today && t.status !== "completed")
    .sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));
  const overdue = tasks.filter((t) => t.status !== "completed" && t.date < today);
  const todayEvents = events.filter((e) => e.date === today).sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const activeGoals = goals.filter((g) => g.active);
  const lines = [
    "You are a study planner for a student. Build a realistic, prioritized daily plan from this context.",
    `Today is ${today}.`,
    "",
    "Today's tasks:",
    ...(todayTasks.length
      ? todayTasks.map((t) => `- ${t.startTime ? `${t.startTime} ` : ""}${t.title} (${t.priority}, ${t.duration || "?"} min${t.category ? `, ${t.category}` : ""})`)
      : ["- none"]),
    "",
    "Overdue:",
    ...(overdue.length ? overdue.map((t) => `- ${t.title} (due ${t.date})`) : ["- none"]),
    "",
    "Today's events:",
    ...(todayEvents.length ? todayEvents.map((e) => `- ${e.startTime} ${e.title}`) : ["- none"]),
    "",
    "Active goals:",
    ...(activeGoals.length ? activeGoals.map((g) => `- ${g.title}`) : ["- none"]),
    "",
    'Respond with a short markdown plan: a "Focus first" list, a "Scheduled" timeline, then one "Notes" line. Keep it under 12 bullets.',
  ];
  return lines.join("\n");
}

export function deterministicPlan(tasks: Task[], events: CalendarEvent[], today: string): string {
  const todayTasks = tasks
    .filter((t) => t.date === today && t.status !== "completed")
    .sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));
  const overdue = tasks.filter((t) => t.status !== "completed" && t.date < today);
  const todayEvents = events.filter((e) => e.date === today).sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const parts: string[] = [];
  if (todayTasks.length || todayEvents.length || overdue.length) {
    parts.push("**Focus first**");
    todayTasks.slice(0, 3).forEach((t) => parts.push(`- ${t.title}`));
    if (overdue.length) overdue.slice(0, 2).forEach((t) => parts.push(`- Catch up: ${t.title}`));
    if (todayEvents.length) {
      parts.push("**Scheduled**");
      todayEvents.forEach((e) => parts.push(`- ${e.startTime} · ${e.title}`));
    }
    todayTasks
      .filter((t) => t.startTime)
      .slice(0, 4)
      .forEach((t) => parts.push(`- ${t.startTime} · ${t.title}`));
    if (overdue.length) parts.push(`_${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue — clear these first._`);
    else parts.push("_Nothing overdue. Keep the streak going._");
  } else {
    parts.push("Your day is clear. Perfect time to review flashcards or start a goal.");
  }
  return parts.join("\n");
}

export function parseSubtasks(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[-*•]+\s*/, "").replace(/^\d+[.)]\s*/, ""))
    .filter((l) => l.length > 0)
    .slice(0, 8);
}