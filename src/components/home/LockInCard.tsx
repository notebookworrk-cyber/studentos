import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function LockInCard() {
  const { navigate, nowTask, lockinActive, startLockIn, endLockIn } = useOS();

  if (lockinActive) {
    const remainingMin = Math.ceil(lockinActive.plannedMin - lockinActive.focusedMin);
    return (
      <section className="lockin-card active">
        <div className="panel-title lockin-title">
          <Icon name="lock" />
          LOCKED IN
        </div>
        <h3 className="lockin-goal">{lockinActive.title}</h3>
        <div className="lockin-line">{remainingMin} min remaining</div>
        <div className="lockin-actions">
          <button className="btn btn-primary" onClick={() => navigate("lockin")}>
            <Icon name="focus" size={16} />
            Continue
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => endLockIn(false)}>
            <Icon name="x" size={14} />
            End
          </button>
        </div>
      </section>
    );
  }

  const title = nowTask?.title ?? "Start a focus session";
  const mins = nowTask?.mins;
  const line = mins ? `${mins} minutes planned · Focus session ready` : "Pick a task and lock in";

  const handleStart = () => {
    if (nowTask) {
      startLockIn({ title: nowTask.title, plannedMin: nowTask.mins, taskId: nowTask.id });
    }
    navigate("lockin");
  };

  return (
    <section className="lockin-card">
      <div className="panel-title lockin-title">
        <Icon name="lock" />
        Lock-In
      </div>
      <h3 className="lockin-goal">{title}</h3>
      <div className="lockin-line">{line}</div>
      <button className="btn btn-primary lockin-start" onClick={handleStart}>
        <Icon name="focus" size={16} />
        Start Lock-In
      </button>
    </section>
  );
}