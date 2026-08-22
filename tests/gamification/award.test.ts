import { describe, it, expect } from "vitest";
import { awardXP, initialGamificationState } from "../../src/lib/gamification/award";
import { levelForXP, xpForLevel, xpProgressInLevel } from "../../src/lib/gamification/xp";
import { todayISO, addDaysISO } from "../../src/lib/date";

describe("levelForXP", () => {
  it("starts at level 1", () => {
    expect(levelForXP(0)).toBe(1);
    expect(levelForXP(100)).toBe(1); // xpForLevel(2) = 282
  });

  it("levels up past thresholds", () => {
    expect(levelForXP(xpForLevel(2))).toBe(2);
    expect(levelForXP(xpForLevel(3) - 1)).toBe(2);
    expect(levelForXP(xpForLevel(5))).toBe(5);
  });

  it("progress never exceeds 100 or goes negative", () => {
    const p = xpProgressInLevel(xpForLevel(3));
    expect(p.pct).toBeGreaterThanOrEqual(0);
    expect(p.pct).toBeLessThanOrEqual(100);
  });
});

describe("awardXP", () => {
  it("does not mutate the input state", () => {
    const g = initialGamificationState;
    const ng = awardXP(g, 10);
    expect(g.xp).toBe(0);
    expect(ng.xp).toBe(10);
  });

  it("adds stats", () => {
    const ng = awardXP(initialGamificationState, 5, { totalTasksCompleted: 1 });
    expect(ng.totalTasksCompleted).toBe(1);
    expect(ng.totalStudyMinutes).toBe(0);
  });

  it("accumulates weekly XP under today's local date key", () => {
    const first = awardXP(initialGamificationState, 20);
    expect(first.weeklyXP[todayISO()]).toBe(20);
    const second = awardXP(first, 15);
    expect(second.weeklyXP[todayISO()]).toBe(35);
  });

  it("counts one active day and starts streak on first award", () => {
    const ng = awardXP(initialGamificationState, 10);
    expect(ng.totalActiveDays).toBe(1);
    expect(ng.currentStreak).toBe(1);
    expect(ng.longestStreak).toBe(1);
    expect(ng.lastActiveDate).toBe(todayISO());
  });

  it("keeps same-day activity from inflating streaks or day counts", () => {
    const once = awardXP(initialGamificationState, 10);
    const twice = awardXP(once, 10);
    expect(twice.currentStreak).toBe(1);
    expect(twice.totalActiveDays).toBe(1);
  });

  it("continues a streak from yesterday", () => {
    const yesterday = addDaysISO(todayISO(), -1);
    const g = { ...initialGamificationState, lastActiveDate: yesterday, currentStreak: 3, longestStreak: 3, totalActiveDays: 4 };
    const ng = awardXP(g, 10);
    expect(ng.currentStreak).toBe(4);
    expect(ng.totalActiveDays).toBe(5);
  });

  it("resets the streak after a gap", () => {
    const old = addDaysISO(todayISO(), -3);
    const g = { ...initialGamificationState, lastActiveDate: old, currentStreak: 7, longestStreak: 7, totalActiveDays: 8 };
    const ng = awardXP(g, 10);
    expect(ng.currentStreak).toBe(1);
    expect(ng.longestStreak).toBe(7);
  });

  it("updates level when XP crosses threshold", () => {
    const ng = awardXP({ ...initialGamificationState }, xpForLevel(2), {});
    expect(ng.level).toBe(2);
  });
});
