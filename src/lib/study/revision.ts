import type { RevisionItem, TopicMastery } from "./types";

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export function generateRevisionItems(topics: TopicMastery[]): RevisionItem[] {
  const items: RevisionItem[] = [];

  for (const t of topics) {
    if (t.attempts === 0 && t.mastery === 0) continue;

    const reasons: string[] = [];
    let priority: RevisionItem["priority"] = "low";
    let suggestedAction = "Review for 15 minutes";

    // Mastery-based
    if (t.mastery < 0.35) {
      priority = "high";
      reasons.push(`mastery is only ${Math.round(t.mastery * 100)}%`);
      suggestedAction = "Re-study the topic from scratch, then retake the quiz";
    } else if (t.mastery < 0.55) {
      priority = "high";
      reasons.push(`mastery is ${Math.round(t.mastery * 100)}%`);
      suggestedAction = "Focus on weak areas identified in your mistakes";
    } else if (t.mastery < 0.75) {
      priority = "medium";
      reasons.push(`mastery is ${Math.round(t.mastery * 100)}%`);
      suggestedAction = "Practice with flashcards and a quick quiz";
    }

    // Recent errors
    const recentErrors = t.recentAttempts - t.recentCorrect;
    if (recentErrors >= 3) {
      priority = "high";
      reasons.push(`${recentErrors} recent errors`);
    } else if (recentErrors >= 2) {
      if (priority !== "high") priority = "medium";
      reasons.push(`${recentErrors} recent errors`);
    }

    // Time since review
    const days = daysSince(t.lastReviewedAt);
    if (days > 14 && t.mastery < 0.7) {
      if (priority !== "high") priority = "medium";
      reasons.push(`last reviewed ${Math.round(days)} days ago`);
    }

    // Repeated mistakes
    const uniqueMistakes = new Set(t.mistakes.map((m) => m.questionId)).size;
    if (uniqueMistakes >= 3) {
      reasons.push(`${uniqueMistakes} different questions missed`);
      if (priority === "low") priority = "medium";
    }

    if (reasons.length > 0) {
      items.push({
        topic: t.topic,
        priority,
        reason: `Review ${t.topic} because ${reasons.join(" and ")}.`,
        mastery: t.mastery,
        lastReviewedAt: t.lastReviewedAt,
        suggestedAction,
      });
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.mastery - b.mastery);

  return items;
}
