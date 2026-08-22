import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { WALLPAPERS } from "../data/wallpapers";
import { seedEvents, seedFolders, seedGoals, seedNotes, seedSessions, seedSubjects, seedTasks, projects as seedProjects } from "../data/mock";
import { addDaysISO, fmtWeekday, todayISO } from "../lib/date";
import { due, gradeCard, mergeDeck } from "../lib/srs";
import type { ReviewCard } from "../lib/srs";
import { type StudyMaterial } from "../lib/study/types";
import type { QuizResult } from "../lib/studyai";
import type {
  AIStatus,
  AIMessage,
  CalendarEvent,
  Composer,
  GamificationState,
  Goal,
  GoalEditor,
  LockInSession,
  LockInStart,
  Note,
  NoteEditor,
  PageId,
  PlanItem,
  Project,
  ProjectEditor,
  StudyFocus,
  StudySession,
  StudySubject,
  Task,
  UpcomingItem,
} from "../types";
import { xpForTask } from "../lib/gamification/xp";
import { awardXP, initialGamificationState } from "../lib/gamification/award";
import { usePersistedState } from "./persisted";
import { notify } from "../lib/notifications";

export const FOCUS_LEN = 25 * 60;
export const SESSIONS_PER_SET = 4;
export const BREAK_LEN = 5 * 60;
export const LONG_BREAK_LEN = 15 * 60;

const TASKS_KEY = "studentos.tasks.v1";
const EVENTS_KEY = "studentos.events.v1";
const NOTES_KEY = "studentos.notes.v1";
const FOLDERS_KEY = "studentos.folders.v1";
const SUBJECTS_KEY = "studentos.study.subjects.v1";
const SESSIONS_KEY = "studentos.study.sessions.v1";
const SUBJECT_KEY = "studentos.study.subject.v1";
const FOCUS_KEY = "studentos.study.focus.v1";
const GOALS_KEY = "studentos.planning.goals.v1";
const LOCKIN_KEY = "studentos.lockin.v1";
const WALLPAPER_KEY = "studentos.wallpaper.v1";
const THEME_KEY = "studentos.theme.v1";
const REVIEW_KEY = "studentos.study.review.v1";
const STUDY_MATERIALS_KEY = "studentos.study.materials.v1";
const QUIZ_KEY = "studentos.study.quizzes.v1";
const GAMIFICATION_KEY = "studentos.gamification.v1";
const AI_KEY = "studentos.ai.status.v1";
const AI_MESSAGES_KEY = "studentos.ai.messages.v1";
const PROJECTS_KEY = "studentos.projects.v1";
const PROFILE_KEY = "studentos.profile.v1";
const ACCENT_KEY = "studentos.accent.v1";
const QUOTES_KEY = "studentos.quotes.v1";
const LOCATION_KEY = "studentos.location.v1";
const CLOCK24H_KEY = "studentos.clock24h.v1";

export type Theme = "light" | "dark";

export interface SavedQuiz {
  id: string;
  title: string;
  savedAt: number;
  result: QuizResult;
}

function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface TimerState {
  seconds: number;
  running: boolean;
  session: number;
  set: number;
  focusLen: number;
  phase: "focus" | "break";
  breakType: "short" | "long";
  breakLen: number;
  setBreakLen: (n: number) => void;
  target: number;
  toggle: () => void;
  reset: () => void;
}

interface OSContextValue {
  page: PageId;
  navigate: (page: PageId) => void;
  wallpaper: string;
  setWallpaper: (wp: string) => void;
  wallpaperOpacity: number;
  setWallpaperOpacity: (n: number) => void;
  wallpaperDim: number;
  setWallpaperDim: (n: number) => void;
  wallpaperBlur: number;
  setWallpaperBlur: (n: number) => void;
  wallpaperFavorites: string[];
  toggleWallpaperFavorite: (id: string) => void;
  wallpaperRecent: string[];
  dynamicAtmosphere: boolean;
  setDynamicAtmosphere: (v: boolean) => void;
  autoChange: "never" | "daily" | "startup";
  setAutoChange: (v: "never" | "daily" | "startup") => void;
  randomizeWallpaper: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  today: string;
  plan: PlanItem[];
  togglePlan: (id: string) => void;
  nowTask: PlanItem | undefined;
  timer: TimerState;
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  folders: string[];
  upcoming: UpcomingItem[];
  overdue: Task[];
  lockinActive: LockInSession | null;
  lockinHistory: LockInSession[];
  reviewCards: ReviewCard[];
  addReviewCards: (fresh: ReviewCard[]) => void;
  gradeReview: (id: string, grade: 0 | 1 | 2 | 3 | 4) => void;
  dueReviews: ReviewCard[];
  savedQuizzes: SavedQuiz[];
  addSavedQuiz: (result: QuizResult) => void;
  startLockIn: (input: LockInStart) => void;
  endLockIn: (completed: boolean) => void;
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addNote: (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFolder: (path: string) => void;
  deleteFolder: (path: string) => void;
  noteEditor: NoteEditor;
  openNoteEditor: (e: Exclude<NoteEditor, null>) => void;
  closeNoteEditor: () => void;
  newNote: () => void;
  newNoteIn: (folder: string, category: string) => void;
  composer: Composer;
  openComposer: (c: Exclude<Composer, null>) => void;
  closeComposer: () => void;
  resetData: () => void;
  subjects: StudySubject[];
  sessions: StudySession[];
  studySubjectId: string;
  selectSubject: (id: string) => void;
  studyFocus: StudyFocus | null;
  setStudyFocus: (f: StudyFocus | null) => void;
  currentSubject: StudySubject | undefined;
  startStudyFocus: (subjectId: string, topicId: string) => void;
  toggleTopic: (subjectId: string, topicId: string) => void;
  markTopicDone: (subjectId: string, topicId: string) => void;
  finishStudySession: (subjectId: string, topicId: string) => StudySession;
  subjectProgress: (s: StudySubject) => number;
  focusedSec: number;
  goals: Goal[];
  goalEditor: GoalEditor;
  openGoalEditor: (e: Exclude<GoalEditor, null>) => void;
  closeGoalEditor: () => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "updatedAt">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
   goalProgress: (goalId: string) => number;
   linkTaskToGoal: (taskId: string, goalId: string | null) => void;
   studyMaterials: StudyMaterial[];
   addStudyMaterial: (m: Omit<StudyMaterial, "id">) => StudyMaterial;
   updateStudyMaterial: (id: string, patch: Partial<StudyMaterial>) => void;
   deleteStudyMaterial: (id: string) => void;
    gamification: GamificationState;
    newAchievements: string[];
    aiStatus: AIStatus;
    setAiStatus: (s: AIStatus) => void;
    aiMessages: AIMessage[];
    setAiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>;
    aiGenerating: boolean;
    setAiGenerating: (b: boolean) => void;
    aiLoadProgress: { phase: string; percent: number } | null;
    setAiLoadProgress: (p: { phase: string; percent: number } | null) => void;
    projects: Project[];
    addProject: (p: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
    updateProject: (id: string, patch: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    projectEditor: ProjectEditor;
    openProjectEditor: (e: Exclude<ProjectEditor, null>) => void;
     closeProjectEditor: () => void;
     profileName: string;
     setProfileName: (n: string) => void;
     accent: string;
     setAccent: (a: string) => void;
quotesEnabled: boolean;
     setQuotesEnabled: (b: boolean) => void;
location: { city: string; lat: number; lon: number } | null;
      setLocation: (loc: { city: string; lat: number; lon: number } | null) => void;
clock24h: boolean;
       setClock24h: (b: boolean) => void;
       notificationsEnabled: boolean;
       setNotificationsEnabled: (b: boolean) => void;
       sessionReview: { kind: "study" | "lockin"; id: string } | null;
       openSessionReview: (kind: "study" | "lockin", id: string) => void;
submitSessionReview: (rating: number, note?: string) => void;
        dismissSessionReview: () => void;
  }

const OSContext = createContext<OSContextValue | null>(null);

function buildPlan(tasks: Task[], events: CalendarEvent[], today: string): PlanItem[] {
  const items: PlanItem[] = [];
  for (const e of events) {
    if (e.date !== today) continue;
    items.push({
      id: e.id,
      ref: e.id,
      kind: "event",
      time: e.startTime,
      title: e.title,
      mins: e.duration,
      done: false,
      priority: "mid",
      category: e.category,
    });
  }
  for (const t of tasks) {
    if (t.date !== today) continue;
    items.push({
      id: t.id,
      ref: t.id,
      kind: "task",
      time: t.startTime ?? "—",
      title: t.title,
      mins: t.duration,
      done: t.status === "completed",
      priority: t.priority === "high" ? "high" : "mid",
      category: t.category,
    });
  }
  items.sort((a, b) => a.time.localeCompare(b.time));
  return items;
}

function buildUpcoming(tasks: Task[], events: CalendarEvent[], today: string): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const e of events) {
    if (e.date <= today) continue;
    items.push({
      id: e.id,
      kind: e.kind === "exam" ? "exam" : "event",
      label: e.title,
      date: fmtWeekday(e.date),
      iso: e.date,
    });
  }
  for (const t of tasks) {
    if (t.date <= today || t.status === "completed") continue;
    items.push({
      id: t.id,
      kind: "deadline",
      label: t.title,
      date: fmtWeekday(t.date),
      iso: t.date,
    });
  }
  items.sort((a, b) => (a.iso ?? "").localeCompare(b.iso ?? ""));
  return items.slice(0, 5);
}

export function OSProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>("home");
  const [wallpaper, setWallpaper] = usePersistedState<string>(WALLPAPER_KEY, "dawn", {
    parse: (r) => (WALLPAPERS.some((w) => w.id === r) ? r : "dawn"),
    serialize: (v) => v,
  });
  const [wallpaperOpacity, setWallpaperOpacity] = usePersistedState<number>("studentos.wallpaperOpacity.v1", 100, {
    parse: (r) => { const n = parseFloat(r); return Number.isFinite(n) ? n : 100; },
    serialize: (n) => String(n),
  });
  const [wallpaperDim, setWallpaperDim] = usePersistedState<number>("studentos.wallpaperDim.v1", 12, {
    parse: (r) => { const n = parseFloat(r); return Number.isFinite(n) ? n : 12; },
    serialize: (n) => String(n),
  });
  const [wallpaperBlur, setWallpaperBlur] = usePersistedState<number>("studentos.wallpaperBlur.v1", 0, {
    parse: (r) => { const n = parseFloat(r); return Number.isFinite(n) ? n : 0; },
    serialize: (n) => String(n),
  });
  const [wallpaperFavorites, setWallpaperFavorites] = usePersistedState<string[]>("studentos.wallpaperFav.v1", []);
  const [wallpaperRecent, setWallpaperRecent] = usePersistedState<string[]>("studentos.wallpaperRecent.v1", []);
  const [dynamicAtmosphere, setDynamicAtmosphere] = usePersistedState<boolean>("studentos.wallpaperDynamic.v1", false, {
    parse: (r) => r === "1",
    serialize: (b) => (b ? "1" : "0"),
  });
  const [autoChange, setAutoChange] = usePersistedState<"never" | "daily" | "startup">("studentos.wallpaperAuto.v1", "never", {
    parse: (r) => (r === "daily" || r === "startup" ? r : "never"),
    serialize: (v) => v,
  });
  const [theme, setTheme] = usePersistedState<Theme>(THEME_KEY, systemTheme(), {
    parse: (r) => (r === "light" || r === "dark" ? r : systemTheme()),
    serialize: (t) => t,
  });
  const [tasks, setTasks] = usePersistedState<Task[]>(TASKS_KEY, seedTasks);
  const [events, setEvents] = usePersistedState<CalendarEvent[]>(EVENTS_KEY, seedEvents);
  const [notes, setNotes] = usePersistedState<Note[]>(NOTES_KEY, seedNotes);
  const [folders, setFolders] = usePersistedState<string[]>(FOLDERS_KEY, seedFolders);
  const [seconds, setSeconds] = useState(FOCUS_LEN);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [set] = useState(SESSIONS_PER_SET);
  const [focusLen, setFocusLen] = useState(FOCUS_LEN);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [breakType, setBreakType] = useState<"short" | "long">("short");
  const [breakLen, setBreakLen] = useState(BREAK_LEN / 60);
  const [composer, setComposer] = useState<Composer>(null);
  const [noteEditor, setNoteEditor] = useState<NoteEditor>(null);
  const [subjects, setSubjects] = usePersistedState<StudySubject[]>(SUBJECTS_KEY, seedSubjects);
  const [sessions, setSessions] = usePersistedState<StudySession[]>(SESSIONS_KEY, seedSessions);
  const [studySubjectId, setStudySubjectId] = usePersistedState<string>(SUBJECT_KEY, "bio");
  const [studyFocus, setStudyFocus] = usePersistedState<StudyFocus | null>(FOCUS_KEY, null, {
    serialize: (f) => (f ? JSON.stringify(f) : null),
  });
  const [focusedSec, setFocusedSec] = useState(0);
  const [goals, setGoals] = usePersistedState<Goal[]>(GOALS_KEY, seedGoals);
  const [goalEditor, setGoalEditor] = useState<GoalEditor>(null);
  const [lockinSessions, setLockinSessions] = usePersistedState<LockInSession[]>(LOCKIN_KEY, []);
  const [reviewCards, setReviewCards] = usePersistedState<ReviewCard[]>(REVIEW_KEY, []);
  const [studyMaterials, setStudyMaterials] = usePersistedState<StudyMaterial[]>(STUDY_MATERIALS_KEY, []);
  const [savedQuizzes, setSavedQuizzes] = usePersistedState<SavedQuiz[]>(QUIZ_KEY, []);
  const [gamification, setGamification] = usePersistedState<GamificationState>(GAMIFICATION_KEY, initialGamificationState);
  const [aiStatus, setAiStatus] = usePersistedState<AIStatus>(AI_KEY, "not_installed", {
    parse: (r) => {
      try { const v = JSON.parse(r) as AIStatus; return v === "loading" ? "not_installed" : v; }
      catch { return "not_installed"; }
    },
    serialize: (s) => (s === "loading" ? null : JSON.stringify(s)),
  });
  const [aiMessages, setAiMessages] = usePersistedState<AIMessage[]>(AI_MESSAGES_KEY, [], {
    // Cap at 200 messages (100 exchanges) to avoid localStorage bloat
    serialize: (m) => JSON.stringify(m.length > 200 ? m.slice(-200) : m),
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiLoadProgress, setAiLoadProgress] = useState<{ phase: string; percent: number } | null>(null);
  const [projects, setProjects] = usePersistedState<Project[]>(PROJECTS_KEY, seedProjects);
  const [projectEditor, setProjectEditor] = useState<ProjectEditor>(null);
  const [profileName, setProfileName] = usePersistedState<string>(PROFILE_KEY, "Lucky");
  const [accent, setAccent] = usePersistedState<string>(ACCENT_KEY, "blue");
  const [quotesEnabled, setQuotesEnabled] = usePersistedState<boolean>(QUOTES_KEY, true);
  const [location, setLocation] = usePersistedState<{ city: string; lat: number; lon: number } | null>(LOCATION_KEY, null, {
    serialize: (l) => (l ? JSON.stringify(l) : null),
  });
  const [clock24h, setClock24h] = usePersistedState<boolean>(CLOCK24H_KEY, true);
  const [notificationsEnabled, setNotificationsEnabled] = usePersistedState<boolean>("studentos.notificationsEnabled.v1", true, {
    parse: (r) => r !== "0",
    serialize: (b) => (b ? "1" : "0"),
  });
  const [sessionReview, setSessionReview] = useState<{ kind: "study" | "lockin"; id: string } | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 0 : s - 1));
      if (phase === "focus") setFocusedSec((f) => f + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    if (!running || seconds !== 0) return;
    if (phase === "focus") {
      setLockinSessions((prev) =>
        prev.map((ls) =>
          ls.status === "active"
            ? {
                ...ls,
                focusedMin: Math.min(ls.plannedMin, Math.max(1, Math.round(focusLen / 60))),
                endedAt: new Date().toISOString(),
                status: "completed",
              }
            : ls,
        ),
      );
      if (session >= SESSIONS_PER_SET) {
        setSession(1);
        setBreakType("long");
        setPhase("break");
        setSeconds(LONG_BREAK_LEN);
        if (notificationsEnabled) notify("Long break", "You earned it — rest up.");
      } else {
        setSession((x) => x + 1);
        setBreakType("short");
        setPhase("break");
        setSeconds(BREAK_LEN);
        if (notificationsEnabled) notify("Break time", "Short break — stretch a little.");
      }
    } else {
      setPhase("focus");
      setSeconds(focusLen);
      if (notificationsEnabled) notify("Focus time", "Back to it.");
    }
  }, [running, seconds, phase, session, focusLen, notificationsEnabled]);

  const today = todayISO();

  const plan = useMemo(() => buildPlan(tasks, events, today), [tasks, events, today]);
  const nowTask = useMemo(
    () => plan.find((p) => !p.done && p.kind === "task"),
    [plan],
  );
  const upcoming = useMemo(() => buildUpcoming(tasks, events, today), [tasks, events, today]);
  const overdue = useMemo(
    () => tasks.filter((t) => t.date < today && t.status !== "completed"),
    [tasks, today],
  );

  const togglePlan = (id: string) => {
    setTasks((prev: Task[]) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      const wasCompleted = task.status === "completed";
      const updated: Task[] = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: wasCompleted ? "todo" : "completed",
              updatedAt: new Date().toISOString(),
              completedAt: wasCompleted ? undefined : new Date().toISOString(),
            }
          : t,
      );
      if (!wasCompleted) {
        const xp = xpForTask(task.priority);
        setGamification((g) => awardXP(g, xp, { totalTasksCompleted: 1 }));
      }
      return updated;
    });
  };

  const addTask = (t: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    setTasks((prev) => [...prev, { ...t, id: uid("task"), createdAt: now, updatedAt: now }]);
  };

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)),
    );

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addEvent = (e: Omit<CalendarEvent, "id">) =>
    setEvents((prev) => [...prev, { ...e, id: uid("ev") }]);

  const updateEvent = (id: string, patch: Partial<CalendarEvent>) =>
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)));

  const deleteEvent = (id: string) => setEvents((prev) => prev.filter((ev) => ev.id !== id));

  const addProject = (p: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    setProjects((prev) => [...prev, { ...p, id: uid("proj"), createdAt: now, updatedAt: now }]);
  };

  const updateProject = (id: string, patch: Partial<Project>) =>
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    );

  const deleteProject = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  const addNote = (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const id = uid("note");
    setNotes((prev) => [...prev, { ...n, id, createdAt: now, updatedAt: now }]);
    return id;
  };

  const updateNote = (id: string, patch: Partial<Note>) =>
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
    );

  const deleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const addFolder = (path: string) => {
    const p = path.replace(/^\/+|\/+$/g, "");
    if (!p || folders.includes(p)) return;
    setFolders((prev) => [...prev, p]);
  };

  const deleteFolder = (path: string) =>
    setFolders((prev) => prev.filter((f) => f !== path && !f.startsWith(path + "/")));

  const addGoal = (g: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    setGoals((prev) => [...prev, { ...g, id: uid("goal"), createdAt: now, updatedAt: now }]);
  };

  const updateGoal = (id: string, patch: Partial<Goal>) =>
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g)),
    );

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t)));
  };

  const goalProgress = (goalId: string) => {
    const linked = tasks.filter((t) => t.goalId === goalId);
    if (!linked.length) return 0;
    return Math.round((linked.filter((t) => t.status === "completed").length / linked.length) * 100);
  };

  const linkTaskToGoal = (taskId: string, goalId: string | null) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, goalId: goalId ?? undefined } : t)),
    );

  const addStudyMaterial = (m: Omit<StudyMaterial, "id">): StudyMaterial => {
    const material: StudyMaterial = { ...m, id: uid("mat") };
    setStudyMaterials((prev) => [material, ...prev]);
    return material;
  };

  const updateStudyMaterial = (id: string, patch: Partial<StudyMaterial>) =>
    setStudyMaterials((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
      ),
    );

  const deleteStudyMaterial = (id: string) => {
    setStudyMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const newNote = () => {
    const id = addNote({
      title: "",
      content: "",
      category: "Ideas",
      tags: [],
      folder: "Personal/Notes",
      favorite: false,
      pinned: false,
      taskId: null,
      project: null,
    });
    setNoteEditor({ mode: "edit", id });
  };

  const newNoteIn = (folder: string, category: string) => {
    const id = addNote({
      title: "",
      content: "",
      category,
      tags: [],
      folder,
      favorite: false,
      pinned: false,
      taskId: null,
      project: null,
    });
    setNoteEditor({ mode: "edit", id });
  };

  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === studySubjectId),
    [subjects, studySubjectId],
  );

  const subjectProgress = (s: StudySubject) =>
    s.topics.length ? Math.round((s.topics.filter((t) => t.done).length / s.topics.length) * 100) : 0;

  const selectSubject = (id: string) => {
    setStudySubjectId(id);
    if (!studyFocus) {
      const s = subjects.find((x) => x.id === id);
      const t = s?.topics.find((x) => !x.done);
      if (s && t) setStudyFocus({ subjectId: id, topicId: t.id });
    }
  };

  const startStudyFocus = (subjectId: string, topicId: string) => {
    setStudyFocus({ subjectId, topicId });
    setFocusedSec(0);
    setFocusLen(FOCUS_LEN);
    setSeconds(FOCUS_LEN);
    setRunning(true);
  };

  const toggleTopic = (subjectId: string, topicId: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) => (t.id === topicId ? { ...t, done: !t.done } : t)),
            }
          : s,
      ),
    );

  const markTopicDone = (subjectId: string, topicId: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              topics: s.topics.map((t) => (t.id === topicId ? { ...t, done: true } : t)),
            }
          : s,
      ),
    );

  const finishStudySession = (subjectId: string, topicId: string): StudySession => {
    const subj = subjects.find((s) => s.id === subjectId);
    const topic = subj?.topics.find((t) => t.id === topicId);
    const wasDone = topic?.done ?? false;
    const delta =
      subj && subj.topics.length && !wasDone
        ? Math.round((1 / subj.topics.length) * 100)
        : 0;
    const focusedMinutes = Math.max(1, Math.round(focusedSec / 60));
    const studyTask = tasks.find(
      (t) => t.category === "Study" && t.status !== "completed",
    );
    if (studyTask) updateTask(studyTask.id, { status: "completed" });
    if (!wasDone) markTopicDone(subjectId, topicId);
    const session: StudySession = {
      id: uid("session"),
      subjectId,
      topicId,
      topicTitle: topic?.title ?? "Study",
      focusedMinutes,
      tasksCompleted: studyTask ? 1 : 0,
      notesCreated: 0,
      progressDelta: delta,
      endedAt: new Date().toISOString(),
    };
    setSessions((prev) => [session, ...prev]);
    setFocusedSec(0);
    setSessionReview({ kind: "study", id: session.id });
    const xp = 15 * Math.ceil(session.focusedMinutes / 25);
    setGamification((prev) => awardXP(prev, xp, { totalStudyMinutes: session.focusedMinutes }));
    return session;
  };

  const startLockIn = (input: LockInStart) => {
    const now = new Date().toISOString();
    const session: LockInSession = {
      id: uid("lockin"),
      title: input.title,
      taskId: input.taskId ?? null,
      goalId: input.goalId ?? null,
      subjectId: input.subjectId ?? null,
      category: input.category ?? "Focus",
      plannedMin: input.plannedMin,
      focusedMin: 0,
      startedAt: now,
      endedAt: null,
      status: "active",
    };
    setLockinSessions((prev) => [session, ...prev.filter((s) => s.status !== "active")]);
    setFocusLen(input.plannedMin * 60);
    setSeconds(input.plannedMin * 60);
    setSession(1);
    setRunning(true);
    if (input.taskId) updateTask(input.taskId, { status: "in-progress" });
  };

  const endLockIn = (completed: boolean) => {
    const active = lockinSessions.find((s) => s.status === "active");
    if (!active) return;
    const focusedMin = Math.max(1, Math.round((focusLen - seconds) / 60));
    setLockinSessions((prev) =>
      prev.map((s) =>
        s.id === active.id
          ? {
              ...s,
              focusedMin: Math.min(active.plannedMin, focusedMin),
              endedAt: new Date().toISOString(),
              status: completed ? "completed" : "abandoned",
            }
          : s,
      ),
    );
    if (completed && active.taskId) updateTask(active.taskId, { status: "completed" });
    if (completed) setSessionReview({ kind: "lockin", id: active.id });
    setSeconds(focusLen);
    setRunning(false);
    setSession(1);
    setFocusLen(FOCUS_LEN);
    if (completed) {
      setGamification((prev) => awardXP(prev, 20, { totalLockInMinutes: focusedMin }));
    }
  };

  const openSessionReview = (kind: "study" | "lockin", id: string) => setSessionReview({ kind, id });

  const submitSessionReview = (rating: number, note?: string) => {
    if (!sessionReview) return;
    const { kind, id } = sessionReview;
    if (kind === "study") {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, rating, note: note?.trim() || undefined } : s)));
    } else {
      setLockinSessions((prev) => prev.map((s) => (s.id === id ? { ...s, rating, note: note?.trim() || undefined } : s)));
    }
    setSessionReview(null);
  };

  const dismissSessionReview = () => setSessionReview(null);

  const resetData = () => {
    setTasks(seedTasks);
    setEvents(seedEvents);
    setNotes(seedNotes);
    setFolders(seedFolders);
    setSubjects(seedSubjects);
    setSessions(seedSessions);
    setStudySubjectId("bio");
    setStudyFocus(null);
    setGoals(seedGoals);
    setGoalEditor(null);
    setLockinSessions([]);
    setFocusLen(FOCUS_LEN);
    setSeconds(FOCUS_LEN);
    setFocusedSec(0);
    setRunning(false);
    setGamification(initialGamificationState);
    setAiStatus("not_installed");
    setAiMessages([]);
    setAiGenerating(false);
    setProjects(seedProjects);
    setProjectEditor(null);
    setProfileName("Lucky");
    setAccent("blue");
    setQuotesEnabled(true);
    setLocation(null);
    setClock24h(true);
    setNotificationsEnabled(true);
  };

  const applyWallpaper = (wp: string) => {
    setWallpaper(wp);
    setWallpaperRecent((prev) => [wp, ...prev.filter((x) => x !== wp)].slice(0, 6));
  };

  const toggleWallpaperFavorite = (id: string) => {
    setWallpaperFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const randomizeWallpaper = () => {
    const pool = WALLPAPERS.filter((w) => w.id !== wallpaper);
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) applyWallpaper(next.id);
  };

  useEffect(() => {
    if (autoChange === "never") return;
    const last = localStorage.getItem("studentos.wallpaperAutoDate.v1");
    const todayKey = todayISO();
    if (last === todayKey) return;
    localStorage.setItem("studentos.wallpaperAutoDate.v1", todayKey);
    const pool = WALLPAPERS.filter((w) => w.id !== wallpaper);
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (next) applyWallpaper(next.id);
  }, [autoChange]);

  const value: OSContextValue = {
    page,
    navigate: setPage,
    wallpaper,
    setWallpaper: applyWallpaper,
    wallpaperOpacity,
    setWallpaperOpacity,
    wallpaperDim,
    setWallpaperDim,
    wallpaperBlur,
    setWallpaperBlur,
    wallpaperFavorites,
    toggleWallpaperFavorite,
    wallpaperRecent,
    dynamicAtmosphere,
    setDynamicAtmosphere,
    autoChange,
    setAutoChange,
    randomizeWallpaper,
    theme,
    setTheme,
    today,
    plan,
    togglePlan,
    nowTask,
    timer: {
      seconds,
      running,
      session,
      set,
      focusLen,
      phase,
      breakType,
      breakLen,
      setBreakLen,
      target: phase === "focus" ? focusLen : (breakType === "long" ? LONG_BREAK_LEN : breakLen * 60),
      toggle: () => setRunning((r) => !r),
      reset: () => {
        setRunning(false);
        setPhase("focus");
        setSeconds(focusLen);
        setSession(1);
      },
    },
    tasks,
    events,
    notes,
    folders,
    upcoming,
    overdue,
    reviewCards,
    addReviewCards: (fresh: ReviewCard[]) => setReviewCards((prev) => mergeDeck(prev, fresh)),
    gradeReview: (id: string, grade: 0 | 1 | 2 | 3 | 4) => {
      setReviewCards((prev) => prev.map((c) => (c.id === id ? gradeCard(c, grade) : c)));
      setGamification((prev) => awardXP(prev, 2, { totalCardsReviewed: 1 }));
    },
    dueReviews: due(reviewCards),
    savedQuizzes,
    addSavedQuiz: (result: QuizResult) => {
      setSavedQuizzes((prev) => [{ id: `quiz-${Date.now()}`, title: result.title, savedAt: Date.now(), result }, ...prev]);
      const correct = result.questions.length;
      setGamification((prev) => awardXP(prev, 5 * correct, { totalQuizzesCompleted: 1, totalQuizCorrect: correct }));
    },
    lockinActive: lockinSessions.find((s) => s.status === "active") ?? null,
    lockinHistory: lockinSessions.filter((s) => s.status !== "active"),
    startLockIn,
    endLockIn,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    updateEvent,
    deleteEvent,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    deleteFolder,
    noteEditor,
    openNoteEditor: setNoteEditor,
    closeNoteEditor: () => setNoteEditor(null),
    newNote,
    newNoteIn,
    composer,
    openComposer: setComposer,
    closeComposer: () => setComposer(null),
    resetData,
    subjects,
    sessions,
    studySubjectId,
    selectSubject,
    studyFocus,
    setStudyFocus,
    currentSubject,
    startStudyFocus,
    toggleTopic,
    markTopicDone,
    finishStudySession,
    subjectProgress,
    focusedSec,
    goals,
    goalEditor,
    openGoalEditor: setGoalEditor,
    closeGoalEditor: () => setGoalEditor(null),
    addGoal,
    updateGoal,
    deleteGoal,
    goalProgress,
     linkTaskToGoal,
     studyMaterials,
     addStudyMaterial,
     updateStudyMaterial,
     deleteStudyMaterial,
      gamification,
      newAchievements: gamification.achievements,
      aiStatus,
      setAiStatus,
      aiMessages,
      setAiMessages,
      aiGenerating,
      setAiGenerating,
      aiLoadProgress,
      setAiLoadProgress,
      projects,
      addProject,
      updateProject,
      deleteProject,
      projectEditor,
      openProjectEditor: setProjectEditor,
      closeProjectEditor: () => setProjectEditor(null),
      profileName,
      setProfileName,
      accent,
      setAccent,
      quotesEnabled,
      setQuotesEnabled,
      location,
      setLocation,
      clock24h,
      setClock24h,
      notificationsEnabled,
      setNotificationsEnabled,
      sessionReview,
      openSessionReview,
      submitSessionReview,
      dismissSessionReview,
    };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error("useOS must be used inside OSProvider");
  return ctx;
}

export { addDaysISO };