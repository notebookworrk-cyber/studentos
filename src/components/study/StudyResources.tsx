import { fmtRelative } from "../../lib/date";
import { studyVideos } from "../../data/mock";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function StudyResources() {
  const { currentSubject, notes, folders, openNoteEditor, navigate, newNoteIn } = useOS();
  const subject = currentSubject;

  if (!subject) return null;

  const subjectNotes = notes
    .filter((n) => n.folder.startsWith(subject.folder))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const subjectFolders = folders.filter((f) => f.startsWith(subject.folder));

  return (
    <div className="study-resources">
      <div className="study-res-grid">
        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="note" />
              Notes
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                newNoteIn(subject.folder, subject.name);
                navigate("notes");
              }}
            >
              <Icon name="plus" size={14} />
              Create Study Note
            </button>
          </div>
          {subjectNotes.length === 0 ? (
            <p className="study-res-empty">No notes here yet.</p>
          ) : (
            <div className="study-res-list">
              {subjectNotes.map((n) => (
                <button
                  key={n.id}
                  className="study-res-item"
                  onClick={() => {
                    openNoteEditor({ mode: "edit", id: n.id });
                    navigate("notes");
                  }}
                >
                  <span className="study-res-item-title">{n.title || "Untitled note"}</span>
                  <span className="study-res-item-sub">Edited {fmtRelative(n.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="files" />
              Files
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("files")}>
              Browse
            </button>
          </div>
          {subjectFolders.length === 0 ? (
            <p className="study-res-empty">Nothing filed under {subject.name} yet.</p>
          ) : (
            <div className="study-res-list">
              {subjectFolders.map((f) => (
                <div key={f} className="study-res-item">
                  <span className="study-res-item-title">{f.replace(subject.folder + "/", "")}</span>
                  <span className="study-res-item-sub">folder</span>
                </div>
              ))}
            </div>
          )}
          <p className="study-res-meta">
            {subjectNotes.length} note{subjectNotes.length === 1 ? "" : "s"} ·{" "}
            {subjectFolders.length} folder{subjectFolders.length === 1 ? "" : "s"}
          </p>
        </section>
      </div>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="video" />
            Recommended learning
          </div>
          <span className="badge badge-plain">YouTube</span>
        </div>
        <div className="study-videos">
          {studyVideos.map((v) => (
            <div key={v.id} className="study-video">
              <div className="study-video-thumb">
                <Icon name="play" size={16} />
              </div>
              <div className="study-video-main">
                <div className="study-video-title">{v.title}</div>
                <div className="study-video-meta">
                  {v.channel} · {v.duration}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => window.open(v.url, "_blank", "noopener")}>
                Open
                <Icon name="ext" size={13} />
              </button>
            </div>
          ))}
        </div>
        <p className="study-res-meta">Live YouTube search opens in your browser. In-app playback is a future milestone.</p>
      </section>

      <div className="study-res-grid">
        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="grad" />
              NotebookLM
            </div>
          </div>
          <p className="study-res-copy">Your source-grounded study workspace. Turn notes and files into answers, audio, and study guides.</p>
          <div className="practice-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => window.open("https://notebooklm.google.com", "_blank", "noopener")}>
              Open NotebookLM
              <Icon name="ext" size={13} />
            </button>
          </div>
        </section>

        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="ai" />
              Study with AI
            </div>
          </div>
          <p className="study-res-copy">Need help understanding something? Your tutor will read the current subject, topic, and notes.</p>
          <div className="study-ai-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("ai")}>Explain this topic</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("ai")}>Quiz me</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("ai")}>Find my weak areas</button>
          </div>
        </section>
      </div>
    </div>
  );
}
