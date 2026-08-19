import { useState } from "react";
import { fmtDuration } from "../../lib/format";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function TodayPlan() {  const { plan, togglePlan, openComposer } = useOS();
  const [selected, setSelected] = useState<string | null>(null);
  const taskCount = plan.filter((t) => t.kind === "task").length;
  const doneCount = plan.filter((t) => t.kind === "task" && t.done).length;
  const nextId = plan.find((t) => !t.done && t.kind === "task")?.id;

  return (
    <section className="section plan">
      <div className="section-head">
        <h3 className="section-label">Today's Plan</h3>
        <span className="badge badge-plain">{doneCount}/{taskCount} done</span>
      </div>
      {taskCount === 0 ? (
        <div className="plan-empty">
          <p className="up-empty">No tasks today. Your schedule is clear.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => openComposer({ type: "task" })}>
            <Icon name="plus" size={14} />
            Add Task
          </button>
        </div>
      ) : (
      <div className="timeline">
        {plan.map((item) => {
          const isNext = item.id === nextId;
          const isSelected = item.id === selected;
          return (
            <div
              key={item.id}
              className={`tl-item ${item.done ? "done" : ""} ${isNext ? "next" : ""} ${isSelected ? "selected" : ""} ${item.kind === "event" ? "event" : ""}`}
              onClick={() => setSelected(item.id === selected ? null : item.id)}
            >
              <div className="tl-time">{item.time}</div>
              <div className="tl-rail">
                <span className={`tl-dot ${item.priority === "high" ? "high" : ""}`} />
              </div>
              <div className="tl-body">
                <div className="tl-title">
                  <span>{item.title}</span>
                  <span className="tl-duration">{fmtDuration(item.mins)}</span>
                </div>
                <div className="tl-cat">{item.category}</div>
              </div>
              {item.kind === "task" ? (
                <button
                  className={`tl-check ${item.done ? "on" : ""}`}
                  aria-label={item.done ? `undo ${item.title}` : `complete ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlan(item.id);
                  }}
                >
                  <Icon name={item.done ? "undo" : "check"} size={12} />
                </button>
              ) : (
                <span className="tl-event" aria-label="scheduled event" />
              )}
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}