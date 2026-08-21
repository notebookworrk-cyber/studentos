import { useEffect } from "react";
import { Icon } from "../Icon";
import { isDesktop } from "../browser/BrowserPage";
import {
  ensureUpdate,
  useUpdate,
  downloadUpdate,
  quitAndInstall,
  setNotesOpen,
  setDismissed,
  formatSize,
} from "../../lib/update";

export function UpdateBanner() {
  const { enabled, state, update, progress, dismissed, notesOpen } = useUpdate();

  useEffect(() => {
    if (isDesktop) ensureUpdate();
  }, []);

  if (!isDesktop || !enabled) return null;
  if (dismissed) return null;
  if (state !== "available" && state !== "downloading" && state !== "downloaded") return null;
  if (!update?.version) return null;

  const ready = state === "downloaded";

  return (
    <div className={`update-banner ${ready ? "ready" : ""}`}>
      <div className="update-banner-body">
        <div className="update-banner-title">
          {ready ? (
            <>
              <Icon name="check" size={14} />
              StudentOS {update.version} is ready.
            </>
          ) : state === "downloading" ? (
            <>
              <Icon name="download" size={14} />
              Downloading StudentOS {update.version}
            </>
          ) : (
            <>
              <Icon name="spark" size={14} />
              StudentOS {update.version} is available
            </>
          )}
        </div>
        <div className="update-banner-sub">
          {state === "downloading" && progress ? (
            <>
              {progress.percent}% · {formatSize(progress.transferred)} / {formatSize(progress.total)}
            </>
          ) : !ready && update.size > 0 ? (
            `${formatSize(update.size)} update`
          ) : (
            "Restart StudentOS to finish installing."
          )}
        </div>
      </div>
      <div className="update-banner-actions">
        {ready ? (
          <button className="btn btn-primary btn-sm" onClick={quitAndInstall}>
            Restart &amp; Install
          </button>
        ) : state === "downloading" ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setDismissed()}>
            Hide
          </button>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" onClick={downloadUpdate}>
              Download
            </button>
            {!notesOpen && (
              <button className="btn btn-ghost btn-sm" onClick={() => setNotesOpen(true)}>
                View Update
              </button>
            )}
          </>
        )}
        {state !== "downloading" && (
          <button className="btn btn-ghost btn-sm" onClick={() => setDismissed()}>
            Later
          </button>
        )}
      </div>
    </div>
  );
}