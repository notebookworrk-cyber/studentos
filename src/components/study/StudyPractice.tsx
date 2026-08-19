import { useRef, useState } from "react";
import { practiceQuestions } from "../../data/mock";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function StudyPractice() {
  const { currentSubject, studyFocus, markTopicDone } = useOS();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const flagged = useRef(false);

  const subject = currentSubject;
  const focusTopic =
    studyFocus && studyFocus.subjectId === subject?.id
      ? subject?.topics.find((t) => t.id === studyFocus.topicId)
      : undefined;
  const topic = focusTopic ?? subject?.topics.find((t) => !t.done);

  if (!subject) return null;

  const n = practiceQuestions.length;
  const q = practiceQuestions[Math.min(idx, n - 1)];
  const finished = done || idx >= n;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= n) {
      setDone(true);
      if (topic && !flagged.current) {
        flagged.current = true;
        markTopicDone(subject.id, topic.id);
      }
      return;
    }
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (finished) {
    return (
      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="target" />
            Practice complete
          </div>
          <span className="badge badge-green">{score} / {n}</span>
        </div>
        <p className="practice-done-line">
          {score === n
            ? "Perfect. You know this topic cold."
            : score >= n * 0.6
              ? "Solid effort. A quick review will close the gaps."
              : "Worth another pass — review the explanations below."}
        </p>
        <div className="practice-actions">
          <button className="btn btn-ghost" onClick={restart}>
            <Icon name="undo" size={15} />
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="study-block surface">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="target" />
          Quick Practice
        </div>
        <span className="badge badge-plain">Question {idx + 1} of {n}</span>
      </div>

      <div className="practice-question">{q.question}</div>

      <div className="practice-options">
        {q.options.map((opt, i) => {
          let cls = "practice-opt";
          if (picked !== null) {
            if (i === q.answer) cls += " correct";
            else if (i === picked) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button key={i} className={cls} onClick={() => pick(i)} disabled={picked !== null}>
              <span className="practice-opt-key">{String.fromCharCode(65 + i)}</span>
              {opt}
              {picked !== null && i === q.answer && <Icon name="check" size={15} />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`practice-feedback ${picked === q.answer ? "good" : "warn"}`}>
          <span className="practice-fb-label">
            {picked === q.answer ? "Correct" : "Not quite"}
          </span>
          <span className="practice-expl">{q.explanation}</span>
        </div>
      )}

      <div className="practice-actions">
        <span className="practice-score">Score {score}</span>
        <button className="btn btn-primary" onClick={next} disabled={picked === null}>
          {idx + 1 >= n ? "Finish" : "Next"}
          <Icon name="arrow" size={15} />
        </button>
      </div>
    </section>
  );
}
