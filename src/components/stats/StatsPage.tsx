import { useMemo, useState } from "react";
import { useOS } from "../../state/os";
import { xpProgressInLevel } from "../../lib/gamification/xp";
import { ACHIEVEMENTS } from "../../lib/gamification/achievements";
import { Icon } from "../Icon";
import { toISO } from "../../lib/date";

const RANKS = [
  { min: 0, title: "Novice", color: "var(--ink-3)" },
  { min: 5, title: "Learner", color: "var(--cyan)" },
  { min: 10, title: "Scholar", color: "var(--accent)" },
  { min: 20, title: "Adept", color: "var(--accent-2)" },
  { min: 35, title: "Expert", color: "var(--good)" },
  { min: 50, title: "Master", color: "var(--warn)" },
  { min: 75, title: "Sage", color: "var(--danger)" },
];

function rankFor(level: number) {
  let r = RANKS[0];
  for (const rank of RANKS) {
    if (level >= rank.min) r = rank;
  }
  return r;
}

type Range = "week" | "month" | "all";

function dateKey(d: Date) {
  return toISO(d);
}

export function StatsPage() {
  const { gamification, tasks, sessions, lockinHistory, subjects } = useOS();
  const wxp = gamification.weeklyXP ?? {};
  const { current, needed, pct } = xpProgressInLevel(gamification.xp);
  const level = gamification.level;
  const rank = rankFor(level);

  const [range, setRange] = useState<Range>("week");

  const quizAccuracy = gamification.totalQuizzesCompleted > 0
    ? Math.round((gamification.totalQuizCorrect / gamification.totalQuizzesCompleted) * 100)
    : 0;

  const stats = useMemo(() => {
    const accuracyStat = gamification.totalQuizzesCompleted > 0
      ? [{ label: "Accuracy", value: `${quizAccuracy}%`, icon: "quiz" as const }]
      : [];
    return [
      { label: "Tasks Done", value: gamification.totalTasksCompleted, icon: "check" as const },
      { label: "Study Hours", value: Math.round(gamification.totalStudyMinutes / 60 * 10) / 10, icon: "study" as const },
      { label: "Focus Hours", value: Math.round(gamification.totalLockInMinutes / 60 * 10) / 10, icon: "lock" as const },
      ...accuracyStat,
      { label: "Cards Reviewed", value: gamification.totalCardsReviewed, icon: "notes" as const },
      { label: "Active Days", value: gamification.totalActiveDays, icon: "calendar" as const },
    ];
  }, [gamification, quizAccuracy]);

  const { chartDays, maxXP, chartLabel, totalXP } = useMemo(() => {
    const now = new Date();
    const days: { label: string; xp: number }[] = [];
    let total = 0;
    if (range === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const xp = wxp[dateKey(d)] ?? 0;
        total += xp;
        days.push({ label: d.toLocaleDateString("en", { weekday: "short" }), xp });
      }
    } else if (range === "month") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const xp = wxp[dateKey(d)] ?? 0;
        total += xp;
        if (i % 5 === 0 || i === 0) {
          days.push({ label: d.toLocaleDateString("en", { month: "short", day: "numeric" }), xp });
        } else {
          days.push({ label: "", xp });
        }
      }
    } else {
      const keys = Object.keys(wxp).sort();
      if (keys.length) {
        for (const k of keys) {
          const xp = wxp[k];
          total += xp;
          const d = new Date(k);
          if (keys.length <= 14 || keys.indexOf(k) % Math.ceil(keys.length / 14) === 0) {
            days.push({ label: d.toLocaleDateString("en", { month: "short", day: "numeric" }), xp });
          } else {
            days.push({ label: "", xp });
          }
        }
      } else {
        days.push({ label: "Now", xp: 0 });
      }
    }
    return { chartDays: days, maxXP: Math.max(1, ...days.map(d => d.xp)), chartLabel: range === "week" ? "This Week" : range === "month" ? "Last 30 Days" : "All Time", totalXP: total };
  }, [wxp, range]);

  const prevWeekXP = useMemo(() => {
    const now = new Date();
    let total = 0;
    for (let i = 13; i >= 7; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      total += wxp[dateKey(d)] ?? 0;
    }
    return total;
  }, [wxp]);

  const currentWeekXP = useMemo(() => {
    const now = new Date();
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      total += wxp[dateKey(d)] ?? 0;
    }
    return total;
  }, [wxp]);

  const xpDelta = currentWeekXP - prevWeekXP;
  const isFresh = gamification.xp === 0 && Object.keys(wxp).length === 0;

  const dayMap = useMemo(() => {
    const now = new Date();
    const map: Record<string, { tasks: number; study: number; lockin: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[dateKey(d)] = { tasks: 0, study: 0, lockin: 0 };
    }
    for (const t of tasks) {
      if (t.completedAt) {
        const k = t.completedAt.slice(0, 10);
        if (map[k]) map[k].tasks++;
      }
    }
    for (const s of sessions) {
      const k = s.endedAt.slice(0, 10);
      if (map[k]) map[k].study += s.focusedMinutes;
    }
    for (const l of lockinHistory) {
      const k = l.startedAt.slice(0, 10);
      if (map[k]) map[k].lockin += l.focusedMin ?? 0;
    }
    return map;
  }, [tasks, sessions, lockinHistory]);

  const heatmap = useMemo(() => {
    const now = new Date();
    const focus: Record<string, number> = {};
    for (const s of sessions) {
      const k = s.endedAt.slice(0, 10);
      focus[k] = (focus[k] ?? 0) + s.focusedMinutes;
    }
    for (const l of lockinHistory) {
      const k = l.startedAt.slice(0, 10);
      focus[k] = (focus[k] ?? 0) + (l.focusedMin ?? 0);
    }
    const weeks: { date: string; mins: number; level: number }[][] = [];
    for (let w = 7; w >= 0; w--) {
      const week: { date: string; mins: number; level: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(now);
        dt.setDate(dt.getDate() - (w * 7 + (6 - d)));
        const k = dateKey(dt);
        const mins = focus[k] ?? 0;
        const level = mins === 0 ? 0 : mins < 15 ? 1 : mins < 30 ? 2 : mins < 60 ? 3 : 4;
        week.push({ date: k, mins, level });
      }
      weeks.push(week);
    }
    return weeks;
  }, [sessions, lockinHistory]);

  const subjectBreakdown = useMemo(() => {
    const mins: Record<string, number> = {};
    for (const s of sessions) mins[s.subjectId] = (mins[s.subjectId] ?? 0) + s.focusedMinutes;
    const rows = Object.entries(mins)
      .map(([id, m]) => ({ id, name: subjects.find((x) => x.id === id)?.name ?? "Subject", minutes: m, color: subjects.find((x) => x.id === id)?.color ?? "var(--accent)" }))
      .sort((a, b) => b.minutes - a.minutes);
    const max = Math.max(1, ...rows.map((r) => r.minutes));
    return { rows, max };
  }, [sessions, subjects]);

  const categories = ["task", "study", "lockin", "streak", "quiz", "flashcard", "level", "special"] as const;
  const categoryLabels: Record<string, string> = {
    task: "Tasks", study: "Study", lockin: "Lock-In", streak: "Streaks",
    quiz: "Quizzes", flashcard: "Flashcards", level: "Levels", special: "Special",
  };

  return (
    <div className="page stats-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Stats</h1>
          <p className="page-subtitle">Your progress and achievements</p>
        </div>
      </header>

      <div className="stats-hero glass">
        <div className="stats-hero-top">
          <div className="stats-hero-left">
            <div className="stats-level-badge">Lv {level}</div>
            <div>
              <div className="stats-xp-label">{gamification.xp.toLocaleString()} XP</div>
              <div className="stats-xp-detail">{current} / {needed} to next level</div>
            </div>
          </div>
          <div className="stats-rank" style={{ color: rank.color }}>{rank.title}</div>
        </div>
        <div className="stats-hero-bar">
          <div className="stats-hero-bar-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <div className="stats-hero-row">
          <span className="stats-streak">{gamification.currentStreak > 0 ? `${gamification.currentStreak} day streak` : "No active streak"}</span>
          <span className="stats-longest">Best: {gamification.longestStreak} days</span>
        </div>
      </div>

      {isFresh ? (
        <div className="stats-empty glass">
          <Icon name="chart" size={28} />
          <h2>No activity yet</h2>
          <p>Complete tasks, study and lock in to start building your XP.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stats-card glass">
                <Icon name={s.icon} size={18} />
                <div className="stats-card-value">{s.value}</div>
                <div className="stats-card-label">{s.label}</div>
              </div>
            ))}
            {xpDelta !== 0 && (
              <div className={`stats-card glass stats-card-delta ${xpDelta > 0 ? "positive" : "negative"}`}>
                <Icon name="chart" size={18} />
                <div className="stats-card-value">{xpDelta > 0 ? "+" : ""}{xpDelta}</div>
                <div className="stats-card-label">XP this week vs last</div>
              </div>
            )}
          </div>

          <div className="stats-chart-section glass">
            <div className="stats-chart-head">
              <h2>{chartLabel}</h2>
              <div className="stats-range-tabs" role="tablist">
                {(["week", "month", "all"] as Range[]).map((r) => (
                  <button key={r} className={`stats-range-tab ${range === r ? "active" : ""}`} role="tab" aria-selected={range === r} onClick={() => setRange(r)}>
                    {r === "week" ? "7d" : r === "month" ? "30d" : "All"}
                  </button>
                ))}
              </div>
            </div>
            <div className="stats-chart">
              {chartDays.map((d, i) => (
                <div key={i} className="stats-chart-col">
                  <div className="stats-chart-bar-wrap">
                    <div className="stats-chart-bar" style={{ transform: `scaleY(${(d.xp / maxXP)})` }} />
                  </div>
                  {d.label && <div className="stats-chart-label">{d.label}</div>}
                  {d.xp > 0 && d.label && <div className="stats-chart-xp">{d.xp}</div>}
                </div>
              ))}
            </div>
            <div className="stats-chart-total">{totalXP.toLocaleString()} XP total</div>
          </div>
        </>
      )}

      <div className="stats-focus glass">
        <div className="stats-focus-head">
          <h2>Focus heatmap</h2>
          <span className="stats-focus-sub">Last 8 weeks · study + lock-in minutes</span>
        </div>
        <div className="stats-heat">
          {heatmap.map((week, wi) => (
            <div key={wi} className="stats-heat-week">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={`stats-heat-cell lv${cell.level}`}
                  title={`${cell.date} — ${cell.mins} min focused`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="stats-heat-legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`stats-heat-cell lv${l}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="stats-days glass">
        <div className="stats-days-head">
          <h2>Last 14 days</h2>
        </div>
        <div className="stats-day-grid">
          {Object.entries(dayMap).map(([k, v]) => {
            const d = new Date(`${k}T12:00:00`);
            const isToday = k === dateKey(new Date());
            return (
              <div key={k} className={`stats-day ${isToday ? "today" : ""}`}>
                <div className="stats-day-label">{d.toLocaleDateString("en", { weekday: "short" })} {d.getDate()}</div>
                <div className="stats-day-metrics">
                  <span className="stats-day-metric" title="Tasks completed"><Icon name="check" size={11} />{v.tasks}</span>
                  <span className="stats-day-metric" title="Study minutes"><Icon name="study" size={11} />{v.study}</span>
                  <span className="stats-day-metric" title="Lock-in minutes"><Icon name="lock" size={11} />{v.lockin}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {subjectBreakdown.rows.length > 0 && (
        <div className="stats-subjects glass">
          <div className="stats-subjects-head">
            <h2>Study time by subject</h2>
          </div>
          {subjectBreakdown.rows.map((r) => (
            <div key={r.id} className="stats-subject">
              <div className="stats-subject-row">
                <span className="stats-subject-name">{r.name}</span>
                <span className="stats-subject-min">{Math.round((r.minutes / 60) * 10) / 10}h</span>
              </div>
              <div className="stats-subject-track">
                <div className="stats-subject-bar" style={{ width: `${(r.minutes / subjectBreakdown.max) * 100}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stats-achievements">
        <h2>Achievements ({(gamification.achievements ?? []).length} / {ACHIEVEMENTS.length})</h2>
        {categories.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="stats-achievement-group">
              <h3>{categoryLabels[cat]}</h3>
              <div className="stats-achievement-grid">
                {items.map((a) => {
                  const unlocked = (gamification.achievements ?? []).includes(a.id);
                  return (
                    <div key={a.id} className={`stats-achievement glass ${unlocked ? "unlocked" : ""}`} title={a.description}>
                      <span className="stats-achievement-icon">{unlocked ? a.icon : <Icon name="lock" size={24} />}</span>
                      <span className="stats-achievement-name">{a.name}</span>
                      <span className="stats-achievement-desc">{a.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
