import { useSyncExternalStore } from "react";

export interface UpdateInfo {
  version: string | null;
  notes: string | null;
  size: number;
}

export interface UpdateSnapshot {
  enabled: boolean;
  state: "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";
  channel: string;
  version: string;
  update: UpdateInfo | null;
  progress: { percent: number; transferred: number; total: number } | null;
  error: string | null;
  lastResult: "up-to-date" | "update-available" | "error" | null;
}

const INITIAL: UpdateSnapshot = {
  enabled: false,
  state: "idle",
  channel: "stable",
  version: "",
  update: null,
  progress: null,
  error: null,
  lastResult: null,
};

let snap: UpdateSnapshot = INITIAL;
let dismissed = false;
let notesOpen = false;
let booted = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function apply(next: Partial<UpdateSnapshot>) {
  if (next.update?.version && next.update.version !== snap.update?.version) {
    dismissed = false;
  }
  snap = { ...snap, ...next };
  emit();
}

export function ensureUpdate() {
  const updater = window.studentos?.updater;
  if (!updater || booted) return;
  booted = true;
  updater.onEvent(({ state }) => apply(state));
  void updater.status().then(apply).catch(() => {});
}

export function checkForUpdate() {
  const updater = window.studentos?.updater;
  if (!updater) return;
  void updater.check().then(apply).catch(() => {});
}

export function downloadUpdate() {
  const updater = window.studentos?.updater;
  if (!updater) return;
  void updater.download().then(apply).catch(() => {});
}

export function quitAndInstall() {
  window.studentos?.updater?.quitAndInstall().catch(() => {});
}

export function setNotesOpen(open: boolean) {
  notesOpen = open;
  emit();
}

export function setDismissed() {
  dismissed = true;
  emit();
}

export function useUpdate() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snap,
  );
  return { ...snap, dismissed, notesOpen };
}

export function formatSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}