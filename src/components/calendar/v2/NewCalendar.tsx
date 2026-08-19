import { useEffect, useRef, useState } from "react";
import { useCalendarStore } from "./store/useCalendarStore";
import CalendarHeader from "./ui/CalendarHeader";
import MonthView from "./views/MonthView";
import WeekView from "./views/WeekView";
import DayView from "./views/DayView";
import AgendaView from "./views/AgendaView";
import type { CalendarItem } from "./store/useCalendarStore";

export function NewCalendar() {
  const s = useCalendarStore();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ item: CalendarItem; x: number; y: number } | null>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (["input", "textarea"].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return;
      const isMonth = s.view === "month";
      if (e.key === "ArrowLeft") { e.preventDefault(); s.moveSelected(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); s.moveSelected(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); s.moveSelected(isMonth ? -7 : -1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); s.moveSelected(isMonth ? 7 : 1); }
      else if (e.key === "t" || e.key === "T") { e.preventDefault(); s.goToToday(); }
      else if (e.key === "Escape") { e.preventDefault(); s.setSelected(s.today); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [s, menu]);

  const items = s.expanded;

  function onItemMenu(item: CalendarItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ item, x: e.clientX, y: e.clientY });
  }

  function closeMenu() { setMenu(null); }

  function realTask(item: CalendarItem) {
    return s.tasks.find((t) => `task-${t.id}` === item.id);
  }

  function realEvent(item: CalendarItem) {
    return s.events.find((ev) => ev.id === item.id) ?? s.events.find((ev) => item.id.startsWith(`${ev.id}-r-`));
  }

  function openEdit(item: CalendarItem) {
    if (item.kind === "task") {
      const t = realTask(item);
      if (t) s.openComposer({ type: "task", task: t });
    } else {
      const ev = realEvent(item);
      if (ev) {
        if (ev.recurrence && item.id !== ev.id) {
          s.openComposer({ type: "event", event: ev });
        } else {
          s.openComposer({ type: "event", event: ev });
        }
      }
    }
    closeMenu();
  }

  function toggleComplete(item: CalendarItem) {
    if (item.kind === "task") {
      const t = realTask(item);
      if (t) s.togglePlan(t.id);
    }
    closeMenu();
  }

  function startFocus(item: CalendarItem) {
    const task = item.kind === "task" ? realTask(item) : null;
    s.startLockIn({
      title: item.title,
      category: item.category,
      taskId: task?.id ?? null,
      plannedMin: item.duration || 25,
    });
    closeMenu();
  }

  function deleteItem(item: CalendarItem) {
    if (item.kind === "task") {
      const t = realTask(item);
      if (t) s.deleteTask(t.id);
    } else {
      const ev = realEvent(item);
      if (ev && !ev.recurrence) s.deleteEvent(ev.id);
      else if (ev) s.deleteEvent(ev.recurrenceId ?? ev.id);
    }
    closeMenu();
  }

  function moveItem(item: CalendarItem, patch: { date: string; startTime: string }) {
    if (item.kind === "task") {
      const t = realTask(item);
      if (t) s.updateTask(t.id, patch);
    } else {
      const ev = realEvent(item);
      if (ev) s.updateEvent(ev.id, patch);
    }
  }

  return (
    <div className="cal-root" ref={rootRef} onClick={closeMenu}>
      <CalendarHeader
        view={s.view} setView={s.setView}
        selected={s.selected} cursor={s.cursor}
        filter={s.filter} setFilter={s.setFilter}
        search={s.search} setSearch={s.setSearch}
        workHours={s.workHours} setWorkHours={s.setWorkHours}
        moveSelected={s.moveSelected} goToToday={s.goToToday}
      />
      {s.view === "month" && (
        <MonthView
          grid={s.grid}
          cursor={s.cursor}
          selected={s.selected}
          today={s.today}
          items={items}
          search={s.search}
          matchesSearch={s.matchesSearch}
          matchesFilter={s.matchesFilter}
          onSelectDate={s.setSelected}
          onItemMenu={onItemMenu}
          onOpenComposer={(d) => s.openComposer({ type: "event", draft: { date: d.date, startTime: d.startTime ?? "09:00", duration: d.duration } as never })}
        />
      )}
      {s.view === "week" && (
        <WeekView
          weekDates={s.weekDates}
          today={s.today}
          items={items}
          nowMin={s.nowMin}
          activeStartHour={s.activeStartHour}
          activeHours={s.activeHours}
          onOpenComposer={(d) => s.openComposer({ type: "event", draft: { date: d.date, startTime: d.startTime ?? "09:00", duration: d.duration } as never })}
          onItemMenu={onItemMenu}
          onMoveItem={moveItem}
        />
      )}
      {s.view === "day" && (
        <DayView
          iso={s.selected}
          today={s.today}
          items={items}
          nowMin={s.nowMin}
          activeStartHour={s.activeStartHour}
          activeHours={s.activeHours}
          onOpenComposer={(d) => s.openComposer({ type: "event", draft: { date: d.date, startTime: d.startTime ?? "09:00", duration: d.duration } as never })}
          onItemMenu={onItemMenu}
          onMoveItem={moveItem}
        />
      )}
      {s.view === "agenda" && (
        <AgendaView
          items={items}
          today={s.today}
          search={s.search}
          matchesSearch={s.matchesSearch}
          matchesFilter={s.matchesFilter}
          onItemMenu={onItemMenu}
        />
      )}
      {menu && (
        <div className="cal-menu" style={{ top: menu.y, left: menu.x }}>
          <button className="cal-menu-item" onClick={() => openEdit(menu.item)}>Edit</button>
          {menu.item.kind === "task" && (
            <button className="cal-menu-item" onClick={() => toggleComplete(menu.item)}>
              {menu.item.status === "completed" ? "Mark incomplete" : "Complete"}
            </button>
          )}
          <button className="cal-menu-item" onClick={() => startFocus(menu.item)}>Start Focus</button>
          <button className="cal-menu-item cal-menu-delete" onClick={() => deleteItem(menu.item)}>Delete</button>
        </div>
      )}
    </div>
  );
}
