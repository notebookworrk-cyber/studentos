import { useMemo, useState } from "react";
import type { QuizResult } from "../../lib/studyai";
import { Icon } from "../Icon";

export function StudyQuiz({ result, onSave }: { result: QuizResult; onSave: (q: QuizResult) => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const q = result.questions[idx];
  const correct = useMemo(() => (checked && picked === q?.answer) ?? false, [checked, picked, q]);

  if (!q || result.questions.length === 0) {
    return <p className="study-res-empty">No questions could be generated from this scope — add more note content.</p>;
  }

  const next = () => {
    if (idx + 1 >= result.questions.length) {
      setDone(true);
      setSaved(false);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
    setChecked(false);
  };

  const finish = () => {
    setDone(true);
  };

  const save = () => {
    onSave(result);
    setSaved(true);
  };

  if (done) {
    return (
      <div className="sai-quiz-done">
        <div className="sai-score">{score}/{result.questions.length}</div>
        <p className="sai-score-line">
          {score / Math.max(1, result.questions.length) >= 0.7 ? "Solid. Keep the streak." : "Review the weak ones below, then retake."}
        </p>
        <div className="sai-actions-row">
          <button className="btn btn-ghost btn-sm" onClick={() => { setIdx(0); setPicked(null); setChecked(false); setScore(0); setDone(false); }}>
            <Icon name="undo" size={13} />
            Retake
          </button>
          {!saved && (
            <button className="btn btn-primary btn-sm" onClick={save}>
              <Icon name="check" size={13} />
              Save quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sai-quiz">
      <div className="sai-quiz-head">
        <span className="sai-quiz-count">Q {idx + 1} of {result.questions.length}</span>
        <span className="sai-quiz-score">Score {score}</span>
      </div>
      <p className="sai-quiz-q">{q.question}</p>
      <div className="sai-quiz-opts">
        {q.options.map((opt, i) => {
          let cls = "sai-opt";
          if (checked) {
            if (i === q.answer) cls += " good";
            else if (i === picked) cls += " bad";
          }
          return (
            <button key={i} className={cls} disabled={checked} onClick={() => { setPicked(i); setChecked(true); if (i === q.answer) setScore((s) => s + 1); }}>
              <span className="sai-opt-key">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {checked && (
        <div className={`sai-explain ${correct ? "good" : "bad"}`}>
          <Icon name={correct ? "check" : "x"} size={14} />
          <div>
            <strong>{correct ? "Correct" : "Not quite"}</strong>
            <p>{q.explanation}</p>
            <span className="sai-source">Source · {q.sourceNote}</span>
          </div>
        </div>
      )}
      <div className="sai-actions-row">
        <button className="btn btn-primary btn-sm" onClick={checked ? next : finish} disabled={!checked}>
          {idx + 1 >= result.questions.length ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}