export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "completed";
export const TASK_CATEGORIES = ["Study", "School", "Project", "Personal", "Coding"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // "HH:MM"
  duration: number; // minutes
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  project: string | null;
  goalId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string; // ISO — set when status becomes completed
}

export type EventKind = "class" | "exam" | "deadline" | "event";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  duration: number; // minutes
  category: string;
  kind: EventKind;
  taskId?: string;
  endDate?: string; // YYYY-MM-DD — multi-day span end (inclusive)
  recurrence?: "daily" | "weekdays" | "weekly" | "monthly" | null;
  allDay?: boolean;
  location?: string;
  description?: string;
  reminder?: number; // minutes before; 0 = none
  exceptions?: string[]; // recurring instance dates skipped (YYYY-MM-DD)
  recurrenceId?: string; // points to base event for overrides
}

export type EventDraft = {
  title?: string;
  date: string;
  startTime: string;
  duration?: number;
  category?: string;
  kind?: EventKind;
  recurrence?: CalendarEvent["recurrence"];
  endDate?: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  reminder?: number;
};

export type Composer =
  | { type: "task"; task?: Task; goalId?: string }
  | { type: "event"; event?: CalendarEvent; draft?: EventDraft }
  | { type: "agenda"; date: string }
  | null;

export type GoalPriority = "critical" | "important" | "optional";

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string | null; // YYYY-MM-DD
  priority: GoalPriority;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GoalEditor = { mode: "new" } | { mode: "edit"; id: string } | null;

export type InsightKind = "overloaded" | "unscheduled" | "deadline" | "capacity";

export interface PlanningInsight {
  id: string;
  kind: InsightKind;
  level: "warn" | "info";
  title: string;
  line: string;
}

export type PageId =
  | "home"
  | "planning"
  | "calendar"
  | "tasks"
  | "notes"
  | "timer"
  | "study"
  | "projects"
  | "code"
  | "research"
  | "ai"
  | "files"
  | "browser"
  | "terminal"
  | "lockin"
  | "settings"
  | "stats";

export interface PlanItem {
  id: string;
  ref: string;
  kind: "task" | "event";
  time: string;
  title: string;
  mins: number;
  done: boolean;
  priority: "high" | "mid";
  category: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  lastActivity: string;
  status: "planning" | "active" | "paused" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

export const NOTE_CATEGORIES = [
  "Study",
  "Biology",
  "Chemistry",
  "Physics",
  "Computer Science",
  "Research",
  "Project",
  "Code",
  "Personal",
  "Ideas",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  folder: string;
  favorite: boolean;
  pinned: boolean;
  taskId: string | null;
  project: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type NoteEditor = { mode: "new" } | { mode: "edit"; id: string } | null;

export interface UpcomingItem {
  id: string;
  kind: "exam" | "deadline" | "event";
  label: string;
  date: string;
  tag?: string;
  iso?: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  done: boolean;
}

export interface StudySubject {
  id: string;
  name: string;
  objective: string;
  color: string; // CSS color used for identity accents
  folder: string; // matching StudentOS notes folder
  topics: StudyTopic[];
}

export interface StudyFocus {
  subjectId: string;
  topicId: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // index of correct option
  explanation: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topicId: string;
  topicTitle: string;
  focusedMinutes: number;
  tasksCompleted: number;
  notesCreated: number;
  progressDelta: number;
  endedAt: string; // ISO
  rating?: number; // 1-5, from session review
  note?: string;
}

export type LockInStatus = "active" | "completed" | "abandoned";

export interface LockInSession {
  id: string;
  title: string;
  taskId: string | null;
  goalId: string | null;
  subjectId: string | null;
  category: string;
  plannedMin: number;
  focusedMin: number;
  startedAt: string; // ISO
  endedAt: string | null; // ISO
  status: LockInStatus;
  rating?: number; // 1-5, from session review
  note?: string;
}

export interface LockInStart {
  title: string;
  category?: string;
  taskId?: string | null;
  goalId?: string | null;
  subjectId?: string | null;
  plannedMin: number;
}

export interface PageMeta {
  title: string;
  subtitle: string;
  sections: string[];
}

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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "task" | "study" | "lockin" | "streak" | "quiz" | "flashcard" | "level" | "special";
  condition: (state: GamificationState) => boolean;
}

export type AIStatus = "not_installed" | "downloading" | "installing" | "ready" | "loading" | "loaded" | "error";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AIModelInfo {
  installed: boolean;
  name: string;
  size: string;
  path: string;
}

export interface AIProgress {
  phase: string;
  percent: number;
  downloaded: string;
  speed: string;
}

export type ProjectEditor = { mode: "new" } | { mode: "edit"; id: string } | null;