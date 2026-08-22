import type { GamificationState } from "../../types";
import { levelForXP } from "./xp";
import { updateStreak } from "./streaks";
import { checkAllAchievements } from "./achievements";
import { todayISO } from "../date";

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

type StatKey =
  | "totalTasksCompleted"
  | "totalStudyMinutes"
  | "totalLockInMinutes"
  | "totalQuizzesCompleted"
  | "totalQuizCorrect"
  | "totalCardsReviewed";

export function awardXP(
  g: GamificationState,
  xp: number,
  stats: Partial<Record<StatKey, number>> = {},
): GamificationState {
  let ng: GamificationState = { ...g, xp: g.xp + xp };
  for (const key of Object.keys(stats) as StatKey[]) {
    ng[key] += stats[key] ?? 0;
  }
  ng = { ...ng, ...updateStreak(ng.lastActiveDate, ng.currentStreak, ng.longestStreak, ng.totalActiveDays) };
  ng.level = levelForXP(ng.xp);
  const todayKey = todayISO();
  ng.weeklyXP = { ...ng.weeklyXP, [todayKey]: (ng.weeklyXP[todayKey] || 0) + xp };
  const unlocked = checkAllAchievements(ng);
  if (unlocked.length) ng.achievements = [...ng.achievements, ...unlocked];
  return ng;
}
