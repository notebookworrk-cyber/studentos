import { Icon } from "../../../Icon";
import type { CalendarFilter, CalendarView } from "../store/useCalendarStore";

export interface CalendarHeaderProps {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  selected: string;
  cursor: { year: number; month: number };
  filter: CalendarFilter;
  setFilter: (f: CalendarFilter) => void;
  search: string;
  setSearch: (q: string) => void;
  workHours: boolean;
  setWorkHours: (w: boolean) => void;
  moveSelected: (days: number) => void;
  goToToday: () => void;
}

const monthLabel = (year: number, month: number) =>
  `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`;

export default function CalendarHeader({
  view, setView, selected, cursor, filter, setFilter, search, setSearch,
  workHours, setWorkHours, moveSelected, goToToday,
}: CalendarHeaderProps) {
  const prevStep = view === "month" ? -30 : view === "week" ? -7 : -1;
  const nextStep = view === "month" ? 30 : view === "week" ? 7 : 1;
  const title = view === "month"
    ? monthLabel(cursor.year, cursor.month)
    : view === "week"
    ? `Week of ${monthLabel(cursor.year, cursor.month).split(" ")[0]} ${new Date(selected).getDate()}`
    : view === "day"
    ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(selected).getDay()]}, ${new Date(selected).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
    : `Agenda`;

  return (
    <div className="cal-header">
      <div className="cal-header-left">
        <button className="btn btn-ghost btn-icon" aria-label="Previous" onClick={() => moveSelected(prevStep)}>
          <Icon name="chevL" size={16} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={goToToday}>Today</button>
        <button className="btn btn-ghost btn-icon" aria-label="Next" onClick={() => moveSelected(nextStep)}>
          <Icon name="chevR" size={16} />
        </button>
        <div className="cal-header-title">{title}</div>
      </div>
      <div className="cal-seg" role="tablist">
        {(["month", "week", "day", "agenda"] as CalendarView[]).map((v) => (
          <button
            key={v}
            role="tab"
            className={`seg-item ${view === v ? "active" : ""}`}
            onClick={() => setView(v)}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <div className="cal-header-actions">
        <div className="cal-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            className="cal-search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn btn-ghost btn-icon" onClick={() => setSearch("")}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
        <div className="cal-filters" role="group">
          {(["all", "task", "event", "exam", "deadline", "class"] as CalendarFilter[]).map((f) => (
            <button
              key={f}
              className={`cal-filter-chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {view === "week" && (
          <button
            className={`btn btn-ghost btn-icon ${workHours ? "active" : ""}`}
            aria-label="Work hours"
            onClick={() => setWorkHours(!workHours)}
            title="Toggle 6am–10pm"
          >
            <Icon name="clock" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
