import type {
  Concept,
  Definition,
  Fact,
  QuizQuestion,
  SourceSpan,
  StudyMaterial,
} from "./types";

const MIN_CONFIDENCE = 0.5;
const MAX_QUESTIONS = 20;
const MCQ_DISTRACTOR_COUNT = 3;

function topicFromSpan(span: SourceSpan, material: StudyMaterial): string {
  if (span.sectionId) {
    const sec = material.doc.sections.find((s) => s.id === span.sectionId);
    if (sec) return sec.title;
  }
  return material.title;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function extractBlankTerm(sentence: string): { sentence: string; term: string } | null {
  const defMatch = sentence.match(
    /^([A-Z][a-zA-Z\s]+?)\s+(?:is|are|refers to|means|is defined as)\s+(.+?)\.?\s*$/i
  );
  if (defMatch) {
    const term = defMatch[1].trim();
    const blanked = sentence.replace(term, "______");
    return { sentence: blanked, term };
  }
  return null;
}

function generateMCQ(
  definition: Definition,
  material: StudyMaterial,
  allTerms: string[]
): QuizQuestion | null {
  if (definition.confidence < MIN_CONFIDENCE) return null;

  const distractors = shuffle(
    allTerms.filter((t) => t.toLowerCase() !== definition.term.toLowerCase())
  ).slice(0, MCQ_DISTRACTOR_COUNT);

  if (distractors.length < MCQ_DISTRACTOR_COUNT) return null;

  const options = shuffle([definition.definition, ...distractors]);
  const answerIndex = options.indexOf(definition.definition);

  if (answerIndex === -1) return null;

  return {
    id: `qz-mcq-${definition.id}`,
    type: "mcq",
    question: `What is ${definition.term}?`,
    options,
    answer: definition.definition,
    answerIndex,
    explanation: `${definition.term} is defined as: ${definition.definition}`,
    topic: topicFromSpan(definition.span, material),
    difficulty: definition.definition.length > 100 ? "hard" : definition.definition.length > 40 ? "medium" : "easy",
    confidence: definition.confidence,
    source: definition.span,
  };
}

function generateTrueFalse(
  fact: Fact,
  material: StudyMaterial
): QuizQuestion | null {
  if (fact.confidence < MIN_CONFIDENCE) return null;

  const trueStatement = `${fact.subject} ${fact.relation} ${fact.object}`;
  const falseObjects = material.facts
    .filter((f) => f.id !== fact.id && f.subject.toLowerCase() === fact.subject.toLowerCase())
    .map((f) => f.object);
  if (falseObjects.length === 0) return null;

  const falseObj = falseObjects[0];
  const falseStatement = `${fact.subject} ${fact.relation} ${falseObj}`;
  const isTrue = Math.random() > 0.5;

  const statement = isTrue ? trueStatement : falseStatement;
  const answer = isTrue ? "True" : "False";
  const explanation = isTrue
    ? `Correct: ${trueStatement}`
    : `False — ${trueStatement}. The statement incorrectly says "${falseObj}" instead of "${fact.object}".`;

  return {
    id: `qz-tf-${fact.id}`,
    type: "truefalse",
    question: `True or False: ${statement}`,
    options: ["True", "False"],
    answer,
    answerIndex: isTrue ? 0 : 1,
    explanation,
    topic: topicFromSpan(fact.span, material),
    difficulty: "easy",
    confidence: fact.confidence,
    source: fact.span,
  };
}

function generateFillBlank(
  definition: Definition,
  material: StudyMaterial
): QuizQuestion | null {
  if (definition.confidence < MIN_CONFIDENCE) return null;

  const fullSentence = `${definition.term} is ${definition.definition}`;
  const blanked = extractBlankTerm(fullSentence);
  if (!blanked) return null;

  return {
    id: `qz-fb-${definition.id}`,
    type: "fill-blank",
    question: blanked.sentence,
    options: [],
    answer: blanked.term,
    answerIndex: -1,
    explanation: `${blanked.term}: ${definition.definition}`,
    topic: topicFromSpan(definition.span, material),
    difficulty: "medium",
    confidence: definition.confidence,
    source: definition.span,
  };
}

function generateShortAnswer(
  concept: Concept,
  material: StudyMaterial
): QuizQuestion | null {
  if (concept.relevanceScore < 2 || concept.contexts.length === 0) return null;

  const ctx = concept.contexts[0];
  const answerKeyTerms = ctx
    .split(/[\s,;.]+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  return {
    id: `qz-sa-${concept.id}`,
    type: "short-answer",
    question: `Explain the concept of "${concept.term}" based on the material.`,
    options: [],
    answer: ctx,
    answerIndex: -1,
    explanation: `Key points: ${answerKeyTerms.join(", ")}`,
    topic: topicFromSpan(concept.span, material),
    difficulty: "hard",
    confidence: Math.min(concept.relevanceScore / 10, 1),
    source: concept.span,
  };
}

export function generateQuiz(material: StudyMaterial): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  const allTerms = material.definitions.map((d) => d.term);

  // MCQ from definitions
  for (const def of material.definitions) {
    const q = generateMCQ(def, material, allTerms);
    if (q && !seen.has(q.question)) {
      seen.add(q.question);
      questions.push(q);
    }
  }

  // True/False from facts
  for (const fact of material.facts) {
    const q = generateTrueFalse(fact, material);
    if (q && !seen.has(q.question)) {
      seen.add(q.question);
      questions.push(q);
    }
  }

  // Fill-in-the-blank from definitions
  for (const def of material.definitions) {
    const q = generateFillBlank(def, material);
    if (q && !seen.has(q.question)) {
      seen.add(q.question);
      questions.push(q);
    }
  }

  // Short answer from high-relevance concepts
  for (const concept of material.concepts) {
    const q = generateShortAnswer(concept, material);
    if (q && !seen.has(q.question)) {
      seen.add(q.question);
      questions.push(q);
    }
  }

  return shuffle(questions).slice(0, MAX_QUESTIONS);
}
