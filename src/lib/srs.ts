// Leitner-box spaced-repetition scheduler for flashcards.

export type ReviewGrade = 0 | 1 | 2 | 3 | 4; // 0=again, 1=hard, 2=good, 3=easy, 4=forgot

export interface ReviewCard {
  id: string; // flashcard id
  front: string;
  back: string;
  source: string;
  box: number; // 1..5
  dueAt: number; // epoch ms
  lastGradedAt: number;
}

export interface ReviewRecord {
  id: string;
  front: string;
  back: string;
  source: string;
  box: number;
  dueAt: number;
  lastGradedAt: number;
}

export const BOX_INTERVALS_MS = [
  0, // unused
  0, // box 1: due immediately after learning
  4 * 3600e3, // box 2: 4h
  24 * 3600e3, // box 3: 1d
  3 * 24 * 3600e3, // box 4: 3d
  7 * 24 * 3600e3, // box 5: 7d
];

export function toRecord(card: ReviewCard): ReviewRecord {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    source: card.source,
    box: card.box,
    dueAt: card.dueAt,
    lastGradedAt: card.lastGradedAt,
  };
}

export function fromRecord(r: ReviewRecord): ReviewCard {
  return { ...r };
}

export function initCard(id: string, front: string, back: string, source: string, now = Date.now()): ReviewCard {
  return { id, front, back, source, box: 1, dueAt: now, lastGradedAt: now };
}

// Grade a card. On again/forgot it drops to box 1 (or one box down); otherwise it climbs.
export function gradeCard(card: ReviewCard, grade: ReviewGrade, now = Date.now()): ReviewCard {
  let box = card.box;
  if (grade === 0 || grade === 4) box = 1;
  else if (grade === 1) box = Math.max(1, box - 1);
  else box = Math.min(5, box + (grade >= 3 ? 2 : 1));
  return { ...card, box, dueAt: now + BOX_INTERVALS_MS[box], lastGradedAt: now };
}

export function due(cards: ReviewCard[], now = Date.now()): ReviewCard[] {
  return cards.filter((c) => c.dueAt <= now);
}

// Merge new cards into the deck, preserving existing box/due state for known ids.
export function mergeDeck(deck: ReviewCard[], fresh: ReviewCard[]): ReviewCard[] {
  const known = new Map(deck.map((c) => [c.id, c]));
  const out = [...deck];
  for (const f of fresh) {
    const k = known.get(f.id);
    if (k) continue;
    out.push(f);
  }
  return out;
}

export function weakSpots(deck: ReviewCard[]): { front: string; back: string; source: string; box: number }[] {
  return deck
    .filter((c) => c.box <= 1)
    .sort((a, b) => a.lastGradedAt - b.lastGradedAt)
    .slice(0, 6);
}