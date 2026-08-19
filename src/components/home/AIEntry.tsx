import { useOS } from "../../state/os";
import { Icon } from "../Icon";

const starters = ["Plan my day", "Explain a topic", "Review my tasks", "Help with a project"];

export function AIEntry() {
  const { navigate } = useOS();
  return (
    <section className="section ai">
      <div className="ai-row">
        <div className="ai-orb">
          <Icon name="spark" />
        </div>
        <div className="ai-text">
          <div className="ai-title">StudentOS AI</div>
          <div className="ai-sub">What should we work on next?</div>
        </div>
      </div>
      <div className="ai-actions">
        {starters.map((s) => (
          <button key={s} className="btn btn-ghost btn-sm" onClick={() => {
            try { localStorage.setItem("studentos.ai.intent.v1", JSON.stringify({ prompt: s })); } catch {}
            navigate("ai");
          }}>
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
