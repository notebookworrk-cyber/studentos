import { Modal } from "../Modal";
import { Icon } from "../Icon";
import {
  useUpdate,
  downloadUpdate,
  quitAndInstall,
  setNotesOpen,
  formatSize,
} from "../../lib/update";

function Notes({ notes }: { notes: string | null }) {
  if (!notes) return <p className="update-notes-empty">No release notes published for this version.</p>;
  const lines = notes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <div className="update-notes">
      {lines.map((l, i) => {
        if (l.startsWith("- ") || l.startsWith("* ")) {
          return (
            <div key={i} className="update-note-bullet">
              <Icon name="check" size={12} />
              <span>{l.slice(2)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="update-note-head">
            {l.replace(/^#+\s*/, "")}
          </p>
        );
      })}
    </div>
  );
}

export function UpdateModal() {
  const { notesOpen, update, state } = useUpdate();
  if (!notesOpen || !update?.version) return null;

  const downloading = state === "downloading";
  const ready = state === "downloaded";

  return (
    <Modal title={`StudentOS ${update.version}`} onClose={() => setNotesOpen(false)}>
      <div className="update-modal-body">
        <div className="update-modal-sub">What's new</div>
        <Notes notes={update.notes} />
        {update.size > 0 && (
          <div className="update-size">
            <Icon name="download" size={14} />
            Download size: {formatSize(update.size)}
          </div>
        )}
      </div>
      <div className="update-modal-actions">
        {ready ? (
          <button className="btn btn-primary" onClick={quitAndInstall}>
            <Icon name="refresh" size={14} />
            Restart &amp; Install
          </button>
        ) : (
          <button className="btn btn-primary" onClick={downloadUpdate} disabled={downloading}>
            <Icon name="download" size={14} />
            {downloading ? "Downloading…" : "Download Update"}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setNotesOpen(false)}>
          Later
        </button>
      </div>
    </Modal>
  );
}