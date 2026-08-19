import type { CalendarItem } from "../store/useCalendarStore";

const KIND_COLOR: Record<string, string> = {
  exam: "var(--danger)",
  deadline: "var(--warn)",
  class: "var(--indigo)",
  event: "var(--cyan)",
  task: "var(--accent)",
};

export interface EventPillProps {
  item: CalendarItem;
  compact?: boolean;
  onMenu?: (item: CalendarItem, e: React.MouseEvent) => void;
  onComplete?: (item: CalendarItem) => void;
}

export function EventPill({ item, compact = false, onMenu, onComplete }: EventPillProps) {
  const color = KIND_COLOR[item.eventKind ?? ""] ?? KIND_COLOR[item.category?.toLowerCase() ?? ""] ?? KIND_COLOR.task;
  const isTask = item.kind === "task";
  const done = isTask && item.status === "completed";
  const evk = (item.eventKind ?? "task") as "task" | "event" | "exam" | "deadline" | "class" | "eventKind";

  return (
    <button
      type="button"
      className={`ev-pill evk-${evk} ${compact ? "compact" : ""} ${item.allDay ? "allday" : ""} ${done ? "done" : ""}`}
      title={item.title}
      onClick={onMenu ? (e) => onMenu(item, e) : undefined}
    >
      {!compact && item.allDay && <span className="ev-allday-marker" />}
      {!item.allDay && <span className="ev-time">{item.startTime?.slice(0, 5) ?? ""}</span>}
      <span className="ev-title" title={item.title}>{item.title}</span>
      {item.eventKind && !compact && (
        <span className="ev-kind-dot" style={{ background: color, color }} />
      )}
      {done && onComplete && (
        <span className="ev-bell" title="mark as incomplete" onClick={(e) => { e.stopPropagation(); onComplete(item); }}>
          <span aria-hidden>✓</span>
        </span>
      )}
    </button>
  );
}
