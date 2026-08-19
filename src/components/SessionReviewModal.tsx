import { useEffect, useState } from "react";
import { useOS } from "../state/os";
import { Icon } from "./Icon";

export function SessionReviewModal() {
  const { sessionReview, submitSessionReview, dismissSessionReview } = useOS();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    setRating(0);
    setHover(0);
    setNote("");
  }, [sessionReview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissSessionReview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissSessionReview]);

  if (!sessionReview) return null;
  const kind = sessionReview.kind === "study" ? "Study session" : "Lock-in session";

  return (
    <div className="modal-overlay" onMouseDown={dismissSessionReview}>
      <div className="modal" style={{ width: "min(420px, 100%)" }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <Icon name="focus" />
            {kind} complete
          </div>
        </div>
        <div className="modal-body">
          <p className="review-prompt">How did it go?</p>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`review-star ${n <= (hover || rating) ? "active" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`Rate ${n} of 5`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="review-note"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={dismissSessionReview}>
            Skip
          </button>
          <button className="btn btn-primary" disabled={rating === 0} onClick={() => submitSessionReview(rating, note)}>
            Save review
          </button>
        </div>
      </div>
    </div>
  );
}