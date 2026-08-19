export type ProcessingStatus = "idle" | "importing" | "extracting" | "normalizing" | "structuring" | "analyzing" | "summarizing" | "note-taking" | "done" | "failed";

export type InputFormat = "pdf" | "txt" | "md" | "pasted";

export interface SourceSpan {
  docId: string;
  sectionId?: string;
  paragraphId?: string;
  sentenceIndex?: number;
  page?: number;
}

export interface DocMetadata {
  title: string;
  source: string;
  format: InputFormat;
  pages: number;
  createdAt: string;
  importedAt: string;
}

export interface Sentence {
  id: string;
  text: string;
  confidence: number;
  span: SourceSpan;
}

export interface Paragraph {
  id: string;
  text: string;
  sentences: Sentence[];
  pageNumber: number | null;
  span: SourceSpan;
}

export interface Section {
  id: string;
  title: string;
  level: number;
  headingConfidence: number;
  startPara: number;
  paragraphs: Paragraph[];
  span: SourceSpan;
}

export interface Document {
  id: string;
  metadata: DocMetadata;
  rawText: string;
  normalizedText: string;
  pages: string[];
  sections: Section[];
  paragraphs: Paragraph[];
  allSentences: Sentence[];
}

export interface Definition {
  id: string;
  term: string;
  definition: string;
  confidence: number;
  span: SourceSpan;
}

export interface Concept {
  id: string;
  term: string;
  frequency: number;
  relevanceScore: number;
  contexts: string[];
  span: SourceSpan;
}

export interface Fact {
  id: string;
  subject: string;
  relation: string;
  object: string;
  confidence: number;
  span: SourceSpan;
}

export type SummaryMode = "quick" | "standard" | "detailed" | "exam";

export interface SummaryItem {
  text: string;
  source: SourceSpan;
}

export interface SummaryResult {
  mode: SummaryMode;
  items: SummaryItem[];
  keyTerms: { term: string; meaning: string; source: SourceSpan }[];
  confidence: number;
}

export interface StructuredNote {
  id: string;
  title: string;
  content: string;
  docId: string;
  generatedAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  source: string;
  format: InputFormat;
  doc: Document;
  definitions: Definition[];
  concepts: Concept[];
  facts: Fact[];
  summary: SummaryResult | null;
  note: StructuredNote | null;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  status: ProcessingStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProcessInput =
  | { format: "pasted"; text: string; title: string }
  | { format: "txt" | "md"; text: string; title: string }
  | { format: "pdf"; file: File; title?: string };

export interface ProcessResult {
  status: ProcessingStatus;
  materialId?: string;
  error?: string;
}

export interface StudyIntelligenceResult {
  definitions: Definition[];
  concepts: Concept[];
  facts: Fact[];
  summary: SummaryResult;
  note: StructuredNote;
}

// ── Flashcards ──

export type FlashcardType = "definition" | "fact" | "process" | "component" | "cause-effect" | "comparison";

export type FlashcardDifficulty = "easy" | "medium" | "hard";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  type: FlashcardType;
  topic: string;
  difficulty: FlashcardDifficulty;
  confidence: number;
  source: SourceSpan;
}

// ── Quiz ──

export type QuizQuestionType = "mcq" | "truefalse" | "fill-blank" | "short-answer";

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[];
  answer: string;
  answerIndex: number;
  explanation: string;
  topic: string;
  difficulty: QuizDifficulty;
  confidence: number;
  source: SourceSpan;
}

export interface QuizAttempt {
  id: string;
  materialId: string;
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  score: number;
  totalQuestions: number;
  startedAt: string;
  completedAt: string | null;
}

export interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  correct: boolean;
  score: number;
  feedback: string;
}

// ── Mastery ──

export interface MasteryState {
  materialId: string;
  topics: TopicMastery[];
  overallMastery: number;
  lastReviewedAt: string | null;
  totalAttempts: number;
  totalCorrect: number;
}

export interface TopicMastery {
  topic: string;
  mastery: number;
  attempts: number;
  correct: number;
  recentCorrect: number;
  recentAttempts: number;
  difficulty: number;
  lastReviewedAt: string | null;
  mistakes: MistakeRecord[];
}

export interface MistakeRecord {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

// ── Weak Topics ──

export interface WeakTopic {
  topic: string;
  mastery: number;
  status: "weak" | "struggling" | "review";
  reasons: string[];
  recentErrors: number;
  totalAttempts: number;
}

// ── Revision ──

export interface RevisionItem {
  topic: string;
  priority: "high" | "medium" | "low";
  reason: string;
  mastery: number;
  lastReviewedAt: string | null;
  suggestedAction: string;
}
