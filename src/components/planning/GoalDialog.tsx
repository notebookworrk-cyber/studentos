import { useState } from "react";
import { todayISO } from "../../lib/date";
import { useOS } from "../../state/os";
import type { GoalPriority } from "../../types";
import { TASK_CATEGORIES } from "../../types";
import { Modal } from "../Modal";

export function GoalDialog() {
  const { goalEditor, closeGoalEditor, addGoal, updateGoal, deleteGoal, goals } = useOS();
  const editing = goalEditor?.mode === "edit" ? goals.find((g) => g.id === goalEditor.id) : undefined;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "Study");
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [priority, setPriority] = useState<GoalPriority>(editing?.priority ?? "important");

  if (!goalEditor) return null;

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const payload = {
      title: trimmed,
      description: description.trim(),
      category,
      deadline: deadline || null,
      priority,
      active: true,
    };
    if (goalEditor.mode === "edit") updateGoal(goalEditor.id, payload);
    else addGoal(payload);
    closeGoalEditor();
  };

  return (
    <Modal
      title={goalEditor.mode === "edit" ? "Edit Goal" : "New Goal"}
      onClose={closeGoalEditor}
      footer={
        <>
          {goalEditor.mode === "edit" && (
            <button
              className="btn btn-ghost danger"
              onClick={() => {
                deleteGoal(goalEditor.id);
                closeGoalEditor();
              }}
            >
              Delete
            </button>
          )}
          <span className="modal-spacer" />
          <button className="btn btn-ghost" onClick={closeGoalEditor}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!title.trim()}>
            {goalEditor.mode === "edit" ? "Save changes" : "Create Goal"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field full">
          <span className="field-label">Goal</span>
          <input
            className="input"
            value={title}
            autoFocus
            placeholder="What do you want to accomplish?"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </label>
        <label className="field full">
          <span className="field-label">Description</span>
          <textarea
            className="input textarea"
            value={description}
            placeholder="Why it matters…"
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Deadline</span>
          <input
            className="input"
            type="date"
            min={todayISO()}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
        <label className="field full">
          <span className="field-label">Priority</span>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as GoalPriority)}>
            <option value="critical">Critical — must happen</option>
            <option value="important">Important — should happen</option>
            <option value="optional">Optional — nice to complete</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}