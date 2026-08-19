import { useRef, useState } from "react";
import type { CalendarItem } from "../store/useCalendarStore";
import { EventPill } from "../ui/EventPill";

export interface DayColumn {
  iso: string;
  label: string;
  date: number;
  today: boolean;
  timed: CalendarItem[];
  allDay: CalendarItem[];
}

export interface TimeGridProps {
  days: DayColumn[];
  PX_PER_HOUR: number;
  activeStartHour: number;
  activeHours: number;
  isToday: boolean;
  nowMin: number;
  onOpenComposer: (draft: { date: string; startTime?: string; duration?: number }) => void;
  onItemMenu: (item: CalendarItem, e: React.MouseEvent) => void;
  onMoveItem?: (item: CalendarItem, patch: { date: string; startTime: string }) => void;
}

function toMin(startTime: string | null | undefined): number | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function fmtMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function fmtHour(h: number): string {
  return `${String(h % 24).padStart(2, "0")}`;
}

interface LaneBlock { item: CalendarItem; lane: number; lanes: number; width: number; left: number; top: number; height: number; }

function assignLanes(items: CalendarItem[], startMin: number, pxPerMin: number): LaneBlock[] {
  const sorted = [...items].sort((a, b) => {
    const am = toMin(a.startTime) ?? startMin;
    const bm = toMin(b.startTime) ?? startMin;
    return am - bm;
  });
  const lanes: { end: number; item: CalendarItem }[][] = [];
  for (const item of sorted) {
    const m = toMin(item.startTime) ?? startMin;
    const dur = item.duration || 30;
    const end = m + dur;
    let placed = -1;
    for (let i = 0; i < lanes.length; i++) {
      const last = lanes[i][lanes[i].length - 1];
      if (last.end <= m) { placed = i; break; }
    }
    if (placed === -1) lanes.push([]);
    placed = placed === -1 ? lanes.length - 1 : placed;
    lanes[placed].push({ end, item });
  }
  const count = lanes.length || 1;
  const width = 100 / count;
  return lanes.flatMap((lane, li) => {
    return lane.map(({ item }) => {
      const m = toMin(item.startTime) ?? startMin;
      const dur = item.duration || 30;
      const top = (m - startMin) * pxPerMin;
      const height = Math.max(8, dur * pxPerMin);
      return { item, lane: li, lanes: count, width, left: li * width, top, height };
    });
  });
}

type DragState = {
  mode: "col" | "item";
  col: string;
  item?: CalendarItem;
  startY: number;
  startMin: number;
  endMin: number;
  startDur: number;
  moved: boolean;
};

export default function TimeGrid({
  days, PX_PER_HOUR, activeStartHour, activeHours,
  isToday, nowMin, onOpenComposer, onItemMenu, onMoveItem,
}: TimeGridProps) {
  const gridRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [colPreview, setColPreview] = useState<{ col: string; startMin: number; endMin: number } | null>(null);

  const startHour = activeStartHour;
  const endHour = startHour + activeHours;
  const pxPerMin = PX_PER_HOUR / 60;
  const gridH = activeHours * PX_PER_HOUR;

  function snap30(min: number): number {
    return Math.max(startHour * 60, Math.min(endHour * 60, Math.ceil(min / 30) * 30));
  }

  function clampMin(min: number): number {
    return Math.max(startHour * 60, Math.min(endHour * 60 - 1, min));
  }

  function colMin(iso: string, clientY: number): number | null {
    const col = gridRefs.current[iso];
    if (!col) return null;
    const r = col.getBoundingClientRect();
    return startHour * 60 + Math.round((clientY - r.top) / pxPerMin);
  }

  function colPointerDown(iso: string) {
    return (e: React.PointerEvent) => {
      if (e.button !== 0 || drag.current) return;
      if ((e.target as HTMLElement).closest(".tg-event")) return;
      const m = colMin(iso, e.clientY);
      if (m == null) return;
      const start = snap30(m);
      drag.current = { mode: "col", col: iso, startY: e.clientY, startMin: start, endMin: start + 30, startDur: 0, moved: false };
      setColPreview({ col: iso, startMin: start, endMin: start + 30 });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
  }

  function colPointerMove(e: React.PointerEvent) {
    if (!drag.current || drag.current.mode !== "col") return;
    const m = colMin(drag.current.col, e.clientY);
    if (m == null) return;
    const cur = snap30(m);
    if (cur !== drag.current.startMin) drag.current.moved = true;
    drag.current.endMin = cur > drag.current.startMin ? cur : drag.current.startMin + 30;
    setColPreview({ col: drag.current.col, startMin: drag.current.startMin, endMin: drag.current.endMin });
  }

  function colPointerEnd() {
    if (!drag.current || drag.current.mode !== "col") return;
    const d = drag.current;
    drag.current = null;
    setColPreview(null);
    if (!d.moved) return;
    suppressClick.current = true;
    if (d.endMin - d.startMin < 30) return;
    onOpenComposer({ date: d.col, startTime: fmtMin(d.startMin), duration: d.endMin - d.startMin });
  }

  function colClick(iso: string) {
    return (e: React.MouseEvent) => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      if (drag.current) return;
      if ((e.target as HTMLElement).closest(".tg-event")) return;
      const m = colMin(iso, e.clientY);
      if (m == null) return;
      const snapped = snap30(m);
      onOpenComposer({ date: iso, startTime: fmtMin(snapped) });
    };
  }

  function itemPointerDown(item: CalendarItem, e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).classList.add("dragging");
    drag.current = {
      mode: "item", col: item.date, item,
      startY: e.clientY,
      startMin: toMin(item.startTime) ?? startHour * 60,
      endMin: 0,
      startDur: item.duration || 30,
      moved: false,
    };
  }

  function itemPointerMove(e: React.PointerEvent) {
    if (!drag.current || drag.current.mode !== "item" || !drag.current.item) return;
    const d = drag.current;
    const delta = Math.round((e.clientY - d.startY) / pxPerMin / 30) * 30;
    if (delta !== 0) d.moved = true;
    const newMin = clampMin(d.startMin + delta);
    const el = e.currentTarget as HTMLElement;
    el.style.top = `${(newMin - startHour * 60) * pxPerMin}px`;
  }

  function itemPointerEnd(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.mode !== "item" || !d.item) return;
    drag.current = null;
    (e.currentTarget as HTMLElement).classList.remove("dragging");
    if (!d.moved) return;
    suppressClick.current = true;
    const delta = Math.round((e.clientY - d.startY) / pxPerMin / 30) * 30;
    const newMin = clampMin(d.startMin + delta);
    if (newMin === d.startMin) return;
    onMoveItem?.(d.item, { date: d.col, startTime: fmtMin(newMin) });
  }

  function itemPointerCancel(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.mode !== "item" || !d.item) return;
    drag.current = null;
    (e.currentTarget as HTMLElement).classList.remove("dragging");
  }

  function menuHandler(item: CalendarItem, e: React.MouseEvent) {
    if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); e.stopPropagation(); return; }
    onItemMenu(item, e);
  }

  const todayMin = isToday ? nowMin : null;

  return (
    <div className="tg">
      <div className="tg-grid" style={{ height: gridH }}>
        <div className="tg-gutter">
          {Array.from({ length: activeHours }, (_, i) => {
            const h = startHour + i;
            const min = h * 60;
            const isNowHour = todayMin !== null && todayMin >= min && todayMin < min + 60;
            return (
              <div key={h} className={`tg-hour ${isNowHour ? "tg-hour-now" : ""}`}>
                <span className="tg-hour-label">{fmtHour(h)}</span>
                {isNowHour && isToday && (
                  <span className="tg-now-marker" style={{ top: (todayMin - min) * pxPerMin }} />
                )}
              </div>
            );
          })}
        </div>
        {days.map((d) => {
          const timed = d.timed.filter((it) => {
            const m = toMin(it.startTime);
            return m !== null && m >= startHour * 60 && m < endHour * 60;
          });
          const blocks = assignLanes(timed, startHour * 60, pxPerMin);
          return (
            <div
              key={d.iso}
              ref={(n) => { gridRefs.current[d.iso] = n; }}
              className={`tg-col ${d.today ? "tg-col-today" : ""}`}
              onPointerDown={colPointerDown(d.iso)}
              onPointerMove={colPointerMove}
              onPointerUp={colPointerEnd}
              onPointerCancel={colPointerEnd}
              onClick={colClick(d.iso)}
            >
              <div className="tg-col-allday">
                {d.allDay.map((item) => (
                  <EventPill key={item.id} item={item} compact onMenu={menuHandler} />
                ))}
              </div>
              {blocks.map(({ item, left, width, top, height }) => (
                <div
                  key={item.id}
                  data-id={item.id}
                  className="tg-event"
                  style={{ top, height, left: `${left}%`, width: `${width}%` }}
                  onPointerDown={(e) => itemPointerDown(item, e)}
                  onPointerMove={itemPointerMove}
                  onPointerUp={itemPointerEnd}
                  onPointerCancel={itemPointerCancel}
                >
                  <EventPill item={item} onMenu={menuHandler} />
                </div>
              ))}
              {colPreview?.col === d.iso && (
                <div
                  className="tg-preview"
                  style={{
                    top: (colPreview.startMin - startHour * 60) * pxPerMin,
                    height: (colPreview.endMin - colPreview.startMin) * pxPerMin,
                  }}
                />
              )}
            </div>
          );
        })}
        {isToday && todayMin !== null && (
          <div
            className="tg-now-line"
            style={{ top: (todayMin - startHour * 60) * pxPerMin }}
          />
        )}
      </div>
    </div>
  );
}