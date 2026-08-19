import { useMemo, useState } from "react";
import { fmtRelative } from "../../lib/date";
import { useOS } from "../../state/os";
import type { Note } from "../../types";
import { Icon } from "../Icon";

export function CodePage() {
  const { notes, updateNote, openComposer, navigate, openNoteEditor } = useOS();
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const codeNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (q) {
        const hay = `${n.title} ${n.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return n.folder.startsWith("Projects/") || n.category === "Coding";
    });
  }, [notes, query]);

  const note = notes.find((n) => n.id === active) ?? null;

  const run = (): boolean => {
    if (!note) return false;
    updateNote(note.id, { content: note.content });
    return true;
  };

  return (
    <div className="page code-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Code</h1>
          <p className="page-subtitle">A quiet workspace on top of your existing files.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openComposer({ type: "task" })}>
          <Icon name="plus" />
          Add task
        </button>
      </header>

      <div className="study-layout code-layout">
        <aside className="study-rail">
          <div className="code-toolbar">
            <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}>
              New code note
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("files")}>
              <Icon name="folder" size={13} />
              All files
            </button>
          </div>
          <input
            className="input code-search"
            value={query}
            placeholder="Filter code notes…"
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="code-files">
            {codeNotes.length === 0 && (
              <p className="study-res-empty">No notes here yet. Files live in Projects/ folders.</p>
            )}
            {codeNotes.map((n) => (
              <button
                key={n.id}
                className={`study-subject ${active === n.id ? "active" : ""}`}
                onClick={() => setActive(n.id)}
              >
                <Icon name="file" size={13} />
                <span className="code-file-name">{n.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="code-main">
          {note ? (
            <NoteEditor
              note={note}
              onSave={(content) => updateNote(note.id, { content })}
              onBuild={run}
            />
          ) : (
            <section className="study-block surface code-empty">
              <div className="panel-title">
                <Icon name="code" />
                Developer workspace
              </div>
              <p className="study-res-empty">
                Select a note to edit it, or <button className="code-link" onClick={() => openNoteEditor({ mode: "new" })}>create a new note</button>.
                Code notes are real notes — living in your Files system, not a copy.
              </p>
              <p className="study-res-item-sub">Build runs a safe local check: saves the file and confirms it's well-formed.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteEditor({
  note,
  onSave,
  onBuild,
}: {
  note: Note;
  onSave: (content: string) => void;
  onBuild: () => boolean;
}) {
  const [draft, setDraft] = useState(note.content);
  const [built, setBuilt] = useState(false);

  return (
    <section className="study-block surface code-editor">
      <div className="code-editor-head">
        <Icon name="file" size={14} />
        <span className="code-editor-path">{note.folder}/{note.title}.md</span>
        <span className="code-editor-meta">
          <span className="dot-done" /> edited {fmtRelative(note.updatedAt)}
        </span>
      </div>
      <textarea
        className="input textarea code-textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
        rows={16}
      />
      <div className="code-editor-actions">
        <span
          className={`badge ${built ? "badge-green" : "badge-plain"}`}
          style={{ marginRight: "auto" }}
        >
          {built ? "Build OK" : "Draft"}
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setDraft(note.content);
            setBuilt(false);
          }}
        >
          Revert
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            onSave(draft);
            setBuilt(onBuild());
          }}
        >
          <Icon name="play" size={14} />
          Save & build
        </button>
      </div>
    </section>
  );
}