import type { StudyAIScope, StudyAIKind } from "./studyai";

export type AIIntent = { action: StudyAIKind; scope: StudyAIScope } | null;

const KEY = "studentos.ai.intent.v1";

export function getIntent(): AIIntent {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AIIntent) : null;
  } catch {
    return null;
  }
}

export function setIntent(intent: AIIntent): void {
  if (intent) localStorage.setItem(KEY, JSON.stringify(intent));
  else localStorage.removeItem(KEY);
}