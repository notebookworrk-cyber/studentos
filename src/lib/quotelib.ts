import { QUOTES, type Quote } from "../data/quotes";

const CACHE_KEY = "studentos.dailyQuote.v1";

interface CachedQuote {
  text: string;
  author: string;
  date: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function deterministicPick(date: string): Quote {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  return QUOTES[Math.abs(hash) % QUOTES.length];
}

function readCache(): CachedQuote | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as CachedQuote;
  } catch { /* ignore */ }
  return null;
}

function writeCache(quote: Quote, date: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ text: quote.text, author: quote.author, date }));
  } catch { /* ignore */ }
}

export async function fetchQuote(): Promise<Quote> {
  const today = todayStr();
  const cached = readCache();
  if (cached && cached.date === today) return cached;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("https://api.quotable.io/random", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const q: Quote = { text: data.content, author: data.author };
      writeCache(q, today);
      return q;
    }
  } catch { /* offline or error — fall through */ }

  const q = deterministicPick(today);
  writeCache(q, today);
  return q;
}

export function getDailyQuote(): Quote {
  const cached = readCache();
  const today = todayStr();
  if (cached && cached.date === today) return cached;
  return deterministicPick(today);
}
