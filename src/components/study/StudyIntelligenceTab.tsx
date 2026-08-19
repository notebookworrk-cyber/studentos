import { useState, useMemo } from "react";
import { processStudyInput } from "./StudyIntelligenceController";
import { useOS } from "../../state/os";
import type { StudyMaterial, ProcessingStatus, QuizQuestion, AnswerRecord } from "../../lib/study/types";
import { evaluateAnswer } from "../../lib/study/evaluation";
import { detectTopics } from "../../lib/study/topics";
import { generateRevisionItems } from "../../lib/study/revision";
import { createTopicMastery } from "../../lib/study/mastery";
import type { TopicMastery } from "../../lib/study/types";
import { Icon } from "../Icon";

type Mode = "import" | "processing" | "view";

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  idle: "Idle",
  importing: "Importing...",
  extracting: "Extracting text...",
  normalizing: "Normalizing...",
  structuring: "Detecting structure...",
  analyzing: "Extracting patterns...",
  summarizing: "Generating summary...",
  "note-taking": "Writing notes...",
  done: "Done!",
  failed: "Failed",
};

export function StudyIntelligenceTab() {
  const { studyMaterials, addStudyMaterial, deleteStudyMaterial, openNoteEditor, addNote } = useOS();
  const [mode, setMode] = useState<Mode>(studyMaterials.length === 0 ? "import" : "view");
  const [current, setCurrent] = useState<StudyMaterial | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !titleInput.trim()) return;
    setMode("processing");
    setError(null);
    setStatus("importing");

    try {
      const result = await processStudyInput(
        { format: "pasted", text: textInput, title: titleInput },
        setStatus
      );
      if (result.status === "done" && result.material) {
        const saved = addStudyMaterial({
          title: result.material.title,
          source: result.material.source,
          format: result.material.format,
          doc: result.material.doc,
          definitions: result.material.definitions,
          concepts: result.material.concepts,
          facts: result.material.facts,
          summary: result.material.summary,
          note: result.material.note,
          flashcards: result.material.flashcards,
          quizQuestions: result.material.quizQuestions,
          status: result.material.status,
          error: result.material.error,
          createdAt: result.material.createdAt,
          updatedAt: result.material.updatedAt,
        });
        setCurrent(saved);
        setMode("view");
        setError(null);
      } else if (result.status === "failed") {
        setError(result.error ?? "Unknown error");
        setMode("import");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMode("import");
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMode("processing");
    setError(null);

    try {
      const result = await processStudyInput(
        { format: "pdf", file, title: file.name },
        setStatus
      );
      if (result.status === "done" && result.material) {
        const saved = addStudyMaterial({
          title: result.material.title,
          source: result.material.source,
          format: result.material.format,
          doc: result.material.doc,
          definitions: result.material.definitions,
          concepts: result.material.concepts,
          facts: result.material.facts,
          summary: result.material.summary,
          note: result.material.note,
          flashcards: result.material.flashcards,
          quizQuestions: result.material.quizQuestions,
          status: result.material.status,
          error: result.material.error,
          createdAt: result.material.createdAt,
          updatedAt: result.material.updatedAt,
        });
        setCurrent(saved);
        setMode("view");
      } else if (result.status === "failed") {
        setError(result.error ?? "Unknown error");
        setMode("import");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMode("import");
    }
  };

  const handleExportNote = () => {
    if (!current?.note) return;
    const noteId = addNote({
      title: current.note.title,
      content: current.note.content,
      category: "Study",
      tags: ["study-intelligence"],
      folder: "Study",
      favorite: false,
      pinned: false,
      taskId: null,
      project: current.title,
    });
    openNoteEditor({ mode: "edit", id: noteId });
  };

  if (mode === "view" && (!current && studyMaterials.length > 0)) {
    setCurrent(studyMaterials[0]);
  }
  const display = current ?? studyMaterials[0];

  return (
    <div className="study-intelligence-tab">
      {mode === "import" || mode === "processing" ? (
        <>
          {mode === "processing" && (
            <div className="si-progress-bar">
              <div className="si-progress-track">
                <div className="si-progress-fill" style={{ transform: "scaleX(0.8)" }} />
              </div>
              <span className="si-progress-label">{STATUS_LABELS[status]}</span>
              {error && <div className="si-error">{error}</div>}
            </div>
          )}

          <div className="si-import">
            <h2>Study Intelligence</h2>
            <p className="si-sub">Paste text, upload a PDF, or select existing material.</p>

            <div className="si-import-card">
              <h3>Paste Text</h3>
              <form onSubmit={handleImport} className="si-form">
                <input
                  type="text"
                  placeholder="Title"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="input"
                  required
                />
                <textarea
                  placeholder="Paste your study material here..."
                  value={textInput}
                  onChange={(e) => setTimeout(() => setTextInput(e.target.value), 0)}
                  className="si-textarea"
                  rows={8}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={status !== "idle" && status !== "failed"}>
                  Process
                </button>
              </form>
            </div>

            <div className="si-import-card">
              <h3>Upload PDF / TXT / MD</h3>
              <label className="btn btn-ghost btn-file">
                <Icon name="upload" size={14} />
                Choose file
                <input type="file" accept=".pdf,.txt,.md" onChange={handleFile} hidden />
              </label>
              <span className="si-hint">PDF parsing uses pdfjs-dist. TXT and MD are plain text.</span>
            </div>

            {studyMaterials.length > 0 && (
              <div className="si-existing">
                <h3>Existing Materials</h3>
                <div className="si-list">
                  {studyMaterials.map((m) => (
                    <button
                      key={m.id}
                      className="si-list-item"
                      onClick={() => { setCurrent(m); setMode("view"); }}
                    >
                      <div className="si-item-title">{m.title}</div>
                      <div className="si-item-meta">
                        <span>{m.format} · {m.doc.sections.length} sections · {m.definitions.length} terms</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : display ? (
        <StudyMaterialView
          material={display}
          onBack={() => { setMode("import"); setCurrent(null); }}
          onExport={handleExportNote}
          onDelete={() => { if (display) deleteStudyMaterial(display.id); }}
        />
      ) : (
        <div className="si-placeholder">
          <Icon name="brain" size={32} />
          <p>No study materials. Import text or a PDF to begin.</p>
        </div>
      )}
    </div>
  );
}

type ViewProps = {
  material: StudyMaterial;
  onBack: () => void;
  onExport: () => void;
  onDelete: () => void;
};

const VIEW_TABS = ["summary", "definitions", "concepts", "facts", "flashcards", "quiz", "mastery", "revision", "note"] as const;

function StudyMaterialView({ material, onBack, onExport, onDelete }: ViewProps) {
  const [tab, setTab] = useState<(typeof VIEW_TABS)[number]>("summary");

  return (
    <div className="si-view">
      <header className="si-view-head">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="back" size={14} />
        </button>
        <h2>{material.title}</h2>
        <div className="si-view-actions">
          {material.note && (
            <button className="btn btn-ghost btn-sm" onClick={onExport}>
              <Icon name="note" size={14} />
              Export to Notes
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onDelete}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      </header>

      <div className="si-tabs seg">
        {VIEW_TABS.map((t) => (
          <button
            key={t}
            className={`seg-item ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            disabled={t === "note" && !material.note}
          >
            {t === "flashcards" ? `Flashcards (${material.flashcards.length})` :
             t === "quiz" ? `Quiz (${material.quizQuestions.length})` :
             t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="si-view-body">
        {tab === "summary" && <SummaryPanel material={material} />}
        {tab === "definitions" && <DefinitionsPanel material={material} />}
        {tab === "concepts" && <ConceptsPanel material={material} />}
        {tab === "facts" && <FactsPanel material={material} />}
        {tab === "flashcards" && <FlashcardsPanel material={material} />}
        {tab === "quiz" && <QuizPanel material={material} />}
        {tab === "mastery" && <MasteryPanel material={material} />}
        {tab === "revision" && <RevisionPanel material={material} />}
        {tab === "note" && material.note && (
          <pre className="si-note">{material.note.content}</pre>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({ material }: { material: StudyMaterial }) {
  return (
    <div className="si-summary">
      {material.summary?.items.length ? (
        <ul>
          {material.summary.items.map((item, i) => (
            <li key={i}>{item.text}</li>
          ))}
        </ul>
      ) : <p>No summary generated.</p>}
      {material.summary?.keyTerms.length ? (
        <div className="si-keyterms">
          {material.summary.keyTerms.map((t, i) => (
            <div key={i} className="si-keyterm">
              <strong>{t.term}</strong>: {t.meaning}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DefinitionsPanel({ material }: { material: StudyMaterial }) {
  return (
    <div className="si-defs">
      {material.definitions.map((d) => (
        <div key={d.id} className="si-def">
          <strong>{d.term}</strong>
          <p>{d.definition}</p>
          <small>Confidence: {Math.round(d.confidence * 100)}%</small>
        </div>
      ))}
    </div>
  );
}

function ConceptsPanel({ material }: { material: StudyMaterial }) {
  return (
    <div className="si-concepts">
      {material.concepts.map((c) => (
        <div key={c.id} className="si-concept">
          <span className="badge">{c.frequency}</span>
          <strong>{c.term}</strong>
          {c.contexts.length > 0 && <small>{c.contexts[0]}</small>}
        </div>
      ))}
    </div>
  );
}

function FactsPanel({ material }: { material: StudyMaterial }) {
  return (
    <div className="si-facts">
      {material.facts.map((f) => (
        <div key={f.id} className="si-fact">
          <span className="badge badge-tint">{f.relation}</span>
          <strong>{f.subject}</strong> → {f.object}
        </div>
      ))}
    </div>
  );
}

function FlashcardsPanel({ material }: { material: StudyMaterial }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = material.flashcards;

  if (cards.length === 0) return <p>No flashcards generated. Need more definitions, concepts, or facts.</p>;

  const card = cards[currentIdx];

  return (
    <div className="si-flashcards">
      <div className="si-fc-progress">{currentIdx + 1} / {cards.length}</div>
      <div className="si-fc-card" onClick={() => setFlipped(!flipped)}>
        <div className={`si-fc-inner ${flipped ? "flipped" : ""}`}>
          <div className="si-fc-front">
            <span className={`badge badge-${card.difficulty}`}>{card.difficulty}</span>
            <span className="badge">{card.type}</span>
            <p className="si-fc-question">{card.question}</p>
            <small>Click to flip</small>
          </div>
          <div className="si-fc-back">
            <p className="si-fc-answer">{card.answer}</p>
            <small>{card.topic}</small>
          </div>
        </div>
      </div>
      <div className="si-fc-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); }} disabled={currentIdx === 0}>Prev</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentIdx(Math.min(cards.length - 1, currentIdx + 1)); setFlipped(false); }} disabled={currentIdx === cards.length - 1}>Next</button>
      </div>
    </div>
  );
}

function QuizPanel({ material }: { material: StudyMaterial }) {
  const [quizMode, setQuizMode] = useState<"select" | "active" | "results">("select");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  const startQuiz = (types: QuizQuestion["type"][]) => {
    const filtered = material.quizQuestions.filter((q) => types.includes(q.type));
    setQuestions(filtered.slice(0, 10));
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedOption(null);
    setTextAnswer("");
    setQuizMode("active");
  };

  const submitAnswer = () => {
    const q = questions[currentIdx];
    let userAnswer: string;
    if (q.type === "mcq") {
      userAnswer = selectedOption !== null ? q.options[selectedOption] : "";
    } else {
      userAnswer = textAnswer;
    }
    const evalResult = evaluateAnswer(q.answer, userAnswer);
    const record: AnswerRecord = {
      questionId: q.id,
      userAnswer,
      correct: evalResult.correct,
      score: evalResult.score,
      feedback: evalResult.feedback,
    };
    setAnswers([...answers, record]);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setTextAnswer("");
    } else {
      setQuizMode("results");
    }
  };

  if (material.quizQuestions.length === 0) return <p>No quiz questions generated.</p>;

  if (quizMode === "select") {
    const types = [...new Set(material.quizQuestions.map((q) => q.type))];
    return (
      <div className="si-quiz-select">
        <h3>Start a Quiz</h3>
        <p>{material.quizQuestions.length} questions available</p>
        <div className="si-quiz-types">
          {types.map((t) => (
            <button key={t} className="btn btn-ghost btn-sm" onClick={() => startQuiz([t])}>
              {t === "mcq" ? "Multiple Choice" : t === "truefalse" ? "True/False" : t === "fill-blank" ? "Fill in the Blank" : "Short Answer"}
            </button>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => startQuiz(types)}>
            Mixed Quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizMode === "results") {
    const correct = answers.filter((a) => a.correct).length;
    const score = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;
    return (
      <div className="si-quiz-results">
        <h3>Quiz Complete</h3>
        <div className="si-quiz-score">{score}%</div>
        <p>{correct}/{answers.length} correct</p>
        <div className="si-quiz-review">
          {questions.map((q, i) => (
            <div key={q.id} className={`si-quiz-item ${answers[i]?.correct ? "correct" : "wrong"}`}>
              <p><strong>Q{i + 1}:</strong> {q.question}</p>
              <p>Your answer: {answers[i]?.userAnswer || "—"}</p>
              {!answers[i]?.correct && <p>Correct: {q.answer}</p>}
              <small>{answers[i]?.feedback}</small>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => setQuizMode("select")}>Try Again</button>
      </div>
    );
  }

  const q = questions[currentIdx];
  return (
    <div className="si-quiz-active">
      <div className="si-quiz-progress">Question {currentIdx + 1} of {questions.length}</div>
      <div className="si-quiz-question">
        <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
        <p>{q.question}</p>
      </div>
      {q.type === "mcq" && (
        <div className="si-quiz-options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`si-quiz-opt ${selectedOption === i ? "selected" : ""}`}
              onClick={() => setSelectedOption(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {q.type === "truefalse" && (
        <div className="si-quiz-options">
          <button className={`si-quiz-opt ${selectedOption === 0 ? "selected" : ""}`} onClick={() => setSelectedOption(0)}>True</button>
          <button className={`si-quiz-opt ${selectedOption === 1 ? "selected" : ""}`} onClick={() => setSelectedOption(1)}>False</button>
        </div>
      )}
      {(q.type === "fill-blank" || q.type === "short-answer") && (
        <input
          type="text"
          className="input"
          placeholder="Type your answer..."
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
        />
      )}
      <button className="btn btn-primary" onClick={submitAnswer} disabled={q.type === "mcq" || q.type === "truefalse" ? selectedOption === null : !textAnswer.trim()}>
        {currentIdx < questions.length - 1 ? "Next" : "Finish"}
      </button>
    </div>
  );
}

function MasteryPanel({ material }: { material: StudyMaterial }) {
  const topics = useMemo(() => detectTopics(material.doc, material.concepts, material.definitions, material.facts), [material]);

  if (topics.length === 0) return <p>No topics detected.</p>;

  return (
    <div className="si-mastery">
      <h3>Topics ({topics.length})</h3>
      <div className="si-mastery-list">
        {topics.map((t) => (
          <div key={t.name} className="si-mastery-item">
            <strong>{t.name}</strong>
            <div className="si-mastery-meta">
              <span>{t.definitions.length} definitions</span>
              <span>{t.concepts.length} concepts</span>
              <span>{t.facts.length} facts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevisionPanel({ material }: { material: StudyMaterial }) {
  const topics = useMemo(() => detectTopics(material.doc, material.concepts, material.definitions, material.facts), [material]);
  const masteryData: TopicMastery[] = useMemo(() => topics.map((t) => createTopicMastery(t.name)), [topics]);
  const revisionItems = useMemo(() => generateRevisionItems(masteryData), [masteryData]);

  if (revisionItems.length === 0) return <p>No revision items. Take a quiz to generate recommendations.</p>;

  return (
    <div className="si-revision">
      <h3>Revision Recommendations</h3>
      <div className="si-revision-list">
        {revisionItems.map((item) => (
          <div key={item.topic} className={`si-revision-item si-rev-${item.priority}`}>
            <div className="si-revision-header">
              <strong>{item.topic}</strong>
              <span className={`badge badge-${item.priority}`}>{item.priority}</span>
            </div>
            <p>{item.reason}</p>
            <small>{item.suggestedAction}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
