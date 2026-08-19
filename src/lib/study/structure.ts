import type { Document, Paragraph, Section, Sentence, SourceSpan } from "./types";

const HEADING_NUMBERS = /^\s*(?:(\d+(?:\.\d+)*)\s+|(\d+\.\s+)|([IVX]+\.\s+)|([A-Z]\.\s+))/i;
const DEFINITION_PATTERNS = [
  /^(.+?)\s+(is|are|means|refers to|is defined as|is known as|is called)\s+(.+)$/i,
  /^The\s+(.+?)\s+(is|are)\s+(.+)$/i,
  /^(?:A|An|The)\s+(.+?)\s+(is|are)\s+(.+)$/i,
  /^(.+?):\s*(.+)$/,
];

export function buildDocument(text: string, pages: string[], docId: string, title: string): Document {
  const paragraphs = splitIntoParagraphs(text, pages, docId);
  const sections = buildSections(paragraphs, docId);
  const allSentences = paragraphs.flatMap((p) => p.sentences);

  return {
    id: docId,
    metadata: {
      title,
      source: "uploaded",
      format: "pdf",
      pages: pages.length,
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
    },
    rawText: text,
    normalizedText: text,
    pages,
    sections,
    paragraphs,
    allSentences,
  };
}

function splitIntoParagraphs(text: string, pages: string[], docId: string): Paragraph[] {
  const pageMap = buildPageMap(pages);
  const rawParagraphs = text.split(/\n{2,}/);
  const paragraphs: Paragraph[] = [];
  let paraIdx = 0;

  for (const chunk of rawParagraphs) {
    const trimmed = chunk.trim();
    if (trimmed.length < 15) continue;
    const sentences = splitSentences(trimmed);
    const pageNumber = pageMap.get(paraIdx) ?? null;
    const span: SourceSpan = { docId, paragraphId: paraIdx.toString() };

    paragraphs.push({
      id: `para-${paraIdx}`,
      text: trimmed,
      sentences,
      pageNumber,
      span,
    });
    paraIdx++;
  }

  return paragraphs;
}

function splitSentences(text: string): Sentence[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(/(?<=[.!?])\s+/);
  if (parts.length === 1) {
    return [{ id: "s0", text: cleaned, confidence: 0.9, span: {} as SourceSpan }];
  }
  return parts
    .filter((s) => s.length > 5)
    .map((s, i) => ({
      id: `s${i}`,
      text: s.trim(),
      confidence: 0.9,
      span: {} as SourceSpan,
    }));
}

function buildPageMap(pages: string[]): Map<number, number> {
  const map = new Map<number, number>();
  let paraIdx = 0;
  for (let p = 0; p < pages.length; p++) {
    const pageText = pages[p];
    const pageParagraphs = pageText.split(/\n{2,}/).filter((c) => c.trim().length > 15);
    for (let i = 0; i < pageParagraphs.length; i++) {
      map.set(paraIdx, p + 1);
      paraIdx++;
    }
  }
  return map;
}

function buildSections(paragraphs: Paragraph[], docId: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let sectionId = 0;

  for (const para of paragraphs) {
    const headingInfo = detectHeading(para.text);
    if (headingInfo) {
      const span: SourceSpan = { docId, sectionId: `sec-${sectionId}` };
      currentSection = {
        id: `sec-${sectionId}`,
        title: headingInfo.title,
        level: headingInfo.level,
        headingConfidence: headingInfo.confidence,
        startPara: paraIdx(para, paragraphs),
        paragraphs: [],
        span,
      };
      sections.push(currentSection);
      sectionId++;
    } else {
      if (!currentSection && paragraphs.length > 0) {
        const span: SourceSpan = { docId, sectionId: "sec-0" };
        currentSection = {
          id: "sec-0",
          title: "Introduction",
          level: 1,
          headingConfidence: 0.1,
          startPara: 0,
          paragraphs: [],
          span,
        };
        sections.push(currentSection);
        sectionId = 1;
      }
      currentSection?.paragraphs.push(para);
    }
  }

  return sections;
}

function paraIdx(para: Paragraph, all: Paragraph[]): number {
  return all.indexOf(para);
}

interface HeadingInfo {
  title: string;
  level: number;
  confidence: number;
}

function detectHeading(text: string): HeadingInfo | null {
  const line = text.replace(/^#+\s*/, "").split(/\n/)[0].trim();
  if (line.length > 120) return null;

  let score = 0;

  if (HEADING_NUMBERS.test(line)) score += 0.4;
  if (/^[A-Z][^.!?]*$/.test(line) && line.length < 80) score += 0.3;
  if (line.length < 70) score += 0.15;
  if (/^(Chapter|Section|Introduction|Conclusion|Summary|References|Appendices|Methods|Results|Discussion)\b/i.test(line)) score += 0.3;
  if (!line.endsWith(".") && line.length < 60) score += 0.1;
  if (line.length < 15) score += 0.1;

  if (score < 0.4) return null;

  const level = score > 0.7 ? 1 : score > 0.5 ? 2 : 3;
  return { title: line, level, confidence: Math.min(0.95, score) };
}

export { DEFINITION_PATTERNS };
