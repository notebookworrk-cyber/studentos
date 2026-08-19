import { useState } from "react";
import { uid, useOS } from "../../state/os";
import { fmtRelative } from "../../lib/date";
import { Icon } from "../Icon";
import { Modal } from "../Modal";

const KIND = ["Paper", "Article", "Video", "Book", "Idea"] as const;
type SourceKind = (typeof KIND)[number];
type Source = {
  id: string;
  title: string;
  url: string;
  kind: SourceKind;
  status: "untouched" | "reading" | "annotated" | "done";
  tags: string[];
  note: string;
  createdAt: string;
};

const SOURCES_KEY = "studentos.research.v1";

function load(): Source[] {
  try {
    const raw = localStorage.getItem(SOURCES_KEY);
    return raw ? (JSON.parse(raw) as Source[]) : [];
  } catch {
    return [];
  }
}
function save(s: Source[]) {
  localStorage.setItem(SOURCES_KEY, JSON.stringify(s));
}

export function ResearchPage() {
  const { notes } = useOS();
  const [sources, setSources] = useState<Source[]>(load);
  const [showAdd, setShowAdd] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [kind, setKind] = useState<SourceKind>("Paper");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const active = sources.find((s) => s.id === activeId) ?? null;
  const ls = (fn: (s: Source[]) => Source[]) => {
    const next = fn(sources);
    setSources(next);
    save(next);
  };

  const addSource = () => {
    const t = title.trim();
    if (!t) return;
    const s: Source = {
      id: uid("src"),
      title: t,
      url: url.trim(),
      kind,
      status: "untouched",
      tags: [],
      note: "",
      createdAt: new Date().toISOString(),
    };
    ls((x) => [s, ...x]);
    setTitle("");
    setUrl("");
    setShowAdd(false);
    setActiveId(s.id);
  };

  const setStatus = (id: string, status: Source["status"]) =>
    ls((x) => x.map((s) => (s.id === id ? { ...s, status } : s)));

  const updateNote = (id: string, note: string) =>
    ls((x) => x.map((s) => (s.id === id ? { ...s, note, status: note.trim() ? "annotated" : s.status } : s)));

  return (
    <div className="page research-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Research</h1>
          <p className="page-subtitle">Collect sources, annotate, and link to your notes & projects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={15} />
          Add source
        </button>
      </header>

      <div className="research-layout">
        <aside className="study-rail research-rail">
          <div className="rail-label">Sources</div>
          {sources.length === 0 ? (
            <p className="study-res-empty">No sources yet.</p>
          ) : (
            sources.map((s) => (
              <button
                key={s.id}
                className={`study-subject ${activeId === s.id ? "active" : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                <span className={`dot ${s.status === "done" ? "dot-live" : ""}`} />
                <span className="study-subject-name">{s.title}</span>
              </button>
            ))
          )}
        </aside>

        <div className="research-main">
          {!active ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="research" size={24} /></div>
              <h3 className="empty-title">No source selected</h3>
              <p className="empty-line">Select a source, or add one to start annotating.</p>
            </div>
          ) : (
            <SourceDetail
              source={active}
              notes={notes}
              setStatus={(st) => setStatus(active.id, st)}
              updateNote={(n) => updateNote(active.id, n)}
              onDelete={() => {
                ls((x) => x.filter((c) => c.id !== active.id));
                setActiveId(null);
              }}
            />
          )}
        </div>
      </div>

      {showAdd && (
        <Modal
          title="Add source"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <span className="modal-spacer" />
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addSource} disabled={!title.trim()}>
                Add source
              </button>
            </>
          }
        >
          <label className="field full">
            <span className="field-label">Title</span>
            <input
              className="input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSource()}
              placeholder="Title of the paper, article, or idea"
            />
          </label>
          <label className="field full">
            <span className="field-label">Kind</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as SourceKind)}>
              {KIND.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="field full">
            <span className="field-label">URL (optional)</span>
            <input
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <p className="research-hint">
            StudentOS stores your notes, never auto-scrapes. Add the link to visit it yourself.
          </p>
        </Modal>
      )}
    </div>
  );
}

function SourceDetail({
  source: s,
  notes,
  setStatus,
  updateNote,
  onDelete,
}: {
  source: Source;
  notes: { id: string; title: string }[];
  setStatus: (status: Source["status"]) => void;
  updateNote: (note: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(s.note);
  return (
    <>
      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="research" />
            {s.kind}
          </div>
          <div className="panel-actions">
            <button className="btn btn-ghost btn-sm" onClick={onDelete}>
              <Icon name="trash" size={13} />
              Delete
            </button>
          </div>
        </div>
        <h2 className="research-title">{s.title}</h2>
        <div className="research-meta">
          {s.url && (
            <a className="research-link" href={s.url} target="_blank" rel="noreferrer">
              <Icon name="ext" size={13} />
              {s.url}
            </a>
          )}
          <span className="badge badge-plain">added {fmtRelative(s.createdAt)}</span>
        </div>

        <div className="seg research-seg">
          {(["untouched", "reading", "annotated", "done"] as const).map((st) => (
            <button
              key={st}
              className={`seg-item ${s.status === st ? "active" : ""}`}
              onClick={() => setStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="note" />
            Annotation
          </div>
        </div>
        <textarea
          className="input textarea research-annotate"
          rows={7}
          value={draft}
          placeholder="Your takeaways, questions, and connections…"
          onChange={(e) => {
            setDraft(e.target.value);
            updateNote(e.target.value);
          }}
        />
        <p className="research-related-label">Related notes</p>
        {notes.filter((n) => n.title.toLowerCase().includes(s.title.toLowerCase().slice(0, 12))).length === 0 ? (
          <p className="study-res-empty">No related notes found.</p>
        ) : (
          notes
            .filter((n) => n.title.toLowerCase().includes(s.title.toLowerCase().slice(0, 12)))
            .map((n) => <div key={n.id} className="study-res-item"><span className="study-res-item-title">{n.title}</span></div>)
        )}
      </section>
    </>
  );
}