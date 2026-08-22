import { useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";
import { useOS } from "../../state/os";
import type { PageId } from "../../types";
import { Icon } from "../Icon";

import { isDesktop } from "../../lib/platform";
const desktop = () => window.studentos!;

type Line = { text: string; kind: "cmd" | "out" };

const PAGES: PageId[] = [
  "home", "planning", "calendar", "tasks", "notes", "timer",
  "study", "projects", "code", "research", "ai", "files",
  "browser", "terminal", "lockin", "settings",
];

const HELP = [
  "help           — show this help",
  "status         — what's on your plate today",
  "open <page>    — jump to a page (e.g. open tasks)",
  "page ?         — list pages",
  "focus          — start / pause the focus timer",
  "reset          — reset the focus timer",
  "task <title>   — add a task for today",
  "lockin <min>   — start a lock-in for <min> minutes",
  "clear          — clear the terminal",
];

function FakeTerminal() {
  const { navigate, timer, openComposer, startLockIn, tasks, goals, events, today, plan } = useOS();
  const [lines, setLines] = useState<Line[]>([
    { text: "StudentOS terminal — type `help` to get started.", kind: "out" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const openToday = tasks.filter((t) => t.date === today);
  const doneToday = openToday.filter((t) => t.status === "completed").length;

  const run = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const out: Line[] = [];
    const [cmd, ...rest] = trimmed.split(/\s+/);
    const arg = rest.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        out.push(...HELP.map((h) => ({ text: h, kind: "out" as const })));
        break;
      case "status": {
        out.push({ text: `Day: ${plan.length} planned · ${plan.filter((i) => i.done).length} done`, kind: "out" });
        out.push({ text: `Tasks: ${openToday.length} today (${doneToday} done), ${tasks.filter((t) => t.status === "in-progress").length} in progress`, kind: "out" });
        out.push({ text: `Goals: ${goals.filter((g) => g.active).length} active · Events: ${events.length} upcoming`, kind: "out" });
        break;
      }
      case "open": {
        const target = (arg.toLowerCase() || "home") as PageId;
        if (PAGES.includes(target)) {
          navigate(target as PageId);
          out.push({ text: `→ ${target}`, kind: "out" });
        } else out.push({ text: `Unknown page '${arg}'. Try 'page ?'.`, kind: "out" });
        break;
      }
      case "page":
        out.push(...PAGES.map((p) => ({ text: p, kind: "out" as const })));
        break;
      case "focus":
        timer.toggle();
        out.push({ text: "Focus timer toggled", kind: "out" });
        break;
      case "reset":
        timer.reset();
        out.push({ text: "Focus timer reset", kind: "out" });
        break;
      case "task": {
        if (!arg) { out.push({ text: "Usage: task <title>", kind: "out" }); break; }
        openComposer({ type: "task" });
        out.push({ text: `Opening task dialog for "${arg}"`, kind: "out" });
        break;
      }
      case "lockin": {
        const min = Math.min(240, Math.max(5, parseInt(arg, 10) || 25));
        startLockIn({ title: "Terminal lock-in", plannedMin: min });
        navigate("lockin");
        out.push({ text: `Lock-in started · ${min} min`, kind: "out" });
        break;
      }
      case "clear":
        setLines([]);
        return;
      default:
        out.push({ text: `Unknown command '${cmd}'. Type 'help'.`, kind: "out" });
    }

    setLines((l) => [...l, { text: `> ${trimmed}`, kind: "cmd" }, ...out]);
    setInput("");
  };

  return (
    <div className="terminal-window">
      <div className="terminal-bar">
        <span className="terminal-dot" style={{ background: "#ff5f57" }} />
        <span className="terminal-dot" style={{ background: "#febc2e" }} />
        <span className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="terminal-title">studentos / web mode</span>
      </div>
      <div className="terminal-body">
        {lines.map((l, i) => (
          <div key={i} className={`terminal-line ${l.kind}`}>
            {l.kind === "cmd" ? <span className="terminal-prompt">studentos ›</span> : null}
            {l.text}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">studentos ›</span>
          <input
            className="terminal-input"
            value={input}
            autoFocus
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(input)}
            spellCheck={false}
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}

type TermSession = { id: string; name: string };

/* Each tab owns its own xterm + host div; sessions stay alive when hidden. */
function TermInstance({ session, active }: {
  session: TermSession;
  active: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDesktop) return;
    let disposed = false;
    let term: any = null;
    let fit: { fit: () => void } | null = null;
    let ro: ResizeObserver | null = null;
    let unData = () => {};
    let unExit = () => {};
    let unInput = { dispose: () => {} };
    let unHost = () => {};

    const init = async () => {
      const host = hostRef.current;
      if (!host || disposed) return;
      try {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        if (disposed || hostRef.current !== host) return;
        term = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: "Cascadia Mono, Consolas, monospace",
          theme: { background: "#0d1220", foreground: "#e7edf5", cursor: "#7aa2ff", selectionBackground: "#2b3a5e" },
        });
        fit = new FitAddon();
        term.loadAddon(fit);
        term.open(host);
        fit.fit();

        const doResize = () => {
          if (!active || !term || !fit) return;
          fit.fit();
          desktop().terminal.resize(session.id, term.cols, term.rows);
        };
        ro = new ResizeObserver(doResize);
        ro.observe(host);

        unData = desktop().terminal.events.onData(({ id, data }) => {
          if (id === session.id) term.write(data);
        });
        unExit = desktop().terminal.events.onExit(({ id }) => {
          if (id === session.id) term.write("\r\n\x1b[31m[process exited]\x1b[0m\r\n");
        });
        unInput = term.onData((d: string) => desktop().terminal.write(session.id, d));
        const grow = doResize;
        const rw = () => grow();
        window.addEventListener("resize", rw);
        const act = () => grow();
        window.addEventListener("focus", act);
        unHost = () => {
          window.removeEventListener("resize", rw);
          window.removeEventListener("focus", act);
        };
      } catch (e) {
        console.error("Terminal init failed:", e);
      }
    };
    void init();

    return () => {
      disposed = true;
      unData();
      unExit();
      unInput.dispose();
      ro?.disconnect();
      unHost();
      try { term?.dispose(); } catch {}
    };
  }, [session.id]);

  useEffect(() => {
    if (active && hostRef.current) {
      const hide = hostRef.current;
      requestAnimationFrame(() => {
        if (hide) {
          const xtermEl = hide.querySelector<HTMLElement>(".xterm");
          xtermEl?.focus();
        }
      });
    }
  }, [active]);

  return (
    <div
      ref={hostRef}
      className="terminal-xterm"
      style={active ? { display: "block" } : { display: "none" }}
    />
  );
}

export function TerminalPage() {
  const [tabs, setTabs] = useState<TermSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [real, setReal] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const seqRef = useRef(0);

  useEffect(() => {
    if (!isDesktop) return;
    let disposed = false;
    const boot = async () => {
      try {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        void Terminal; void FitAddon;
        const name = "Terminal 1";
        const cwd = sessionStorage.getItem("studentos.term.cwd") || undefined;
        if (cwd) sessionStorage.removeItem("studentos.term.cwd");
        const { id } = await desktop().terminal.create({ cols: 80, rows: 24, name, cwd });
        if (disposed) { desktop().terminal.kill(id); return; }
        setTabs([{ id, name }]);
        setActiveId(id);
        setReal(true);
      } catch (e) {
        console.error("Terminal boot failed:", e);
      }
    };
    void boot();
    return () => { disposed = true; };
  }, []);

  const newTab = async () => {
    if (!isDesktop) return;
    const seq = ++seqRef.current;
    const name = `Terminal ${seq}`;
    const { id } = await desktop().terminal.create({ cols: 80, rows: 24, name });
    setTabs((t) => [...t, { id, name }]);
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    desktop().terminal.kill(id);
    setTabs((t) => {
      const next = t.filter((x) => x.id !== id);
      if (activeId === id && next.length) setActiveId(next[next.length - 1].id);
      if (!next.length) setActiveId(null);
      return next;
    });
  };

  const restartTab = (id: string) => {
    desktop().terminal.restart(id);
  };

  const launchOpenCode = async () => {
    if (!isDesktop) return;
    const seq = ++seqRef.current;
    const name = `OpenCode ${seq}`;
    const cwd = sessionStorage.getItem("studentos.term.cwd") || undefined;
    const { id } = await desktop().terminal.create({ cols: 80, rows: 24, name, cwd });
    setTabs((t) => [...t, { id, name }]);
    setActiveId(id);
    setTimeout(() => desktop().terminal.write(id, "opencode\r"), 1200);
  };

  const beginRename = (id: string, name: string) => {
    setRenameId(id);
    setDraftName(name);
    setRenaming(true);
  };

  const applyRename = (id: string) => {
    const name = draftName.trim() || "Terminal";
    desktop().terminal.rename(id, name);
    setTabs((t) => t.map((x) => (x.id === id ? { ...x, name } : x)));
    setRenaming(false);
    setRenameId(null);
  };

  return (
    <div className="page terminal-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Terminal</h1>
          <p className="page-subtitle">{real ? "A real shell — running on your machine." : "Drive StudentOS by commands."}</p>
        </div>
        {real && <span className="badge badge-green">real shell</span>}
        {isDesktop && (
          <button className="btn btn-ghost" onClick={launchOpenCode} title="Launch OpenCode in a new tab">
            <Icon name="code" size={14} />
            OpenCode
          </button>
        )}
      </header>

      <section className="study-block surface terminal-block">
        {isDesktop ? (
          <>
            <div className="term-tabbar">
              {tabs.map((t) => (
                <div key={t.id} className={`term-tab ${activeId === t.id ? "active" : ""}`} onClick={() => setActiveId(t.id)}>
                  {renaming && renameId === t.id ? (
                    <input
                      className="term-tab-input"
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => applyRename(t.id)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") applyRename(t.id); }}
                    />
                  ) : (
                    <span className="term-tab-name" onDoubleClick={() => beginRename(t.id, t.name)}>{t.name}</span>
                  )}
                  <button className="term-tab-btn" title="Rename" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); beginRename(t.id, t.name); }}>
                    <Icon name="edit" size={11} />
                  </button>
                  <button className="term-tab-btn" title="Restart" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); restartTab(t.id); }}>
                    <Icon name="undo" size={11} />
                  </button>
                  <button className="term-tab-btn term-tab-close" title="Close" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); closeTab(t.id); }}>
                    <Icon name="x" size={11} />
                  </button>
                </div>
              ))}
              <button className="term-tab-new" title="New terminal" onClick={() => void newTab()}>
                <Icon name="plus" size={13} />
              </button>
            </div>
            {tabs.map((t) => (
              <TermInstance
                key={t.id}
                session={t}
                active={activeId === t.id}
              />
            ))}
          </>
        ) : (
          <FakeTerminal />
        )}
      </section>
    </div>
  );
}