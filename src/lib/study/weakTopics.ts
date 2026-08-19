import type { TopicMastery, WeakTopic } from "./types";

const MASTERY_THRESHOLD_WEAK = 0.35;
const MASTERY_THRESHOLD_STRUGGLING = 0.55;
const MASTERY_THRESHOLD_REVIEW = 0.75;
const MIN_ATTEMPTS = 3;

export function detectWeakTopics(topics: TopicMastery[]): WeakTopic[] {
  const weakTopics: WeakTopic[] = [];

  for (const t of topics) {
    if (t.attempts < MIN_ATTEMPTS && t.mastery === 0) {
      continue;
    }

    const reasons: string[] = [];
    let status: WeakTopic["status"] = "review";

    // Mastery-based status
    if (t.mastery < MASTERY_THRESHOLD_WEAK) {
      status = "weak";
      reasons.push(`Mastery is ${Math.round(t.mastery * 100)}%`);
    } else if (t.mastery < MASTERY_THRESHOLD_STRUGGLING) {
      status = "struggling";
      reasons.push(`Mastery is ${Math.round(t.mastery * 100)}%`);
    } else if (t.mastery < MASTERY_THRESHOLD_REVIEW) {
      status = "review";
      reasons.push(`Mastery is ${Math.round(t.mastery * 100)}% — could be stronger`);
    } else {
      continue; // Mastery is high enough
    }

    // Recent errors
    const recentErrors = t.recentAttempts - t.recentCorrect;
    if (recentErrors >= 3) {
      reasons.push(`${recentErrors} recent errors`);
    } else if (recentErrors >= 1 && t.recentAttempts <= 5) {
      reasons.push(`${recentErrors}/${t.recentAttempts} recent attempts wrong`);
    }

    // Repeated mistakes
    const uniqueMistakes = new Set(t.mistakes.map((m) => m.questionId)).size;
    if (uniqueMistakes >= 3) {
      reasons.push(`${uniqueMistakes} different questions missed`);
    }

    // Low recent accuracy
    if (t.recentAttempts >= 3) {
      const recentAcc = t.recentCorrect / t.recentAttempts;
      if (recentAcc < 0.4) {
        reasons.push(`Recent accuracy only ${Math.round(recentAcc * 100)}%`);
      }
    }

    // Time since last review
    if (t.lastReviewedAt) {
      const daysSince = (Date.now() - new Date(t.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7 && t.mastery < 0.6) {
        reasons.push(`Not reviewed for ${Math.round(daysSince)} days`);
      }
    }

    if (reasons.length > 0) {
      weakTopics.push({
        topic: t.topic,
        mastery: t.mastery,
        status,
        reasons,
        recentErrors,
        totalAttempts: t.attempts,
      });
    }
  }

  weakTopics.sort((a, b) => a.mastery - b.mastery);
  return weakTopics;
}
