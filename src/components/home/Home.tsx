import { useEffect, useMemo, useState } from "react";
import { TodayPlan } from "./TodayPlan";
import { Projects } from "./Projects";
import { Notes } from "./Notes";
import { Upcoming } from "./Upcoming";
import { AIEntry } from "./AIEntry";
import { DueReviews } from "./DueReviews";
import { QuizOffer } from "./QuizOffer";
import { DailyQuote } from "./DailyQuote";
import { WeatherCard } from "./WeatherCard";
import { useOS } from "../../state/os";
import { xpProgressInLevel } from "../../lib/gamification/xp";
import { Icon } from "../Icon";
import { todayISO } from "../../lib/date";

export function Home() {
  const {
    quotesEnabled,
    profileName,
    navigate,
    plan,
    overdue,
    toasts,
  } = useOS();

  const taskCount = useMemo(() => plan.filter((p) => p.kind === "task").length, [plan]);
  const eventCount = useMemo(() => plan.filter((p) => p.kind === "event").length, [plan]);
  const plannedMinutes = useMemo(
    () => plan.filter((p) => p.kind === "task" && !p.done).reduce((sum, p) => sum + p.mins, 0),
    [plan],
  );

  return (
    <div className="page home">
      <HomeHeader profileName={profileName} overdue={overdue} taskCount={taskCount} eventCount={eventCount} plannedMinutes={plannedMinutes} />

      <div className="home-hero-grid">
        <section className="home-panel">
          <div className="section-head">
            <h3 className="section-label">Today</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("calendar")}>
              Calendar
            </button>
          </div>
          <TodayPlan />
        </section>

        <section className="home-panel">
          <div className="section-head">
            <h3 className="section-label">Focus</h3>
          </div>
          <FocusNow />
        </section>
      </div>

      <TodayProgress taskCount={taskCount} />
      <QuickActions />

      <div className="home-weather-row">
        <WeatherCard />
        {quotesEnabled && <DailyQuote />}
      </div>

      <div className="home-grid">
        <div className="home-main">
          <DueReviews />
          <QuizOffer />
        </div>
        <div className="home-rail">
          <GamificationCard />
          <Upcoming />
          <Projects />
          <Notes />
          <AIEntry />
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

function HomeHeader({
  profileName,
  taskCount,
  eventCount,
  plannedMinutes,
  overdue,
}: {
  profileName: string;
  taskCount: number;
  eventCount: number;
  plannedMinutes: number;
  overdue: Array<{ status: string }>;
}) {
  const { navigate } = useOS();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const context =
    overdue.length > 0
      ? `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"} · `
      : "";
  const contextLine =
    context +
    (taskCount > 0
      ? `${taskCount} task${taskCount === 1 ? "" : "s"} · ${plannedMinutes > 0 ? `${Math.floor(plannedMinutes / 60)}h ${plannedMinutes % 60}m planned` : "no time set"}`
      : eventCount > 0
        ? `${eventCount} event${eventCount === 1 ? "" : "s"} scheduled`
        : "your day is clear");

  return (
    <header className="home-header">
      <button className="home-date eyebrow" onClick={() => navigate("calendar")} title="Open Calendar">
        {date}
      </button>
      <h1 className="home-title">
        {greeting}, {profileName}.
      </h1>
      <p className="home-context">{contextLine}</p>
    </header>
  );
}

function FocusNow() {
  const { nowTask, plan, lockinActive, navigate, startLockIn, endLockIn } = useOS();

  if (lockinActive) {
    const remainingMin = Math.ceil(lockinActive.plannedMin - lockinActive.focusedMin);
    return (
      <div className="focus-now">
        <div className="focus-now-label">
          <span className="dot dot-live" />
          In Progress
        </div>
        <h2 className="focus-now-title">{lockinActive.title}</h2>
        <div className="focus-now-meta">{remainingMin} min remaining</div>
        <div className="focus-now-actions">
          <button className="btn btn-primary" onClick={() => navigate("lockin")}>
            <Icon name="focus" size={16} />
            Continue
          </button>
          <button className="btn btn-ghost" onClick={() => endLockIn(false)}>
            <Icon name="x" size={14} />
            End
          </button>
        </div>
      </div>
    );
  }

  const taskItems = plan.filter((p) => p.kind === "task");
  const doneCount = taskItems.filter((t) => t.done).length;

  if (!nowTask) {
    return (
      <div className="focus-now focus-now-empty">
        <Icon name="timer" size={22} />
        <p>Nothing scheduled. Pick a task and lock in.</p>
        <button className="btn btn-primary" onClick={() => navigate("timer")}>
          <Icon name="timer" size={15} />
          Open Focus
        </button>
      </div>
    );
  }

  const handleStart = () => {
    startLockIn({ title: nowTask.title, plannedMin: nowTask.mins, taskId: nowTask.id });
    navigate("lockin");
  };

  return (
    <div className="focus-now">
      <div className="focus-now-label">
        <span className="focus-now-cat">{nowTask.category}</span>
      </div>
      <h2 className="focus-now-title">{nowTask.title}</h2>
      <div className="focus-now-meta">
        <span>{nowTask.mins} min planned</span>
        {taskItems.length > 0 && <span>· {doneCount} of {taskItems.length} done</span>}
      </div>
      <button className="btn btn-primary focus-now-start" onClick={handleStart}>
        <Icon name="focus" size={16} />
        Start Focus
      </button>
    </div>
  );
}

function TodayProgress({ taskCount }: { taskCount: number }) {
  const { plan, lockinHistory, sessions, upcoming } = useOS();
  const doneCount = plan.filter((t) => t.kind === "task" && t.done).length;
  const todayKey = todayISO();
  const focusSessionsToday = lockinHistory.filter(
    (s) => s.startedAt.slice(0, 10) === todayKey && s.status === "completed",
  ).length;
  const studyMinutesToday = sessions
    .filter((s) => s.endedAt.slice(0, 10) === todayKey)
    .reduce((sum, s) => sum + s.focusedMinutes, 0);
  const nextUp = upcoming[0];

  return (
    <section className="today-progress">
      <div className="today-progress-label">
        <span className="dot dot-live" />
        Today&apos;s Progress
      </div>
      <div className="today-progress-grid">
        <div className="tp-cell">
          <span className="tp-value nums">{studyMinutesToday > 0 ? `${Math.floor(studyMinutesToday / 60)}h ${studyMinutesToday % 60}m` : "0m"}</span>
          <span className="tp-label">Study time</span>
        </div>
        <div className="tp-cell">
          <span className="tp-value nums">{doneCount}/{taskCount}</span>
          <span className="tp-label">Tasks done</span>
        </div>
        <div className="tp-cell">
          <span className="tp-value nums">{focusSessionsToday}</span>
          <span className="tp-label">Focus sessions</span>
        </div>
        <div className="tp-cell">
          <span className="tp-value">{nextUp ? nextUp.label : "—"}</span>
          <span className="tp-label">{nextUp ? nextUp.date : "Next deadline"}</span>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const { openComposer, newNote, navigate } = useOS();
  return (
    <section className="quick-actions">
      <button className="btn btn-ghost" onClick={() => openComposer({ type: "task" })}>
        <Icon name="plus" size={15} />
        New task
      </button>
      <button className="btn btn-ghost" onClick={newNote}>
        <Icon name="notes" size={15} />
        New note
      </button>
      <button className="btn btn-ghost" onClick={() => navigate("timer")}>
        <Icon name="timer" size={15} />
        Start focus
      </button>
      <button className="btn btn-ghost" onClick={() => openComposer({ type: "event" })}>
        <Icon name="calendar" size={15} />
        Add event
      </button>
    </section>
  );
}

function ToastContainer({ toasts }: { toasts: Array<{ id: string; message: string; type: "info" | "success" | "warning" | "error" }> }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function GamificationCard() {
  const { gamification } = useOS();
  const { current, needed, pct } = xpProgressInLevel(gamification.xp);
  return (
    <section className="home-gamification">
      <div className="home-gam-top">
        <div className="home-gam-level">
          <Icon name="star" size={16} />
          <span>Level {gamification.level}</span>
        </div>
        <span className="home-gam-streak">{gamification.currentStreak} day streak</span>
      </div>
      <div className="progress" style={{ marginTop: 8 }}>
        <div className="progress-track progress-mine" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <div className="home-gam-xp">{current} / {needed} XP</div>
    </section>
  );
}