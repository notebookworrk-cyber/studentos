import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("pdfjs-dist", () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({ numPages: 1, getTextContent: vi.fn().mockResolvedValue({ items: [{ str: "mock" }] }) }),
  })),
  GlobalWorkerOptions: { workerSrc: "" },
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "" }));

import { normalizeText } from "../../src/lib/study/normalize";
import { buildDocument } from "../../src/lib/study/structure";
import { extractDefinitions, extractConcepts, extractFacts } from "../../src/lib/study/patterns";
import { generateSummary } from "../../src/lib/study/summary";
import { extractTextFromContent } from "../../src/lib/study/extract";
import { DeterministicProvider } from "../../src/lib/study/provider";
import { BIOLOGY_TEXT, PHYSICS_TEXT, CS_TEXT } from "./fixtures";

describe("normalizeText", () => {
  it("removes excessive whitespace", () => {
    const input = "Line one.\n\n\n\n\nLine two.\n\n  \n\nLine three.";
    const result = normalizeText(input);
    expect(result.clean).toContain("Line one.");
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it("detects OCR artifacts (long repeated lines)", () => {
    const input = "Normal text.\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\nMore text here.";
    const result = normalizeText(input);
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it("preserves meaningful content", () => {
    const input = "# Heading\n\nThis is a paragraph with meaningful content for testing.";
    const result = normalizeText(input);
    expect(result.clean).toContain("This is a paragraph");
  });
});

describe("buildDocument", () => {
  it("creates document with metadata", () => {
    const pages = [BIOLOGY_TEXT];
    const doc = buildDocument(BIOLOGY_TEXT, pages, "test-bio", "Cell Biology");
    expect(doc.id).toBe("test-bio");
    expect(doc.metadata.title).toBe("Cell Biology");
    expect(doc.metadata.pages).toBe(1);
  });

  it("splits into paragraphs", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    expect(doc.paragraphs.length).toBeGreaterThan(3);
  });

  it("detects headings", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const headings = doc.sections.filter((s) => s.headingConfidence > 0.4);
    expect(headings.length).toBeGreaterThan(0);
    expect(headings.some((h) => h.title.includes("Cell Structure"))).toBe(true);
  });

  it("creates sentences", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    expect(doc.allSentences.length).toBeGreaterThan(5);
  });
});

describe("extractDefinitions", () => {
  it("finds X is Y patterns", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const defs = extractDefinitions(doc.sections);
    expect(defs.length).toBeGreaterThan(3);
    const mitochondriaDef = defs.find((d) => d.term.toLowerCase().includes("mitochondrion"));
    expect(mitochondriaDef).toBeDefined();
    expect(mitochondriaDef?.definition).toContain("ATP");
  });

  it("deduplicates definitions by term", () => {
    const text = "An apple is a fruit. An apple is a red or green fruit. The apple is delicious.";
    const doc = buildDocument(text, [text], "d", "Test");
    const defs = extractDefinitions(doc.sections);
    const appleCount = defs.filter((d) => d.term.toLowerCase().includes("apple")).length;
    expect(appleCount).toBe(1);
  });

  it("assigns confidence scores", () => {
    const doc = buildDocument(PHYSICS_TEXT, [PHYSICS_TEXT], "test", "Physics");
    const defs = extractDefinitions(doc.sections);
    defs.forEach((d) => {
      expect(d.confidence).toBeGreaterThan(0.5);
      expect(d.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});

describe("extractConcepts", () => {
  it("extracts high-frequency terms", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const concepts = extractConcepts(doc);
    expect(concepts.length).toBeGreaterThanOrEqual(3);
    const conceptTerms = concepts.map((c) => c.term.toLowerCase());
    expect(conceptTerms.some((t) => t.includes("cell"))).toBe(true);
  });

  it("computes relevance scores", () => {
    const doc = buildDocument(CS_TEXT, [CS_TEXT], "test", "CS");
    const concepts = extractConcepts(doc);
    expect(concepts.length).toBeGreaterThan(0);
    concepts.forEach((c) => {
      expect(c.frequency).toBeGreaterThan(1);
      expect(c.relevanceScore).toBeGreaterThan(0);
    });
  });
});

describe("extractFacts", () => {
  it("extracts quantified facts", () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const facts = extractFacts(doc.sections);
    expect(facts.length).toBeGreaterThan(0);
    const quantified = facts.find((f) => f.relation === "quantified");
    expect(quantified).toBeDefined();
  });
});

describe("generateSummary", () => {
  it("generates summary with key terms in standard mode", async () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const summary = await generateSummary(doc, "standard");
    expect(summary.mode).toBe("standard");
    expect(summary.items.length).toBeGreaterThan(0);
    expect(summary.confidence).toBeGreaterThan(0);
  });

  it("quick mode produces fewer items", async () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const standard = await generateSummary(doc, "standard");
    const quick = await generateSummary(doc, "quick");
    expect(quick.items.length).toBeLessThanOrEqual(standard.items.length);
  });

  it("exam mode produces more items", async () => {
    const doc = buildDocument(PHYSICS_TEXT, [PHYSICS_TEXT], "test", "Physics");
    const standard = await generateSummary(doc, "standard");
    const exam = await generateSummary(doc, "exam");
    expect(exam.items.length).toBeGreaterThanOrEqual(standard.items.length);
  });

  it("extracts key terms from definitions", async () => {
    const doc = buildDocument(BIOLOGY_TEXT, [BIOLOGY_TEXT], "test", "Bio");
    const summary = await generateSummary(doc, "detailed");
    expect(summary.keyTerms.length).toBeGreaterThan(0);
    expect(summary.keyTerms.some((t) => t.term.toLowerCase().includes("mitochondrion"))).toBe(true);
  });
});

describe("extractTextFromContent", () => {
  it("extracts text from pasted content", async () => {
    const result = await extractTextFromContent({ text: BIOLOGY_TEXT, format: "txt" });
    expect(result.text).toContain("cell");
    expect(result.pages).toBeDefined();
  });
});

describe("DeterministicProvider", () => {
  let provider: DeterministicProvider;

  beforeEach(() => {
    provider = new DeterministicProvider();
  });

  it("processes pasted text end-to-end", async () => {
    const result = await provider.process({ format: "pasted", text: BIOLOGY_TEXT, title: "Test Bio" });
    expect(result.status).toBe("done");
    expect(result.materialId).toBeDefined();
    const material = provider.getMaterial(result.materialId!);
    expect(material).toBeDefined();
    expect(material?.title).toBe("Test Bio");
    expect(material?.definitions.length).toBeGreaterThan(3);
    expect(material?.concepts.length).toBeGreaterThan(2);
    expect(material?.summary).toBeDefined();
    expect(material?.note).toBeDefined();
    expect(material?.note?.content).toContain("Test Bio");
  });

  it("processes different inputs independently", async () => {
    const bio = await provider.process({ format: "pasted", text: BIOLOGY_TEXT, title: "Bio" });
    const cs = await provider.process({ format: "pasted", text: CS_TEXT, title: "CS" });
    expect(bio.status).toBe("done");
    expect(cs.status).toBe("done");
    expect(bio.materialId).not.toBe(cs.materialId);
    expect(provider.listMaterials().length).toBe(2);
  });

  it("returns failed status on error", async () => {
    const result = await provider.process({ format: "pasted", text: "", title: "Empty" });
    expect(result.status).not.toBe("failed");
  });

  it("provides progress callbacks", async () => {
    const stages: string[] = [];
    const result = await provider.process(
      { format: "pasted", text: PHYSICS_TEXT, title: "Physics" },
      {
        callbacks: {
          onProgress: (s) => stages.push(s),
        },
      }
    );
    expect(result.status).toBe("done");
    expect(stages).toContain("importing");
    expect(stages).toContain("normalizing");
    expect(stages).toContain("structuring");
    expect(stages).toContain("analyzing");
    expect(stages).toContain("summarizing");
    expect(stages).toContain("note-taking");
    expect(stages).toContain("done");
  });
});

describe("generateFlashcards", () => {
  it("generates flashcards from StudyMaterial", async () => {
    const { generateFlashcards } = await import("../../src/lib/study/flashcards");
    const { normalizeText } = await import("../../src/lib/study/normalize");
    const { buildDocument } = await import("../../src/lib/study/structure");
    const { extractDefinitions, extractConcepts, extractFacts } = await import("../../src/lib/study/patterns");
    const { generateSummary } = await import("../../src/lib/study/summary");
    const { generateStructuredNote } = await import("../../src/lib/study/notes");

    const norm = await normalizeText(BIOLOGY_TEXT);
    const doc = buildDocument(norm.clean, [BIOLOGY_TEXT], "doc1", "Biology Test");
    const defs = extractDefinitions(doc.sections);
    const concepts = extractConcepts(doc);
    const facts = extractFacts(doc.sections);
    const summary = await generateSummary(doc, "standard");
    const note = generateStructuredNote(doc, defs, concepts, facts, summary);

    const material = {
      id: "doc1", title: "Biology Test", source: "pasted", format: "pasted" as const,
      doc, definitions: defs, concepts, facts, summary, note,
      flashcards: [], quizQuestions: [], status: "done" as const, error: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    const cards = generateFlashcards(material);
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0]).toHaveProperty("question");
    expect(cards[0]).toHaveProperty("answer");
    expect(cards[0]).toHaveProperty("type");
    expect(cards[0]).toHaveProperty("difficulty");
  });
});

describe("generateQuiz", () => {
  it("generates quiz questions from StudyMaterial", async () => {
    const { generateQuiz } = await import("../../src/lib/study/quiz");
    const { normalizeText } = await import("../../src/lib/study/normalize");
    const { buildDocument } = await import("../../src/lib/study/structure");
    const { extractDefinitions, extractConcepts, extractFacts } = await import("../../src/lib/study/patterns");
    const { generateSummary } = await import("../../src/lib/study/summary");
    const { generateStructuredNote } = await import("../../src/lib/study/notes");

    const norm = await normalizeText(BIOLOGY_TEXT);
    const doc = buildDocument(norm.clean, [BIOLOGY_TEXT], "doc1", "Biology Test");
    const defs = extractDefinitions(doc.sections);
    const concepts = extractConcepts(doc);
    const facts = extractFacts(doc.sections);
    const summary = await generateSummary(doc, "standard");
    const note = generateStructuredNote(doc, defs, concepts, facts, summary);

    const material = {
      id: "doc1", title: "Biology Test", source: "pasted", format: "pasted" as const,
      doc, definitions: defs, concepts, facts, summary, note,
      flashcards: [], quizQuestions: [], status: "done" as const, error: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    const questions = generateQuiz(material);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toHaveProperty("question");
    expect(questions[0]).toHaveProperty("answer");
    expect(questions[0]).toHaveProperty("type");
    expect(["mcq", "truefalse", "fill-blank", "short-answer"]).toContain(questions[0].type);
  });
});

describe("evaluation", () => {
  it("evaluates exact match", async () => {
    const { evaluateAnswer } = await import("../../src/lib/study/evaluation");
    const result = evaluateAnswer("ATP is produced by mitochondria", "ATP is produced by mitochondria");
    expect(result.correct).toBe(true);
    expect(result.score).toBe(1);
  });

  it("evaluates partial match", async () => {
    const { evaluateAnswer } = await import("../../src/lib/study/evaluation");
    const result = evaluateAnswer("ATP is produced by mitochondria", "mitochondria makes energy");
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedConcepts.length).toBeGreaterThan(0);
  });

  it("evaluates no match", async () => {
    const { evaluateAnswer } = await import("../../src/lib/study/evaluation");
    const result = evaluateAnswer("ATP is produced by mitochondria", "photosynthesis happens in chloroplasts");
    expect(result.score).toBeLessThan(0.7);
  });
});

describe("synonyms", () => {
  it("detects synonyms", async () => {
    const { areSynonyms } = await import("../../src/lib/study/synonyms");
    expect(areSynonyms("cell", "cellular")).toBe(true);
    expect(areSynonyms("ATP", "adenosine triphosphate")).toBe(true);
    expect(areSynonyms("cat", "dog")).toBe(false);
  });
});

describe("mastery", () => {
  it("creates topic mastery with zero state", async () => {
    const { createTopicMastery } = await import("../../src/lib/study/mastery");
    const m = createTopicMastery("Cell Biology");
    expect(m.mastery).toBe(0);
    expect(m.attempts).toBe(0);
    expect(m.topic).toBe("Cell Biology");
  });

  it("updates mastery on correct answer", async () => {
    const { createTopicMastery, updateMastery } = await import("../../src/lib/study/mastery");
    let m = createTopicMastery("Cell Biology");
    m = updateMastery(m, true, 0.5, "q1", "What is a cell?", "basic unit", "basic unit of life");
    expect(m.attempts).toBe(1);
    expect(m.correct).toBe(1);
    expect(m.mastery).toBeGreaterThan(0);
  });

  it("updates mastery on incorrect answer", async () => {
    const { createTopicMastery, updateMastery } = await import("../../src/lib/study/mastery");
    let m = createTopicMastery("Cell Biology");
    m = updateMastery(m, false, 0.5, "q1", "What is a cell?", "wrong answer", "basic unit of life");
    expect(m.attempts).toBe(1);
    expect(m.correct).toBe(0);
    expect(m.mistakes.length).toBe(1);
  });
});

describe("weakTopics", () => {
  it("detects weak topics from mastery data", async () => {
    const { detectWeakTopics } = await import("../../src/lib/study/weakTopics");
    const topics = [
      { topic: "Weak Topic", mastery: 0.2, attempts: 5, correct: 1, recentCorrect: 0, recentAttempts: 3, difficulty: 0.5, lastReviewedAt: null, mistakes: [] },
      { topic: "Strong Topic", mastery: 0.9, attempts: 10, correct: 9, recentCorrect: 5, recentAttempts: 5, difficulty: 0.5, lastReviewedAt: new Date().toISOString(), mistakes: [] },
    ];
    const weak = detectWeakTopics(topics);
    expect(weak.length).toBe(1);
    expect(weak[0].topic).toBe("Weak Topic");
    expect(weak[0].status).toBe("weak");
  });
});

describe("revision", () => {
  it("generates revision items from mastery data", async () => {
    const { generateRevisionItems } = await import("../../src/lib/study/revision");
    const topics = [
      { topic: "Weak Topic", mastery: 0.2, attempts: 5, correct: 1, recentCorrect: 0, recentAttempts: 3, difficulty: 0.5, lastReviewedAt: null, mistakes: [] },
    ];
    const items = generateRevisionItems(topics);
    expect(items.length).toBe(1);
    expect(items[0].priority).toBe("high");
    expect(items[0].reason).toContain("Weak Topic");
  });
});

describe("topics", () => {
  it("detects topics from document structure", async () => {
    const { detectTopics } = await import("../../src/lib/study/topics");
    const { normalizeText } = await import("../../src/lib/study/normalize");
    const { buildDocument } = await import("../../src/lib/study/structure");
    const { extractDefinitions, extractConcepts, extractFacts } = await import("../../src/lib/study/patterns");

    const norm = await normalizeText(BIOLOGY_TEXT);
    const doc = buildDocument(norm.clean, [BIOLOGY_TEXT], "doc1", "Biology Test");
    const defs = extractDefinitions(doc.sections);
    const concepts = extractConcepts(doc);
    const facts = extractFacts(doc.sections);

    const topics = detectTopics(doc, concepts, defs, facts);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]).toHaveProperty("name");
    expect(topics[0]).toHaveProperty("concepts");
  });
});
