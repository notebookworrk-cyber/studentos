import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useOS } from "../state/os";
import { fuzzyMatch, highlightRanges } from "../lib/search";
import type { FuzzyMatch } from "../lib/search";
import type { PageId } from "../types";

interface Cmd {
  id: string;
  label: string;
  icon: string;
  group: string;
  hint?: string;
  match?: FuzzyMatch | null;
  run: () => void;
}

interface ResearchSource {
  id: string;
  title: string;
  url: string;
  kind: string;
  status: string;
  tags: string[];
  note: string;
}

const PAGE_LABELS: [PageId, string, string][] = [
  ["home", "Home", "home"],
  ["planning", "Planning", "flag"],
  ["calendar", "Calendar", "calendar"],
  ["tasks", "Tasks", "tasks"],
  ["notes", "Notes", "notes"],
  ["study", "Study", "study"],
  ["projects", "Projects", "projects"],
  ["code", "Code", "code"],
  ["research", "Research", "research"],
  ["files", "Files", "files"],
  ["browser", "Browser", "browser"],
  ["terminal", "Terminal", "terminal"],
  ["timer", "Focus Timer", "timer"],
  ["lockin", "Lock-In", "lock"],
  ["ai", "AI Assistant", "ai"],
  ["settings", "Settings", "settings"],
];

function matchCmd(c: Cmd, q: string): Cmd {
  const lm = fuzzyMatch(q, c.label);
  if (lm) return { ...c, match: lm };
  const gm = fuzzyMatch(q, c.group);
  if (gm) return { ...c, match: { score: gm.score - 50, indices: [] } };
  if (c.hint) {
    const hm = fuzzyMatch(q, c.hint);
    if (hm) return { ...c, match: { score: hm.score - 100, indices: [] } };
  }
  return { ...c, match: null };
}

function Highlight({ text, match }: { text: string; match?: FuzzyMatch | null }) {
  if (!match || match.indices.length === 0) return <>{text}</>;
  return (
    <>
      {highlightRanges(text, match.indices).map((r, i) =>
        r.match ? (
          <mark key={i} className="palette-mark">
            {r.text}
          </mark>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { navigate, openComposer, newNote, openNoteEditor, tasks, notes, folders, projects, goals, events, subjects, studyMaterials } = useOS();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (page: PageId) => {
    navigate(page);
    onClose();
  };

  const base = useMemo<Cmd[]>(() => {
    const nav = PAGE_LABELS.map(([page, label, icon]): Cmd => ({
      id: `nav-${page}`,
      label,
      icon,
      group: "Navigate",
      run: () => go(page),
    }));
    const acts: Cmd[] = [
      { id: "new-task", label: "New Task", icon: "plus", group: "Actions", run: () => { openComposer({ type: "task" }); onClose(); } },
      { id: "new-event", label: "Add Event", icon: "calendar", group: "Actions", run: () => { openComposer({ type: "event" }); onClose(); } },
      { id: "new-note", label: "New Note", icon: "note", group: "Actions", run: () => { newNote(); onClose(); } },
      { id: "start-focus", label: "Start Focus", icon: "focus", group: "Actions", run: () => go("timer") },
      { id: "start-lockin", label: "Start Lock-In", icon: "lock", group: "Actions", run: () => go("lockin") },
      { id: "open-ai", label: "Ask AI", icon: "spark", group: "Actions", run: () => go("ai") },
    ];
    return [...nav, ...acts];
  }, [navigate, openComposer, newNote, onClose]);

  const data = useMemo<Cmd[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const items: Cmd[] = [];
    const seen = new Set<string>();
    const push = (id: string, label: string, icon: string, group: string, hint: string | undefined, run: () => void, matchScore = 0) => {
      if (seen.has(id)) return;
      seen.add(id);
      const lm = fuzzyMatch(q, label);
      items.push({ id, label, icon, group, hint, match: lm ?? { score: matchScore, indices: [] }, run });
    };

    for (const t of tasks) {
      const m = fuzzyMatch(q, `${t.title} ${t.description}`);
      if (!m) continue;
      push(`task-${t.id}`, t.title, "tasks", "Tasks", t.status === "completed" ? "Completed" : t.date, () => go("tasks"), m.score);
    }
    for (const n of notes) {
      const m = fuzzyMatch(q, `${n.title} ${n.content} ${n.tags.join(" ")}`);
      if (!m) continue;
      push(`note-${n.id}`, n.title || "Untitled note", "note", "Notes", n.folder, () => {
        openNoteEditor({ mode: "edit", id: n.id });
        go("notes");
      }, m.score);
    }
    for (const f of folders) {
      const m = fuzzyMatch(q, f);
      if (!m) continue;
      push(`folder-${f}`, f, "folder", "Files", "Folder", () => go("files"), m.score);
    }
    for (const p of projects) {
      const m = fuzzyMatch(q, `${p.name} ${p.description}`);
      if (!m) continue;
      push(`project-${p.id}`, p.name, "projects", "Projects", p.status, () => go("projects"), m.score);
    }
    for (const g of goals) {
      const m = fuzzyMatch(q, `${g.title} ${g.description}`);
      if (!m) continue;
      push(`goal-${g.id}`, g.title, "flag", "Goals", g.deadline ?? "No deadline", () => go("planning"), m.score);
    }
    for (const e of events) {
      const m = fuzzyMatch(q, `${e.title} ${e.category}`);
      if (!m) continue;
      push(`event-${e.id}`, e.title, "calendar", "Events", `${e.date} · ${e.startTime}`, () => go("calendar"), m.score);
    }
    for (const s of subjects) {
      const m = fuzzyMatch(q, `${s.name} ${s.objective}`);
      if (!m) continue;
      push(`subject-${s.id}`, s.name, "study", "Study", s.folder, () => go("study"), m.score);
    }
    for (const m of studyMaterials) {
      const mm = fuzzyMatch(q, m.title);
      if (!mm) continue;
      push(`material-${m.id}`, m.title, "study", "Study", m.source ?? "Study material", () => go("study"), mm.score);
    }
    let research: ResearchSource[] = [];
    try {
      research = JSON.parse(localStorage.getItem("studentos.research.v1") ?? "[]");
    } catch {
      /* ignore */
    }
    for (const r of research) {
      const m = fuzzyMatch(q, `${r.title} ${r.note} ${r.tags.join(" ")}`);
      if (!m) continue;
      push(`research-${r.id}`, r.title, "research", "Research", r.kind, () => go("research"), m.score);
    }
    return items;
  }, [query, tasks, notes, folders, projects, goals, events, subjects, studyMaterials, openNoteEditor, onClose, go]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return base;
    return [...base.map((c) => matchCmd(c, q)), ...data]
      .filter((c) => c.match)
      .sort((a, b) => (b.match!.score - a.match!.score));
  }, [base, data, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Cmd[]>();
    for (const c of filtered) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    for (const [g, arr] of map) {
      arr.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
      void g;
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runActive = (index: number) => {
    const c = filtered[index];
    if (c) c.run();
  };

  const activeId = filtered[active] ? `pal-opt-${filtered[active].id}` : undefined;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive(active);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search & command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="palette-input-wrap">
          <Icon name="search" className="palette-search-icon" />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search tasks, notes, files, projects, events, goals…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {filtered.length === 0 && (
            <div className="palette-empty">No matches for “{query}”</div>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="palette-group">
              <div className="palette-group-label">{group}</div>
              {items.map((c) => {
                const idx = filtered.indexOf(c);
                return (
                  <button
                    key={c.id}
                    id={`pal-opt-${c.id}`}
                    role="option"
                    aria-selected={idx === active}
                    data-idx={idx}
                    className={`palette-item ${idx === active ? "active" : ""}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => runActive(idx)}
                  >
                    <Icon name={c.icon} className="palette-item-icon" />
                    <span className="palette-item-label">
                      <Highlight text={c.label} match={c.match} />
                    </span>
                    {c.hint && <span className="palette-item-hint">{c.hint}</span>}
                    {idx === active && (
                      <span className="palette-item-enter">
                        <kbd className="kbd">↵</kbd>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <kbd className="kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd> select
          </span>
          <span>
            <kbd className="kbd">Ctrl K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}