import { useState } from "react";
import type { FlashcardResult } from "../../lib/studyai";
import type { ReviewCard } from "../../lib/srs";
import { Icon } from "../Icon";

export function StudyFlashcards({
  result,
  onGrade,
}: {
  result: FlashcardResult;
  onGrade: (card: ReviewCard, grade: 0 | 1 | 2 | 3) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = result.cards[idx];
  if (!card || result.cards.length === 0) {
    return <p className="study-res-empty">No flashcards could be generated from this scope.</p>;
  }

  const grade = (g: 0 | 1 | 2 | 3) => {
    onGrade(
      { id: card.id, front: card.front, back: card.back, source: card.source, box: 1, dueAt: 0, lastGradedAt: 0 },
      g,
    );
    setFlipped(false);
    setIdx((i) => (i + 1 >= result.cards.length ? 0 : i + 1));
  };

  return (
    <div className="sai-flash">
      <div
        className={`sai-card ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flip card"
      >
        <div className="sai-card-inner">
          <div className={`sai-card-face sai-face-front${flipped ? "" : ""}`}>
            <span className="sai-card-count">{idx + 1}/{result.cards.length}</span>
            <p className="sai-face-text">{card.front}</p>
            <span className="sai-card-hint">Tap to reveal</span>
          </div>
          <div className={`sai-card-face sai-face-back${flipped ? "" : ""}`}>
            <span className="sai-card-count">{idx + 1}/{result.cards.length}</span>
            <p className="sai-face-text">{card.back}</p>
            <span className="sai-card-hint">Tap to flip back</span>
          </div>
        </div>
      </div>
      <div className="sai-actions-row">
        <button className="btn btn-ghost btn-sm" onClick={() => grade(0)}>
          <Icon name="x" size={13} />
          Again
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => grade(1)}>
          <Icon name="arrow" size={13} />
          Hard
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => grade(2)}>
          <Icon name="check" size={13} />
          Good
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => grade(3)}>
          <Icon name="spark" size={13} />
          Easy
        </button>
      </div>
    </div>
  );
}

export function FlashcardReview({ cards, onGrade }: { cards: ReviewCard[]; onGrade: (id: string, grade: 0 | 1 | 2 | 3 | 4) => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[idx];
  if (!card || cards.length === 0) {
    return <p className="study-res-empty">Nothing due right now. Come back later.</p>;
  }

  const grade = (g: 0 | 1 | 2 | 3 | 4) => {
    onGrade(card.id, g);
    setFlipped(false);
    setIdx((i) => {
      const next = i + 1;
      return next >= cards.length ? 0 : Math.min(next, Math.max(0, cards.length - 1));
    });
  };

  return (
    <div className="sai-flash">
      <div
        className={`sai-card ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flip card"
      >
        <div className="sai-card-inner">
          <div className="sai-card-face sai-face-front">
            <span className="sai-card-count">Review {idx + 1}/{cards.length} · box {card.box}</span>
            <p className="sai-face-text">{card.front}</p>
            <span className="sai-card-hint">Tap to reveal</span>
          </div>
          <div className="sai-card-face sai-face-back">
            <span className="sai-card-count">Review {idx + 1}/{cards.length} · box {card.box}</span>
            <p className="sai-face-text">{card.back}</p>
            <span className="sai-card-hint">Tap to flip back</span>
          </div>
        </div>
      </div>
      <div className="sai-actions-row">
        <button className="btn btn-ghost btn-sm" onClick={() => grade(0)}>
          <Icon name="x" size={13} />
          Forgot
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => grade(1)}>
          <Icon name="arrow" size={13} />
          Hard
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => grade(2)}>
          <Icon name="check" size={13} />
          Good
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => grade(3)}>
          <Icon name="spark" size={13} />
          Easy
        </button>
      </div>
    </div>
  );
}
