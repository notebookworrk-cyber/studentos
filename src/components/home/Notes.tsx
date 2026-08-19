import { fmtRelative } from "../../lib/date";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function Notes() {
  const { notes, navigate, openNoteEditor } = useOS();
  const recent = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

  return (
    <section className="section">
      <div className="section-head">
        <h3 className="section-label">Recent Notes</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("notes")}>
          All notes
        </button>
      </div>
      <div className="notes">
        {recent.length === 0 ? (
          <p className="up-empty">No notes yet. Capture your first idea.</p>
        ) : (
          recent.map((n) => (
            <button
              key={n.id}
              className="note"
              onClick={() => {
                openNoteEditor({ mode: "edit", id: n.id });
                navigate("notes");
              }}
            >
              <span className="note-title">{n.title || "Untitled note"}</span>
              <span className="note-preview">
                {n.content ? n.content.slice(0, 60) : "Empty note."}
                {n.content.length > 60 ? "…" : ""}
              </span>
              <span className="note-edited">{fmtRelative(n.updatedAt)}</span>
              {n.pinned && <Icon name="pin" size={12} className="icon-pin" />}
            </button>
          ))
        )}
      </div>
    </section>
  );
}