import { useSyncExternalStore } from "react";

export interface CenterItem {
  id: number;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

const KEY = "studentos.notifications.v1";
const FIRED_KEY = "studentos.notifications.fired.v1";
const MAX_ITEMS = 50;

let items: CenterItem[] = loadItems();
let seq = items.length ? items[0].id : 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function loadItems(): CenterItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(raw)) return raw;
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
}

function fireOS(title: string, body: string) {
  const desktop = (window as unknown as { studentos?: { notify?: { show: (p: { title: string; body?: string }) => Promise<unknown> } } }).studentos;
  if (desktop?.notify?.show) {
    desktop.notify.show({ title, body }).catch(() => {});
    return;
  }
  try {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, silent: true });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((p) => {
          if (p === "granted") new Notification(title, { body, silent: true });
        });
      }
    }
  } catch {
    /* notifications unsupported */
  }
}

export function notify(title: string, body = "") {
  items = [{ id: ++seq, title, body, at: Date.now(), read: false }, ...items].slice(0, MAX_ITEMS);
  persist();
  emit();
  fireOS(title, body);
}

export function useNotifications(): CenterItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
  );
}

export function useUnreadCount(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items.filter((i) => !i.read).length,
  );
}

export function markAllRead() {
  items = items.map((i) => (i.read ? i : { ...i, read: true }));
  persist();
  emit();
}

export function clearNotifications() {
  items = [];
  persist();
  emit();
}

function loadFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function rememberFired(key: string) {
  const map = loadFired();
  map[key] = Date.now();
  const cutoff = Date.now() - 3 * 864e5;
  for (const k of Object.keys(map)) if (map[k] < cutoff) delete map[k];
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function wasFired(key: string): boolean {
  return !!loadFired()[key];
}