import type { Concept, Definition, Document, Fact, Section } from "./types";

export interface Topic {
  name: string;
  concepts: Concept[];
  definitions: Definition[];
  facts: Fact[];
  sectionId: string | null;
  relevance: number;
}

function keywordOverlap(a: string, b: string): number {
  const wordsA = new Set(
    a.toLowerCase().split(/[\s,;.]+/).filter((w) => w.length > 3)
  );
  const wordsB = new Set(
    b.toLowerCase().split(/[\s,;.]+/).filter((w) => w.length > 3)
  );
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.min(wordsA.size, wordsB.size);
}

function conceptsFromSection(
  section: Section,
  _doc: Document,
  allConcepts: Concept[],
  allDefs: Definition[],
  allFacts: Fact[]
): { concepts: Concept[]; definitions: Definition[]; facts: Fact[] } {
  const paraIds = new Set(section.paragraphs.map((p) => p.id));
  const concepts = allConcepts.filter(
    (c) => paraIds.has(c.span.paragraphId || "") || c.span.sectionId === section.id
  );
  const definitions = allDefs.filter(
    (d) => paraIds.has(d.span.paragraphId || "") || d.span.sectionId === section.id
  );
  const facts = allFacts.filter(
    (f) => paraIds.has(f.span.paragraphId || "") || f.span.sectionId === section.id
  );
  return { concepts, definitions, facts };
}

export function detectTopics(
  doc: Document,
  concepts: Concept[],
  definitions: Definition[],
  facts: Fact[]
): Topic[] {
  const topics: Topic[] = [];

  // Group by section headings first
  for (const section of doc.sections) {
    const items = conceptsFromSection(section, doc, concepts, definitions, facts);
    if (items.concepts.length + items.definitions.length + items.facts.length === 0) continue;
    topics.push({
      name: section.title,
      concepts: items.concepts,
      definitions: items.definitions,
      facts: items.facts,
      sectionId: section.id,
      relevance: items.concepts.reduce((s, c) => s + c.relevanceScore, 0),
    });
  }

  // Merge similar topics
  const merged: Topic[] = [];
  const used = new Set<number>();

  for (let i = 0; i < topics.length; i++) {
    if (used.has(i)) continue;
    let current = { ...topics[i] };

    for (let j = i + 1; j < topics.length; j++) {
      if (used.has(j)) continue;
      if (keywordOverlap(current.name, topics[j].name) > 0.5) {
        current = {
          name: current.name,
          concepts: [...current.concepts, ...topics[j].concepts],
          definitions: [...current.definitions, ...topics[j].definitions],
          facts: [...current.facts, ...topics[j].facts],
          sectionId: current.sectionId,
          relevance: current.relevance + topics[j].relevance,
        };
        used.add(j);
      }
    }
    merged.push(current);
    used.add(i);
  }

  // Sort by relevance
  merged.sort((a, b) => b.relevance - a.relevance);

  return merged;
}
