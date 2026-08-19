import type {
  Concept,
  Definition,
  Document,
  Fact,
  StructuredNote,
  SummaryResult,
} from "./types";

export function generateStructuredNote(
  doc: Document,
  definitions: Definition[],
  concepts: Concept[],
  facts: Fact[],
  summary: SummaryResult
): StructuredNote {
  const lines: string[] = [];

  lines.push(`# ${doc.metadata.title}`);
  lines.push("");
  lines.push(`> _Generated from: ${doc.metadata.source} (${doc.metadata.pages} pages)_`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  for (const item of summary.items) {
    lines.push(`- ${item.text}`);
  }
  if (summary.items.length === 0) {
    lines.push("- _No summary available._");
  }
  lines.push("");

  if (summary.keyTerms.length > 0) {
    lines.push("### Key Terms");
    lines.push("");
    for (const term of summary.keyTerms) {
      lines.push(`- **${term.term}** — ${term.meaning}`);
    }
    lines.push("");
  }

  if (definitions.length > 0) {
    lines.push("## Definitions");
    lines.push("");
    for (const def of definitions.slice(0, 30)) {
      lines.push(`**${def.term}**`);
      lines.push(`  ${def.definition}`);
      lines.push("");
    }
  }

  if (concepts.length > 0) {
    lines.push("## Key Concepts");
    lines.push("");
    for (const concept of concepts.slice(0, 15)) {
      lines.push(`### ${concept.term} (⏺ ${concept.frequency} occurrences)`);
      for (const ctx of concept.contexts.slice(0, 2)) {
        lines.push(`_${ctx}_`);
      }
      lines.push("");
    }
  }

  if (facts.length > 0) {
    lines.push("## Key Facts");
    lines.push("");
    for (const fact of facts.slice(0, 15)) {
      lines.push(`- **${fact.subject}** ${fact.relation} ${fact.object}`);
    }
    lines.push("");
  }

  if (doc.sections.length > 0) {
    lines.push("## Study Guide (Sections)");
    lines.push("");
    for (const section of doc.sections) {
      lines.push(`### ${section.level === 1 ? "##" : section.level === 2 ? "###" : "####"} ${section.title}`);
      const sectionSentences = section.paragraphs.flatMap((p) =>
        p.sentences.map((s) => s.text)
      );
      if (sectionSentences.length > 0) {
        for (const s of sectionSentences.slice(0, 5)) {
          lines.push(`- ${s}`);
        }
      }
      lines.push("");
    }
  }

  lines.push("## Flashcard Queue (from this material)");
  lines.push("");
  for (const def of definitions.slice(0, 10)) {
    lines.push(`Q: What is ${def.term}?`);
    lines.push(`A: ${def.definition}`);
    lines.push("");
  }

  return {
    id: `note-${doc.id}-${Date.now()}`,
    title: `${doc.metadata.title} — Study Note`,
    content: lines.join("\n"),
    docId: doc.id,
    generatedAt: new Date().toISOString(),
  };
}
