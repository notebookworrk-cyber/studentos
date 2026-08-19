import type { TopicMastery } from "./types";

const LONG_TERM_WEIGHT = 0.3;
const RECENT_WEIGHT = 0.4;
const DIFFICULTY_WEIGHT = 0.15;
const CONSISTENCY_WEIGHT = 0.15;

export function createTopicMastery(topic: string): TopicMastery {
  return {
    topic,
    mastery: 0,
    attempts: 0,
    correct: 0,
    recentCorrect: 0,
    recentAttempts: 0,
    difficulty: 0.5,
    lastReviewedAt: null,
    mistakes: [],
  };
}

function computeConsistency(recentCorrect: number, recentAttempts: number): number {
  if (recentAttempts < 3) return 0.5;
  return recentCorrect / recentAttempts;
}

export function updateMastery(
  current: TopicMastery,
  correct: boolean,
  difficulty: number,
  questionId: string,
  question: string,
  userAnswer: string,
  correctAnswer: string
): TopicMastery {
  const now = new Date().toISOString();
  const newAttempts = current.attempts + 1;
  const newCorrect = current.correct + (correct ? 1 : 0);
  const newRecentAttempts = Math.min(current.recentAttempts + 1, 10);
  const newRecentCorrect = correct
    ? Math.min(current.recentCorrect + 1, newRecentAttempts)
    : Math.max(0, current.recentCorrect - 0);

  const longTermAccuracy = newCorrect / newAttempts;
  const recentAccuracy = newRecentCorrect / newRecentAttempts;
  const consistency = computeConsistency(newRecentCorrect, newRecentAttempts);
  const diffFactor = 1 - difficulty;

  const mastery =
    longTermAccuracy * LONG_TERM_WEIGHT +
    recentAccuracy * RECENT_WEIGHT +
    diffFactor * DIFFICULTY_WEIGHT +
    consistency * CONSISTENCY_WEIGHT;

  const mistakes = [...current.mistakes];
  if (!correct && mistakes.length < 20) {
    mistakes.push({
      questionId,
      question,
      userAnswer,
      correctAnswer,
      timestamp: now,
    });
  }

  return {
    topic: current.topic,
    mastery: Math.round(mastery * 100) / 100,
    attempts: newAttempts,
    correct: newCorrect,
    recentCorrect: newRecentCorrect,
    recentAttempts: newRecentAttempts,
    difficulty: (current.difficulty + difficulty) / 2,
    lastReviewedAt: now,
    mistakes: mistakes.slice(-20),
  };
}
