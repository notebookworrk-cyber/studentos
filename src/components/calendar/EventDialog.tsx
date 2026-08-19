import { useState } from "react";
import { todayISO } from "../../lib/date";
import { useOS } from "../../state/os";
import type { CalendarEvent, EventKind } from "../../types";
import { Modal } from "../Modal";

const EVENT_CATEGORIES = ["Life", "Exam", "Study", "Project", "Social", "Other"] as const;
const RECURRENCE_OPTIONS = [
  { value: null, label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export function EventDialog() {
  const { composer, closeComposer, addEvent, updateEvent, deleteEvent } = useOS();
  const ev = composer?.type === "event" ? composer.event : undefined;
  const draft = composer?.type === "event" ? composer.draft : undefined;
  const [title, setTitle] = useState(ev?.title ?? draft?.title ?? "");
  const [date, setDate] = useState(ev?.date ?? draft?.date ?? todayISO());
  const [startTime, setStartTime] = useState(ev?.startTime ?? draft?.startTime ?? "09:00");
  const [duration, setDuration] = useState(String(ev?.duration ?? draft?.duration ?? 60));
  const [category, setCategory] = useState(ev?.category ?? draft?.category ?? "Life");
  const [kind, setKind] = useState<EventKind>(ev?.kind ?? draft?.kind ?? "event");
  const [recurrence, setRecurrence] = useState<CalendarEvent["recurrence"]>(ev?.recurrence ?? draft?.recurrence ?? null);
  const [endDate, setEndDate] = useState(ev?.endDate ?? draft?.endDate ?? "");
  const [allDay, setAllDay] = useState(ev?.allDay ?? draft?.allDay ?? false);
  const [location, setLocation] = useState(ev?.location ?? draft?.location ?? "");
  const [description, setDescription] = useState(ev?.description ?? draft?.description ?? "");
  const [reminder, setReminder] = useState(String(ev?.reminder ?? draft?.reminder ?? 0));
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!composer || composer.type !== "event") return null;

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed || !date) return;
    if (endDate && endDate < date) return;
    const payload = {
      title: trimmed,
      date,
      startTime: startTime || "09:00",
      duration: Math.max(5, Number(duration) || 30),
      category,
      kind,
      recurrence: recurrence ?? null,
      endDate: endDate || undefined,
      allDay,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      reminder: Math.max(0, Number(reminder) || 0),
    };
    if (ev) updateEvent(ev.id, payload);
    else addEvent(payload);
    closeComposer();
  };

  return (
    <Modal
      title={ev ? "Edit Event" : "New Event"}
      onClose={closeComposer}
      footer={
        <>
          {ev && (
            <button
              className="btn btn-ghost danger"
              onClick={() => {
                deleteEvent(ev.id);
                closeComposer();
              }}
            >
              Delete
            </button>
          )}
          <span className="modal-spacer" />
          <button className="btn btn-ghost" onClick={closeComposer}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!title.trim() || !date}>
            {ev ? "Save changes" : "Add Event"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field full">
          <span className="field-label">Title</span>
          <input
            className="input"
            value={title}
            autoFocus
            placeholder="Event name"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </label>
        <label className="field">
          <span className="field-label">Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Start time</span>
          <input className="input" type="time" value={startTime} disabled={allDay} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Duration (min)</span>
          <input
            className="input"
            type="number"
            min={5}
            step={5}
            value={duration}
            disabled={allDay}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
        <label className="field full">
          <span className="field-label">
            <input type="checkbox" className="input-check" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </span>
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Type</span>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as EventKind)}>
            <option value="event">Event</option>
            <option value="exam">Exam</option>
            <option value="deadline">Deadline</option>
            <option value="class">Class</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Repeat</span>
          <select className="input" value={recurrence === null ? "" : recurrence ?? ""} onChange={(e) => setRecurrence(e.target.value === "" ? null : e.target.value as CalendarEvent["recurrence"])}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value === null ? "" : opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field full">
          <span className="field-label">End date (optional)</span>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm form-more"
          onClick={() => setShowAdvanced(v => !v)}
        >
          {showAdvanced ? "Hide details" : "Add location, description & reminder"}
        </button>
        {showAdvanced && (
          <>
            <label className="field">
              <span className="field-label">Location</span>
              <input className="input" type="text" value={location} placeholder="Where?" onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Remind before</span>
              <select className="input" value={String(reminder)} onChange={(e) => setReminder(e.target.value)}>
                <option value="0">None</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="1440">1 day</option>
              </select>
            </label>
            <label className="field full">
              <span className="field-label">Description</span>
              <textarea className="input" rows={3} value={description} placeholder="Notes, agenda, details…" onChange={(e) => setDescription(e.target.value)} />
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}