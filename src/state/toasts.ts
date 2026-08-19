import { useSyncExternalStore } from "react";

export type ToastKind = "ok" | "info" | "warn" | "err";

interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toast(msg: string, kind: ToastKind = "info") {
  const last = toasts[toasts.length - 1];
  if (last && last.msg === msg && last.kind === kind) return;
  const t = { id: ++seq, msg, kind };
  toasts = [...toasts, t].slice(-4);
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 3200);
}

export function dismiss(id: number) {
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
  );
}
