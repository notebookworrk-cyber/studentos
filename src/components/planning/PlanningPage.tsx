import { useState } from "react";
import { fmtDuration } from "../../lib/format";
import { addDaysISO, fmtFullDate, fmtMonthDay, fmtWeekday } from "../../lib/date";
import {
  AVAILABLE_DAY_MIN,
  buildInsights,
  dayCompletedMin,
  dayPlannedMin,
  findConflicts,
  weekCompletedMin,
  weekDays,
  weekPlannedMin,
} from "../../lib/planning";
import { useOS } from "../../state/os";
import type { Goal, PlanItem } from "../../types";
import { Icon } from "../Icon";

type Tab = "overview" | "planner" | "week" | "review";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "planner", label: "Day Planner" },
  { id: "week", label: "This Week" },
  { id: "review", label: "Plan Review" },
];

export function PlanningPage() {
  const { goals, openGoalEditor, openComposer, navigate, timer, tasks, events, today } = useOS();
  const [tab, setTab] = useState<Tab>("overview");

  const plannedToday = dayPlannedMin(tasks, events, today);
  const weekPlanned = weekPlannedMin(tasks, events, today);
  const active = goals.filter((g) => g.active);

  return (
    <div className="page planning-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Planning</h1>
          <p className="page-subtitle">Turn your goals into a day you can actually execute.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            timer.toggle();
            navigate("lockin");
          }}
        >
          <Icon name="lock" />
          Start Lock-In
        </button>
      </header>

      <div className="plan-context">
        <ContextStat label="Today planned" value={fmtDuration(plannedToday)} icon="clock" />
        <ContextStat label="This week" value={fmtDuration(weekPlanned)} icon="calendar" />
        <ContextStat label="Active goals" value={`${active.length}`} icon="flag" />
      </div>

      <div className="seg plan-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`seg-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Overview
          onAddGoal={() => openGoalEditor({ mode: "new" })}
          onAddTask={() => openComposer({ type: "task" })}
          onReviewDay={() => setTab("review")}
          onPlanner={() => setTab("planner")}
        />
      )}
      {tab === "planner" && <DayPlanner />}
      {tab === "week" && <WeekView />}
      {tab === "review" && <PlanReview />}
    </div>
  );
}

function ContextStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="plan-context-stat">
      <Icon name={icon} size={15} />
      <div>
        <div className="plan-context-value">{value}</div>
        <div className="plan-context-label">{label}</div>
      </div>
    </div>
  );
}

function Overview({
  onAddGoal,
  onAddTask,
  onReviewDay,
  onPlanner,
}: {
  onAddGoal: () => void;
  onAddTask: () => void;
  onReviewDay: () => void;
  onPlanner: () => void;
}) {
  const { goals, tasks, events, today, goalProgress } = useOS();
  const plannedToday = dayPlannedMin(tasks, events, today);
  const completed = dayCompletedMin(tasks, today);
  const remaining = AVAILABLE_DAY_MIN - plannedToday;
  const insights = buildInsights(tasks, events, goals, today);
  const active = goals.filter((g) => g.active);

  return (
    <div className="plan-overview">
      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="chart" />
            Time budget
          </div>
          <span className="badge badge-tint">{fmtDuration(AVAILABLE_DAY_MIN)}</span>
        </div>
        <BudgetRow label="Planned" value={plannedToday} cap={AVAILABLE_DAY_MIN} />
        <div className="plan-budget-grid">
          <Stat num={fmtDuration(plannedToday)} label="Planned today" />
          <Stat num={fmtDuration(completed)} label="Done" />
          <Stat
            num={fmtDuration(Math.max(remaining, 0))}
            label={remaining < 0 ? "Over budget" : "Free this evening"}
            danger={remaining < 0}
          />
        </div>
      </section>

      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="spark" />
            Insights
          </div>
        </div>
        {insights.length === 0 ? (
          <p className="study-res-empty">All clear. Nothing needs your attention.</p>
        ) : (
          <div className="plan-insights">
            {insights.map((i) => (
              <div key={i.id} className={`plan-insight ${i.level}`}>
                <span className={`dot ${i.level === "warn" ? "plan-dot-warn" : "plan-dot-ok"}`} />
                <div>
                  <div className="plan-insight-title">{i.title}</div>
                  <div className="plan-insight-line">{i.line}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="plus" />
            Daily actions
          </div>
        </div>
        <div className="plan-actions">
          <button className="btn btn-ghost" onClick={onAddGoal}>
            <Icon name="flag" />
            Add Goal
          </button>
          <button className="btn btn-ghost" onClick={onAddTask}>
            <Icon name="plus" />
            Add Task
          </button>
          <button className="btn btn-ghost" onClick={onPlanner}>
            <Icon name="calendar" />
            Schedule
          </button>
          <button className="btn btn-ghost" onClick={onReviewDay}>
            <Icon name="check" />
            Review Day
          </button>
          <ClearCompletedBtn />
        </div>
      </section>

      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="target" />
            Goals
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onAddGoal}>
            <Icon name="plus" />
            New Goal
          </button>
        </div>
        {active.length === 0 ? (
          <p className="study-res-empty">No active goals. Start with one.</p>
        ) : (
          <div className="plan-goals">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} progress={goalProgress(g.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BudgetRow({ label, value, cap }: { label: string; value: number; cap: number }) {
  const pct = Math.min(100, Math.round((value / cap) * 100));
  const over = value > cap;
  return (
    <div className="plan-budget-row">
      <div className="plan-budget-line">
        <span>{label}</span>
        <span className={over ? "plan-danger" : ""}>
          {fmtDuration(value)} of {fmtDuration(cap)}
        </span>
      </div>
      <div className="progress plan-budget-bar">
        <div
          className="progress-track"
          style={{ transform: `scaleX(${pct / 100})`, background: over ? "var(--danger)" : "var(--accent)" }}
        />
      </div>
    </div>
  );
}

function Stat({ num, label, danger }: { num: string; label: string; danger?: boolean }) {
  return (
    <div className="study-stat">
      <div className={`study-stat-num ${danger ? "plan-danger" : ""}`}>{num}</div>
      <div className="study-stat-label">{label}</div>
    </div>
  );
}

function ClearCompletedBtn() {
  const { tasks, today, updateTask } = useOS();
  return (
    <button
      className="btn btn-ghost"
      onClick={() =>
        tasks
          .filter((t) => t.date === today && t.status === "completed")
          .forEach((t) => updateTask(t.id, { status: "completed" }))
      }
    >
      <Icon name="trash" />
      Clear Completed
    </button>
  );
}

function GoalCard({ goal, progress }: { goal: Goal; progress: number }) {
  const { tasks, openGoalEditor, openComposer, togglePlan } = useOS();
  const linked = tasks.filter((t) => t.goalId === goal.id);

  return (
    <div className="plan-goal">
      <div className="plan-goal-head">
        <span className={`badge ${goalTint(goal.priority)}`}>{goal.priority}</span>
        <span className="plan-goal-title">{goal.title}</span>
        <span className="plan-goal-meta">
          {goal.category}
          {goal.deadline ? ` · due ${fmtMonthDay(goal.deadline)}` : ""}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => openGoalEditor({ mode: "edit", id: goal.id })}>
          <Icon name="edit" size={13} />
        </button>
      </div>
      <div className="plan-goal-body">
        <div className="plan-goal-pct">{progress}%</div>
        <div className="progress plan-goal-bar">
          <div className="progress-track" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
      {linked.length > 0 && (
        <div className="plan-goal-tasks">
          {linked.map((t) => (
            <div key={t.id} className="plan-goal-task">
              <button
                className={`task-check ${t.status === "completed" ? "on" : ""}`}
                aria-label={`Toggle ${t.title}`}
                onClick={() => togglePlan(t.id)}
              >
                <Icon name={t.status === "completed" ? "check" : "dot"} size={12} />
              </button>
              <span className={`plan-goal-task-title ${t.status === "completed" ? "done" : ""}`}>{t.title}</span>
              <span className="plan-goal-task-meta">
                {t.startTime ? t.startTime : "unscheduled"} · {fmtDuration(t.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
      <button
        className="btn btn-ghost btn-sm plan-goal-link"
        onClick={() => openComposer({ type: "task", goalId: goal.id })}
      >
        <Icon name="plus" size={13} />
        Link task
      </button>
    </div>
  );
}

function goalTint(p: string): string {
  if (p === "critical") return "badge-amber";
  if (p === "important") return "badge-tint";
  return "badge-plain";
}

function DayPlanner() {
  const { plan, today, openComposer } = useOS();
  const planRefs = plan.map((p) => p.ref);
  const conflicts = findConflicts(
    plan.map((p) => ({ startTime: p.time === "—" ? null : p.time, duration: p.mins })),
  );
  const conflictRefs = new Set(
    conflicts.flatMap((c) => [planRefs[c.a], planRefs[c.b]]).filter(Boolean) as string[],
  );

  return (
    <div className="plan-planner">
      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="clock" />
            {fmtFullDate(today)}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => openComposer({ type: "task" })}>
            <Icon name="plus" />
            Schedule task
          </button>
        </div>
        {plan.length === 0 ? (
          <p className="study-res-empty">Nothing planned today. A clear day.</p>
        ) : (
          <div className="plan-timeline">
            {plan.map((p) => (
              <PlannerRow key={p.id} item={p} conflict={conflictRefs.has(p.ref)} />
            ))}
          </div>
        )}
      </section>

      {conflicts.length > 0 && (
        <section className="study-block surface plan-block">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="flag" />
              Overlap detected
            </div>
          </div>
          <div className="plan-insights">
            {conflicts.map((c, idx) => {
              const a = plan[c.a];
              const b = plan[c.b];
              if (!a || !b) return null;
              return (
                <div key={idx} className="plan-insight warn">
                  <span className="dot plan-dot-warn" />
                  <div>
                    <div className="plan-insight-title">{a.title} and {b.title}</div>
                    <div className="plan-insight-line">
                      {a.time} and {b.time} overlap by {c.overlapMin} min.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="arrow" />
            Unfinished work
          </div>
        </div>
        <UnscheduledList />
      </section>
    </div>
  );
}

function PlannerRow({ item, conflict }: { item: PlanItem; conflict: boolean }) {
  const { updateTask, today, togglePlan, navigate } = useOS();

  return (
    <div className={`plan-row ${item.done ? "done" : ""} ${conflict ? "conflict" : ""}`}>
      <span className="plan-row-time">{item.time}</span>
      <button
        className={`task-check ${item.done ? "on" : ""}`}
        aria-label={`Toggle ${item.title}`}
        onClick={() => item.kind === "task" && togglePlan(item.id)}
      >
        <Icon name={item.done ? "check" : "dot"} size={12} />
      </button>
      <span className="plan-row-title">{item.title}</span>
      <span className="plan-row-meta">
        {item.category} · {fmtDuration(item.mins)}
      </span>
      {item.kind === "task" && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => updateTask(item.id, { date: addDaysISO(today, 1) })}
        >
          <Icon name="arrow" size={13} />
          Tomorrow
        </button>
      )}
      {item.kind === "task" && item.category === "Study" && (
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("study")}>
          <Icon name="book" size={13} />
          Study
        </button>
      )}
    </div>
  );
}

function UnscheduledList() {
  const { tasks, openComposer } = useOS();
  const unscheduled = tasks.filter((t) => !t.startTime && t.status !== "completed");
  if (unscheduled.length === 0) {
    return <p className="study-res-empty">Everything has a time. Good.</p>;
  }
  return (
    <div className="plan-timeline">
      {unscheduled.slice(0, 5).map((t) => (
        <div key={t.id} className="plan-row">
          <span className="plan-row-time">—</span>
          <span className="plan-row-title">{t.title}</span>
          <span className="plan-row-meta">{t.category}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => openComposer({ type: "task", task: t })}>
            <Icon name="edit" size={13} />
            Schedule
          </button>
        </div>
      ))}
    </div>
  );
}

function WeekView() {
  const { tasks, events, today, goals } = useOS();
  const days = weekDays(today);

  return (
    <div className="plan-week">
      {days.map((d) => {
        const planned = dayPlannedMin(tasks, events, d);
        const done = dayCompletedMin(tasks, d);
        const items = [
          ...events
            .filter((e) => e.date === d)
            .map((e) => ({ id: e.id, title: e.title, time: e.startTime, kind: "event" as const })),
          ...tasks
            .filter((t) => t.date === d && t.status !== "completed")
            .map((t) => ({ id: t.id, title: t.title, time: t.startTime, kind: "task" as const })),
        ].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
        const isToday = d === today;
        const near = goals.find((g) => g.deadline === d);
        return (
          <div key={d} className={`plan-day ${isToday ? "today" : ""}`}>
            <div className="plan-day-head">
              <span className="plan-day-name">{fmtWeekday(d)}</span>
              <span className="plan-day-date">{fmtMonthDay(d)}</span>
            </div>
            <div className="plan-day-line">
              {fmtDuration(planned)} planned
              {done > 0 && <span className="plan-day-done"> · {fmtDuration(done)} done</span>}
            </div>
            {near && (
              <div className="plan-day-deadline">
                <Icon name="flag" size={12} />
                {near.title}
              </div>
            )}
            <div className="plan-day-items">
              {items.length === 0 ? (
                <span className="plan-day-empty">—</span>
              ) : (
                items.slice(0, 4).map((it) => (
                  <div key={it.id} className={`plan-day-item ${it.kind}`}>
                    <span className="plan-day-item-time">{it.time ?? "—"}</span>
                    <span className="plan-day-item-title">{it.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlanReview() {
  const { tasks, events, today } = useOS();
  const tPlanned = dayPlannedMin(tasks, events, today);
  const tDone = dayCompletedMin(tasks, today);
  const tRemaining = Math.max(0, tPlanned - tDone);
  const wPlanned = weekPlannedMin(tasks, events, today);
  const wDone = weekCompletedMin(tasks, today);
  const wRemaining = Math.max(0, wPlanned - wDone);

  return (
    <div className="plan-review">
      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="clock" />
            Today
          </div>
          <span className="badge badge-tint">{fmtDuration(tRemaining)} left</span>
        </div>
        <div className="plan-budget-grid">
          <Stat num={fmtDuration(tPlanned)} label="Planned" />
          <Stat num={fmtDuration(tDone)} label="Completed" />
          <Stat num={fmtDuration(tRemaining)} label="Remaining" />
        </div>
        <BudgetRow label="Completion" value={tDone} cap={Math.max(tPlanned, 1)} />
      </section>

      <section className="study-block surface plan-block">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="calendar" />
            This week
          </div>
          <span className="badge badge-tint">{fmtDuration(wRemaining)} left</span>
        </div>
        <div className="plan-budget-grid">
          <Stat num={fmtDuration(wPlanned)} label="Planned" />
          <Stat num={fmtDuration(wDone)} label="Completed" />
          <Stat num={fmtDuration(wRemaining)} label="Remaining" />
        </div>
        <BudgetRow label="Completion" value={wDone} cap={Math.max(wPlanned, 1)} />
      </section>
    </div>
  );
}
