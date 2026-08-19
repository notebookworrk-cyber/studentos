import type { Achievement, GamificationState } from "../../types";

export const ACHIEVEMENTS: Achievement[] = [
  // Task achievements
  { id: "first-steps", name: "First Steps", description: "Complete 1 task", icon: "✓", category: "task", condition: (s) => s.totalTasksCompleted >= 1 },
  { id: "taskmachine", name: "Taskmachine", description: "Complete 10 tasks", icon: "⚡", category: "task", condition: (s) => s.totalTasksCompleted >= 10 },
  { id: "century-club", name: "Century Club", description: "Complete 100 tasks", icon: "💯", category: "task", condition: (s) => s.totalTasksCompleted >= 100 },
  { id: "priority-pro", name: "Priority Pro", description: "Complete a high-priority task", icon: "🔥", category: "task", condition: (s) => s.totalTasksCompleted >= 1 },

  // Study achievements
  { id: "first-focus", name: "First Focus", description: "Complete 1 study session", icon: "📚", category: "study", condition: (s) => s.totalStudyMinutes > 0 },
  { id: "study-streak", name: "Study Streak", description: "Complete 10 study sessions", icon: "🎯", category: "study", condition: (s) => s.totalStudyMinutes >= 250 },
  { id: "marathon-scholar", name: "Marathon Scholar", description: "Study 4+ hours in total", icon: "🏃", category: "study", condition: (s) => s.totalStudyMinutes >= 240 },

  // Lock-in achievements
  { id: "lock-it-in", name: "Lock It In", description: "Complete 1 lock-in session", icon: "🔒", category: "lockin", condition: (s) => s.totalLockInMinutes > 0 },
  { id: "focus-beast", name: "Focus Beast", description: "Complete 10 lock-in hours", icon: "🦁", category: "lockin", condition: (s) => s.totalLockInMinutes >= 600 },
  { id: "iron-focus", name: "Iron Focus", description: "Complete 30 lock-in hours", icon: "⚙️", category: "lockin", condition: (s) => s.totalLockInMinutes >= 1800 },

  // Streak achievements
  { id: "on-a-roll", name: "On a Roll", description: "3-day streak", icon: "🔥", category: "streak", condition: (s) => s.currentStreak >= 3 },
  { id: "week-warrior", name: "Week Warrior", description: "7-day streak", icon: "⚔️", category: "streak", condition: (s) => s.currentStreak >= 7 },
  { id: "monthly-master", name: "Monthly Master", description: "30-day streak", icon: "👑", category: "streak", condition: (s) => s.currentStreak >= 30 },
  { id: "century-streak", name: "Century Streak", description: "100-day streak", icon: "💎", category: "streak", condition: (s) => s.currentStreak >= 100 },
  { id: "year-of-power", name: "Year of Power", description: "365-day streak", icon: "🏆", category: "streak", condition: (s) => s.currentStreak >= 365 },

  // Quiz achievements
  { id: "quiz-taker", name: "Quiz Taker", description: "Complete 1 quiz", icon: "❓", category: "quiz", condition: (s) => s.totalQuizzesCompleted >= 1 },
  { id: "perfect-score", name: "Perfect Score", description: "Get 100% on a quiz", icon: "⭐", category: "quiz", condition: (s) => s.totalQuizCorrect >= 1 },
  { id: "quiz-master", name: "Quiz Master", description: "Complete 10 quizzes", icon: "🎓", category: "quiz", condition: (s) => s.totalQuizzesCompleted >= 10 },

  // Flashcard achievements
  { id: "first-review", name: "First Review", description: "Review 1 flashcard", icon: "🃏", category: "flashcard", condition: (s) => s.totalCardsReviewed >= 1 },
  { id: "card-collector", name: "Card Collector", description: "Review 100 cards", icon: "📇", category: "flashcard", condition: (s) => s.totalCardsReviewed >= 100 },
  { id: "srs-master", name: "SRS Master", description: "Review 500 cards", icon: "🧠", category: "flashcard", condition: (s) => s.totalCardsReviewed >= 500 },

  // Level achievements
  { id: "getting-started", name: "Getting Started", description: "Reach Level 5", icon: "🌱", category: "level", condition: (s) => s.level >= 5 },
  { id: "level-10", name: "Level 10", description: "Reach Level 10", icon: "🌿", category: "level", condition: (s) => s.level >= 10 },
  { id: "level-25", name: "Level 25", description: "Reach Level 25", icon: "🌳", category: "level", condition: (s) => s.level >= 25 },
  { id: "level-50", name: "Level 50", description: "Reach Level 50", icon: "⭐", category: "level", condition: (s) => s.level >= 50 },

  // Special achievements
  { id: "night-owl", name: "Night Owl", description: "Complete activity after midnight", icon: "🦉", category: "special", condition: () => { const h = new Date().getHours(); return h >= 0 && h < 4; } },
  { id: "early-bird", name: "Early Bird", description: "Complete activity before 6am", icon: "🐦", category: "special", condition: () => new Date().getHours() < 6 },
  { id: "weekend-warrior", name: "Weekend Warrior", description: "Activity on Saturday or Sunday", icon: "🎮", category: "special", condition: () => { const d = new Date().getDay(); return d === 0 || d === 6; } },
];

export function checkAllAchievements(state: GamificationState): string[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.condition(state)).map((a) => a.id);
}
