import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { clearNotifications, markAllRead, useNotifications, useUnreadCount } from "../../lib/notifications";

function fmtTime(at: number) {
  const d = new Date(at);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = useNotifications();
  const unread = useUnreadCount();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="notif-center" ref={ref}>
      <button
        className="topbar-search notif-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Icon name="bell" size={14} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Notifications</span>
            <div className="notif-panel-actions">
              {unread > 0 && (
                <button className="notif-action" onClick={markAllRead}>Mark read</button>
              )}
              {items.length > 0 && (
                <button className="notif-action" onClick={clearNotifications}>Clear</button>
              )}
            </div>
          </div>
          {items.length === 0 ? (
            <p className="notif-empty">Nothing yet — reminders and focus alerts land here.</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id} className={`notif-item ${n.read ? "" : "unread"}`}>
                  <span className="notif-dot" />
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    {n.body && <div className="notif-msg">{n.body}</div>}
                  </div>
                  <span className="notif-time">{fmtTime(n.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}