import { useMemo, useState } from "react";
import { fmtRelative } from "../../lib/date";
import { setIntent } from "../../lib/aiIntent";
import { useOS } from "../../state/os";
import { toast } from "../../state/toasts";
import type { Note } from "../../types";
import { NOTE_CATEGORIES } from "../../types";
import { ContextMenu, useContextMenu, type MenuItem } from "../ContextMenu";
import { Icon } from "../Icon";
import { NoteEditor } from "./NoteEditor";

type View = "all" | "pinned" | "favorites";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pinned", label: "Pinned" },
  { id: "favorites", label: "Favorites" },
];

function folderRoot(folder: string): string | null {
  const idx = folder.indexOf("/");
  return idx === -1 ? folder : folder.slice(0, idx);
}

export function NotesPage() {
  const { notes, noteEditor, newNote, openNoteEditor } = useOS();
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");
  const [root, setRoot] = useState("all");
  const [cat, setCat] = useState("all");
  const [sortBy, setSortBy] = useState("edited");
  const { menu, open, close } = useContextMenu();

  const roots = useMemo(
    () =>
      [...new Set(notes.map((n) => folderRoot(n.folder)).filter((r): r is string => Boolean(r)))].sort(),
    [notes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = notes.filter((n) => {
      if (view === "pinned" && !n.pinned) return false;
      if (view === "favorites" && !n.favorite) return false;
      if (root !== "all" && folderRoot(n.folder) !== root) return false;
      if (cat !== "all" && n.category !== cat) return false;
      if (q) {
        const hay = `${n.title} ${n.content} ${n.tags.join(" ")} ${n.category} ${n.folder}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return base.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "created") return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, view, query, root, cat, sortBy]);

  const rootCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes) {
      const r = folderRoot(n.folder);
      if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    return counts;
  }, [notes]);

  return (
    <div className="page notes-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">Your ideas, knowledge and working memory.</p>
        </div>
        <button className="btn btn-primary" onClick={newNote}>
          <Icon name="plus" />
          New Note
        </button>
      </header>

      <div className={`notes-panes ${noteEditor ? "has-editor" : ""}`}>
        <aside className="notes-rail" aria-label="Folders">
          <div className="notes-rail-label">Folders</div>
          <button
            className={`notes-rail-item ${root === "all" ? "active" : ""}`}
            onClick={() => setRoot("all")}
          >
            <Icon name="notes" size={14} />
            All notes
            <span className="notes-rail-count">{notes.length}</span>
          </button>
          {roots.map((r) => (
            <button
              key={r}
              className={`notes-rail-item ${root === r ? "active" : ""}`}
              onClick={() => setRoot(r)}
            >
              <Icon name="folder" size={14} />
              {r}
              <span className="notes-rail-count">{rootCount.get(r) ?? 0}</span>
            </button>
          ))}
        </aside>

        <div className="notes-list-col">
          <div className="notes-toolbar">
            <div className="seg">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  className={`seg-item ${view === v.id ? "active" : ""}`}
                  onClick={() => setView(v.id)}
                  aria-pressed={view === v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="toolbar-controls">
              <label className="search">
                <Icon name="search" size={15} />
                <input
                  className="input search-input"
                  placeholder="Search notes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <select className="input toolbar-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
                <option value="all">All categories</option>
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className="input toolbar-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort notes">
                <option value="edited">Sort by edited</option>
                <option value="created">Sort by created</option>
                <option value="title">Sort by title</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="note" size={22} />
              </div>
              <h3 className="empty-title">No notes found</h3>
              <p className="empty-line">
                {query || root !== "all" || cat !== "all" ? "Try a different search or filter." : "Capture your first idea and it will live here."}
              </p>
              <button className="btn btn-primary" onClick={newNote}>
                <Icon name="plus" />
                New Note
              </button>
            </div>
          ) : (
            <div className="note-list">
              {filtered.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  active={noteEditor?.mode === "edit" && noteEditor.id === n.id}
                  onOpen={() => openNoteEditor({ mode: "edit", id: n.id })}
                  onMenu={(e, items) => open(e, items)}
                />
              ))}
            </div>
          )}
        </div>

        {noteEditor && (
          <div className="notes-editor-col">
            <NoteEditor />
          </div>
        )}
      </div>

      <ContextMenu menu={menu} onClose={close} />
    </div>
  );
}

function NoteCard({ note, active, onOpen, onMenu }: { note: Note; active?: boolean; onOpen: () => void; onMenu: (e: React.MouseEvent, items: MenuItem[]) => void }) {
  const { updateNote, deleteNote, navigate } = useOS();
  const menuItems: MenuItem[] = [
    { label: "Open", icon: "file", onClick: onOpen },
    { label: note.pinned ? "Unpin" : "Pin", icon: "pin", onClick: () => updateNote(note.id, { pinned: !note.pinned }) },
    { label: note.favorite ? "Remove favorite" : "Favorite", icon: "star", onClick: () => updateNote(note.id, { favorite: !note.favorite }) },
    { label: "Summarize", icon: "doc", onClick: () => { setIntent({ action: "summarize", scope: { mode: "note", noteId: note.id } }); navigate("ai"); } },
    { label: "Quiz me", icon: "target", onClick: () => { setIntent({ action: "quiz", scope: { mode: "note", noteId: note.id } }); navigate("ai"); } },
    { label: "Ask AI", icon: "ai", onClick: () => navigate("ai") },
    { separator: true },
    { label: "Delete", icon: "trash", danger: true, onClick: () => { deleteNote(note.id); toast(`Note deleted · ${note.title || "Untitled"}`); } },
  ];
  return (
    <button
      className={`note-row ${note.pinned ? "pinned" : ""} ${active ? "active" : ""}`}
      onClick={onOpen}
      onContextMenu={(e) => onMenu(e, menuItems)}
    >
      <div className="note-row-main">
        <span className="note-row-title">{note.title || "Untitled note"}</span>
        <span className="note-row-preview">
          {note.content
            ? note.content.slice(0, 90) + (note.content.length > 90 ? "…" : "")
            : "Empty note. Click to start writing."}
        </span>
      </div>
      <div className="note-row-meta">
        <span className="badge badge-tint">{note.category}</span>
        {note.tags.length > 0 && <span className="note-row-tags">{note.tags.slice(0, 2).join(" · ")}</span>}
        <span className="note-row-edited">{fmtRelative(note.updatedAt)}</span>
        {(note.pinned || note.favorite) && (
          <span className="note-row-flags">
            {note.pinned && <Icon name="pin" size={13} className="icon-pin" />}
            {note.favorite && <Icon name="star" size={13} className="icon-star" />}
          </span>
        )}
      </div>
    </button>
  );
}