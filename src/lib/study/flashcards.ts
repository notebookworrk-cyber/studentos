import type {
  Concept,
  Definition,
  Fact,
  Flashcard,
  FlashcardDifficulty,
  FlashcardType,
  SourceSpan,
  StudyMaterial,
} from "./types";

const MIN_CONFIDENCE = 0.5;
const MAX_CARDS = 50;

function difficulty(def: Definition | Concept | Fact): FlashcardDifficulty {
  const len = "definition" in def ? def.definition.length : "object" in def ? (def as Fact).object.length : 40;
  if (len > 120) return "hard";
  if (len > 50) return "medium";
  return "easy";
}

function topicFromSpan(span: SourceSpan, material: StudyMaterial): string {
  if (span.sectionId) {
    const sec = material.doc.sections.find((s) => s.id === span.sectionId);
    if (sec) return sec.title;
  }
  return material.title;
}

function defToCard(def: Definition, material: StudyMaterial): Flashcard | null {
  if (def.confidence < MIN_CONFIDENCE) return null;
  return {
    id: `fc-def-${def.id}`,
    question: `What is ${def.term}?`,
    answer: def.definition,
    type: "definition",
    topic: topicFromSpan(def.span, material),
    difficulty: difficulty(def),
    confidence: def.confidence,
    source: def.span,
  };
}

function conceptToCard(concept: Concept, material: StudyMaterial): Flashcard | null {
  if (concept.relevanceScore < 1.5 || concept.contexts.length === 0) return null;
  const ctx = concept.contexts[0];
  const type: FlashcardType = /process|cycle|pathway|mechanism/i.test(concept.term)
    ? "process"
    : /component|structure|organelle|part/i.test(concept.term)
    ? "component"
    : "definition";
  return {
    id: `fc-con-${concept.id}`,
    question: `Explain: ${concept.term}`,
    answer: ctx,
    type,
    topic: topicFromSpan(concept.span, material),
    difficulty: difficulty(concept),
    confidence: Math.min(concept.relevanceScore / 10, 1),
    source: concept.span,
  };
}

function factToCards(fact: Fact, material: StudyMaterial): Flashcard[] {
  if (fact.confidence < MIN_CONFIDENCE) return [];
  const cards: Flashcard[] = [];
  const topic = topicFromSpan(fact.span, material);

  cards.push({
    id: `fc-fact-${fact.id}`,
    question: `${fact.subject} ${fact.relation} what?`,
    answer: fact.object,
    type: "fact",
    topic,
    difficulty: difficulty(fact),
    confidence: fact.confidence,
    source: fact.span,
  });

  if (/cause|lead|result|increase|decrease/i.test(fact.relation)) {
    cards.push({
      id: `fc-ce-${fact.id}`,
      question: `What is the cause/effect relationship involving ${fact.subject}?`,
      answer: `${fact.subject} ${fact.relation} ${fact.object}`,
      type: "cause-effect",
      topic,
      difficulty: "medium",
      confidence: fact.confidence,
      source: fact.span,
    });
  }

  return cards;
}

export function generateFlashcards(material: StudyMaterial): Flashcard[] {
  const cards: Flashcard[] = [];
  const seen = new Set<string>();

  for (const def of material.definitions) {
    const card = defToCard(def, material);
    if (card && !seen.has(card.question)) {
      seen.add(card.question);
      cards.push(card);
    }
  }

  for (const concept of material.concepts) {
    const card = conceptToCard(concept, material);
    if (card && !seen.has(card.question)) {
      seen.add(card.question);
      cards.push(card);
    }
  }

  for (const fact of material.facts) {
    const factCards = factToCards(fact, material);
    for (const card of factCards) {
      if (!seen.has(card.question)) {
        seen.add(card.question);
        cards.push(card);
      }
    }
  }

  return cards.slice(0, MAX_CARDS);
}
