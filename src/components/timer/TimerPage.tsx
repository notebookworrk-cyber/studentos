import { useState } from "react";
import { SESSIONS_PER_SET, useOS } from "../../state/os";
import { fmtDuration } from "../../lib/format";
import { Icon } from "../Icon";

const PRESETS = [15, 25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

export function TimerPage() {
  const { timer, focusedSec } = useOS();
  const { seconds, running, session, set, focusLen, phase, breakType, breakLen, setBreakLen, toggle, reset, target } =
    timer;
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(focusLen / 60);
  const [breakDraft, setBreakDraft] = useState(breakLen);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = ((target - seconds) / target) * 100;

  const status = !running
    ? seconds === target
      ? phase === "break"
        ? "Break ready"
        : "Ready to focus"
      : "Paused"
    : phase === "break"
      ? breakType === "long"
        ? "Long break · done with the set"
        : `Short break · ${breakLen} min`
      : `Focusing · Session ${session} of ${set}`;

  const applyDraft = () => {
    reset();
    setEdit(false);
  };

  return (
    <div className="page timer-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Focus Timer</h1>
          <p className="page-subtitle">
            {fmtDuration(focusedSec)} focused today · set {session}/{SESSIONS_PER_SET}
          </p>
        </div>
        {!running && (
          <button className="btn btn-ghost" onClick={() => setEdit(!edit)}>
            <Icon name="settings" size={15} />
            {edit ? "Done" : "Length"}
          </button>
        )}
      </header>

      {edit && (
        <section className="study-block surface timer-edit">
          <div className="panel-title">
            <Icon name="clock" />
            Session length
          </div>
          <div className="lockin-presets" style={{ marginTop: 12 }}>
            {PRESETS.map((m) => (
              <button key={m} className={`btn btn-sm ${draft === m ? "btn-primary" : ""}`} onClick={() => setDraft(m)}>
                {fmtDuration(m)}
              </button>
            ))}
          </div>
          <div className="panel-title" style={{ marginTop: 18 }}>
            <Icon name="clock" />
            Break length
          </div>
          <div className="lockin-presets" style={{ marginTop: 12 }}>
            {BREAK_PRESETS.map((m) => (
              <button
                key={m}
                className={`btn btn-sm ${breakDraft === m ? "btn-primary" : ""}`}
                onClick={() => setBreakDraft(m)}
              >
                {fmtDuration(m)}
              </button>
            ))}
          </div>
          <div className="timer-edit-actions">
            <button className="btn btn-primary" onClick={applyDraft} disabled={draft <= 0}>
              Use {fmtDuration(draft)}
            </button>
            <button className="btn btn-ghost" onClick={() => { setBreakLen(breakDraft); setEdit(false); }}>
              Set break
            </button>
          </div>
        </section>
      )}

      <section className={`surface timer-stage ${phase}`}>
        <div
          className={`timer-ring ${running ? "running" : ""}`}
          style={{ "--pct": `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties}
        >
          <button className="timer-time" onClick={toggle} aria-label={running ? "Pause" : "Start"}>
            {mm}:{ss}
            <span className="timer-time-sub">{status}</span>
          </button>
        </div>

        <div className="timer-sets">
          {Array.from({ length: SESSIONS_PER_SET }, (_, i) => (
            <span key={i} className={`timer-set-dot ${i + 1 < session ? "done" : i + 1 === session ? "current" : ""}`} />
          ))}
          <span className="timer-sets-label">
            Set {session} of {SESSIONS_PER_SET}
          </span>
        </div>

        <div className="timer-actions">
          <button className="btn btn-ghost" onClick={reset} disabled={seconds === focusLen && !running}>
            <Icon name="undo" />
            Reset
          </button>
          <button className={`btn ${running ? "btn-ghost" : "btn-primary"}`} onClick={toggle}>
            <Icon name={running ? "pause" : "play"} />
            {running ? "Pause" : seconds === target ? "Start" : "Resume"}
          </button>
        </div>
      </section>
    </div>
  );
}
