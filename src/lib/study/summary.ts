import { rankSentences, tokenize } from "../studyai";
import type { Document, SummaryMode, SummaryResult } from "./types";

const MODE_CONFIGS: Record<SummaryMode, { ratio: number; maxItems: number; topTerms: number }> = {
  quick: { ratio: 0.05, maxItems: 5, topTerms: 3 },
  standard: { ratio: 0.15, maxItems: 10, topTerms: 5 },
  detailed: { ratio: 0.3, maxItems: 20, topTerms: 8 },
  exam: { ratio: 0.5, maxItems: 50, topTerms: 12 },
};

export async function generateSummary(
  doc: Document,
  mode: SummaryMode = "standard"
): Promise<SummaryResult> {
  const cfg = MODE_CONFIGS[mode];
  const allSentences = doc.allSentences;

  if (allSentences.length === 0) {
    return { mode, items: [], keyTerms: [], confidence: 0 };
  }

  const words = tokenize(doc.normalizedText);
  const ranked = rankSentences(allSentences.map((s) => s.text), words);
  const topCount = Math.max(1, Math.floor(allSentences.length * cfg.ratio));
  const items = ranked
    .slice(0, Math.min(topCount, cfg.maxItems))
    .map((r) => {
      const sentence = allSentences.find((s) => s.text === r.s);
      return {
        text: r.s,
        source: sentence?.span ?? { docId: doc.id },
      };
    })
    .filter((item) => item.text.length > 10);

  const keyTerms = extractKeyTerms(doc, cfg.topTerms);

  const confidence = items.length / Math.max(1, cfg.maxItems);

  return {
    mode,
    items,
    keyTerms,
    confidence,
  };
}

function extractKeyTerms(doc: Document, limit: number): { term: string; meaning: string; source: { docId: string } }[] {
  const terms: { term: string; meaning: string; source: { docId: string } }[] = [];

  for (const section of doc.sections) {
    for (const para of section.paragraphs) {
      for (const sentence of para.sentences) {
        const match = sentence.text.match(/^(.+?)\s+(?:is|are|means|refers to)\s+(.+)$/i);
        if (match) {
          terms.push({
            term: match[1].trim(),
            meaning: match[2].replace(/\.$/, "").trim(),
            source: { docId: doc.id },
          });
        }
      }
    }
  }

  return terms.slice(0, limit);
}
