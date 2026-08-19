import { useState } from "react";
import { Icon } from "./Icon";
import { useOS } from "../state/os";
import { xpProgressInLevel } from "../lib/gamification/xp";
import type { PageId } from "../types";

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  special?: "primary" | "lockin";
}

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Core",
    items: [
      { id: "home", label: "Home", icon: "home", special: "primary" },
      { id: "planning", label: "Planning", icon: "flag" },
      { id: "calendar", label: "Calendar", icon: "calendar" },
      { id: "tasks", label: "Tasks", icon: "tasks" },
      { id: "notes", label: "Notes", icon: "notes" },
      { id: "timer", label: "Focus", icon: "timer" },
    ],
  },
  {
    label: "Workspaces",
    items: [
      { id: "study", label: "Study", icon: "study" },
      { id: "projects", label: "Projects", icon: "projects" },
      { id: "code", label: "Code", icon: "code" },
      { id: "research", label: "Research", icon: "research" },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "ai", label: "AI", icon: "ai" },
      { id: "files", label: "Files", icon: "files" },
      { id: "browser", label: "Browser", icon: "browser" },
      { id: "terminal", label: "Terminal", icon: "terminal" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "lockin", label: "Lock-In", icon: "lock", special: "lockin" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];

export function Sidebar() {
  const { page, navigate, gamification } = useOS();
  const [collapsed, setCollapsed] = useState(false);
  const { pct } = xpProgressInLevel(gamification.xp);
  const level = gamification.level;
  return (
    <aside className={`glass sidebar ${collapsed ? "collapsed" : ""}`}>
      <button className="sidebar-collapse" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <Icon name={collapsed ? "expand" : "collapse"} size={14} />
      </button>
      <div className="brand" title={collapsed ? "StudentOS" : undefined}>
        <div className="brand-mark">S</div>
        <div>
          <div className="brand-name">StudentOS</div>
          <div className="brand-sub">Workspace</div>
        </div>
      </div>

      {groups.map((group) => (
        <nav key={group.label} className="nav-group">
          <div className="nav-label">{group.label}</div>
          {group.items.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""} ${item.special ?? ""}`}
              onClick={() => navigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      ))}

      {!collapsed && (
        <button className="xp-widget" onClick={() => navigate("stats")} title="View stats">
          <div className="xp-widget-row">
            <span className="xp-widget-level">Lv {level}</span>
            <span className="xp-widget-xp">{gamification.xp.toLocaleString()} XP</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
          <div className="xp-widget-row">
            <span className="xp-widget-streak">
              {gamification.currentStreak > 0 ? `${gamification.currentStreak} day streak` : "No streak yet"}
            </span>
            <span className="xp-widget-achievements">
              {gamification.achievements.length} badges
            </span>
          </div>
        </button>
      )}
      {collapsed && (
        <button className="xp-widget xp-widget-mini" onClick={() => navigate("stats")} title={`Level ${level} — ${gamification.xp} XP`}>
          <span className="xp-widget-level-mini">{level}</span>
        </button>
      )}

      <div className="sidebar-foot" title={collapsed ? "Lucky" : undefined}>
        <div className="avatar">L</div>
        <div>
          <div className="sidebar-foot-name">Lucky</div>
          <div className="sidebar-foot-sub">
            <span className="dot dot-live" />
            Free
          </div>
        </div>
      </div>
    </aside>
  );
}
