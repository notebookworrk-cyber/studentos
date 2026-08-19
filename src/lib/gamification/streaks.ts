import { addDaysISO, todayISO } from "../date";

export function updateStreak(
  lastActiveDate: string | null,
  currentStreak: number,
  longestStreak: number,
  totalActiveDays: number
): { lastActiveDate: string; currentStreak: number; longestStreak: number; totalActiveDays: number } {
  const today = todayISO();

  if (lastActiveDate === today) {
    return { lastActiveDate: today, currentStreak, longestStreak, totalActiveDays };
  }

  const yesterday = addDaysISO(today, -1);
  let newStreak: number;

  if (lastActiveDate === yesterday) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newTotal = lastActiveDate === today ? totalActiveDays : totalActiveDays + 1;
  const newLongest = Math.max(longestStreak, newStreak);

  return {
    lastActiveDate: today,
    currentStreak: newStreak,
    longestStreak: newLongest,
    totalActiveDays: newTotal,
  };
}
