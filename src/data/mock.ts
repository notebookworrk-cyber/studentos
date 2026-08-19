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

export const seedTasks: Task[] = [];

export const seedEvents: CalendarEvent[] = [];

export const projects: Project[] = [];

export const seedGoals: Goal[] = [];

export const seedFolders: string[] = [];

export const seedNotes: Note[] = [];

export const seedSubjects: StudySubject[] = [];

export const practiceQuestions: PracticeQuestion[] = [];

export const studyVideos: { id: string; title: string; channel: string; duration: string; url: string }[] = [];

export const seedSessions: StudySession[] = [];

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