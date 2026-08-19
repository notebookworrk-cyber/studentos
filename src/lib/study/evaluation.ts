import { areSynonyms, normalizeTerm } from "./synonyms";

export interface EvalResult {
  score: number;
  correct: boolean;
  matchedConcepts: string[];
  missingConcepts: string[];
  feedback: string;
  confidence: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function conceptOverlap(expected: string, actual: string): { matched: string[]; missing: string[] } {
  const expectedTerms = tokenize(expected).map(normalizeTerm);
  const actualTerms = new Set(tokenize(actual).map(normalizeTerm));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of expectedTerms) {
    let found = actualTerms.has(term);
    if (!found) {
      for (const actual of actualTerms) {
        if (areSynonyms(term, actual)) {
          found = true;
          break;
        }
      }
    }
    if (found) matched.push(term);
    else missing.push(term);
  }

  return { matched, missing };
}

function phraseOverlap(expected: string, actual: string): number {
  const expTokens = tokenize(expected);
  const actTokens = tokenize(actual);
  if (expTokens.length === 0) return 0;

  let matches = 0;
  for (const t of expTokens) {
    if (actTokens.some((a) => a === t || areSynonyms(a, t))) matches++;
  }
  return matches / expTokens.length;
}

export function evaluateAnswer(expected: string, actual: string): EvalResult {
  const expNorm = expected.toLowerCase().trim();
  const actNorm = actual.toLowerCase().trim();

  if (actNorm === expNorm) {
    return {
      score: 1,
      correct: true,
      matchedConcepts: tokenize(expected),
      missingConcepts: [],
      feedback: "Exact match.",
      confidence: 1,
    };
  }

  const { matched, missing } = conceptOverlap(expected, actual);
  const phraseScore = phraseOverlap(expected, actual);
  const conceptScore = matched.length / Math.max(tokenize(expected).length, 1);
  const score = Math.min(1, conceptScore * 0.6 + phraseScore * 0.4);

  const criticalMissing = missing.filter((m) => {
    const critical = ["mitochondria", "atp", "nucleus", "enzyme", "protein", "dna", "electron", "algorithm"];
    return critical.includes(m);
  });

  const correct = score >= 0.7 && criticalMissing.length === 0;
  const confidence = score >= 0.9 ? 0.95 : score >= 0.7 ? 0.8 : score >= 0.4 ? 0.6 : 0.3;

  let feedback: string;
  if (correct) {
    feedback = `Good answer. Matched: ${matched.slice(0, 3).join(", ")}`;
  } else if (score >= 0.4) {
    feedback = `Partial. Missing: ${missing.slice(0, 3).join(", ")}`;
  } else {
    feedback = `Needs improvement. Key concepts: ${missing.slice(0, 4).join(", ")}`;
  }

  return {
    score: Math.round(score * 100) / 100,
    correct,
    matchedConcepts: matched,
    missingConcepts: missing,
    feedback,
    confidence,
  };
}

export function scoreQuiz(answers: { expected: string; actual: string }[]): {
  totalScore: number;
  correct: number;
  results: EvalResult[];
} {
  const results = answers.map((a) => evaluateAnswer(a.expected, a.actual));
  const correct = results.filter((r) => r.correct).length;
  return {
    totalScore: results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0,
    correct,
    results,
  };
}
