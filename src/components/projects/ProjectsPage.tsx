import { useState } from "react";
import { useOS } from "../../state/os";
import { toast } from "../../state/toasts";
import { fmtFullDate } from "../../lib/date";
import { Icon } from "../Icon";
import { isDesktop } from "../../lib/platform";
import { ContextMenu, useContextMenu } from "../ContextMenu";

export function ProjectsPage() {
  const { tasks, notes, goals, projects, openProjectEditor, navigate, openComposer, openNoteEditor, deleteTask, deleteNote, updateNote, togglePlan, startLockIn } = useOS();
  const { menu, open, close } = useContextMenu();
  const [active, setActive] = useState<string | null>(null);

  const openTerminalHere = async (project: string) => {
    const d = window.studentos;
    if (!d) return navigate("terminal");
    const dir = await d.system.resolvePath({ name: project });
    if (dir.path) sessionStorage.setItem("studentos.term.cwd", dir.path);
    navigate("terminal");
  };

  const picked = active ?? projects[0]?.id ?? null;
  const pickedProject = picked ? projects.find((p) => p.id === picked) : null;
  const projTasks = pickedProject ? tasks.filter((t) => t.project === pickedProject.name) : [];
  const projNotes = pickedProject ? notes.filter((n) => n.project === pickedProject.name) : [];
  const projGoals = pickedProject ? goals.filter((g) => g.title.toLowerCase().includes(pickedProject.name.toLowerCase())) : [];
  const done = projTasks.filter((t) => t.status === "completed").length;
  const pct = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;

  const projectMenu = (p: { id: string; name: string }) => [
    { label: "Open", icon: "back" as const, onClick: () => setActive(p.id) },
    { label: "Edit", icon: "edit" as const, onClick: () => openProjectEditor({ mode: "edit", id: p.id }) },
    { label: "Add task", icon: "plus" as const, onClick: () => openComposer({ type: "task" }) },
    ...(isDesktop ? [{ label: "Open Terminal Here", icon: "terminal" as const, onClick: () => openTerminalHere(p.name) }] : []),
  ];

  const taskMenu = (t: { id: string; status: string; title: string; duration: number }) => [
    { label: t.status === "completed" ? "Mark incomplete" : "Complete", icon: "check" as const, onClick: () => togglePlan(t.id) },
    { label: "Edit", icon: "edit" as const, onClick: () => openComposer({ type: "task", task: tasks.find((x) => x.id === t.id) }) },
    { label: "Start Lock-In", icon: "lock" as const, onClick: () => startLockIn({ title: t.title, plannedMin: t.duration || 25, taskId: t.id }) },
    { separator: true },
    { label: "Delete", icon: "trash" as const, danger: true, onClick: () => { deleteTask(t.id); toast("Task deleted", "ok"); } },
  ];

  const noteMenu = (n: { id: string; favorite: boolean }) => [
    { label: "Open", icon: "back" as const, onClick: () => openNoteEditor({ mode: "edit", id: n.id }) },
    { label: n.favorite ? "Unfavorite" : "Favorite", icon: "star" as const, onClick: () => updateNote(n.id, { favorite: !n.favorite }) },
    { separator: true },
    { label: "Delete", icon: "trash" as const, danger: true, onClick: () => { deleteNote(n.id); toast("Note deleted", "ok"); } },
  ];

  const statusLabel: Record<string, string> = { active: "Active", planning: "Planning", paused: "Paused", completed: "Completed", archived: "Archived" };

  return (
    <div className="page projects-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Every project, one place — tasks, notes, goals & focus together.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openProjectEditor({ mode: "new" })}>
          <Icon name="plus" size={15} />
          New project
        </button>
      </header>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon name="projects" size={24} /></div>
          <h3 className="empty-title">No projects yet</h3>
          <p className="empty-line">Create a project to organize your tasks, notes, and goals.</p>
        </div>
      ) : (
        <>
          <section className="study-block surface">
            <div className="panel-head">
              <div className="panel-title">
                <Icon name="projects" />
                Overview
              </div>
            </div>
            <div className="projects-grid">
              {projects.map((p) => {
                const ts = tasks.filter((t) => t.project === p.name);
                const nt = notes.filter((n) => n.project === p.name);
                const doneCount = ts.filter((t) => t.status === "completed").length;
                const cumulative = ts.length ? Math.round((doneCount / ts.length) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    className={`projects-card surface ${picked === p.id ? "active" : ""}`}
                    onClick={() => setActive(p.id)}
                    onContextMenu={(e) => open(e, projectMenu(p))}
                  >
                    <div className="projects-card-top">
                      <span className="projects-card-name">
                        <span className="dot" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className="badge badge-plain">{ts.length} tasks</span>
                    </div>
                    <div className="projects-card-nums">
                      <span>{doneCount}/{ts.length} done</span>
                      <span>{nt.length} notes</span>
                    </div>
                    <div className="progress">
                      <div className="progress-track" style={{ transform: `scaleX(${cumulative / 100})`, background: p.color }} />
                    </div>
                    <span className="badge badge-plain">{statusLabel[p.status] ?? p.status}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {pickedProject && (
            <section className="study-block surface">
              <div className="panel-head">
                <div className="panel-title">
                  <Icon name="layers" />
                  <span className="dot" style={{ background: pickedProject.color }} />
                  {pickedProject.name}
                  <span className="badge badge-tint">{pct}% complete</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => openProjectEditor({ mode: "edit", id: pickedProject.id })}>
                  <Icon name="edit" size={13} />
                  Edit
                </button>
              </div>

              {pickedProject.description && (
                <p className="projects-desc">{pickedProject.description}</p>
              )}

              <div className="projects-progress-line">
                <div className="progress">
                  <div className="progress-track" style={{ transform: `scaleX(${pct / 100})`, background: pickedProject.color }} />
                </div>
              </div>

              {projGoals.length > 0 && (
                <div className="projects-sec">
                  <div className="field-label">Goals</div>
                  {projGoals.map((g) => (
                    <div key={g.id} className="study-res-item">
                      <div>
                        <div className="study-res-item-title">{g.title}</div>
                        <div className="study-res-item-sub">
                          {g.category} · {g.deadline ? fmtFullDate(g.deadline) : "no deadline"}
                        </div>
                      </div>
                      <span className={`badge ${g.priority === "critical" ? "badge-red" : g.priority === "important" ? "badge-amber" : "badge-plain"}`}>
                        {g.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="projects-col">
                <div className="projects-sec">
                  <div className="field-label">Tasks</div>
                  {projTasks.length === 0 && <p className="study-res-empty">No tasks linked to this project.</p>}
                  {projTasks.map((t) => (
                    <div
                      key={t.id}
                      className="study-res-item projects-task-row"
                      onContextMenu={(e) => open(e, taskMenu(t))}
                    >
                      <div className="projects-task">
                        <span className={`dot ${t.status === "completed" ? "dot-live" : ""}`} />
                        <div>
                          <div className={`study-res-item-title ${t.status === "completed" ? "projects-done" : ""}`}>
                            {t.title}
                          </div>
                          <div className="study-res-item-sub">
                            {t.date} · {t.category}
                            {t.goalId && " · goal-linked"}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-plain">{t.status}</span>
                    </div>
                  ))}
                </div>

                <div className="projects-sec">
                  <div className="field-label">Notes</div>
                  {projNotes.length === 0 && <p className="study-res-empty">No notes in this project.</p>}
                  {projNotes.map((n) => (
                    <button
                      key={n.id}
                      className="study-res-item projects-note"
                      onClick={() => openNoteEditor({ mode: "edit", id: n.id })}
                      onContextMenu={(e) => open(e, noteMenu(n))}
                    >
                      <div className="projects-task">
                        {n.favorite && <Icon name="star" size={13} />}
                        <div>
                          <div className="study-res-item-title">{n.title}</div>
                          <div className="study-res-item-sub">{n.folder}</div>
                        </div>
                      </div>
                      <Icon name="back" size={15} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="projects-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openComposer({ type: "task" })}>
                  <Icon name="plus" size={13} />
                  Add task
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("tasks")}>
                  Open Tasks
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("files")}>
                  Open Files
                </button>
                {isDesktop && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openTerminalHere(pickedProject.name)} title="Shell in this project's folder">
                    <Icon name="terminal" size={13} />
                    Open Terminal Here
                  </button>
                )}
              </div>
            </section>
          )}
        </>
      )}
      <ContextMenu menu={menu} onClose={close} />
    </div>
  );
}
