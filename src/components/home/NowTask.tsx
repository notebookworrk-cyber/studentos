import { useOS } from "../../state/os";
import { fmtDuration } from "../../lib/format";

export function NowTask() {
  const { plan, nowTask } = useOS();
  if (!nowTask) return null;

  const taskItems = plan.filter((p) => p.kind === "task");
  const doneCount = taskItems.filter((t) => t.done).length;
  const nextTask = taskItems.find((t) => !t.done && t.id !== nowTask.id);

  return (
    <section className="now glass">
      <div className="now-label">
        <span className="dot dot-live" />
        NOW
      </div>
      <div className="now-body">
        <div className="now-main">
          <h2 className="now-title">{nowTask.title}</h2>
          <div className="now-meta">
            <span className="now-cat">{nowTask.category}</span>
            <span className="now-dur">{fmtDuration(nowTask.mins)} planned</span>
          </div>
        </div>
        <div className="now-progress">
          <div className="now-track" aria-hidden>
            <div className="now-track-fill" style={{ transform: `scaleX(${taskItems.length ? doneCount / taskItems.length : 0})` }} />
          </div>
          <span className="now-count">{doneCount} of {taskItems.length} done</span>
        </div>
      </div>
      {nextTask && (
        <div className="next-task">
          <span className="next-label">NEXT</span>
          <span className="next-title">{nextTask.title}</span>
          <span className="next-meta">{fmtDuration(nextTask.mins)} · {nextTask.category}</span>
        </div>
      )}
    </section>
  );
}