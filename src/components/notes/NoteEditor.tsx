import { useEffect, useState } from "react";
import { fmtRelative } from "../../lib/date";
import { runStudyAction } from "../../lib/studyai";
import { useOS } from "../../state/os";
import { NOTE_CATEGORIES } from "../../types";
import { Icon } from "../Icon";

type SaveState = "idle" | "saving" | "saved";
type AILabel = "improve" | "expand" | "suggest";

export function NoteEditor() {
  const { notes, subjects, folders, tasks, noteEditor, updateNote, deleteNote, closeNoteEditor } = useOS();
  const noteId = noteEditor?.mode === "edit" ? noteEditor.id : null;
  const note = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [taskId, setTaskId] = useState("");
  const [save, setSave] = useState<SaveState>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiBusy, setAiBusy] = useState<AILabel | null>(null);
  const [aiMenu, setAiMenu] = useState(false);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setFolder(note.folder);
    setCategory(note.category);
    setTags(note.tags.join(", "));
    setTaskId(note.taskId ?? "");
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!note) return;
    if (!title.trim() && !content.trim() && !tags.trim()) return;
    setSave("saving");
    const id = setTimeout(() => {
      updateNote(note.id, {
        title: title.trim(),
        content: content.trim(),
        folder,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        taskId: taskId || null,
      });
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
    }, 500);
    return () => clearTimeout(id);
  }, [title, content, folder, category, tags, taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNoteEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeNoteEditor]);

  if (!note) return null;

  const confirm = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
      return;
    }
    deleteNote(note.id);
    closeNoteEditor();
  };

  const runAi = (kind: AILabel) => {
    if (aiBusy) return;
    setAiMenu(false);
    setAiBusy(kind);
    const res = runStudyAction(kind, { notes, subjects, scope: { mode: "note", noteId: note.id } });
    const text = "data" in res ? (res.data as { text: string }).text : "";
    updateNote(note.id, { content: text });
    setContent(text);
    setTimeout(() => setAiBusy(null), 600);
  };

  return (
    <div className="editor">
      <div className="editor-top">
        <button className="btn btn-ghost btn-sm" onClick={closeNoteEditor}>
          <Icon name="back" size={15} />
          Notes
        </button>

        <div className="editor-ai-group">
          <button
            className={`btn btn-ghost btn-sm ${aiMenu || aiBusy ? "active" : ""}`}
            onClick={() => setAiMenu((m) => !m)}
            disabled={!!aiBusy}
          >
            <Icon name="spark" size={15} />
            {aiBusy ? "Working…" : "AI"}
            <Icon name="arrow" size={12} className={`editor-ai-caret ${aiMenu ? "open" : ""}`} />
          </button>
          {aiMenu && !aiBusy && (
            <div className="editor-ai-menu">
              <button className="editor-ai-item" onClick={() => runAi("improve")}>
                <Icon name="check" size={14} />
                <span>
                  <strong>Improve</strong>
                  <em>Restructure into clean headers, key points, action items.</em>
                </span>
              </button>
              <button className="editor-ai-item" onClick={() => runAi("expand")}>
                <Icon name="arrow" size={14} />
                <span>
                  <strong>Expand</strong>
                  <em>Add open questions and gaps to explore further.</em>
                </span>
              </button>
              <button className="editor-ai-item" onClick={() => runAi("suggest")}>
                <Icon name="tag" size={14} />
                <span>
                  <strong>Suggest</strong>
                  <em>Tags, linked subject, and a study-ready summary.</em>
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="editor-spacer" />
        {save === "saving" ? (
          <span className="editor-save">Editing…</span>
        ) : save === "saved" ? (
          <span className="editor-save">Saved just now</span>
        ) : (
          <span className="editor-save muted">
            Edited {fmtRelative(note.updatedAt)}
          </span>
        )}
        <button
          className={`btn btn-ghost btn-icon ${note.pinned ? "active" : ""}`}
          aria-label={note.pinned ? "Unpin note" : "Pin note"}
          onClick={() => updateNote(note.id, { pinned: !note.pinned })}
        >
          <Icon name="pin" size={16} />
        </button>
        <button
          className={`btn btn-ghost btn-icon ${note.favorite ? "active warn" : ""}`}
          aria-label={note.favorite ? "Unfavorite note" : "Favorite note"}
          onClick={() => updateNote(note.id, { favorite: !note.favorite })}
        >
          <Icon name="star" size={16} />
        </button>
        <button className={`btn btn-ghost btn-sm danger ${confirmDelete ? "confirming" : ""}`} onClick={confirm}>
          <Icon name="trash" size={15} />
          {confirmDelete ? "Delete note?" : "Delete"}
        </button>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <input
            className="editor-title"
            placeholder="Untitled note"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Note title"
          />
          <textarea
            className="editor-content"
            placeholder="Start writing…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label="Note content"
          />
        </div>

        <div className="editor-meta">
          <label className="field">
            <span className="field-label">Folder</span>
            <select className="input" value={folder} onChange={(e) => setFolder(e.target.value)}>
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {NOTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Tags</span>
            <input
              className="input"
              placeholder="mitosis, revision"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Linked task</span>
            <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <div className="editor-meta-foot">
            <span>Created {fmtRelative(note.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
