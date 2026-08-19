export interface GamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  achievements: string[];
  totalTasksCompleted: number;
  totalStudyMinutes: number;
  totalLockInMinutes: number;
  totalQuizzesCompleted: number;
  totalQuizCorrect: number;
  totalCardsReviewed: number;
  weeklyXP: Record<string, number>;
}

export const GAMIFICATION_KEY = "studentos.gamification.v1";

export const initialGamificationState: GamificationState = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalActiveDays: 0,
  achievements: [],
  totalTasksCompleted: 0,
  totalStudyMinutes: 0,
  totalLockInMinutes: 0,
  totalQuizzesCompleted: 0,
  totalQuizCorrect: 0,
  totalCardsReviewed: 0,
  weeklyXP: {},
};
