import { addDaysISO, todayISO } from "../lib/date";
import type {
  CalendarEvent,
  Goal,
  Note,
  PracticeQuestion,
  Project,
  StudySession,
  StudySubject,
  Task,
} from "../types";
const T = todayISO();

export const seedTasks: Task[] = [
  {
    id: "t1",
    title: "Physics Revision",
    description: "Optics formulas, mirror & lens equations",
    date: T,
    startTime: "09:00",
    duration: 45,
    priority: "high",
    status: "completed",
    category: "Study",
    project: null,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: "t2",
    title: "Chemistry Practice",
    description: "Chemical bonding and equations practice set",
    date: T,
    startTime: "15:30",
    duration: 60,
    priority: "high",
    status: "todo",
    category: "Study",
    project: null,
    goalId: "g1",
    createdAt: T,
    updatedAt: T,
  },
  {
    id: "t3",
    title: "StudentOS Development",
    description: "Build the Calendar + Tasks foundation",
    date: T,
    startTime: "18:00",
    duration: 90,
    priority: "medium",
    status: "todo",
    category: "Project",
    project: "StudentOS 2.0",
    goalId: "g2",
    createdAt: T,
    updatedAt: T,
  },
  {
    id: "t4",
    title: "Biology assignment",
    description: "Cell cycle worksheet, due Sunday",
    date: addDaysISO(T, 4),
    startTime: null,
    duration: 40,
    priority: "high",
    status: "todo",
    category: "Study",
    project: null,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: "t5",
    title: "Review calculus notes",
    description: "Integration by parts examples",
    date: addDaysISO(T, -1),
    startTime: null,
    duration: 30,
    priority: "medium",
    status: "todo",
    category: "Study",
    project: null,
    createdAt: T,
    updatedAt: T,
  },
];

export const seedEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "School",
    date: T,
    startTime: "11:00",
    duration: 255,
    category: "Life",
    kind: "class",
  },
  {
    id: "e2",
    title: "Chemistry Test",
    date: addDaysISO(T, 2),
    startTime: "09:00",
    duration: 45,
    category: "Exam",
    kind: "exam",
  },
  {
    id: "e3",
    title: "StudentOS milestone",
    date: addDaysISO(T, 5),
    startTime: "16:00",
    duration: 30,
    category: "Project",
    kind: "event",
  },
];

export const projects: Project[] = [
  { id: "p1", name: "StudentOS 2.0", description: "Operating system for students — AI-powered study environment", color: "#3b82f6", progress: 34, lastActivity: "Today", status: "active", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-08-13T00:00:00Z" },
  { id: "p2", name: "Physics Notes", description: "Exam revision notes and problem sets", color: "#8b5cf6", progress: 68, lastActivity: "Yesterday", status: "active", createdAt: "2026-05-15T00:00:00Z", updatedAt: "2026-08-12T00:00:00Z" },
  { id: "p3", name: "AI Healthcare", description: "Machine learning models for medical diagnosis", color: "#22c55e", progress: 21, lastActivity: "This week", status: "paused", createdAt: "2026-07-01T00:00:00Z", updatedAt: "2026-08-08T00:00:00Z" },
];

const iso = (offsetMin: number) => new Date(Date.now() - offsetMin * 60000).toISOString();

export const seedGoals: Goal[] = [
  {
    id: "g1",
    title: "Prepare for Chemistry Test",
    description: "Master chemical bonding and equations before Friday.",
    category: "Study",
    deadline: addDaysISO(T, 2),
    priority: "critical",
    active: true,
    createdAt: iso(60 * 24 * 5),
    updatedAt: iso(60),
  },
  {
    id: "g2",
    title: "Finish StudentOS Home redesign",
    description: "Premium Home command center with real data everywhere.",
    category: "Project",
    deadline: null,
    priority: "important",
    active: true,
    createdAt: iso(60 * 24 * 8),
    updatedAt: iso(60 * 24),
  },
  {
    id: "g3",
    title: "Complete Biology chapter",
    description: "Cell cycle and division material before the assignment.",
    category: "Study",
    deadline: addDaysISO(T, 4),
    priority: "important",
    active: true,
    createdAt: iso(60 * 24 * 3),
    updatedAt: iso(60 * 24 * 2),
  },
];

export const seedFolders: string[] = [
  "Study/Biology",
  "Study/Chemistry",
  "Study/Physics",
  "Study/Computer Science",
  "Research/Papers",
  "Research/Sources",
  "Research/Ideas",
  "Projects/StudentOS",
  "Projects/Physics Notes",
  "Projects/AI Healthcare",
  "Personal/Notes",
  "Personal/Ideas",
];

export const seedNotes: Note[] = [
  {
    id: "n1",
    title: "Cell Cycle — Biology",
    content:
      "Interphase: G1 (growth), S (DNA replication), G2 (preparation). Mitosis: prophase, metaphase, anaphase, telophase. Checkpoints: G1/S, G2/M, M (spindle assembly). Cell division produces two genetically identical daughter cells.",
    category: "Biology",
    tags: ["mitosis", "interphase"],
    folder: "Study/Biology",
    favorite: true,
    pinned: true,
    taskId: null,
    project: null,
    createdAt: iso(60 * 24 * 3),
    updatedAt: iso(2),
  },
  {
    id: "n2",
    title: "StudentOS Architecture",
    content:
      "Layered shell over Vite + React 18. Glass primitives (tokens.css, ui.css). Mock-data seams so the shell never talks to a backend directly. OS context (state/os.tsx) is the single source of truth for tasks, events, notes, and navigation.",
    category: "Code",
    tags: ["react", "architecture"],
    folder: "Projects/StudentOS",
    favorite: true,
    pinned: false,
    taskId: "t3",
    project: "StudentOS 2.0",
    createdAt: iso(60 * 24 * 10),
    updatedAt: iso(60),
  },
  {
    id: "n3",
    title: "AI Agent Ideas",
    content:
      "Study planner that schedules from tasks. Note summarizer that turns class notes into revision cards. Deadline radar that nudges before tests. Project-aware assistant that reads the Projects folder and proposes next steps.",
    category: "Research",
    tags: ["ai", "planning"],
    folder: "Research/Ideas",
    favorite: false,
    pinned: false,
    taskId: null,
    project: null,
    createdAt: iso(60 * 24 * 2),
    updatedAt: iso(60 * 24),
  },
  {
    id: "n4",
    title: "Physics Revision",
    content:
      "Optics formulas: mirror equation 1/f = 1/u + 1/v. Lens formula and sign conventions. Ray diagrams for concave/convex mirrors and lenses. Magnification m = v/u.",
    category: "Physics",
    tags: ["optics", "formulas"],
    folder: "Study/Physics",
    favorite: false,
    pinned: false,
    taskId: "t1",
    project: null,
    createdAt: iso(60 * 24 * 4),
    updatedAt: iso(60 * 24),
  },
  {
    id: "n5",
    title: "AI Healthcare Notes",
    content:
      "Potential architecture: patient data intake, symptom triage, document analysis. Must keep the diagnosis step human-in-the-loop. Prioritize privacy and consent before any model call.",
    category: "Project",
    tags: ["healthcare"],
    folder: "Projects/AI Healthcare",
    favorite: false,
    pinned: false,
    taskId: null,
    project: "AI Healthcare",
    createdAt: iso(60 * 24 * 6),
    updatedAt: iso(60 * 24 * 3),
  },
];

export const quickActions: { label: string; icon: string; page: string }[] = [
  { label: "New Note", icon: "note", page: "notes" },
  { label: "Add Task", icon: "check", page: "tasks" },
  { label: "Start Focus", icon: "play", page: "home" },
  { label: "Open Calendar", icon: "calendar", page: "calendar" },
  { label: "Ask AI", icon: "ai", page: "ai" },
  { label: "Start Lock-In", icon: "lock", page: "lockin" },
];

export const seedSubjects: StudySubject[] = [
  {
    id: "bio",
    name: "Biology",
    objective: "Understand mitosis and meiosis",
    color: "#59d69a",
    folder: "Study/Biology",
    topics: [
      { id: "b-cell", title: "Cell Structure", done: true },
      { id: "b-cycle", title: "Cell Cycle", done: false },
      { id: "b-division", title: "Cell Division", done: false },
      { id: "b-genetics", title: "Genetics", done: false },
    ],
  },
  {
    id: "chem",
    name: "Chemistry",
    objective: "Master chemical bonding",
    color: "#4fd6e8",
    folder: "Study/Chemistry",
    topics: [
      { id: "c-structure", title: "Atomic Structure", done: true },
      { id: "c-bonding", title: "Chemical Bonding", done: false },
      { id: "c-stoich", title: "Equations & Stoichiometry", done: false },
      { id: "c-acids", title: "Acids & Bases", done: false },
    ],
  },
  {
    id: "phys",
    name: "Physics",
    objective: "Master rotation and optics",
    color: "#5f9dff",
    folder: "Study/Physics",
    topics: [
      { id: "p-rot", title: "Rotational Motion", done: false },
      { id: "p-optics", title: "Optics", done: false },
      { id: "p-waves", title: "Waves", done: false },
      { id: "p-energy", title: "Work & Energy", done: true },
    ],
  },
  {
    id: "cs",
    name: "Computer Science",
    objective: "Foundations of programming",
    color: "#9a7bff",
    folder: "Study/Computer Science",
    topics: [
      { id: "cs-py", title: "Python Basics", done: true },
      { id: "cs-ds", title: "Data Structures", done: false },
      { id: "cs-algo", title: "Algorithms", done: false },
      { id: "cs-db", title: "Databases", done: false },
    ],
  },
];

export const practiceQuestions: PracticeQuestion[] = [
  {
    id: "q1",
    question: "During which phase of the cell cycle does DNA replication occur?",
    options: ["G1", "S", "G2", "M"],
    answer: 1,
    explanation: "DNA replication happens during the S (synthesis) phase of interphase.",
  },
  {
    id: "q2",
    question: "How many daughter cells result from one mitotic division?",
    options: ["1", "2", "4", "8"],
    answer: 1,
    explanation: "Mitosis produces two genetically identical diploid daughter cells.",
  },
  {
    id: "q3",
    question: "Which phase of mitosis immediately precedes cytokinesis?",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    answer: 3,
    explanation: "After telophase, the cytoplasm divides during cytokinesis.",
  },
  {
    id: "q4",
    question: "The G1/S checkpoint primarily checks for…",
    options: ["DNA damage and cell size", "Spindle attachment", "Chromosome alignment", "Nuclear envelope integrity"],
    answer: 0,
    explanation: "The G1/S checkpoint ensures the cell is ready and DNA is undamaged before replication.",
  },
  {
    id: "q5",
    question: "Sister chromatids are pulled apart during…",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    answer: 2,
    explanation: "During anaphase, sister chromatids separate toward opposite poles.",
  },
];

export const studyVideos: { id: string; title: string; channel: string; duration: string; url: string }[] = [
  {
    id: "v1",
    title: "The Cell Cycle and Mitosis Explained",
    channel: "Amoeba Sisters",
    duration: "8:12",
    url: "https://www.youtube.com/results?search_query=cell+cycle+mitosis",
  },
  {
    id: "v2",
    title: "Mitosis: Splitting Up is Complicated",
    channel: "Crash Course",
    duration: "10:47",
    url: "https://www.youtube.com/results?search_query=mitosis+crash+course",
  },
  {
    id: "v3",
    title: "Cell Cycle Checkpoints",
    channel: "Khan Academy",
    duration: "5:30",
    url: "https://www.youtube.com/results?search_query=cell+cycle+checkpoints",
  },
];

export const seedSessions: StudySession[] = [
  {
    id: "s1",
    subjectId: "bio",
    topicId: "b-cycle",
    topicTitle: "Cell Cycle",
    focusedMinutes: 42,
    tasksCompleted: 2,
    notesCreated: 1,
    progressDelta: 8,
    endedAt: iso(150),
  },
  {
    id: "s2",
    subjectId: "phys",
    topicId: "p-optics",
    topicTitle: "Optics",
    focusedMinutes: 25,
    tasksCompleted: 1,
    notesCreated: 0,
    progressDelta: 0,
    endedAt: iso(60 * 24),
  },
];

export const pageMeta: Record<string, { title: string; subtitle: string; sections: string[] }> = {
  home: {
    title: "Home",
    subtitle: "Your day, at a glance.",
    sections: ["Now", "Today", "Focus"],
  },
  planning: {
    title: "Planning",
    subtitle: "Goals, priorities, and the schedule that makes them real.",
    sections: ["Goals", "Day planner", "Week overview", "Plan review"],
  },
  calendar: {
    title: "Calendar",
    subtitle: "Your month, weeks, and deadlines in one view.",
    sections: ["Month grid", "Week agenda", "Deadline highlights"],
  },
  tasks: {
    title: "Tasks",
    subtitle: "Everything you need to get done, prioritized.",
    sections: ["Today's list", "Smart priorities", "Recurring tasks"],
  },
  notes: {
    title: "Notes",
    subtitle: "A quiet place for ideas, classes, and research.",
    sections: ["All notes", "Collections", "Quick capture"],
  },
  timer: {
    title: "Timer",
    subtitle: "Focus sessions and study rhythms.",
    sections: ["Pomodoro", "Session history", "Goals"],
  },
  study: {
    title: "Study Mode",
    subtitle: "Your focused learning workspace is being built.",
    sections: ["NotebookLM", "YouTube", "Study timer", "Notes"],
  },
  projects: {
    title: "Projects",
    subtitle: "The work you're shipping, tracked together.",
    sections: ["Active projects", "Milestones", "Activity"],
  },
  code: {
    title: "Code",
    subtitle: "Editor, terminal, and your dev toolchain.",
    sections: ["OpenCode", "GitHub", "Terminal", "Editor"],
  },
  research: {
    title: "Research",
    subtitle: "Gather sources and reason about problems.",
    sections: ["Collections", "Annotations", "Synthesis"],
  },
  ai: {
    title: "StudentOS AI",
    subtitle: "Your layer over every model you choose to connect.",
    sections: ["Providers", "Assistant", "Context"],
  },
  files: {
    title: "Files",
    subtitle: "Your documents, exactly where you need them.",
    sections: ["Recent files", "Folders", "Search"],
  },
  browser: {
    title: "Browser",
    subtitle: "A browser that lives inside your workspace.",
    sections: ["Tabs", "Bookmarks", "Reading list"],
  },
  terminal: {
    title: "Terminal",
    subtitle: "The shell, always one keystroke away.",
    sections: ["Shell", "Sessions", "Snippets"],
  },
  lockin: {
    title: "Lock-In",
    subtitle: "Set a goal. Remove distractions. Finish it.",
    sections: ["Sessions", "Rules", "History"],
  },
  stats: {
    title: "Stats",
    subtitle: "Your progress and achievements.",
    sections: [],
  },
  settings: {
    title: "Settings",
    subtitle: "Wallpaper, appearance, and how StudentOS feels.",
    sections: ["Wallpaper", "Appearance", "Accounts"],
  },
};
