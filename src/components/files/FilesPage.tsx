import { useMemo, useState } from "react";
import { fmtRelative } from "../../lib/date";
import { useOS } from "../../state/os";
import { toast } from "../../state/toasts";
import type { Note } from "../../types";
import { ContextMenu, useContextMenu, type MenuItem } from "../ContextMenu";
import { Icon } from "../Icon";
import { Modal } from "../Modal";

type View = "folders" | "recent" | "favorites";
type Layout = "grid" | "list";

const VIEWS: { id: View; label: string }[] = [
  { id: "folders", label: "Folders" },
  { id: "recent", label: "Recent" },
  { id: "favorites", label: "Favorites" },
];

function splitPath(p: string): string[] {
  return p.split("/").filter(Boolean);
}

function childSegments(folders: string[], prefix: string[]): string[] {
  const kids = new Set<string>();
  for (const f of folders) {
    const segs = splitPath(f);
    if (segs.length <= prefix.length) continue;
    const matches = prefix.every((s, i) => segs[i] === s);
    if (matches) kids.add(segs[prefix.length]);
  }
  return [...kids].sort();
}

function folderMenu(onOpen: () => void, onDelete: () => void): MenuItem[] {
  return [
    { label: "Open", icon: "folder", onClick: onOpen },
    { separator: true },
    { label: "Delete", icon: "trash", danger: true, onClick: onDelete },
  ];
}

export function FilesPage() {
  const { notes, folders, openNoteEditor, addFolder, deleteFolder } = useOS();
  const [view, setView] = useState<View>("folders");
  const [layout, setLayout] = useState<Layout>("grid");
  const [query, setQuery] = useState("");
  const [path, setPath] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const { menu, open, close } = useContextMenu();

  const q = query.trim().toLowerCase();

  const currentPath = path.join("/");
  const subFolders = useMemo(
    () => childSegments(folders, q ? [] : path),
    [folders, path, q],
  );

  const notesHere = useMemo(
    () => (!q ? notes.filter((n) => n.folder === currentPath) : []),
    [notes, currentPath, q],
  );

  const searchHits = useMemo(() => {
    if (!q) return [];
    return notes.filter((n) => {
      const hay = `${n.title} ${n.content} ${n.tags.join(" ")} ${n.category} ${n.folder}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, q]);

  const recent = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10),
    [notes],
  );

  const favorites = useMemo(
    () =>
      [...notes]
        .filter((n) => n.favorite || n.pinned)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [notes],
  );

  const folderHits = useMemo(() => {
    if (!q) return [];
    const all = new Set<string>();
    for (const f of folders) {
      const segs = splitPath(f);
      for (let i = 1; i <= segs.length; i++) {
        const p = segs.slice(0, i).join("/");
        if (p.toLowerCase().includes(q)) all.add(p);
      }
    }
    return [...all].sort();
  }, [folders, q]);

  const shown: Note[] =
    q ? searchHits : view === "recent" ? recent : view === "favorites" ? favorites : notesHere;

  const createFolder = () => {
    const name = folderName.trim();
    if (!name) return;
    addFolder(currentPath ? `${currentPath}/${name}` : name);
    setFolderName("");
    setModal(false);
  };

  return (
    <div className="page files-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Files</h1>
          <p className="page-subtitle">Your documents, exactly where you need them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Icon name="folder" />
          New Folder
        </button>
      </header>

      <div className="files-toolbar">
        <div className="seg">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`seg-item ${view === v.id && !q ? "active" : ""}`}
              onClick={() => {
                setView(v.id);
                setQuery("");
              }}
              aria-pressed={view === v.id && !q}
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
              placeholder="Search files and folders…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="seg layout-seg" role="tablist" aria-label="Layout">
            <button className={`seg-item ${layout === "grid" ? "active" : ""}`} role="tab" aria-selected={layout === "grid"} aria-label="Grid view" onClick={() => setLayout("grid")}>
              <Icon name="grid" size={14} />
            </button>
            <button className={`seg-item ${layout === "list" ? "active" : ""}`} role="tab" aria-selected={layout === "list"} aria-label="List view" onClick={() => setLayout("list")}>
              <Icon name="list" size={14} />
            </button>
          </div>
        </div>
      </div>

      {!q && view === "folders" && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button className="crumb" onClick={() => setPath([])}>
            StudentOS
          </button>
          {path.map((seg, i) => (
            <span key={i} className="crumb-sep">
              <Icon name="chevR" size={13} />
              <button
                className="crumb"
                onClick={() => setPath(path.slice(0, i + 1))}
              >
                {seg}
              </button>
            </span>
          ))}
        </nav>
      )}

      {q ? (
        q && folderHits.length === 0 && shown.length === 0 ? (
          <EmptyFiles />
        ) : (
          <>
            {folderHits.length > 0 && (
              <div className="files-list">
                {folderHits.map((f) => (
                  <button
                    key={f}
                    className="file-row folder"
                    onClick={() => {
                      setPath(splitPath(f));
                      setQuery("");
                      setView("folders");
                    }}
                    onContextMenu={(e) => open(e, folderMenu(() => setPath(splitPath(f)), () => { deleteFolder(f); toast(`Folder deleted · ${f}`); }))}
                  >
                    <Icon name="folder" className="file-ic folder" />
                    <span className="file-name">{f}</span>
                    <span className="file-kind">folder</span>
                  </button>
                ))}
              </div>
            )}
            {shown.length > 0 && (
              layout === "grid" ? (
                <div className="note-grid files-grid">
                  {shown.map((n) => (
                    <NoteCard key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
                  ))}
                </div>
              ) : (
                <div className="files-list">
                  {shown.map((n) => (
                    <FileRow key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
                  ))}
                </div>
              )
            )}
          </>
        )
      ) : view === "folders" ? (
        <>
          {subFolders.length === 0 && notesHere.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="folder" size={22} />
              </div>
              <h3 className="empty-title">This folder is empty</h3>
              <p className="empty-line">Create a folder or add a note to place it here.</p>
              <button className="btn btn-primary" onClick={() => setModal(true)}>
                <Icon name="folder" />
                New Folder
              </button>
            </div>
          ) : (
            <div className="files-browse">
              {subFolders.length > 0 &&
                (layout === "grid" ? (
                  <div className="folder-grid">
                    {subFolders.map((s) => {
                      const full = currentPath ? `${currentPath}/${s}` : s;
                      return (
                        <button key={s} className="folder-card" onClick={() => setPath([...path, s])} onContextMenu={(e) => open(e, folderMenu(() => setPath([...path, s]), () => { deleteFolder(full); toast(`Folder deleted · ${s}`); }))}>
                          <Icon name="folder" size={22} className="folder-ic" />
                          <span className="folder-name">{s}</span>
                          <span className="folder-count">
                            {folders.filter((f) => splitPath(f).join("/").startsWith(full)).length} items
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="files-list">
                    {subFolders.map((s) => {
                      const full = currentPath ? `${currentPath}/${s}` : s;
                      return (
                        <button key={s} className="file-row folder" onClick={() => setPath([...path, s])} onContextMenu={(e) => open(e, folderMenu(() => setPath([...path, s]), () => { deleteFolder(full); toast(`Folder deleted · ${s}`); }))}>
                          <Icon name="folder" className="file-ic folder" />
                          <span className="file-name">{s}</span>
                          <span className="file-kind">folder</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              {notesHere.length > 0 &&
                (layout === "grid" ? (
                  <div className="note-grid files-grid">
                    {notesHere.map((n) => (
                      <NoteCard key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
                    ))}
                  </div>
                ) : (
                  <div className="files-list">
                    {notesHere.map((n) => (
                      <FileRow key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
                    ))}
                  </div>
                ))}
            </div>
          )}
        </>
      ) : shown.length === 0 ? (
        <EmptyFiles
          label={view === "recent" ? "Nothing opened yet" : "No favorites yet"}
          line={view === "recent" ? "Recently edited notes will appear here." : "Star a note and it will show up here."}
        />
      ) : layout === "grid" ? (
        <div className="note-grid files-grid">
          {shown.map((n) => (
            <NoteCard key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
          ))}
        </div>
      ) : (
        <div className="files-list">
          {shown.map((n) => (
            <FileRow key={n.id} note={n} onOpen={() => openNoteEditor({ mode: "edit", id: n.id })} onMenu={(e, items) => open(e, items)} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Folder" onClose={() => setModal(false)}>
          <div className="form-grid">
            <label className="field full">
              <span className="field-label">In</span>
              <div className="input field-folder">{currentPath || "StudentOS (root)"}</div>
            </label>
            <label className="field full">
              <span className="field-label">Folder name</span>
              <input
                className="input"
                placeholder="e.g. Biology"
                value={folderName}
                autoFocus
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createFolder()}
              />
            </label>
          </div>
          <div className="modal-foot">
            <span className="modal-spacer" />
            <button className="btn btn-ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={createFolder} disabled={!folderName.trim()}>
              Create Folder
            </button>
          </div>
        </Modal>
      )}

      <ContextMenu menu={menu} onClose={close} />
    </div>
  );
}

function FileRow({ note, onOpen, onMenu }: { note: Note; onOpen: () => void; onMenu: (e: React.MouseEvent, items: MenuItem[]) => void }) {
  const { updateNote, deleteNote } = useOS();
  const items: MenuItem[] = [
    { label: "Open", icon: "file", onClick: onOpen },
    { label: note.pinned ? "Unpin" : "Pin", icon: "pin", onClick: () => updateNote(note.id, { pinned: !note.pinned }) },
    { label: note.favorite ? "Remove favorite" : "Favorite", icon: "star", onClick: () => updateNote(note.id, { favorite: !note.favorite }) },
    { separator: true },
    { label: "Delete", icon: "trash", danger: true, onClick: () => { deleteNote(note.id); toast(`Note deleted · ${note.title || "Untitled"}`); } },
  ];
  return (
    <button className="file-row" onClick={onOpen} onContextMenu={(e) => onMenu(e, items)}>
      <Icon name="file" className="file-ic" />
      <div className="file-main">
        <span className="file-name">{note.title || "Untitled note"}</span>
        <span className="file-sub">
          {note.folder || "No folder"} · edited {fmtRelative(note.updatedAt)}
        </span>
      </div>
      {note.pinned && <Icon name="pin" size={13} className="icon-pin" />}
      {note.favorite && <Icon name="star" size={13} className="icon-star" />}
      <span className="file-kind">note</span>
    </button>
  );
}

function NoteCard({ note, onOpen, onMenu }: { note: Note; onOpen: () => void; onMenu: (e: React.MouseEvent, items: MenuItem[]) => void }) {
  const { updateNote, deleteNote } = useOS();
  const items: MenuItem[] = [
    { label: "Open", icon: "file", onClick: onOpen },
    { label: note.pinned ? "Unpin" : "Pin", icon: "pin", onClick: () => updateNote(note.id, { pinned: !note.pinned }) },
    { label: note.favorite ? "Remove favorite" : "Favorite", icon: "star", onClick: () => updateNote(note.id, { favorite: !note.favorite }) },
    { separator: true },
    { label: "Delete", icon: "trash", danger: true, onClick: () => { deleteNote(note.id); toast(`Note deleted · ${note.title || "Untitled"}`); } },
  ];
  return (
    <button className={`note-card ${note.pinned ? "pinned" : ""}`} onClick={onOpen} onContextMenu={(e) => onMenu(e, items)}>
      <div className="note-card-top">
        <span className="badge badge-tint">{note.category}</span>
        <span className="note-card-flags">
          {note.pinned && <Icon name="pin" size={13} className="icon-pin" />}
          {note.favorite && <Icon name="star" size={13} className="icon-star" />}
        </span>
      </div>
      <h4 className="note-card-title">{note.title || "Untitled note"}</h4>
      <p className="note-card-preview">{note.content.slice(0, 110)}</p>
      <div className="note-card-foot">
        <span>{note.folder || "No folder"} · edited {fmtRelative(note.updatedAt)}</span>
      </div>
    </button>
  );
}

function EmptyFiles({ label = "Nothing found", line = "Try a different search or browse a folder." }: { label?: string; line?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="file" size={22} />
      </div>
      <h3 className="empty-title">{label}</h3>
      <p className="empty-line">{line}</p>
    </div>
  );
}