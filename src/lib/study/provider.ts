import { extractText } from "./extract";
import { normalizeText } from "./normalize";
import { buildDocument } from "./structure";
import { extractConcepts, extractDefinitions, extractFacts } from "./patterns";
import { generateSummary } from "./summary";
import { generateStructuredNote } from "./notes";
import { generateFlashcards } from "./flashcards";
import { generateQuiz } from "./quiz";
import type {
  Document,
  ProcessInput,
  ProcessResult,
  ProcessingStatus,
  StudyIntelligenceResult,
  StudyMaterial,
  SummaryMode,
} from "./types";

export interface StudyIntelligenceProvider {
  process(input: ProcessInput, opts?: { summaryMode?: SummaryMode }): Promise<ProcessResult>;
  getMaterial(id: string): StudyMaterial | undefined;
  listMaterials(): StudyMaterial[];
}

export interface PipelineCallbacks {
  onProgress?: (status: ProcessingStatus) => void;
  onMaterialReady?: (material: StudyMaterial) => void;
}

export class DeterministicProvider implements StudyIntelligenceProvider {
  private store = new Map<string, StudyMaterial>();

  async process(
    input: ProcessInput,
    opts?: { summaryMode?: SummaryMode; callbacks?: PipelineCallbacks }
  ): Promise<ProcessResult> {
    const { summaryMode = "standard", callbacks } = opts ?? {};
    const docId = `doc-${Date.now()}`;
    const title = ("title" in input && input.title) ? input.title : `Document ${docId}`;

    try {
      callbacks?.onProgress?.("importing");

      let pages: string[] = [];
      let rawText = "";

      if (input.format === "pasted") {
        rawText = input.text;
        pages = [input.text];
      } else if (input.format === "txt" || input.format === "md") {
        rawText = input.text;
        pages = [input.text];
      } else {
        const pdfInput = input as { format: "pdf"; file: File };
        const result = await extractText({ file: pdfInput.file, format: "pdf" });
        rawText = result.text;
        pages = result.pages ?? [result.text];
      }

      callbacks?.onProgress?.("normalizing");
      const normalized = await normalizeText(rawText, pages);

      callbacks?.onProgress?.("structuring");
      const doc: Document = buildDocument(normalized.clean, pages, docId, title);

      callbacks?.onProgress?.("analyzing");
      const definitions = extractDefinitions(doc.sections);
      const concepts = extractConcepts(doc);
      const facts = extractFacts(doc.sections);

      const result: StudyIntelligenceResult = {
        definitions,
        concepts,
        facts,
        summary: { mode: summaryMode, items: [], keyTerms: [], confidence: 0 },
        note: { id: "", title: "", content: "", docId, generatedAt: "" },
      };

      callbacks?.onProgress?.("summarizing");
      result.summary = await generateSummary(doc, summaryMode);

      callbacks?.onProgress?.("note-taking");
      result.note = generateStructuredNote(doc, definitions, concepts, facts, result.summary);

      const flashcards = generateFlashcards({ id: docId, title, source: input.format, format: input.format, doc, definitions, concepts, facts, summary: result.summary, note: result.note, flashcards: [], quizQuestions: [], status: "done", error: null, createdAt: "", updatedAt: "" });
      const quizQuestions = generateQuiz({ id: docId, title, source: input.format, format: input.format, doc, definitions, concepts, facts, summary: result.summary, note: result.note, flashcards: [], quizQuestions: [], status: "done", error: null, createdAt: "", updatedAt: "" });

      const material: StudyMaterial = {
        id: docId,
        title,
        source: input.format,
        format: input.format,
        doc,
        definitions,
        concepts,
        facts,
        summary: result.summary,
        note: result.note,
        flashcards,
        quizQuestions,
        status: "done",
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.store.set(docId, material);
      callbacks?.onMaterialReady?.(material);
      callbacks?.onProgress?.("done");

      return { status: "done", materialId: docId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      callbacks?.onProgress?.("failed");
      return { status: "failed", error };
    }
  }

  getMaterial(id: string): StudyMaterial | undefined {
    return this.store.get(id);
  }

  listMaterials(): StudyMaterial[] {
    return Array.from(this.store.values());
  }
}

export const defaultProvider = new DeterministicProvider();
