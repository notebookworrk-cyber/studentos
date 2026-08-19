import type { CalendarItem } from "../store/useCalendarStore";
import type { DayColumn } from "./TimeGrid";
import { EventPill } from "../ui/EventPill";
import TimeGrid from "./TimeGrid";

export interface WeekViewProps {
  weekDates: string[];
  today: string;
  items: CalendarItem[];
  nowMin: number;
  activeStartHour: number;
  activeHours: number;
  onOpenComposer: (draft: { date: string; startTime?: string; duration?: number }) => void;
  onItemMenu: (item: CalendarItem, e: React.MouseEvent) => void;
  onMoveItem?: (item: CalendarItem, patch: { date: string; startTime: string }) => void;
}

export default function WeekView({
  weekDates, today, items, nowMin, activeStartHour, activeHours, onOpenComposer, onItemMenu, onMoveItem,
}: WeekViewProps) {
  const days: DayColumn[] = weekDates.map((iso) => ({
    iso,
    label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(iso).getDay()],
    date: new Date(iso).getDate(),
    today: iso === today,
    allDay: items.filter((it) => it.allDay && it.date === iso),
    timed: items.filter((it) => !it.allDay && it.date === iso),
  }));

  return (
    <div className="wv">
      <div className="wv-head">
        {days.map((d) => (
          <div key={d.iso} className={`wv-day ${d.today ? "today" : ""}`}>
            <span className="wv-day-name">{d.label}</span>
            <span className={`wv-day-num ${d.today ? "today" : ""}`}>{d.date}</span>
          </div>
        ))}
      </div>
      <div className="wv-allday">
        {days.map((d) => (
          <div key={d.iso} className="tg-allday-cell">
            {d.allDay.map((item) => (
              <EventPill key={item.id} item={item} compact onMenu={onItemMenu} />
            ))}
          </div>
        ))}
      </div>
      <div className="wv-scroll">
        <TimeGrid
          days={days}
          PX_PER_HOUR={40}
          activeStartHour={activeStartHour}
          activeHours={activeHours}
          isToday={false}
          nowMin={nowMin}
          onOpenComposer={onOpenComposer}
          onItemMenu={onItemMenu}
          onMoveItem={onMoveItem}
        />
      </div>
    </div>
  );
}
