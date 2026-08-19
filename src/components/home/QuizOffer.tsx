import { useEffect, useState } from "react";
import { useOS } from "../../state/os";
import { setIntent } from "../../lib/aiIntent";
import { Icon } from "../Icon";

export function QuizOffer() {
  const { lockinHistory, navigate } = useOS();
  const [showOffer, setShowOffer] = useState<boolean>(false);

  useEffect(() => {
    const justCompleted = lockinHistory.length > 0
      && lockinHistory[0].status === "completed"
      && lockinHistory[0].endedAt
      && Date.now() - new Date(lockinHistory[0].endedAt).getTime() < 5 * 60 * 1000;
    setShowOffer(Boolean(justCompleted));
    if (!justCompleted) return;
    const timer = setTimeout(() => setShowOffer(false), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [lockinHistory]);

  if (!showOffer) return null;

  const topicTitle = lockinHistory[0].title;

  return (
    <section className="study-block surface quiz-offer">
      <div className="panel-head">
        <div className="panel-title">
          <Icon name="target" />
          Lock-in complete: {topicTitle}
        </div>
      </div>
      <p className="quiz-offer-text">Want to lock it in? A quick quiz on your focus topic will reinforce what you just studied.</p>
      <div className="sai-actions-row">
        <button className="btn btn-primary" onClick={() => { setIntent({ action: "quiz", scope: { mode: "all" } }); navigate("ai"); }}>
          <Icon name="target" size={13} />
          Generate quiz
        </button>
        <button className="btn btn-ghost" onClick={() => { setIntent({ action: "flashcards", scope: { mode: "all" } }); navigate("ai"); }}>
          <Icon name="focus" size={13} />
          Flashcards instead
        </button>
      </div>
    </section>
  );
}