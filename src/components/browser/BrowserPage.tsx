import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";

import { isDesktop } from "../../lib/platform";

const desktop = () => window.studentos!;

type Tab = {
  id: string;
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  error?: { code: number; desc: string; url: string };
};

type Tool = {
  id: string;
  name: string;
  url: string;
  desc: string;
  color: string;
  frame?: boolean;
};

const TOOLS: Tool[] = [
  { id: "g", name: "Google", url: "https://www.google.com", desc: "Search the web", color: "#4285F4" },
  { id: "yt", name: "YouTube", url: "https://www.youtube.com", desc: "Study videos", color: "#FF0000" },
  { id: "gh", name: "GitHub", url: "https://github.com", desc: "Code & issues", color: "#8b5cf6" },
  { id: "kw", name: "Khan Academy", url: "https://www.khanacademy.org", desc: "Courses & practice", color: "#14b8a6", frame: true },
  { id: "cr", name: "Stack Overflow", url: "https://stackoverflow.com", desc: "Developer answers", color: "#f9a825" },
  { id: "tr", name: "DeepL", url: "https://www.deepl.com/translator", desc: "Translation", color: "#0b5394" },
];

const HOME = "https://www.google.com";

export function BrowserPage() {
  if (isDesktop) return <DesktopBrowser />;
  return <WebBrowser />;
}

function WebBrowser() {
  const [active, setActive] = useState<Tool | null>(null);
  return (
    <div className="page browser-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Browser</h1>
          <p className="page-subtitle">Launch a service. Most sites stay in your own tab.</p>
        </div>
      </header>
      <section className="study-block surface">
        <div className="panel-title">
          <Icon name="browser" />
          Services
        </div>
        <div className="browser-grid">
          {TOOLS.map((t) => (
            <button key={t.id} className={`browser-tile ${active?.id === t.id ? "active" : ""}`} onClick={() => setActive(active?.id === t.id ? null : t)}>
              <span className="browser-tile-dot" style={{ background: t.color }}>
                <Icon name="ext" size={16} />
              </span>
              <span className="browser-tile-name">{t.name}</span>
              <span className="browser-tile-desc">{t.desc}</span>
            </button>
          ))}
        </div>
        {active && (
          <div className="browser-actions">
            <a className="btn btn-ghost" href={active.url} target="_blank" rel="noreferrer">
              <Icon name="ext" size={14} />
              Open externally
            </a>
            <span className="pill-warn">
              <Icon name="lock" size={13} />
              Sites with their own login usually refuse in-app embedding — run the desktop app for a real browser.
            </span>
          </div>
        )}
      </section>
      {active?.frame && (
        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name={active.id as never} />
              {active.name} · in-app
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActive(null)}>
              <Icon name="x" size={14} />
              Close
            </button>
          </div>
          <iframe className="browser-frame" src={active.url} title={active.name} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" />
        </section>
      )}
      {!active && <p className="study-res-empty browser-note">Pick a service above, or run the desktop app for a full multi-tab browser.</p>}
    </div>
  );
}

function DesktopBrowser() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [find, setFind] = useState("");
  const [showFind, setShowFind] = useState(false);
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const active = tabs.find((t) => t.id === activeId) || null;

  const saveSource = useCallback(() => {
    if (!active?.url) return;
    try {
      const key = "studentos.research.v1";
      const list: unknown[] = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift({
        id: `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: active.title || active.url,
        url: active.url,
        kind: "Web",
        status: "untouched",
        tags: [],
        note: "",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(list));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(false);
    }
  }, [active]);

  const patchTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const newTab = useCallback(
    (url = HOME) => {
      void desktop().browser.newTab(url).then((id) => {
        setTabs((ts) => [...ts, { id, url, title: "New tab", loading: false, canGoBack: false, canGoForward: false }]);
        setActiveId(id);
        setAddress(url);
      });
    },
    []
  );

  useEffect(() => {
    newTab();
    return () => {
      for (const t of tabsRef.current) void desktop().browser.setBounds(t, { x: 0, y: 0, width: 0, height: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTab]);

  const tabsRef = useRef<string[]>([]);
  useEffect(() => {
    tabsRef.current = tabs.map((t) => t.id);
  }, [tabs]);

  useEffect(() => {
    if (!isDesktop) return;
    const unNav = desktop().browser.events.onNav((e) => {
      patchTab(e.id, {
        url: e.url ?? undefined,
        title: e.title ?? undefined,
        loading: e.loading ?? undefined,
        canGoBack: e.canGoBack ?? undefined,
        canGoForward: e.canGoForward ?? undefined,
        error: e.error ?? undefined,
      });
      const cleanUrl = (s?: string) => (s || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (e.id === activeIdRef.current && e.url) setAddress(cleanUrl(e.url));
    });
    const unErr = desktop().browser.events.onError((e) => {
      patchTab((e as { id: string }).id, { error: { code: 0, desc: "Navigation failed", url: "" } });
    });
    const unDL = desktop().browser.events.onDownload(() => {});
    return () => {
      unNav(); unErr(); unDL();
    };
  }, [patchTab]);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  useEffect(() => {
    if (!contentRef.current || !activeId) return;
    const el = contentRef.current;
    const place = () => {
      const r = el.getBoundingClientRect();
      void desktop().browser.setBounds(activeId, {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("scroll", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", place);
    };
  }, [activeId]);

  const closeTab = (id: string) => {
    void desktop().browser.closeTab(id);
    setTabs((ts) => ts.filter((t) => t.id !== id));
    if (activeId === id) {
      const next = tabs.find((t) => t.id !== id);
      if (next) {
        setActiveId(next.id);
        setAddress(next.url);
        void desktop().browser.selectTab(next.id);
      } else setActiveId(null);
    }
  };

  const selectTab = (id: string) => {
    setActiveId(id);
    void desktop().browser.selectTab(id);
    const t = tabs.find((x) => x.id === id);
    if (t) setAddress(t.url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  };

  const go = () => {
    if (!activeId) return;
    void desktop().browser.navigate(activeId, address);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") go();
  };

  return (
    <div className="page browser-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Browser</h1>
          <p className="page-subtitle">A real chromium surface, isolated from StudentOS.</p>
        </div>
        <span className="badge badge-green">real engine</span>
      </header>

      <section className="study-block surface browser-desktop">
        <div className="browser-tabbar">
          {tabs.map((t) => (
            <div key={t.id} className={`browser-tab ${t.id === activeId ? "active" : ""}`} onClick={() => selectTab(t.id)}>
              <span className="browser-tab-state">
                {t.loading ? <span className="browser-spinner" /> : <span className="browser-tab-dot" />}
              </span>
              <span className="browser-tab-label">{t.title || "New tab"}</span>
              <button className="browser-tab-close" onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} title="Close tab">
                <Icon name="x" size={11} />
              </button>
            </div>
          ))}
          <button className="browser-tab-new" onClick={() => newTab()} title="New tab">
            <Icon name="plus" size={14} />
          </button>
        </div>

        <div className="browser-toolbar">
          <button className="btn btn-icon" disabled={!active?.canGoBack} onClick={() => activeId && void desktop().browser.back(activeId)} title="Back" aria-label="Back">
            <Icon name="back" size={15} />
          </button>
          <button className="btn btn-icon" disabled={!active?.canGoForward} onClick={() => activeId && void desktop().browser.forward(activeId)} title="Forward" aria-label="Forward">
            <Icon name="arrow" size={15} />
          </button>
          <button className="btn btn-icon" onClick={() => activeId && (active?.loading ? desktop().browser.stop(activeId) : desktop().browser.reload(activeId))} title="Reload" aria-label="Reload">
            <Icon name="undo" size={15} />
          </button>
          <input
            className="input browser-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={onKey}
            onFocus={(e) => e.target.select()}
            placeholder="Search or enter address"
            spellCheck={false}
          />
          <button className="btn btn-icon" onClick={() => setShowFind((s) => !s)} title="Find in page (Ctrl+F)" aria-label="Find in page">
            <Icon name="search" size={15} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!active?.url || saved}
            onClick={saveSource}
            title="Save to Research"
          >
            <Icon name={saved ? "check" : "research"} size={14} />
            {saved ? "Saved" : "Save source"}
          </button>
        </div>

        {showFind && (
          <div className="browser-findbar">
            <input
              className="input browser-find-input"
              value={find}
              autoFocus
              onChange={(e) => { setFind(e.target.value); if (activeId) void desktop().browser.find(activeId, e.target.value); }}
              placeholder="Find in page"
            />
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowFind(false); setFind(""); if (activeId) void desktop().browser.stopFind(activeId); }}>
              <Icon name="x" size={13} />
            </button>
          </div>
        )}

        <div className="browser-content" ref={contentRef}>
          {active?.error && (
            <div className="browser-error">
              <p className="browser-error-title">This page couldn't be loaded.</p>
              <p className="browser-error-url">{active?.url}</p>
              <p className="browser-error-desc">{active.error.desc}</p>
              <div className="browser-error-actions">
                <button className="btn btn-primary" onClick={() => activeId && void desktop().browser.reload(activeId)}>Retry</button>
                <button className="btn btn-ghost" onClick={() => activeId && void desktop().browser.openExternal(active.url)}>Open externally</button>
              </div>
            </div>
          )}
          {!tabs.length && <p className="study-res-empty">Open a tab to start browsing.</p>}
        </div>
      </section>
    </div>
  );
}