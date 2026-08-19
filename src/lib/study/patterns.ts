import { DEFINITION_PATTERNS } from "./structure";
import type { Concept, Definition, Document, Fact, Section } from "./types";

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "shall", "can", "this", "that",
  "these", "those", "i", "you", "he", "she", "it", "we", "they", "as", "from", "which", "which",
  "not", "no", "so", "than", "then", "there", "here", "what", "which", "who", "whom", "whose",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "only", "own",
  "same", "too", "very", "just", "also", "now", "up", "out", "about", "into", "over", "under",
  "again", "further", "once", "here", "there", "when", "where", "why", "how", "all", "any",
]);

export function extractDefinitions(sections: Section[]): Definition[] {
  const definitions: Definition[] = [];
  let defIdx = 0;

  for (const section of sections) {
    for (const para of section.paragraphs) {
      for (const pattern of DEFINITION_PATTERNS) {
        const match = para.text.match(pattern);
        if (match) {
          const term = match[1]?.trim();
          const def = match[3]?.trim() || match[2]?.trim();
          if (term && def && term.length > 2 && term.length < 50 && def.length > 10) {
            definitions.push({
              id: `def-${defIdx}`,
              term: cleanTerm(term),
              definition: def.replace(/\.$/, ""),
              confidence: 0.85,
              span: { ...para.span, paragraphId: para.id },
            });
            defIdx++;
          }
        }
      }
    }
  }

  return deduplicateDefinitions(definitions);
}

function cleanTerm(term: string): string {
  return term
    .replace(/^(The|A|An)\s+/i, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim();
}

function deduplicateDefinitions(defs: Definition[]): Definition[] {
  const seen = new Map<string, Definition>();
  for (const d of defs) {
    const key = d.term.toLowerCase();
    const existing = seen.get(key);
    if (!existing || d.definition.length > existing.definition.length) {
      seen.set(key, d);
    }
  }
  return Array.from(seen.values());
}

export function extractConcepts(doc: Document): Concept[] {
  const termFreq = new Map<string, number>();
  const termParagraphs = new Map<string, Set<number>>();
  const termContexts = new Map<string, Set<string>>();
  const paragraphCount = doc.paragraphs.length;

  for (let pi = 0; pi < doc.paragraphs.length; pi++) {
    const para = doc.paragraphs[pi];
    const tokens = tokenize(para.text);
    const uniqueTokens = new Set(tokens);

    for (const token of uniqueTokens) {
      termFreq.set(token, (termFreq.get(token) ?? 0) + 1);

      const paras = termParagraphs.get(token) ?? new Set();
      paras.add(pi);
      termParagraphs.set(token, paras);

      const contexts = termContexts.get(token) ?? new Set();
      const sentenceText = para.sentences.find((s) => s.text.toLowerCase().includes(token));
      if (sentenceText) {
        contexts.add(sentenceText.text.substring(0, 100));
      }
      termContexts.set(token, contexts);
    }
  }

  const concepts: Concept[] = [];
  const sortedTerms = Array.from(termFreq.entries()).sort((a, b) => b[1] - a[1]);

  let conceptIdx = 0;
  for (const [term, freq] of sortedTerms) {
    if (freq < 2) break;

    const numParas = termParagraphs.get(term)?.size ?? 0;
    const spread = numParas / paragraphCount;
    const score = freq * spread;

    if (score < 1.5) continue;

    concepts.push({
      id: `concept-${conceptIdx}`,
      term,
      frequency: freq,
      relevanceScore: score,
      contexts: Array.from(termContexts.get(term) ?? []).slice(0, 3),
      span: { docId: doc.id },
    });
    conceptIdx++;
  }

  return concepts.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function extractFacts(sections: Section[]): Fact[] {
  const facts: Fact[] = [];
  let factIdx = 0;

  const numberPattern = /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|m|cm|km|°C|°F|s|%|Hz|Pa|N|J|W|V|A|mol|bytes?|bits?|ATP|molecules?|cells?|steps?|stages?|phases?|cycles?|generations?)\b/gi;
  const relationPatterns = [
    /(?:increase|decrease|rise|fall|drop|cause|lead to|result in|produce|generate|emit|reduce|enhance)/gi,
    /(?:effect|effectiveness|efficacy|impact|role|function|importance|significance|relationship)/gi,
  ];

  for (const section of sections) {
    for (const para of section.paragraphs) {
      const sentences = splitIntoSentences(para.text);
      for (const sentence of sentences) {
        const matchNum = sentence.match(numberPattern);
        const matchRel = relationPatterns.some((p) => p.test(sentence));
        if (matchNum || matchRel) {
          facts.push({
            id: `fact-${factIdx}`,
            subject: para.sentences[0]?.text.substring(0, 50) ?? "unknown",
            relation: matchNum ? "quantified" : "causal",
            object: sentence.substring(0, 80),
            confidence: 0.7,
            span: { ...para.span, paragraphId: para.id },
          });
          factIdx++;
        }
      }
    }
  }

  return facts.slice(0, 50);
}

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 15);
}
