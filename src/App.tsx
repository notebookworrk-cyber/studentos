import { lazy, Suspense, useEffect, useState } from "react";
import { OSProvider, useOS } from "./state/os";
import { Sidebar } from "./components/Sidebar";
import { Wallpaper } from "./components/Wallpaper";
import { CommandPalette } from "./components/CommandPalette";
import { Toasts } from "./components/Toasts";
import { AchievementToast } from "./components/AchievementToast";
import { NotificationEngine } from "./components/notifications/NotificationEngine";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { SessionReviewModal } from "./components/SessionReviewModal";
import { Placeholder } from "./components/Placeholder";
import { TaskDialog } from "./components/tasks/TaskDialog";
import { EventDialog } from "./components/calendar/EventDialog";
import { GoalDialog } from "./components/planning/GoalDialog";
import { ProjectDialog } from "./components/projects/ProjectDialog";
import { Icon } from "./components/Icon";
import { pageMeta } from "./data/mock";
import { maybeAutoBackup } from "./lib/backup";

const Home = lazy(() => import("./components/home/Home").then((m) => ({ default: m.Home })));
const TasksPage = lazy(() => import("./components/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import("./components/calendar/v2/NewCalendar").then((m) => ({ default: m.NewCalendar })));
const NotesPage = lazy(() => import("./components/notes/NotesPage").then((m) => ({ default: m.NotesPage })));
const FilesPage = lazy(() => import("./components/files/FilesPage").then((m) => ({ default: m.FilesPage })));
const StudyPage = lazy(() => import("./components/study/StudyPage").then((m) => ({ default: m.StudyPage })));
const PlanningPage = lazy(() => import("./components/planning/PlanningPage").then((m) => ({ default: m.PlanningPage })));
const LockInPage = lazy(() => import("./components/lockin/LockInPage").then((m) => ({ default: m.LockInPage })));
const TimerPage = lazy(() => import("./components/timer/TimerPage").then((m) => ({ default: m.TimerPage })));
const ProjectsPage = lazy(() => import("./components/projects/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const ResearchPage = lazy(() => import("./components/research/ResearchPage").then((m) => ({ default: m.ResearchPage })));
const AIPage = lazy(() => import("./components/ai/AIPage").then((m) => ({ default: m.AIPage })));
const SettingsPage = lazy(() => import("./components/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const BrowserPage = lazy(() => import("./components/browser/BrowserPage").then((m) => ({ default: m.BrowserPage })));
const TerminalPage = lazy(() => import("./components/terminal/TerminalPage").then((m) => ({ default: m.TerminalPage })));
const CodePage = lazy(() => import("./components/code/CodePage").then((m) => ({ default: m.CodePage })));
const StatsPage = lazy(() => import("./components/stats/StatsPage").then((m) => ({ default: m.StatsPage })));

const icons: Record<string, string> = {
  planning: "flag",
  calendar: "calendar",
  tasks: "tasks",
  notes: "notes",
  timer: "timer",
  study: "study",
  projects: "projects",
  code: "code",
  research: "research",
  ai: "ai",
  files: "files",
  browser: "browser",
  terminal: "terminal",
  lockin: "lock",
  settings: "settings",
  home: "home",
};

function PageFallback() {
  return (
    <div className="page page-fallback">
      <div className="skel skel-title" style={{ width: 180 }} />
      <div className="skel skel-line" style={{ width: 320 }} />
      <div className="skel skel-line" style={{ width: 240 }} />
    </div>
  );
}

function Shell() {
  const {
    page,
    composer,
    goalEditor,
    projectEditor,
    lockinActive,
    openComposer,
    newNote,
    timer,
    theme,
    accent,
  } = useOS();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const immersive = !!lockinActive;

  useEffect(() => {
    maybeAutoBackup();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const colors: Record<string, string> = {
      blue: "#5f9dff", purple: "#9a7bff", cyan: "#4fd6e8",
      green: "#59d69a", amber: "#f2b556", rose: "#f27b7b",
    };
    const lightColors: Record<string, string> = {
      blue: "#0a84ff", purple: "#7c5cff", cyan: "#0a9ec0",
      green: "#34c759", amber: "#ff9f0a", rose: "#ff453a",
    };
    const c = theme === "light" ? (lightColors[accent] ?? lightColors.blue) : (colors[accent] ?? colors.blue);
    document.documentElement.style.setProperty("--accent", c);
  }, [accent, theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (immersive) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k === "p") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k === "n") {
        e.preventDefault();
        if (page === "tasks") openComposer({ type: "task" });
        else if (page === "calendar") openComposer({ type: "event" });
        else newNote();
        return;
      }
      if (k === " " && page === "timer") {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
        e.preventDefault();
        timer.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive, page, openComposer, newNote, timer]);

  if (immersive) {
    return (
      <>
        <Wallpaper />
        <NotificationEngine />
        <main className="content immersive">
          <LockInPage immersive />
        </main>
        <Toasts />
      </>
    );
  }

  return (
    <>
      <Wallpaper />
      <div className="app">
        <Sidebar />
        <main className="content">
          <div className="topbar">
            <h1 className="topbar-title">
              <Icon name={icons[page] ?? "home"} size={17} />
              {pageMeta[page].title}
            </h1>
            <button className="topbar-search" onClick={() => setPaletteOpen(true)}>
              <Icon name="search" size={14} />
              <span>Search everything…</span>
              <kbd className="kbd">Ctrl K</kbd>
            </button>
            <NotificationCenter />
          </div>
          {page === "home" ? (
            <Suspense fallback={<PageFallback />}>
              <Home />
            </Suspense>
          ) : page === "tasks" ? (
            <Suspense fallback={<PageFallback />}>
              <TasksPage />
            </Suspense>
          ) : page === "calendar" ? (
            <Suspense fallback={<PageFallback />}>
              <CalendarPage />
            </Suspense>
          ) : page === "notes" ? (
            <Suspense fallback={<PageFallback />}>
              <NotesPage />
            </Suspense>
          ) : page === "files" ? (
            <Suspense fallback={<PageFallback />}>
              <FilesPage />
            </Suspense>
          ) : page === "study" ? (
            <Suspense fallback={<PageFallback />}>
              <StudyPage />
            </Suspense>
          ) : page === "planning" ? (
            <Suspense fallback={<PageFallback />}>
              <PlanningPage />
            </Suspense>
          ) : page === "lockin" ? (
            <Suspense fallback={<PageFallback />}>
              <LockInPage />
            </Suspense>
          ) : page === "timer" ? (
            <Suspense fallback={<PageFallback />}>
              <TimerPage />
            </Suspense>
          ) : page === "projects" ? (
            <Suspense fallback={<PageFallback />}>
              <ProjectsPage />
            </Suspense>
          ) : page === "research" ? (
            <Suspense fallback={<PageFallback />}>
              <ResearchPage />
            </Suspense>
          ) : page === "ai" ? (
            <Suspense fallback={<PageFallback />}>
              <AIPage />
            </Suspense>
          ) : page === "settings" ? (
            <Suspense fallback={<PageFallback />}>
              <SettingsPage />
            </Suspense>
          ) : page === "browser" ? (
            <Suspense fallback={<PageFallback />}>
              <BrowserPage />
            </Suspense>
          ) : page === "terminal" ? (
            <Suspense fallback={<PageFallback />}>
              <TerminalPage />
            </Suspense>
          ) : page === "code" ? (
            <Suspense fallback={<PageFallback />}>
              <CodePage />
            </Suspense>
          ) : page === "stats" ? (
            <Suspense fallback={<PageFallback />}>
              <StatsPage />
            </Suspense>
          ) : (
            <Placeholder
              icon={icons[page]}
              title={pageMeta[page].title}
              subtitle={pageMeta[page].subtitle}
              sections={pageMeta[page].sections}
            />
          )}
        </main>
      </div>
      {composer?.type === "task" && <TaskDialog />}
      {composer?.type === "event" && <EventDialog />}
      {goalEditor && <GoalDialog />}
      {projectEditor && <ProjectDialog />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <SessionReviewModal />
      <NotificationEngine />
      <Toasts />
      <AchievementToast />
    </>
  );
}

export default function App() {
  return (
    <OSProvider>
      <Shell />
    </OSProvider>
  );
}
