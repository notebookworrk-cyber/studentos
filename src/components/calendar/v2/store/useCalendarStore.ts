import { useEffect, useMemo, useState } from "react";
import { addDaysISO, monthGrid, toISO, parseISO } from "../../../../lib/date";
import { expandToView } from "../../../../lib/recurring";
import { useOS } from "../../../../state/os";
import type { CalendarEvent, Task } from "../../../../types";

export type CalendarView = "month" | "week" | "day" | "agenda";
export type CalendarFilter = "all" | "task" | "event" | "exam" | "deadline" | "class";

const V2_VIEW_KEY = "studentos.calendar.v2.view";
const V2_DATE_KEY = "studentos.calendar.v2.date";

export interface CalendarItem {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  duration: number;
  allDay: boolean;
  category: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "completed";
  project?: string;
  kind: "task" | "event";
  eventKind?: "class" | "exam" | "deadline" | "event";
}

function toMin(startTime: string | null | undefined): number | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function useCalendarStore() {
  const {
    tasks, events, addEvent, updateEvent, deleteEvent, openComposer,
    updateTask, deleteTask, togglePlan, startLockIn,
    today,
  } = useOS();

  const [view, setView] = useState<CalendarView>(() => {
    const v = localStorage.getItem(V2_VIEW_KEY);
    return (v === "month" || v === "week" || v === "day" || v === "agenda") ? v : "month";
  });
  const [selected, setSelected] = useState(() => {
    const d = localStorage.getItem(V2_DATE_KEY);
    return d ?? today;
  });
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [workHours, setWorkHours] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { localStorage.setItem(V2_VIEW_KEY, view); }, [view]);
  useEffect(() => { localStorage.setItem(V2_DATE_KEY, selected); }, [selected]);

  const cursor = useMemo(() => {
    const [y, m] = selected.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [selected]);

  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  const monthRange = useMemo(() => {
    const first = grid[0]?.find(Boolean) ?? selected;
    const last = grid[grid.length - 1]?.filter(Boolean).pop() ?? selected;
    return { start: first, end: last };
  }, [grid, selected]);

  const expandedEvents = useMemo(
    () => expandToView(events, monthRange.start, monthRange.end),
    [events, monthRange],
  );

  const expandedItems: CalendarItem[] = useMemo(() => {
    const evs: CalendarItem[] = expandedEvents.map<CalendarItem>((e: CalendarEvent) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      duration: e.duration,
      allDay: !!e.allDay,
      category: e.category,
      priority: "low" as const,
      status: "todo" as const,
      project: e.taskId,
      kind: "event",
      eventKind: e.kind,
    }));
    const tks: CalendarItem[] = tasks
      .filter((t: Task) => inRange(t.date, monthRange.start, monthRange.end))
      .map<CalendarItem>((t: Task) => ({
        id: `task-${t.id}`,
        title: t.title,
        date: t.date,
        startTime: t.startTime ?? null,
        duration: t.duration,
        allDay: !t.startTime,
        category: t.category,
        priority: t.priority,
        status: t.status,
        project: t.project ?? undefined,
        kind: "task",
      }));
    return [...evs, ...tks].sort((a, b) => {
      const at = a.allDay ? 0 : (toMin(a.startTime) ?? 0);
      const bt = b.allDay ? 0 : (toMin(b.startTime) ?? 0);
      return at - bt;
    });
  }, [expandedEvents, tasks, monthRange]);

  const dayExpandedEvents = useMemo(
    () => expandToView(events, selected, selected),
    [events, selected],
  );

  const dayItems: CalendarItem[] = useMemo(() => {
    const evs = dayExpandedEvents.map<CalendarItem>((e: CalendarEvent) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime,
      duration: e.duration,
      allDay: !!e.allDay,
      category: e.category,
      priority: "low" as const,
      status: "todo" as const,
      project: e.taskId,
      kind: "event",
      eventKind: e.kind,
    }));
    const tks = tasks
      .filter((t: Task) => t.date === selected)
      .map<CalendarItem>((t: Task) => ({
        id: `task-${t.id}`,
        title: t.title,
        date: t.date,
        startTime: t.startTime ?? null,
        duration: t.duration,
        allDay: !t.startTime,
        category: t.category,
        priority: t.priority,
        status: t.status,
        project: t.project ?? undefined,
        kind: "task",
      }));
    return [...evs, ...tks].sort((a, b) => {
      const at = a.allDay ? 0 : (toMin(a.startTime) ?? 0);
      const bt = b.allDay ? 0 : (toMin(b.startTime) ?? 0);
      return at - bt;
    });
  }, [dayExpandedEvents, tasks, selected]);

  const weekDates = useMemo(() => {
    const base = parseISO(selected);
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - base.getDay());
    return Array.from({ length: 7 }, (_, i) =>
      toISO(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
    );
  }, [selected]);

  const nowMin = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const activeStartHour = 6;
  const activeHours = workHours ? 17 : 24;

  const moveSelected = (days: number) => setSelected(addDaysISO(selected, days));
  const goToToday = () => setSelected(today);

  function matchesSearch(item: CalendarItem, q: string): boolean {
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      item.title.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower) ||
      (item.project?.toLowerCase().includes(lower) ?? false)
    );
  }

  function matchesFilter(item: CalendarItem): boolean {
    switch (filter) {
      case "all": return true;
      case "task": return item.kind === "task";
      case "event": return item.kind === "event" && !["exam", "deadline", "class"].includes(item.eventKind ?? "");
      case "exam": return item.eventKind === "exam";
      case "deadline": return item.eventKind === "deadline";
      case "class": return item.eventKind === "class";
    }
  }

  return {
    view, setView,
    selected, setSelected,
    filter, setFilter,
    workHours, setWorkHours,
    search, setSearch,
    cursor, grid,
    monthRange,
    expanded: expandedItems,
    dayExpanded: dayItems,
    weekDates,
    today,
    nowMin,
    activeStartHour,
    activeHours,
    matchesSearch,
    matchesFilter,
    toMin,
    addEvent, updateEvent, deleteEvent, openComposer,
    updateTask, deleteTask, togglePlan, startLockIn,
    tasks, events,
    moveSelected, goToToday,
  };
}
