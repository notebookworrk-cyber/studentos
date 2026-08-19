import { useOS } from "../../state/os";

const statusLabel: Record<string, string> = { active: "Active", planning: "Planning", paused: "Paused", completed: "Completed", archived: "Archived" };

export function Projects() {
  const { projects, navigate } = useOS();
  const active = projects.filter((p) => p.status === "active").slice(0, 3);

  return (
    <section className="section">
      <div className="section-head">
        <h3 className="section-label">Projects</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("projects")}>
          View all
        </button>
      </div>
      <div className="projects">
        {active.length === 0 ? (
          <p className="up-empty">No active projects yet.</p>
        ) : active.map((p) => (
          <button key={p.id} className="project" onClick={() => navigate("projects")}>
            <div className="project-top">
              <span className="project-name">
                {p.status === "active" && <span className="dot dot-live" />}
                {p.name}
              </span>
              <span className="project-pct">{p.progress}%</span>
            </div>
            <div className="progress">
              <div
                className={`progress-track ${p.status === "active" ? "progress-mine" : ""}`}
                style={{ transform: `scaleX(${p.progress / 100})` }}
              />
            </div>
            <div className="project-meta">
              {statusLabel[p.status] ?? p.status} · Last activity: {p.lastActivity}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
