export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelForXP(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; pct: number } {
  const level = levelForXP(xp);
  const current = Math.max(0, xp - xpForLevel(level));
  const needed = xpForLevel(level + 1) - xpForLevel(level);
  const pct = Math.min(100, Math.max(0, Math.floor((current / needed) * 100)));
  return { current, needed, pct };
}

export function xpForTask(priority: "low" | "medium" | "high"): number {
  return priority === "high" ? 15 : priority === "medium" ? 10 : 5;
}
