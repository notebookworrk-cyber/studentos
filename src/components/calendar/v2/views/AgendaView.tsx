import type { CalendarItem } from "../store/useCalendarStore";
import { EventPill } from "../ui/EventPill";
import { parseISO } from "../../../../lib/date";

export interface AgendaViewProps {
  items: CalendarItem[];
  today: string;
  matchesSearch: (item: CalendarItem, q: string) => boolean;
  matchesFilter: (item: CalendarItem) => boolean;
  search: string;
  onItemMenu: (item: CalendarItem, e: React.MouseEvent) => void;
}

function fmtDate(iso: string) {
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function AgendaView({ items, today, matchesSearch, matchesFilter, search, onItemMenu }: AgendaViewProps) {
  const filtered = items.filter((it) => matchesFilter(it) && matchesSearch(it, search));
  const grouped: Record<string, CalendarItem[]> = {};
  for (const it of filtered) {
    (grouped[it.date] ??= []).push(it);
  }
  const dates = Object.keys(grouped).sort();
  return (
    <div className="av">
      {dates.length === 0 ? (
        <div className="agenda-empty">No upcoming items.</div>
      ) : (
        dates.map((iso) => (
          <div key={iso} className="av-group">
            <div className={`av-date ${iso === today ? "today" : ""}`}>{fmtDate(iso)}</div>
            <div className="av-list">
              {grouped[iso].map((item) => (
                <EventPill key={item.id} item={item} compact onMenu={onItemMenu} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
