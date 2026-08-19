import { useState } from "react";
import { fmtDuration } from "../../lib/format";
import { fmtRelative } from "../../lib/date";
import { FOCUS_LEN, useOS } from "../../state/os";
import type { StudySession, StudySubject, StudyTopic } from "../../types";
import { Icon } from "../Icon";
import { StudyIntelligenceTab } from "./StudyIntelligenceTab";
import { StudyPractice } from "./StudyPractice";
import { StudyResources } from "./StudyResources";

type Tab = "overview" | "topics" | "resources" | "practice" | "progress" | "intelligence";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "topics", label: "Topics" },
  { id: "resources", label: "Resources" },
  { id: "practice", label: "Practice" },
  { id: "progress", label: "Progress" },
  { id: "intelligence", label: "Intelligence" },
];

const pct = (s: StudySubject) =>
  s.topics.length ? Math.round((s.topics.filter((t) => t.done).length / s.topics.length) * 100) : 0;

export function StudyPage() {
  const {
    subjects,
    studySubjectId,
    selectSubject,
    studyFocus,
    currentSubject,
    timer,
    startStudyFocus,
    finishStudySession,
  } = useOS();
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<StudySession | null>(null);

  const subject = currentSubject;
  const focusTopic = subject?.topics.find((t) => t.id === studyFocus?.topicId);
  const defaultTopic = subject?.topics.find((t) => !t.done) ?? subject?.topics[0];

  const headerFocus = () => {
    if (!subject) return;
    const topic = focusTopic ?? defaultTopic;
    if (topic) startStudyFocus(subject.id, topic.id);
  };

  const endSession = () => {
    if (!subject) return;
    const topic = focusTopic ?? defaultTopic;
    if (!topic) return;
    setSummary(finishStudySession(subject.id, topic.id));
  };

  return (
    <div className="page study-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Study Mode</h1>
          <p className="page-subtitle">Focus on one thing. Learn it properly.</p>
        </div>
        <button className="btn btn-primary" onClick={headerFocus}>
          <Icon name="play" />
          {timer.running ? "Resume" : "Start Focus"}
        </button>
      </header>

      <div className="study-layout">
        <aside className="study-rail">
          <div className="section-label study-rail-label">Subjects</div>
          {subjects.map((s) => {
            const p = pct(s);
            return (
              <button
                key={s.id}
                className={`study-subject ${s.id === studySubjectId ? "active" : ""}`}
                onClick={() => {
                  selectSubject(s.id);
                  setTab("overview");
                }}
              >
                <div className="study-subject-top">
                  <span className="study-subject-name">{s.name}</span>
                  <span className="study-subject-pct">{p}%</span>
                </div>
                <div className="study-subject-topic">
                  {(s.topics.find((t) => !t.done) ?? s.topics[0])?.title}
                </div>
                <div className="progress study-subject-bar">
                  <div className="progress-track" style={{ transform: `scaleX(${p / 100})`, background: s.color }} />
                </div>
              </button>
            );
          })}
        </aside>

        <main className="study-main">
          {summary ? (
            <SummaryCard session={summary} onDismiss={() => setSummary(null)} />
          ) : (
            <>
              <div className="study-tabs seg">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`seg-item ${tab === t.id ? "active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "overview" && (
                <Overview
                  subject={subject}
                  focusTopic={focusTopic}
                  defaultTopic={defaultTopic}
                  onStart={headerFocus}
                  onEnd={endSession}
                  onReview={() => setTab("practice")}
                />
              )}
              {tab === "topics" && (
                <Topics subject={subject} focusTopic={focusTopic} onOverview={() => setTab("overview")} />
              )}
              {tab === "resources" && <StudyResources />}
              {tab === "practice" && <StudyPractice />}
              {tab === "progress" && subject && <Progress subject={subject} />}
              {tab === "intelligence" && <StudyIntelligenceTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Overview({
  subject,
  focusTopic,
  defaultTopic,
  onStart,
  onEnd,
  onReview,
}: {
  subject?: StudySubject;
  focusTopic?: StudyTopic;
  defaultTopic?: StudyTopic;
  onStart: () => void;
  onEnd: () => void;
  onReview: () => void;
}) {
  const { timer, studyFocus, sessions, notes, openNoteEditor, newNoteIn, subjects } = useOS();

  if (!subject) {
    return <div className="study-block surface">Pick a subject to begin.</div>;
  }

  const topic = focusTopic ?? defaultTopic;
  const progress = pct(subject);
  const subjectNotes = notes
    .filter((n) => n.folder.startsWith(subject.folder))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const openNote = (id?: string) => {
    if (id) {
      openNoteEditor({ mode: "edit", id });
      return;
    }
    newNoteIn(subject.folder, subject.name);
  };

  return (
    <div className="study-overview">
      <section className="study-session glass" style={{ "--subj": subject.color } as React.CSSProperties}>
        <div className="study-session-badge">
          <span className="dot" style={{ background: subject.color }} />
          {subject.name}
        </div>
        <div className="study-session-title">{topic?.title ?? "Pick a topic"}</div>
        <div className="study-session-obj">{subject.objective}</div>
        <div className="study-progress-line">
          <span>Chapter progress</span>
          <span className="study-progress-pct">{progress}%</span>
        </div>
        <div className="progress study-session-progress">
          <div className="progress-track" style={{ transform: `scaleX(${progress / 100})`, background: subject.color }} />
        </div>
        <div className="study-session-actions">
          <button className="btn btn-primary" onClick={onStart}>
            <Icon name="play" />
            Start Focus
          </button>
          <button className="btn btn-ghost" onClick={() => openNote(subjectNotes[0]?.id)}>
            <Icon name="note" />
            Open Notes
          </button>
          <button className="btn btn-ghost" onClick={onReview}>
            <Icon name="target" />
            Review
          </button>
          {studyFocus?.subjectId === subject.id && (
            <button className="btn btn-ghost" onClick={onEnd}>
              <Icon name="check" />
              Finish Session
            </button>
          )}
        </div>
        {studyFocus?.subjectId === subject.id && (
          <div className="study-focusing">
            <span className={`dot ${timer.running ? "dot-live" : ""}`} />
            Focused on {subject.name} → {topic?.title ?? ""} · {fmtDuration(FOCUS_LEN - timer.seconds)} elapsed
          </div>
        )}
      </section>

      <StudyPlan
        onStart={() => {
          if (topic) onStart();
        }}
      />

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="clock" />
            Recent sessions
          </div>
        </div>
        {sessions.length === 0 ? (
          <p className="study-res-empty">No study sessions yet. Start one above.</p>
        ) : (
          <div className="study-res-list">
            {sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="study-res-item">
                <span className="study-res-item-title">
                  {s.topicTitle}
                  <span className="study-res-item-sub"> · {subjects.find((x) => x.id === s.subjectId)?.name ?? s.subjectId}</span>
                </span>
                <span className="study-res-item-sub">
                  {fmtDuration(s.focusedMinutes)} · {fmtRelative(s.endedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StudyPlan({ onStart }: { onStart: () => void }) {
  const { plan } = useOS();
  const items = plan.filter((p) => p.kind === "task" && p.category === "Study" && !p.done);
  if (items.length === 0) return null;
  return (
    <section className="study-block surface">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="tasks" />
          Today&apos;s study plan
        </div>
      </div>
      <div className="study-res-list">
        {items.map((it) => (
          <div key={it.id} className="study-plan-row">
            <div className="study-res-item-title">
              {it.title}
              <span className="study-res-item-sub"> · {fmtDuration(it.mins)}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onStart}>
              Start
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Topics({
  subject,
  focusTopic,
  onOverview,
}: {
  subject?: StudySubject;
  focusTopic?: StudyTopic;
  onOverview: () => void;
}) {
  const { toggleTopic, startStudyFocus, timer, studyFocus, setStudyFocus } = useOS();
  if (!subject) return null;
  return (
    <section className="study-block surface">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="layers" />
          Topics · {subject.name}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onOverview}>
          <Icon name="back" size={14} />
          Back to overview
        </button>
      </div>
      <div className="study-topics">
        {subject.topics.map((t) => (
          <div
            key={t.id}
            className={`study-topic ${focusTopic?.id === t.id ? "current" : ""}`}
            onClick={() => setStudyFocus({ subjectId: subject.id, topicId: t.id })}
          >
            <button
              className={`topic-check ${t.done ? "on" : ""}`}
              aria-label={`Mark ${t.title} ${t.done ? "incomplete" : "complete"}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleTopic(subject.id, t.id);
              }}
            >
              <Icon name={t.done ? "check" : "dot"} size={12} />
            </button>
            <div className="study-topic-main">
              <div className="study-topic-title">{t.title}</div>
              <div className="study-topic-sub">
                {t.done ? "Completed" : focusTopic?.id === t.id ? "Current topic" : "Not started"}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (studyFocus?.topicId === t.id) timer.toggle();
                else startStudyFocus(subject.id, t.id);
              }}
            >
              <Icon name="play" size={13} />
              Focus
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Progress({ subject }: { subject: StudySubject }) {
  const { sessions } = useOS();
  const done = subject.topics.filter((t) => t.done).length;
  const totalFocused = sessions.reduce((a, s) => a + s.focusedMinutes, 0);
  const totalTasks = sessions.reduce((a, s) => a + s.tasksCompleted, 0);

  return (
    <div className="study-progress-view">
      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="chart" />
            Subject progress
          </div>
          <span className="badge badge-tint">{pct(subject)}%</span>
        </div>
        <div className="progress study-session-progress">
          <div className="progress-track" style={{ transform: `scaleX(${pct(subject) / 100})`, background: subject.color }} />
        </div>
        <div className="study-progress-grid">
          <Stat num={`${done}/${subject.topics.length}`} label="Topics done" />
          <Stat num={`${sessions.length}`} label="Sessions" />
          <Stat num={fmtDuration(totalFocused)} label="Focused" />
          <Stat num={`${totalTasks}`} label="Tasks done" />
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="clock" />
            Recent activity
          </div>
        </div>
        {sessions.length === 0 ? (
          <p className="study-res-empty">No activity yet.</p>
        ) : (
          <div className="study-res-list">
            {sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="study-res-item">
                <span className="study-res-item-title">
                  {s.topicTitle}
                  {s.progressDelta > 0 && (
                    <span className="badge badge-green study-delta">+{s.progressDelta}%</span>
                  )}
                </span>
                <span className="study-res-item-sub">
                  {fmtDuration(s.focusedMinutes)} focused · {fmtRelative(s.endedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="study-stat">
      <div className="study-stat-num">{num}</div>
      <div className="study-stat-label">{label}</div>
    </div>
  );
}

function SummaryCard({ session, onDismiss }: { session: StudySession; onDismiss: () => void }) {
  const { navigate, openNoteEditor, notes, startStudyFocus, currentSubject } = useOS();
  return (
    <section className="study-session glass study-summary">
      <div className="study-session-badge">
        <span className="dot dot-live" />
        Session complete
      </div>
      <div className="study-session-title">{session.topicTitle}</div>
      <div className="study-session-obj">{session.subjectId}</div>
      <div className="study-progress-grid study-summary-grid">
        <Stat num={fmtDuration(session.focusedMinutes)} label="Focused" />
        <Stat num={`${session.tasksCompleted}`} label="Tasks done" />
        <Stat num={`${session.notesCreated}`} label="Notes" />
        <Stat num={`+${session.progressDelta}%`} label="Progress" />
      </div>
      <div className="study-session-actions">
        <button className="btn btn-ghost" onClick={onDismiss}>
          Continue Later
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (currentSubject) startStudyFocus(currentSubject.id, session.topicId);
            onDismiss();
          }}
        >
          <Icon name="play" />
          Start Another Session
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const related = notes.find((n) => n.pinned) ?? notes[0];
            if (related) {
              openNoteEditor({ mode: "edit", id: related.id });
              navigate("notes");
            }
          }}
        >
          <Icon name="note" />
          Review Notes
        </button>
      </div>
    </section>
  );
}