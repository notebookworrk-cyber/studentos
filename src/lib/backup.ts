import { todayISO } from "./date";

const APP = "studentos";

export interface BackupEnvelope {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, string>;
}

function collectKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("studentos.") && k !== "studentos.backup.date.v1") keys.push(k);
  }
  return keys;
}

export function exportData(): BackupEnvelope {
  const data: Record<string, string> = {};
  for (const k of collectKeys()) {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  }
  return { app: APP, version: 1, exportedAt: new Date().toISOString(), data };
}

export function importData(raw: string): { ok: boolean; count: number; error?: string } {
  let env: unknown;
  try {
    env = JSON.parse(raw);
  } catch {
    return { ok: false, count: 0, error: "That file isn't valid JSON." };
  }
  const e = env as BackupEnvelope;
  if (!e || e.app !== APP || typeof e.data !== "object" || e.data === null) {
    return { ok: false, count: 0, error: "That file isn't a StudentOS backup." };
  }
  let count = 0;
  for (const [k, v] of Object.entries(e.data)) {
    if (!k.startsWith("studentos.")) continue;
    try {
      localStorage.setItem(k, String(v));
      count++;
    } catch {
      /* quota */
    }
  }
  return { ok: true, count };
}

export async function downloadJSON(env: BackupEnvelope) {
  const blob = new Blob([JSON.stringify(env, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studentos-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function maybeAutoBackup() {
  const desktop = (window as unknown as { studentos?: { files?: { autoBackup: (p: { content: string }) => Promise<unknown> } } }).studentos;
  if (!desktop?.files?.autoBackup) return;
  const today = todayISO();
  if (localStorage.getItem("studentos.backup.date.v1") === today) return;
  localStorage.setItem("studentos.backup.date.v1", today);
  desktop.files.autoBackup({ content: JSON.stringify(exportData()) }).catch(() => {});
}