export interface NormalizedText {
  raw: string;
  clean: string;
  confidence: number;
  warnings: string[];
}

export function normalizeText(text: string, pageTexts?: string[]): NormalizedText {
  const warnings: string[] = [];
  const raw = text;
  let clean = text;

  let footerPattern: string[] = [];
  if (pageTexts && pageTexts.length > 0) {
    footerPattern = detectRepeatedPageLines(pageTexts);
    if (footerPattern.length) {
      warnings.push("Removed repeated headers/footers detected across pages");
      clean = removeRepeatedLines(clean, footerPattern);
    }
  }

  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const ocrArtifacts = detectOCRFailures(clean);
  if (ocrArtifacts.length > 0) {
    warnings.push(`Detected ${ocrArtifacts.length} potential OCR artifacts — review recommended`);
  }

  clean = fixLineWrapping(clean);
  clean = normalizeWhitespace(clean);

  let confidence = 0.92;
  if (ocrArtifacts.length > 5) confidence -= 0.1;
  if (footerPattern.length) confidence += 0.03;
  if (clean.length < raw.length * 0.5) confidence -= 0.1;

  return { raw, clean, confidence, warnings: warnings.length ? warnings : [] };
}

function detectRepeatedPageLines(pages: string[]): string[] {
  if (pages.length < 2) return [];
  const pageLines = pages.map((p) => p.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 5));
  const candidates: string[] = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const lines: string[] = [];
      for (const pl of pageLines) {
        if (i < pl.length) lines.push(pl[i]);
        if (j < pl.length) lines.push(pl[pl.length - 1 - j]);
      }
      const freq = countFreq(lines);
      for (const [line, count] of Object.entries(freq)) {
        if (count >= Math.ceil(pages.length * 0.7) && line.length > 8) {
          candidates.push(line);
        }
      }
    }
    if (candidates.length > 8) break;
  }
  return [...new Set(candidates)];
}

function countFreq(arr: string[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of arr) {
    m[s] = (m[s] ?? 0) + 1;
  }
  return m;
}

function removeRepeatedLines(text: string, repeated: string[]): string {
  const escaped = repeated.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`^(${escaped.join("|")})\\s*$`, "gm");
  return text.replace(pattern, "").replace(/\n{3,}/g, "\n\n");
}

function fixLineWrapping(text: string): string {
  return text.replace(/([^\n])\n(?=[a-z0-9])/g, "$1 ");
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(?:\n[ \t]*){2,}/g, "\n\n")
    .replace(/^[ \t]+/gm, "")
    .trim();
}

function detectOCRFailures(text: string): string[] {
  const artifacts: string[] = [];
  const lines = text.split(/\n/);
  for (const line of lines) {
    if (line.length > 10 && /[^a-zA-Z0-9\s.,;:!?()\-'"–—]/.test(line) && line.length < 15) {
      artifacts.push(line);
    }
  }
  const oddLen = lines.filter((l) => l.trim().length > 0 && l.trim().length % 2 === 1 && l.trim().length < 8).length;
  if (oddLen > 0) {
    artifacts.push(`(${oddLen} suspicious short lines)`);
  }
  return artifacts.slice(0, 10);
}
