import { useEffect, useMemo, useState } from "react";
import { getIntent, setIntent } from "../../lib/aiIntent";
import { runStudyAction } from "../../lib/studyai";
import type { StudyAICtx, StudyAIKind, StudyAIScope, SummaryLength, SummaryResult } from "../../lib/studyai";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";
import { StudyAsk } from "./StudyAsk";
import { StudyFlashcards } from "./StudyFlashcards";
import { StudyQuiz } from "./StudyQuiz";

const ACTIONS: { id: StudyAIKind; label: string; icon: string }[] = [
  { id: "summarize", label: "Summarize", icon: "doc" },
  { id: "quiz", label: "Quiz", icon: "target" },
  { id: "flashcards", label: "Flashcards", icon: "focus" },
  { id: "ask", label: "Ask", icon: "spark" },
];

export function StudyAISection() {
  const { notes, subjects, navigate, addReviewCards, addSavedQuiz } = useOS();

  const [scope, setScope] = useState<StudyAIScope>({ mode: "all" });
  const [action, setAction] = useState<StudyAIKind>("summarize");
  const [length, setLength] = useState<SummaryLength>("short");
  const [result, setResult] = useState<ReturnType<typeof runStudyAction> | null>(null);

  useEffect(() => {
    const intent = getIntent();
    if (intent) {
      setScope(intent.scope);
      setAction(intent.action);
      if (intent.action === "summarize") setLength("short");
      setIntent(null);
      runIntent(intent.action, intent.scope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx: StudyAICtx = useMemo(() => ({ notes, subjects, scope, length }), [notes, subjects, scope, length]);

  const runIntent = (kind: StudyAIKind, s: StudyAIScope) => {
    setResult(runStudyAction(kind, { ...ctx, scope: s, length: kind === "summarize" ? length : undefined }, {}));
  };

  const run = (kind: StudyAIKind) => {
    setAction(kind);
    setResult(runStudyAction(kind, { ...ctx, scope, length: kind === "summarize" ? length : undefined }, {}));
  };

  const folders = useMemo(() => [...new Set(notes.map((n) => n.folder).filter(Boolean))], [notes]);

  return (
    <section className="study-block surface sai-section">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="spark" />
          Study AI
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("notes")}>
          <Icon name="doc" size={13} />
          Notes
        </button>
      </div>

      <div className="sai-controls">
        <div className="sai-row">
          <span className="field-label">Scope</span>
          <select
            className="input sai-select"
            value={scope.mode === "note" ? `note:${scope.noteId}` : scope.mode === "folder" ? `folder:${scope.folder}` : scope.mode === "subject" ? `subject:${scope.subjectId}` : "all"}
            onChange={(e) => {
              const [mode, id] = e.target.value.split(":");
              if (mode === "note") setScope({ mode: "note", noteId: id });
              else if (mode === "folder") setScope({ mode: "folder", folder: id });
              else if (mode === "subject") setScope({ mode: "subject", subjectId: id });
              else setScope({ mode: "all" });
            }}
          >
            <option value="all">All notes</option>
            {notes.map((n) => (
              <option key={n.id} value={`note:${n.id}`}>Note · {n.title}</option>
            ))}
            {folders.map((f) => (
              <option key={f} value={`folder:${f}`}>Folder · {f}</option>
            ))}
            {subjects.map((s) => (
              <option key={s.id} value={`subject:${s.id}`}>Subject · {s.name}</option>
            ))}
          </select>
        </div>

        <div className="sai-row">
          <span className="field-label">Action</span>
          <div className="seg">
            {ACTIONS.map((a) => (
              <button key={a.id} className={`seg-item ${action === a.id ? "active" : ""}`} onClick={() => run(a.id)}>
                <Icon name={a.icon} size={13} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {action === "summarize" && (
          <div className="sai-row">
            <span className="field-label">Length</span>
            <div className="seg">
              {(["tldr", "short", "detailed"] as SummaryLength[]).map((l) => (
                <button key={l} className={`seg-item ${length === l ? "active" : ""}`} onClick={() => { setLength(l); setResult(runStudyAction("summarize", { ...ctx, scope, length: l }, {})); }}>
                  {l === "tldr" ? "TL;DR" : l === "short" ? "Short" : "Detailed"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sai-result">
        {!result && (
          <p className="study-res-empty">Pick an action to generate study material from your notes. Works fully offline.</p>
        )}
        {result?.kind === "summarize" && <SummaryView r={result.data} />}
        {result?.kind === "quiz" && <StudyQuiz result={result.data} onSave={addSavedQuiz} />}
        {result?.kind === "flashcards" && <StudyFlashcards result={result.data} onGrade={(c) => addReviewCards([{ ...c, box: 1, dueAt: Date.now(), lastGradedAt: Date.now() }])} />}
        {result?.kind === "ask" && <StudyAsk notes={notes} subjects={subjects} />}
        {result && (result.kind === "improve" || result.kind === "expand" || result.kind === "suggest") && (
          <div className="sai-improve">
            <pre className="sai-improve-text">{result.data.text}</pre>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryView({ r }: { r: SummaryResult }) {
  return (
    <div className="sai-summary">
      <p className="sai-summary-text">{r.summary}</p>
      {r.keyTerms.length > 0 && (
        <div className="sai-glossary">
          <div className="sai-subhead">Key terms</div>
          {r.keyTerms.map((k, i) => (
            <div key={i} className="sai-term">
              <strong>{k.term}</strong>
              <span>{k.meaning}</span>
            </div>
          ))}
        </div>
      )}
      {r.conceptMap.length > 0 && (
        <div className="sai-map">
          <div className="sai-subhead">Concept map</div>
          {r.conceptMap.map((c, i) => (
            <span key={i} className="sai-map-link">{c.from} → {c.to}</span>
          ))}
        </div>
      )}
      {r.studyPoints.length > 0 && (
        <div className="sai-pts">
          <div className="sai-subhead">Study points</div>
          <ul>{r.studyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}
      {r.actionItems.length > 0 && (
        <div className="sai-pts">
          <div className="sai-subhead">Action items</div>
          <ul>{r.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}