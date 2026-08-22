import { useEffect, useMemo, useRef, useState } from "react";
import { fmtFullDate, fmtWeekday } from "../../lib/date";
import { useOS, uid } from "../../state/os";
import { buildPlanPrompt, deterministicPlan } from "../../lib/aiPlanner";
import { Icon } from "../Icon";
import { AISetup } from "./AISetup";
import { StudyAISection } from "./StudyAISection";

const SUGGESTION_CHIPS = [
  "Explain a concept",
  "Help me study",
  "What should I do today?",
  "Summarize my tasks",
  "Quiz me on a topic",
];

type Suggestion = {
  id: string;
  kind: "today" | "overdue" | "goal" | "focus";
  title: string;
  detail: string;
  taskId?: string;
  goalId?: string;
};

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, (match) => `<ul>${match}</ul>`);
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  return html;
}

export function AIPage() {
  const { tasks, goals, events, today, startLockIn, navigate, aiStatus, aiMessages, setAiMessages, aiGenerating, setAiGenerating } = useOS();
  const [chatInput, setChatInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamSubsRef = useRef<Array<() => void>>([]);
  const activeRequestRef = useRef<string | null>(null);

  // Fetch cloud provider status once (BYOK config lives in main process)
  useEffect(() => {
    window.studentos?.ai?.getCloudStatus().then((s) => setCloudReady(s.configured)).catch(() => {});
  }, []);

  // Unmount cleanup: detach subscriptions, abort any in-flight generation
  useEffect(
    () => () => {
      streamSubsRef.current.forEach((unsub) => unsub());
      streamSubsRef.current = [];
      if (activeRequestRef.current) {
        window.studentos?.ai?.cancelStream(activeRequestRef.current).catch(() => {});
      }
    },
    [],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiGenerating]);

  // Handle incoming intent from home screen (chips, quiz offer, etc.)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studentos.ai.intent.v1");
      if (raw) {
        const intent = JSON.parse(raw);
        // Study actions (quiz/flashcards/summarize) are consumed by the
        // StudyAISection dock on mount — only open it here.
        if (intent?.action) {
          setStudyOpen(true);
          return;
        }
        if (intent?.prompt && typeof intent.prompt === "string") {
          localStorage.removeItem("studentos.ai.intent.v1");
          sendChat(intent.prompt);
        }
      }
    } catch {}
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    const overdue = tasks.filter((t) => t.status !== "completed" && t.date < today);
    overdue
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .forEach((t) =>
        out.push({
          id: `over-${t.id}`,
          kind: "overdue",
          title: `Catch up: ${t.title}`,
          detail: `Overdue since ${fmtWeekday(t.date)}`,
          taskId: t.id,
        })
      );

    const goalsActive = goals.filter((g) => g.active);
    goalsActive.slice(0, 2).forEach((g) => {
      const linked = tasks.filter((t) => t.goalId === g.id && t.status !== "completed");
      out.push({
        id: `goal-${g.id}`,
        kind: "goal",
        title: `Advance goal: ${g.title}`,
        detail: linked.length ? `${linked.length} open${g.deadline ? `, due ${fmtFullDate(g.deadline)}` : ""}` : "No linked tasks yet",
        goalId: g.id,
      });
    });

    const open = tasks.filter((t) => t.status !== "completed" && t.date >= today);
    open.slice(0, 3).forEach((t) => {
      const item: Suggestion = {
        id: `todo-${t.id}`,
        kind: "today",
        title: t.title,
        detail: `${t.category} · ${fmtWeekday(t.date)}${t.duration ? ` · ${t.duration} min` : ""}`,
        taskId: t.id,
      };
      if (t.priority === "high") item.title = `High priority: ${t.title}`;
      out.push(item);
    });
    return out.slice(0, 5);
  }, [tasks, goals, today]);

  const todayEvents = events.filter((e) => e.date === today);

  const pushMsg = (role: "user" | "assistant", content: string) => {
    const id = uid("ai");
    setAiMessages((prev) => [...prev, { id, role, content, timestamp: Date.now() }]);
    return id;
  };

  const streamAssistant = async (assistantId: string, prompt: string, history?: { role: "user" | "assistant"; content: string }[]) => {
    const api = window.studentos?.ai;
    if (!api) return;
    const requestId = uid("req");
    activeRequestRef.current = requestId;
    const detach = () => {
      streamSubsRef.current.forEach((unsub) => unsub());
      streamSubsRef.current = [];
      if (activeRequestRef.current === requestId) activeRequestRef.current = null;
    };
    const append = (fn: (content: string) => string) => {
      setAiMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: fn(m.content) } : m)));
    };
    streamSubsRef.current = [
      api.onStreamChunk(({ id, chunk }) => {
        if (id !== requestId) return;
        append((c) => c + chunk);
      }),
      api.onStreamDone(({ id }) => {
        if (id !== requestId) return;
        detach();
        setAiGenerating(false);
      }),
      api.onStreamError(({ id, error }) => {
        if (id !== requestId) return;
        detach();
        append((c) => c || `Error: ${error}`);
        setAiGenerating(false);
      }),
    ];
    const messages = [...(history ?? []), { role: "user" as const, content: prompt }];
    try {
      await api.generateStream({ requestId, prompt, messages, temperature: 0.7, maxTokens: 1024 });
    } catch (e: unknown) {
      detach();
      append((c) => c || `Error: ${e instanceof Error ? e.message : e}`);
      setAiGenerating(false);
    }
  };

  const stopGeneration = () => {
    const id = activeRequestRef.current;
    if (!id) return;
    window.studentos?.ai?.cancelStream(id).catch(() => {});
    streamSubsRef.current.forEach((unsub) => unsub());
    streamSubsRef.current = [];
    activeRequestRef.current = null;
    setAiGenerating(false);
  };

  const sendChat = async (text?: string) => {
    const msg = (text ?? chatInput).trim();
    if (!msg || aiGenerating) return;
    if (!window.studentos?.ai) return;
    setChatInput("");
    setAiGenerating(true);
    // Snapshot prior turns for the cloud provider (stateless per request)
    const history = aiMessages
      .filter((m) => m.content.trim())
      .slice(-12)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    pushMsg("user", msg);
    const assistantId = pushMsg("assistant", "");
    await streamAssistant(assistantId, msg, history);
  };

  const planDay = async () => {
    if (aiGenerating) return;
    const api = window.studentos?.ai;
    const prompt = buildPlanPrompt(tasks, events, goals, today);
    setAiGenerating(true);
    pushMsg("user", "Plan my day");
    const assistantId = pushMsg("assistant", "");
    if (api && isModelReady) {
      await streamAssistant(assistantId, prompt);
    } else {
      setAiMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: deterministicPlan(tasks, events, today) } : m)));
      setAiGenerating(false);
    }
  };

  const hasAI = !!window.studentos?.ai;
  const isModelReady = cloudReady || aiStatus === "ready" || aiStatus === "loaded";

  return (
    <div className="ai-page-full">
      {/* Model Status Bar */}
      <div className="ai-topbar">
        <div className="ai-topbar-left">
          <Icon name="ai" size={20} />
          <span className="ai-topbar-title">StudentOS AI</span>
          {hasAI && (
            <span className={`ai-topbar-badge ${isModelReady ? "online" : "offline"}`}>
              {aiStatus === "loading"
                ? "Loading..."
                : cloudReady
                  ? "Cloud"
                  : isModelReady
                    ? "Online"
                    : "Offline"}
            </span>
          )}
          {!hasAI && (
            <span className="ai-topbar-badge offline">Web Mode</span>
          )}
        </div>
        <div className="ai-topbar-right">
          {hasAI && <AISetup />}
          <button
            className={`btn btn-ghost btn-icon ${studyOpen ? "active" : ""}`}
            onClick={() => setStudyOpen((s) => !s)}
            title={studyOpen ? "Hide study tools" : "Study tools"}
          >
            <Icon name="book" size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen((s) => !s)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Icon name="tasks" size={16} />
          </button>
        </div>
      </div>

      {studyOpen && (
        <div className="ai-study-dock">
          <StudyAISection />
        </div>
      )}

      <div className="ai-main-layout">
        {/* Chat Area */}
        <div className="ai-chat-area">
          {aiMessages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <Icon name="ai" size={32} />
              </div>
              <h2 className="ai-welcome-title">StudentOS AI</h2>
              <p className="ai-welcome-sub">
                {cloudReady ? "Connected to your cloud model." : "Ask me anything. I run 100% offline on your device."}
              </p>
              <div className="ai-chips">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className="ai-chip"
                    onClick={() => sendChat(chip)}
                  >
                    {chip}
                  </button>
                ))}
                <button className="ai-chip" onClick={planDay}>
                  <Icon name="focus" size={13} />
                  Plan my day
                </button>
              </div>
            </div>
          ) : (
            <div className="ai-messages">
              {aiMessages.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role}`}>
                  <div className="ai-msg-avatar">
                    {m.role === "user" ? (
                      <span className="ai-avatar-user">You</span>
                    ) : (
                      <Icon name="ai" size={16} />
                    )}
                  </div>
                  <div
                    className="ai-msg-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                  />
                  {m.role === "assistant" && m.content && (
                    <button
                      className="ai-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(m.content);
                        setCopiedId(m.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      title="Copy message"
                    >
                      <Icon name={copiedId === m.id ? "check" : "copy"} size={13} />
                    </button>
                  )}
                </div>
              ))}
              {aiMessages.length > 0 && aiGenerating && !aiMessages.some((m) => m.role === "assistant" && m.content) && (
                <div className="ai-msg assistant">
                  <div className="ai-msg-avatar">
                    <Icon name="ai" size={16} />
                  </div>
                  <div className="ai-msg-content ai-thinking">
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                    <span className="ai-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input Bar */}
          <div className="ai-input-bar">
            <button className="ai-chip ai-plan-btn" onClick={planDay} disabled={aiGenerating}>
              <Icon name="focus" size={13} />
              Plan my day
            </button>
            <div className="ai-input-wrapper">
              <input
                ref={inputRef}
                className="ai-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder={isModelReady ? "Type a message..." : "Load the model first..."}
                disabled={aiGenerating || !isModelReady}
              />
              <button
                className="ai-send-btn"
                onClick={aiGenerating ? stopGeneration : () => sendChat()}
                disabled={!aiGenerating && (!chatInput.trim() || !isModelReady)}
                title={aiGenerating ? "Stop generating" : "Send"}
              >
                <Icon name={aiGenerating ? "x" : "arrow"} size={16} />
              </button>
            </div>
            {!isModelReady && hasAI && (
              <p className="ai-input-hint">Click "Load model" above to start chatting</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="ai-sidebar">
            <div className="ai-sidebar-section">
              <h4 className="ai-sidebar-title">
                <Icon name="calendar" size={14} />
                Today — {fmtFullDate(today)}
              </h4>
              {todayEvents.length === 0 ? (
                <p className="ai-sidebar-empty">No events today.</p>
              ) : (
                todayEvents.map((e) => (
                  <div key={e.id} className="ai-sidebar-item">
                    <span className="badge badge-tint">{e.kind}</span>
                    <span>{e.title}</span>
                  </div>
                ))
              )}
            </div>

            <div className="ai-sidebar-section">
              <h4 className="ai-sidebar-title">
                <Icon name="target" size={14} />
                Suggestions
              </h4>
              {suggestions.length === 0 ? (
                <p className="ai-sidebar-empty">Nothing pressing.</p>
              ) : (
                suggestions.map((s) => (
                  <div key={s.id} className="ai-sidebar-item">
                    <span className={`badge ${s.kind === "overdue" ? "badge-amber" : s.kind === "goal" ? "badge-purple" : "badge-tint"}`}>
                      {s.kind}
                    </span>
                    <div className="ai-sidebar-item-text">
                      <span className="ai-sidebar-item-title">{s.title}</span>
                      <span className="ai-sidebar-item-detail">{s.detail}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ai-sidebar-section">
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: "100%" }}
                onClick={() => {
                  const top = suggestions[0];
                  if (top?.taskId) {
                    navigate("lockin");
                    startLockIn({ title: top.title.replace(/^High priority: /, ""), plannedMin: 25, taskId: top.taskId });
                  }
                }}
                disabled={!suggestions[0]?.taskId}
              >
                <Icon name="focus" size={13} />
                Lock into top pick
              </button>
            </div>

            <div className="ai-sidebar-section">
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: "100%" }}
                onClick={() => {
                  stopGeneration();
                  setAiMessages([]);
                  window.studentos?.ai?.resetChat().catch(() => {});
                }}
                disabled={aiMessages.length === 0}
              >
                <Icon name="trash" size={13} />
                Clear chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
