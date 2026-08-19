import type { CalendarItem } from "../store/useCalendarStore";
import { EventPill } from "../ui/EventPill";

export interface MonthViewProps {
  grid: (string | null)[][];
  cursor: { year: number; month: number };
  selected: string;
  today: string;
  items: CalendarItem[];
  search: string;
  matchesSearch: (item: CalendarItem, q: string) => boolean;
  matchesFilter: (item: CalendarItem) => boolean;
  onSelectDate: (iso: string) => void;
  onItemMenu: (item: CalendarItem, e: React.MouseEvent) => void;
  onOpenComposer: (draft: { date: string; startTime?: string; duration?: number }) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function MonthView({
  grid, cursor, selected, today, items, search, matchesSearch, matchesFilter,
  onSelectDate, onItemMenu, onOpenComposer,
}: MonthViewProps) {
  return (
    <div className="mv">
      <div className="mv-head">
        <div className="mv-month-year">{MONTHS[cursor.month]} {cursor.year}</div>
        <div className="mv-weekdays">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="mv-weekday">{d}</div>
          ))}
        </div>
      </div>
      <div className="mv-grid">
        {grid.flat().map((iso, i) => {
          if (!iso) return <div key={`empty-${i}`} className="mv-cell empty" />;
          const dayItems = items.filter((it) => it.date === iso && matchesFilter(it) && matchesSearch(it, search));
          const timed = dayItems.filter((it) => !it.allDay);
          const allDay = dayItems.filter((it) => it.allDay);
          const heat = Math.min(5, dayItems.length);
          const isToday = iso === today;
          const isSelected = iso === selected;
          return (
            <div
              key={iso}
              className={`mv-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} heat-${heat}`}
              onClick={() => onSelectDate(iso)}
              onContextMenu={(e) => { e.stopPropagation(); onOpenComposer({ date: iso, startTime: "09:00" }); }}
            >
              <span className="mv-daynum">{new Date(iso).getDate()}</span>
              <div className="mv-cell-pills">
                {allDay.slice(0, 3).map((item) => (
                  <EventPill key={item.id} item={item} compact onMenu={onItemMenu} />
                ))}
                {timed.slice(0, 2).map((item) => (
                  <EventPill key={item.id} item={item} compact onMenu={onItemMenu} />
                ))}
                {dayItems.length > 3 && <span className="mv-more">+{dayItems.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
