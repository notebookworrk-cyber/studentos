import type { CalendarItem } from "../store/useCalendarStore";
import type { DayColumn } from "./TimeGrid";
import TimeGrid from "./TimeGrid";

export interface DayViewProps {
  iso: string;
  today: string;
  items: CalendarItem[];
  nowMin: number;
  activeStartHour: number;
  activeHours: number;
  onOpenComposer: (draft: { date: string; startTime?: string; duration?: number }) => void;
  onItemMenu: (item: CalendarItem, e: React.MouseEvent) => void;
  onMoveItem?: (item: CalendarItem, patch: { date: string; startTime: string }) => void;
}

export default function DayView({ iso, today, items, nowMin, activeStartHour, activeHours, onOpenComposer, onItemMenu, onMoveItem }: DayViewProps) {
  const day: DayColumn = {
    iso,
    label: "day",
    date: new Date(iso).getDate(),
    today: iso === today,
    allDay: items.filter((it) => it.allDay && it.date === iso),
    timed: items.filter((it) => !it.allDay && it.date === iso),
  };

  return (
    <div className="dv">
      <div className="dv-head">
        <span className="dv-day-name">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(iso).getDay()]}</span>
        <span className={`dv-day-num ${day.today ? "today" : ""}`}>{day.date}</span>
      </div>
      <div className="dv-scroll">
        <TimeGrid
          days={[day]}
          PX_PER_HOUR={40}
          activeStartHour={activeStartHour}
          activeHours={activeHours}
          isToday={day.today}
          nowMin={nowMin}
          onOpenComposer={onOpenComposer}
          onItemMenu={onItemMenu}
          onMoveItem={onMoveItem}
        />
      </div>
    </div>
  );
}
