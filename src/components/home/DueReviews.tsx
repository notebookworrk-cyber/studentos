import { FlashcardReview } from "../ai/StudyFlashcards";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function DueReviews() {
  const { dueReviews, gradeReview } = useOS();

  if (!dueReviews || dueReviews.length === 0) return null;

  return (
    <section className="study-block surface due-reviews">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="focus" />
          Due for review
        </div>
      </div>
      <FlashcardReview cards={dueReviews} onGrade={gradeReview} />
    </section>
  );
}