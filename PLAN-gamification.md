# Gamification System — StudentOS

## Overview
Full gamification suite: XP + Levels + Streaks + Achievements + Stats Dashboard + Sidebar Widget + Toast Notifications.

## XP System

### Actions & Rewards
| Action | XP | Source Hook |
|---|---|---|
| Complete task (low) | +5 | `togglePlan` |
| Complete task (medium) | +10 | `togglePlan` |
| Complete task (high) | +15 | `togglePlan` |
| Complete study session | +15 per 25min block | `finishStudySession` |
| Complete lock-in | +20 | `endLockIn` (completed=true) |
| Grade flashcard | +2 | `gradeReview` |
| Quiz correct answer | +5 per correct | `addSavedQuiz` |

### Level Curve
Formula: `XP_needed(level) = floor(100 * level^1.5)`

| Level | Total XP Required | ~Equivalent |
|---|---|---|
| 1 | 0 | Start |
| 2 | 100 | 10 tasks |
| 5 | 2,500 | 250 tasks or 50 study sessions |
| 10 | 15,000 | ~3 months daily use |
| 25 | 75,000 | ~1 year daily use |
| 50 | 350,000 | Prestige |

### XP Bar (Sidebar)
- Shows: `Lv.{level}` badge + progress bar + `{xp}/{nextLevel} XP`
- Progress bar fills left-to-right with blue gradient
- Collapsed sidebar: just the level badge

## Streak System

### Tracking
- `lastActiveDate: string | null` — last day with any activity
- `currentStreak: number` — consecutive active days
- `longestStreak: number` — all-time best
- `totalActiveDays: number` — lifetime unique active days

### Activity Detection
A day is "active" if any of: task completed, study session finished, lock-in completed, flashcard graded, quiz taken.

### Streak Logic
- On first activity of a new day: check if `lastActiveDate` is yesterday → increment streak
- If `lastActiveDate` is today → no change
- If `lastActiveDate` is older than yesterday → streak resets to 1
- Update `longestStreak` if `currentStreak > longestStreak`

## Achievements (30+ badges)

### Task Achievements
| Badge | Condition | Icon |
|---|---|---|
| First Steps | Complete 1 task | ✓ |
| Taskmachine | Complete 10 tasks | ⚡ |
| Century Club | Complete 100 tasks | 💯 |
| Priority Pro | Complete a high-priority task | 🔥 |

### Study Achievements
| Badge | Condition | Icon |
|---|---|---|
| First Focus | Complete 1 study session | 📚 |
| Study Streak | Complete 10 study sessions | 🎯 |
| Marathon Scholar | 4+ hours study in one day | 🏃 |

### Lock-In Achievements
| Badge | Condition | Icon |
|---|---|---|
| Lock It In | Complete 1 lock-in session | 🔒 |
| Focus Beast | Complete 10 lock-ins | 🦁 |
| Iron Focus | 10+ total lock-in hours | ⚙️ |

### Streak Achievements
| Badge | Condition | Icon |
|---|---|---|
| On a Roll | 3-day streak | 🔥 |
| Week Warrior | 7-day streak | ⚔️ |
| Monthly Master | 30-day streak | 👑 |
| Century Streak | 100-day streak | 💎 |
| Year of Power | 365-day streak | 🏆 |

### Quiz Achievements
| Badge | Condition | Icon |
|---|---|---|
| Quiz Taker | Complete 1 quiz | ❓ |
| Perfect Score | Score 100% on any quiz | ⭐ |
| Quiz Master | Complete 10 quizzes | 🎓 |

### Flashcard Achievements
| Badge | Condition | Icon |
|---|---|---|
| First Review | Grade 1 flashcard | 🃏 |
| Card Collector | Review 100 cards | 📇 |
| SRS Master | Have a card reach Box 5 | 🧠 |

### Level Achievements
| Badge | Condition | Icon |
|---|---|---|
| Getting Started | Reach Level 5 | 🌱 |
| Level 10 | Reach Level 10 | 🌿 |
| Level 25 | Reach Level 25 | 🌳 |
| Level 50 | Reach Level 50 | ⭐ |

### Special Achievements
| Badge | Condition | Icon |
|---|---|---|
| Night Owl | Complete activity after midnight | 🦉 |
| Early Bird | Complete activity before 6am | 🐦 |
| Weekend Warrior | Activity on Saturday or Sunday | 🎮 |

## UI Components

### 1. Sidebar XP Widget (`src/components/gamification/XPBar.tsx`)
- Inserted between `.brand` and first `.nav-group` in Sidebar.tsx
- Shows: level badge, XP progress bar, "{xp}/{nextLevel} XP" text
- Collapsed mode: just level number in a circle

### 2. Stats Page (`src/components/gamification/StatsPage.tsx`)
- New page added to `PageId` union: `"stats"`
- Added to sidebar nav under "System" group
- Layout:
  - **Header**: Level badge + total XP + current streak
  - **Stats Grid**: Tasks completed, Study hours, Lock-in hours, Quizzes taken, Cards reviewed
  - **Weekly Activity**: 7-bar chart of daily XP earned
  - **Achievement Grid**: All badges, locked (gray) vs unlocked (colored)

### 3. Achievement Toast (`src/components/gamification/AchievementToast.tsx`)
- Triggered when new achievement unlocked
- Shows badge icon + name + description
- Auto-dismiss after 4 seconds
- Uses existing toast system (`toast()` from `src/state/toasts.ts`)

### 4. XP Notification
- Small floating "+N XP" text that fades up and out
- Triggered on any XP earn

## State Changes

### New Types (`src/types.ts`)
```ts
export interface GamificationState {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  achievements: string[];  // array of achievement IDs
  totalTasksCompleted: number;
  totalStudyMinutes: number;
  totalLockInMinutes: number;
  totalQuizzesCompleted: number;
  totalQuizCorrect: number;
  totalCardsReviewed: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "task" | "study" | "lockin" | "streak" | "quiz" | "flashcard" | "level" | "special";
  condition: (state: GamificationState) => boolean;
}
```

### New State in os.tsx
- `gamification: GamificationState` — persisted to `studentos.gamification.v1`
- `awardXP(amount: number, reason: string)` — adds XP, checks level-up, triggers notification
- `unlockAchievement(id: string)` — adds to achievements array, triggers toast
- `checkAchievements()` — scans all achievement conditions, unlocks any newly met

### Hook Points (existing functions modified)
1. **`togglePlan`** — after marking completed: `awardXP(xpForPriority(task.priority), "Task completed")`
2. **`finishStudySession`** — after creating session: `awardXP(15 * Math.ceil(session.focusedMinutes / 25), "Study session")`
3. **`endLockIn`** — if completed: `awardXP(20, "Lock-in completed")`
4. **`gradeReview`** — `awardXP(2, "Card reviewed")`
5. **`addSavedQuiz`** — calculate correct answers from quiz result, `awardXP(5 * correct, "Quiz completed")`

### Daily Activity Tracking
- On any XP-earning action, call `recordActivity()` which:
  - Gets today's ISO date
  - If `lastActiveDate !== today`: increment `totalActiveDays`, update streak logic
  - Sets `lastActiveDate = today`

## Files to Create
| File | Purpose |
|---|---|
| `src/lib/gamification/types.ts` | Achievement definitions, GamificationState type |
| `src/lib/gamification/xp.ts` | `xpForLevel()`, `levelForXP()`, `awardXP()` helpers |
| `src/lib/gamification/streaks.ts` | `recordActivity()`, streak calculation logic |
| `src/lib/gamification/achievements.ts` | `ACHIEVEMENTS` array, `checkAchievements()` |
| `src/components/gamification/XPBar.tsx` | Sidebar XP widget |
| `src/components/gamification/StatsPage.tsx` | Stats dashboard page |
| `src/styles/gamification.css` | All gamification styles |

## Files to Modify
| File | Changes |
|---|---|
| `src/types.ts` | Add `GamificationState`, `"stats"` to PageId |
| `src/state/os.tsx` | Add gamification state, awardXP, hook into togglePlan/finishStudySession/endLockIn/gradeReview/addSavedQuiz |
| `src/components/Sidebar.tsx` | Add XPBar widget, add "Stats" nav item |
| `src/App.tsx` | Add StatsPage lazy import + route |
| `src/data/mock.ts` | Add stats page to pageMeta |
| `src/main.tsx` | Import gamification.css |

## Implementation Order

### Phase 1: Foundation (types + XP + levels + streaks)
1. Create `src/lib/gamification/types.ts`
2. Create `src/lib/gamification/xp.ts`
3. Create `src/lib/gamification/streaks.ts`
4. Add GamificationState to `src/types.ts`
5. Add gamification state + awardXP + recordActivity to `src/state/os.tsx`
6. Hook into togglePlan, finishStudySession, endLockIn, gradeReview, addSavedQuiz

### Phase 2: Sidebar XP Widget
1. Create `src/components/gamification/XPBar.tsx`
2. Add to Sidebar.tsx between brand and nav
3. Add CSS to gamification.css

### Phase 3: Achievements
1. Create `src/lib/gamification/achievements.ts` with all 30+ definitions
2. Add checkAchievements() call after each awardXP
3. Wire achievement unlock to toast system

### Phase 4: Stats Page
1. Add `"stats"` to PageId union
2. Create `src/components/gamification/StatsPage.tsx`
3. Add route to App.tsx
4. Add nav item to Sidebar.tsx
5. Add pageMeta entry
6. Build weekly activity chart (pure CSS bars)

### Phase 5: Polish + CSS
1. Create `src/styles/gamification.css`
2. Import in main.tsx
3. Style XP bar, stats page, achievement grid, toasts
4. Add level-up celebration effect

### Phase 6: Gate
1. `npx tsc -b`
2. `npm run build`
3. `npx vitest run` (existing tests still pass)
