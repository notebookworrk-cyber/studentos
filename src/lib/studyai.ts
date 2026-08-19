import type { Note, StudySubject } from "../types";

export type SummaryLength = "tldr" | "short" | "detailed";

export interface SummaryResult {
  length: SummaryLength;
  summary: string;
  keyTerms: { term: string; meaning: string }[];
  studyPoints: string[];
  actionItems: string[];
  conceptMap: { from: string; to: string; label: string }[];
}

export interface QuizQuestion {
  type: "mcq" | "truefalse";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  sourceNote: string;
}

export interface QuizResult {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  source: string;
}
export interface FlashcardResult {
  title: string;
  cards: Flashcard[];
}

export interface AskResult {
  answer: string;
  citations: { note: string; snippet: string }[];
  related: string[];
}

export type StudyAIKind = "summarize" | "quiz" | "flashcards" | "ask" | "improve" | "expand" | "suggest";

export type StudyAIScope =
  | { mode: "note"; noteId: string }
  | { mode: "folder"; folder: string }
  | { mode: "subject"; subjectId: string }
  | { mode: "all" };

export interface StudyAICtx {
  notes: Note[];
  subjects: StudySubject[];
  scope: StudyAIScope;
  length?: SummaryLength;
}

export type StudyAIResult =
  | { kind: "summarize"; data: SummaryResult }
  | { kind: "quiz"; data: QuizResult }
  | { kind: "flashcards"; data: FlashcardResult }
  | { kind: "ask"; data: AskResult }
  | { kind: "improve" | "expand" | "suggest"; data: { text: string; noteId?: string } };

const STOPWORDS = new Set(
  ("the a an and or but if then else for of to in on at by with from as is are was were be been being have has had do does did " +
    "it its this that these those i you he she we they my your his her our their me us them what which who whom when where why how " +
    "all any both each few more most other some such no not only own same so than too very can will just should could would may might " +
    "about into over under again further once here there where because while during before after above below between through " +
    "am out up down off out over then once here there via vs per also thereupon hence thus namely likewise e.g eg i.e etc like " +
    "using use uses used make makes made also called known as including includes included").split(/\s+/),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function freq(words: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

function topWords(words: string[], n: number): string[] {
  return [...freq(words).entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
}

function firstSentenceWith(text: string, sentences: string[], term: string): string {
  const t = term.toLowerCase();
  return sentences.find((s) => s.toLowerCase().includes(t)) ?? sentences[0] ?? text;
}

function scoreSentence(sentence: string, freqMap: Map<string, number>): number {
  const words = tokenize(sentence);
  let score = 0;
  for (const w of words) score += freqMap.get(w) ?? 0;
  return score + (sentence.length < 220 && sentence.length > 40 ? 0.5 : 0);
}

export function rankSentences(sentences: string[], words: string[]): { s: string; score: number }[] {
  const fm = freq(words);
  return sentences
    .map((s) => ({ s, score: scoreSentence(s, fm) }))
    .sort((a, b) => b.score - a.score);
}

function scopeNotes(ctx: StudyAICtx): { note: Note; subject?: StudySubject }[] {
  const scope = ctx.scope;
  const bySubject = new Map(ctx.subjects.map((s) => [s.folder, s]));
  switch (scope.mode) {
    case "note":
      return ctx.notes
        .filter((n) => n.id === scope.noteId)
        .map((n) => ({ note: n, subject: bySubject.get(n.folder) }));
    case "folder":
      return ctx.notes
        .filter((n) => n.folder === scope.folder)
        .map((n) => ({ note: n, subject: bySubject.get(n.folder) }));
    case "subject": {
      const sub = ctx.subjects.find((s) => s.id === scope.subjectId);
      return ctx.notes
        .filter((n) => n.folder === sub?.folder)
        .map((n) => ({ note: n, subject: sub }));
    }
    default:
      return ctx.notes.map((n) => ({ note: n, subject: bySubject.get(n.folder) }));
  }
}

function summarize(ctx: StudyAICtx): SummaryResult {
  const items = scopeNotes(ctx);
  const all = items.map((i) => `${i.note.title}\n${i.note.content}`).join("\n\n");
  const sentences = splitSentences(all);
  const words = tokenize(all);
  const ranked = rankSentences(sentences, words);

  const length = ctx.length ?? "short";
  const n = length === "tldr" ? 1 : length === "short" ? 3 : Math.max(5, Math.round(sentences.length * 0.5));
  const summary = ranked
    .slice(0, Math.min(n, ranked.length))
    .sort((a, b) => sentences.indexOf(a.s) - sentences.indexOf(b.s))
    .map((r) => r.s)
    .join(" ");

  const keyTerms = topWords(words, 8).map((term) => ({
    term,
    meaning: firstSentenceWith(all, sentences, term).slice(0, 160),
  }));

  const defWords = new Set(["is", "are", "means", "defined", "consists", "composed", "refers", "role", "function", "process", "causes", "results", "involves", "important", "key", "system", "structure"]);
  const studyPoints = ranked
    .filter((r) => tokenize(r.s).some((w) => defWords.has(w)))
    .slice(0, 6)
    .map((r) => r.s);

  const actionWords = new Set(["should", "must", "remember", "note", "formula", "next", "step", "review", "practice", "apply", "write", "explain", "summarize", "equation", "calculate"]);
  const actionItems = ranked
    .filter((r) => tokenize(r.s).some((w) => actionWords.has(w)))
    .slice(0, 4)
    .map((r) => r.s);

  const kt = keyTerms.slice(0, 6);
  const conceptMap: { from: string; to: string; label: string }[] = [];
  for (const s of sentences) {
    const present = kt.filter((k) => s.toLowerCase().includes(k.term));
    for (let i = 0; i < present.length - 1; i++) {
      conceptMap.push({ from: present[i].term, to: present[i + 1].term, label: "relates to" });
    }
  }

  return { length, summary, keyTerms, studyPoints, actionItems, conceptMap };
}

function quiz(ctx: StudyAICtx): QuizResult {
  const items = scopeNotes(ctx);
  const questions: QuizQuestion[] = [];
  for (const { note } of items) {
    const sentences = splitSentences(note.content);
    const words = tokenize(note.content);
    if (sentences.length < 2) continue;
    const ranked = rankSentences(sentences, words);
    const target = ranked.slice(0, Math.min(3, ranked.length));
    const distractors = ranked.slice(3);
    for (const r of target) {
      const t = tokenize(r.s);
      const keyword = t.find((w) => (freq(words).get(w) ?? 0) >= 2) ?? t[0];
      if (!keyword) continue;
      if (Math.random() < 0.4) {
        const answer = Math.random() < 0.5 ? 0 : 1;
        questions.push({
          type: "truefalse",
          question: `True or false: ${keyword.includes(" ") ? keyword : ""}${r.s}`,
          options: ["True", "False"],
          answer,
          explanation: `${answer === 0 ? "True" : "False"} — ${r.s}`,
          sourceNote: note.title,
        });
        continue;
      }
      const opts = [r.s.slice(0, 140)];
      for (const d of distractors) {
        if (opts.length >= 4) break;
        opts.push(d.s.slice(0, 140));
      }
      const answer = 0;
      const pool = opts.slice(1).sort(() => Math.random() - 0.5);
      const all = [opts[answer], ...pool];
      questions.push({
        type: "mcq",
        question: `Which statement is correct about "${keyword}"?`,
        options: all,
        answer: all.indexOf(opts[answer]),
        explanation: r.s,
        sourceNote: note.title,
      });
    }
    if (questions.length >= 12) break;
  }
  return { title: "Study Quiz", questions };
}

function flashcards(ctx: StudyAICtx): FlashcardResult {
  const items = scopeNotes(ctx);
  const cards: Flashcard[] = [];
  let id = 0;
  for (const { note } of items) {
    const sentences = splitSentences(note.content);
    const words = tokenize(note.content);
    const ranked = rankSentences(sentences, words);
    for (const r of ranked.slice(0, Math.min(3, ranked.length))) {
      const t = tokenize(r.s);
      const term = topWords(t, 1)[0] ?? t[0];
      if (!term) continue;
      cards.push({
        id: `fc-${note.id}-${id++}`,
        front: `What is "${term}"?`,
        back: r.s,
        source: note.title,
      });
    }
  }
  return { title: "Study Flashcards", cards };
}

function ask(ctx: StudyAICtx, question: string): AskResult {
  const qWords = tokenize(question);
  const items = scopeNotes(ctx);
  const citations: { note: string; snippet: string }[] = [];
  for (const { note } of items) {
    const sentences = splitSentences(note.content);
    for (const s of sentences) {
      const sl = s.toLowerCase();
      const hits = qWords.filter((w) => sl.includes(w));
      if (hits.length >= Math.max(1, Math.round(qWords.length / 3))) {
        citations.push({ note: note.title, snippet: s });
      }
    }
  }
  const answer = citations.length
    ? citations.slice(0, 3).map((c) => `• ${c.snippet}`).join("\n")
    : "I couldn't find a direct answer in your notes. Try rephrasing, or ask about a term that appears in a note.";
  const related = topWords(tokenize(citations.map((c) => c.snippet).join(" ")), 5).filter(Boolean);
  return { answer, citations: citations.slice(0, 3), related };
}

function improve(note: Note): { text: string } {
  const sentences = splitSentences(note.content);
  const ranked = rankSentences(sentences, tokenize(note.content));
  const summary = ranked.slice(0, Math.min(3, ranked.length)).map((r) => r.s).join(" ");
  const title = note.title.trim() || "Untitled note";
  const text = [
    `# ${title}`,
    ``,
    `## Overview`,
    summary,
    ``,
    `## Key points`,
    ...ranked.slice(0, Math.min(5, ranked.length)).map((r, i) => `${i + 1}. ${r.s}`),
    ``,
    `## Action`,
    ...(ranked.filter((r) => tokenize(r.s).some((w) => ["should", "must", "review", "practice", "next", "step", "calculate"].includes(w))).slice(0, 3).map((r) => `- [ ] ${r.s}`) ?? []),
  ].join("\n");
  return { text };
}

function expand(note: Note): { text: string } {
  const sentences = splitSentences(note.content);
  const words = tokenize(note.content);
  const fm = freq(words);
  const gaps: string[] = [];
  for (const s of sentences) {
    const t = tokenize(s);
    const big = t.filter((w) => (fm.get(w) ?? 0) >= 2 && w.length > 5);
    if (big.length && !s.includes(" because ") && !s.includes(" which ")) {
      gaps.push(`Expand: "${s}" — why does "${big[0]}" matter and how does it work?`);
    }
  }
  const text = [
    ...sentences,
    ``,
    `## Open questions`,
    ...(gaps.slice(0, 3).length ? gaps.slice(0, 3) : ["What are the causes and consequences here?"]),
  ].join("\n");
  return { text };
}

function suggest(note: Note, subjects: StudySubject[]): { text: string } {
  const words = tokenize(note.content);
  const subj = subjects.find((s) => s.folder === note.folder);
  const tags = topWords(words, 5);
  return {
    text: [
      `Suggested tags: ${tags.join(", ")}`,
      subj ? `Linked subject: ${subj.name} — ${subj.objective}` : `Category: ${note.category || "General"}`,
      `Tone: study note. Suggested next: turn the key terms into a quiz or flashcards.`,
    ].join("\n"),
  };
}

export function runStudyAction(
  kind: StudyAIKind,
  ctx: StudyAICtx,
  extra?: { question?: string; noteId?: string },
): StudyAIResult {
  switch (kind) {
    case "summarize":
      return { kind, data: summarize(ctx) };
    case "quiz":
      return { kind, data: quiz(ctx) };
    case "flashcards":
      return { kind, data: flashcards(ctx) };
    case "ask":
      return { kind, data: ask(ctx, extra?.question ?? "") };
    case "improve": {
      const note = ctx.notes.find((n) => n.id === (extra?.noteId ?? (ctx.scope as { noteId?: string }).noteId));
      return { kind, data: { text: note ? improve(note).text : "No note selected.", noteId: note?.id } };
    }
    case "expand": {
      const note = ctx.notes.find((n) => n.id === (extra?.noteId ?? (ctx.scope as { noteId?: string }).noteId));
      return { kind, data: { text: note ? expand(note).text : "No note selected.", noteId: note?.id } };
    }
    case "suggest": {
      const note = ctx.notes.find((n) => n.id === (extra?.noteId ?? (ctx.scope as { noteId?: string }).noteId));
      return { kind, data: { text: note ? suggest(note, ctx.subjects).text : "No note selected.", noteId: note?.id } };
    }
  }
}