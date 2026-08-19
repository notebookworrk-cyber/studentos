import { useMemo, useState } from "react";
import { fmtMonthDay, todayISO } from "../../lib/date";
import { parseSubtasks } from "../../lib/aiPlanner";
import { useOS } from "../../state/os";
import { toast } from "../../state/toasts";
import type { Task, TaskPriority } from "../../types";
import { TASK_CATEGORIES } from "../../types";
import { ContextMenu, useContextMenu, type MenuItem } from "../ContextMenu";
import { Icon } from "../Icon";

type View = "today" | "upcoming" | "completed" | "all";

const VIEWS: { id: View; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

const priorityBadge: Record<TaskPriority, string> = {
  low: "badge-plain",
  medium: "badge-tint",
  high: "badge-amber",
};

const priorityRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function TasksPage() {
  const { tasks, today, overdue, openComposer, addTask } = useOS();
  const [view, setView] = useState<View>("today");
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [breakingId, setBreakingId] = useState<string | null>(null);
  const { menu, open, close } = useContextMenu();
  const hasAI = !!window.studentos?.ai;

  const breakDown = async (t: Task) => {
    const api = window.studentos?.ai;
    if (!api || breakingId) return;
    setBreakingId(t.id);
    try {
      const prompt = `Break the following task into 3-6 small, actionable subtasks. Return only subtask lines, one per line, each starting with "- ". Keep each under 8 words. Task: ${t.title}${t.description ? `. Description: ${t.description}` : ""}`;
      const res = await api.generate(prompt, 0.7, 200);
      const text = res.text ?? "";
      const titles = parseSubtasks(text);
      if (!titles.length) {
        toast("No subtasks parsed", "err");
        return;
      }
      for (const title of titles) {
        addTask({
          title,
          description: "",
          date: t.date,
          startTime: null,
          duration: 25,
          priority: t.priority,
          category: t.category,
          project: t.project,
          goalId: t.goalId,
          status: "todo",
        });
      }
      toast(`Created ${titles.length} subtasks`, "ok");
    } catch (e: unknown) {
      toast(`AI failed: ${e instanceof Error ? e.message : e}`, "err");
    } finally {
      setBreakingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = tasks.filter((t) => {
      if (view === "completed" && t.status !== "completed") return false;
      if (view !== "completed") {
        if (t.status === "completed") return false;
        if (view === "today" && t.date !== today) return false;
        if (view === "upcoming" && t.date <= today) return false;
      }
      if (catFilter !== "all" && t.category !== catFilter) return false;
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.description} ${t.category} ${t.project ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return base.sort((a, b) => {
      if (sortBy === "priority") return priorityRank[a.priority] - priorityRank[b.priority] || a.date.localeCompare(b.date);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return a.date.localeCompare(b.date) || (a.startTime ?? "99").localeCompare(b.startTime ?? "99");
    });
  }, [tasks, view, query, catFilter, prioFilter, sortBy, today]);

  const inToday = view === "today";

  return (
    <div className="page tasks-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Everything you need to move forward.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openComposer({ type: "task" })}>
          <Icon name="plus" />
          New Task
        </button>
      </header>

      <div className="tasks-toolbar">
        <div className="seg">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`seg-item ${view === v.id ? "active" : ""}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="toolbar-controls">
          <label className="search">
            <Icon name="search" size={15} />
            <input
              className="input search-input"
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select className="input toolbar-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input toolbar-select" value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)} aria-label="Filter by priority">
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="input toolbar-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort tasks">
            <option value="date">Sort by date</option>
            <option value="priority">Sort by priority</option>
            <option value="title">Sort by title</option>
          </select>
        </div>
      </div>

      {inToday && overdue.length > 0 && (
        <section className="overdue-box">
          <div className="overdue-head">
            <span className="badge badge-red">Overdue</span>
            <span className="overdue-note">A gentle reminder, nothing more.</span>
          </div>
          {overdue.map((t) => (
            <TaskRow key={t.id} task={t} overdue hasAI={hasAI} breaking={breakingId === t.id} onBreakDown={breakDown} onMenu={(e, items) => open(e, items)} />
          ))}
        </section>
      )}

      {filtered.length === 0 ? (
        <EmptyState view={view} onCreate={() => openComposer({ type: "task" })} />
      ) : (
        <div className="task-list">
          {filtered.map((t) => (
            <TaskRow key={t.id} task={t} hasAI={hasAI} breaking={breakingId === t.id} onBreakDown={breakDown} onMenu={(e, items) => open(e, items)} />
          ))}
        </div>
      )}

      <ContextMenu menu={menu} onClose={close} />
    </div>
  );
}

function TaskRow({ task, overdue, hasAI, breaking, onBreakDown, onMenu }: { task: Task; overdue?: boolean; hasAI?: boolean; breaking?: boolean; onBreakDown?: (t: Task) => void; onMenu: (e: React.MouseEvent, items: MenuItem[]) => void }) {
  const { togglePlan, openComposer, deleteTask, startLockIn, navigate } = useOS();
  const done = task.status === "completed";
  const dueLabel =
    task.date === todayISO()
      ? "Today"
      : overdue
        ? `Overdue · ${fmtMonthDay(task.date)}`
        : fmtMonthDay(task.date);

  const menuItems: MenuItem[] = [
    { label: done ? "Mark incomplete" : "Complete", icon: done ? "undo" : "check", onClick: () => togglePlan(task.id) },
    { label: "Edit", icon: "edit", onClick: () => openComposer({ type: "task", task }) },
    { label: "Start Focus", icon: "timer", onClick: () => navigate("timer") },
    { label: "Start Lock-In", icon: "lock", onClick: () => startLockIn({ title: task.title, plannedMin: 25, taskId: task.id }) },
    { label: "Ask AI", icon: "ai", onClick: () => navigate("ai") },
    { separator: true },
    { label: "Delete", icon: "trash", danger: true, onClick: () => { deleteTask(task.id); toast(`Task deleted · ${task.title}`); } },
  ];

  return (
    <div
      className={`task-row ${done ? "done" : ""}`}
      onContextMenu={(e) => onMenu(e, menuItems)}
    >
      <button
        className={`task-check ${done ? "on" : ""}`}
        aria-label={done ? `undo ${task.title}` : `complete ${task.title}`}
        onClick={() => {
          togglePlan(task.id);
          if (!done) toast(`Task completed · ${task.title}`, "ok");
        }}
      >
        <Icon name={done ? "undo" : "check"} size={12} />
      </button>
      <div className="task-main">
        <div className="task-title-line">
          <span className="task-title">{task.title}</span>
          {overdue && <span className="badge badge-red task-overdue">Overdue</span>}
          {task.startTime && <span className="task-time">{task.startTime}</span>}
        </div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-tags">
          <span className={`badge ${priorityBadge[task.priority]}`}>{task.priority}</span>
          <span className="badge badge-tint">{task.category}</span>
          {task.project && <span className="badge badge-plain">{task.project}</span>}
          <span className="task-due">{dueLabel}</span>
        </div>
      </div>
      <div className="task-actions">
        {hasAI && onBreakDown && (
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Break ${task.title} into subtasks`}
            title={breaking ? "Breaking down…" : "Break into subtasks (AI)"}
            onClick={() => onBreakDown(task)}
            disabled={breaking}
          >
            <Icon name="ai" size={15} />
          </button>
        )}
        <button
          className="btn btn-ghost btn-icon"
          aria-label={`Edit ${task.title}`}
          onClick={() => openComposer({ type: "task", task })}
        >
          <Icon name="edit" size={15} />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ view, onCreate }: { view: View; onCreate: () => void }) {
  const copy: Record<View, { title: string; line: string }> = {
    today: { title: "Nothing scheduled today", line: "Your day is clear." },
    upcoming: { title: "Nothing coming up", line: "The horizon is empty." },
    completed: { title: "No completed tasks", line: "Check off something to see it here." },
    all: { title: "No tasks found", line: "Try a different search or filter." },
  };
  const c = copy[view];
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="check" size={22} />
      </div>
      <h3 className="empty-title">{c.title}</h3>
      <p className="empty-line">{c.line}</p>
      <button className="btn btn-primary" onClick={onCreate}>
        <Icon name="plus" />
        Add Task
      </button>
    </div>
  );
}