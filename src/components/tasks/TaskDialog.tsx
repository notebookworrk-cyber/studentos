import { useState } from "react";
import { todayISO } from "../../lib/date";
import { useOS } from "../../state/os";
import type { TaskCategory, TaskPriority } from "../../types";
import { TASK_CATEGORIES } from "../../types";
import { Modal } from "../Modal";

export function TaskDialog() {
  const { composer, closeComposer, addTask, updateTask, deleteTask, goals, projects } = useOS();
  const task = composer?.type === "task" ? composer.task : undefined;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [date, setDate] = useState(task?.date ?? todayISO());
  const [startTime, setStartTime] = useState(task?.startTime ?? "");
  const [duration, setDuration] = useState(String(task?.duration ?? 60));
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? "Study");
  const [project, setProject] = useState(task?.project ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? (composer?.type === "task" ? composer.goalId ?? "" : ""));

  if (!composer || composer.type !== "task") return null;

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed || !date) return;
    const payload = {
      title: trimmed,
      description: description.trim(),
      date,
      startTime: startTime || null,
      duration: Math.max(5, Number(duration) || 30),
      priority,
      category,
      project: project.trim() || null,
      goalId: goalId || undefined,
      status: "todo" as const,
    };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    closeComposer();
  };

  return (
    <Modal
      title={task ? "Edit Task" : "New Task"}
      onClose={closeComposer}
      footer={
        <>
          {task && (
            <button
              className="btn btn-ghost danger"
              onClick={() => {
                deleteTask(task.id);
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
            {task ? "Save changes" : "Create Task"}
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
            placeholder="What needs to be done?"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </label>
        <label className="field full">
          <span className="field-label">Description</span>
          <textarea
            className="input textarea"
            value={description}
            placeholder="Optional notes…"
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Start time</span>
          <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Duration (min)</span>
          <input
            className="input"
            type="number"
            min={5}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Priority</span>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Project</span>
          <select className="input" value={project} onChange={(e) => setProject(e.target.value)}>
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Goal</span>
          <select className="input" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">None</option>
            {goals.filter((g) => g.active).map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}