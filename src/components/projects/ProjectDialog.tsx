import { useState } from "react";
import { useOS } from "../../state/os";
import type { Project } from "../../types";
import { Modal } from "../Modal";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4", "#ec4899", "#6366f1"];
type ProjectStatus = Project["status"];

export function ProjectDialog() {
  const { projectEditor, closeProjectEditor, addProject, updateProject, deleteProject, projects } = useOS();
  const editing = projectEditor?.mode === "edit" ? projects.find((p) => p.id === projectEditor.id) : undefined;

  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState(editing?.color ?? COLORS[0]);
  const [status, setStatus] = useState<ProjectStatus>(editing?.status ?? "active");

  if (!projectEditor) return null;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = {
      name: trimmed,
      description: description.trim(),
      color,
      progress: editing?.progress ?? 0,
      lastActivity: editing?.lastActivity ?? "Today",
      status: status as "planning" | "active" | "paused" | "completed" | "archived",
    };
    if (projectEditor.mode === "edit") updateProject(projectEditor.id, payload);
    else addProject(payload);
    closeProjectEditor();
  };

  return (
    <Modal
      title={projectEditor.mode === "edit" ? "Edit Project" : "New Project"}
      onClose={closeProjectEditor}
      footer={
        <>
          {projectEditor.mode === "edit" && (
            <button
              className="btn btn-ghost danger"
              onClick={() => {
                deleteProject(projectEditor.id);
                closeProjectEditor();
              }}
            >
              Delete
            </button>
          )}
          <span className="modal-spacer" />
          <button className="btn btn-ghost" onClick={closeProjectEditor}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>
            {projectEditor.mode === "edit" ? "Save changes" : "Create Project"}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field full">
          <span className="field-label">Project name</span>
          <input
            className="input"
            value={name}
            autoFocus
            placeholder="What are you building?"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </label>
        <label className="field full">
          <span className="field-label">Description</span>
          <textarea
            className="input textarea"
            value={description}
            placeholder="Brief description…"
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Color</span>
          <div className="project-color-row">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`project-color-swatch ${color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}
