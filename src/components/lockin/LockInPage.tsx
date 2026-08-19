import { useState } from "react";
import { fmtDuration } from "../../lib/format";
import { fmtRelative } from "../../lib/date";
import { useOS } from "../../state/os";
import type { LockInSession } from "../../types";
import { Icon } from "../Icon";

const PRESETS = [15, 25, 45, 60, 90];

export function LockInPage({ immersive = false }: { immersive?: boolean }) {
  const { lockinActive, lockinHistory } = useOS();

  return (
    <div className={`page lockin-page ${immersive ? "immersive" : ""}`}>
      {!immersive && (
        <header className="page-head">
          <div>
            <h1 className="page-title">Lock-In</h1>
            <p className="page-subtitle">Set a goal. Remove distractions. Finish it.</p>
          </div>
        </header>
      )}

      {lockinActive ? (
        <ActiveSession session={lockinActive} />
      ) : (
        <StartPanel />
      )}

      {!immersive && <History sessions={lockinHistory} />}
    </div>
  );
}

function StartPanel() {
  const {
    tasks,
    goals,
    subjects,
    startLockIn,
    openComposer,
    openGoalEditor,
  } = useOS();
  const [title, setTitle] = useState("");
  const [plannedMin, setPlannedMin] = useState(45);
  const [taskId, setTaskId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const openTasks = tasks.filter((t) => t.status !== "completed");
  const effectiveTitle =
    title ||
    tasks.find((t) => t.id === taskId)?.title ||
    goals.find((g) => g.id === goalId)?.title ||
    subjects.find((s) => s.id === subjectId)?.name ||
    "";

  const begin = () => {
    startLockIn({
      title: effectiveTitle || "Focus block",
      plannedMin,
      taskId: taskId || null,
      goalId: goalId || null,
      subjectId: subjectId || null,
    });
  };

  return (
    <section className="study-block glass lockin-start">
      <div className="panel-title">
        <Icon name="lock" />
        Start a session
      </div>

      <div className="lockin-form">
        <label className="field full">
          <span className="field-label">What are you locking into?</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={effectiveTitle || "e.g. Finish Chemistry practice"}
          />
        </label>

        <div className="field full">
          <span className="field-label">Planned time</span>
          <div className="lockin-presets">
            {PRESETS.map((m) => (
              <button
                key={m}
                className={`btn btn-sm ${plannedMin === m ? "btn-primary" : ""}`}
                onClick={() => setPlannedMin(m)}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Link a task</span>
          <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">None</option>
            {openTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Link a goal</span>
          <select className="input" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">None</option>
            {goals.filter((g) => g.active).map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Link a subject</span>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">None</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="btn btn-primary lockin-begin" onClick={begin}>
        <Icon name="focus" />
        Lock in · {fmtDuration(plannedMin)}
      </button>

      <div className="lockin-alt">
        <span className="lockin-alt-label">Need something to lock into?</span>
        <button className="btn btn-ghost btn-sm" onClick={() => openComposer({ type: "task" })}>
          <Icon name="plus" size={13} />
          Add a task
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => openGoalEditor({ mode: "new" })}>
          <Icon name="plus" size={13} />
          Add a goal
        </button>
      </div>
    </section>
  );
}

function ActiveSession({ session }: { session: LockInSession }) {
  const { timer, endLockIn, tasks, goals, subjects } = useOS();
  const mm = String(Math.floor(timer.seconds / 60)).padStart(2, "0");
  const ss = String(timer.seconds % 60).padStart(2, "0");
  const pct = ((session.plannedMin * 60 - timer.seconds) / (session.plannedMin * 60)) * 100;
  const task = tasks.find((t) => t.id === session.taskId);
  const goal = goals.find((g) => g.id === session.goalId);
  const subject = subjects.find((s) => s.id === session.subjectId);

  return (
    <section className="glass-frost lockin-active" style={{ "--pct": `${Math.max(0, pct)}%` } as React.CSSProperties}>
      <div className="lockin-active-badge">
        <span className="dot dot-live" />
        Session running
      </div>
      <div className="lockin-active-title">{session.title}</div>
      <div className="lockin-active-meta">
        {subject && (
          <span className="badge badge-cyan">{subject.name}</span>
        )}
        {goal && <span className="badge badge-tint">{goal.title}</span>}
        {task && <span className="badge badge-plain">{task.status === "in-progress" ? "In progress" : "Linked"}</span>}
        {!task && !goal && !subject && <span className="badge badge-plain">{session.category}</span>}
      </div>

      <div className="lockin-ring">
        <div className="lockin-time">
          {mm}:{ss}
          <span className="lockin-time-sub">{fmtDuration(session.plannedMin)} planned</span>
        </div>
      </div>

      <div className="lockin-active-actions">
        <button className="btn btn-ghost" onClick={() => endLockIn(false)}>
          <Icon name="x" />
          Abandon
        </button>
        <button className="btn btn-primary" onClick={timer.toggle}>
          <Icon name={timer.running ? "pause" : "play"} />
          {timer.running ? "Pause" : "Resume"}
        </button>
        <button className="btn btn-ghost" onClick={() => endLockIn(true)}>
          <Icon name="check" />
          Complete
        </button>
      </div>
    </section>
  );
}

function History({ sessions }: { sessions: LockInSession[] }) {
  const { tasks, goals, subjects } = useOS();
  const totalMin = sessions.reduce((a, s) => a + s.focusedMin, 0);
  const done = sessions.filter((s) => s.status === "completed").length;

  return (
    <section className="study-block surface">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="clock" />
          History
        </div>
        {sessions.length > 0 && (
          <span className="badge badge-plain">
            {done} done · {fmtDuration(totalMin)}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="study-res-empty">No sessions yet. Your first focus block is waiting.</p>
      ) : (
        <div className="study-res-list">
          {sessions.slice(0, 10).map((s) => {
            const task = tasks.find((t) => t.id === s.taskId);
            const goal = goals.find((g) => g.id === s.goalId);
            const subject = subjects.find((x) => x.id === s.subjectId);
            return (
              <div key={s.id} className="lockin-row">
                <span
                  className={`lockin-status ${s.status}`}
                  aria-label={s.status}
                  title={s.status}
                >
                  <Icon name={s.status === "completed" ? "check" : "x"} size={11} />
                </span>
                <div className="lockin-row-main">
                  <div className="study-res-item-title">{s.title}</div>
                  <div className="study-res-item-sub">
                    {subject ? `${subject.name} · ` : ""}
                    {goal ? `${goal.title} · ` : ""}
                    {task ? `${task.title} · ` : ""}
                    {fmtRelative(s.endedAt ?? s.startedAt)}
                  </div>
                </div>
                <span className="lockin-row-min">
                  {fmtDuration(s.focusedMin)} / {fmtDuration(s.plannedMin)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}