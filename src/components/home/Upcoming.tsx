import { useOS } from "../../state/os";

export function Upcoming() {
  const { navigate, upcoming } = useOS();
  return (
    <section className="section">
      <div className="section-head">
        <h3 className="section-label">Upcoming</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("calendar")}>
          Calendar
        </button>
      </div>
      <div className="upcoming">
        {upcoming.length === 0 ? (
          <p className="up-empty">Nothing on the horizon yet. Enjoy the calm.</p>
        ) : (
          upcoming.map((u) => (
            <button key={u.id} className="up-item" onClick={() => navigate("calendar")}>
              <span className="up-label">{u.label}</span>
              <span className="up-date">{u.kind} · {u.date}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}