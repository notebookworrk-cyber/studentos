export interface FuzzyMatch {
  score: number;
  indices: number[];
}

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q || !t) return null;

  const sub = t.indexOf(q);
  if (sub >= 0) {
    return { score: 1000 - sub, indices: Array.from({ length: q.length }, (_, i) => sub + i) };
  }

  let qi = 0;
  let last = -1;
  let score = 0;
  const indices: number[] = [];
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue;
    if (last >= 0) score -= ti - last - 1;
    score += 10;
    indices.push(ti);
    last = ti;
    qi++;
  }
  if (qi < q.length) return null;
  if (indices[0] === 0) score += 5;
  return { score, indices };
}

export function highlightRanges(text: string, indices: number[]): { text: string; match: boolean }[] {
  const set = new Set(indices);
  const out: { text: string; match: boolean }[] = [];
  let buf = "";
  let bufMatch = false;
  const flush = () => {
    if (buf) {
      out.push({ text: buf, match: bufMatch });
      buf = "";
      bufMatch = false;
    }
  };
  for (let i = 0; i < text.length; i++) {
    const isMatch = set.has(i);
    if (isMatch !== bufMatch) flush();
    buf += text[i];
    bufMatch = isMatch;
  }
  flush();
  return out;
}