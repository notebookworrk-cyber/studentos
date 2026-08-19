import { useEffect, useState } from "react";
import { fetchQuote, getDailyQuote } from "../../lib/quotelib";
import { Icon } from "../Icon";
import type { Quote } from "../../data/quotes";

export function DailyQuote() {
  const [quote, setQuote] = useState<Quote>(() => getDailyQuote());
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!hidden) fetchQuote().then(setQuote);
  }, [hidden]);

  if (hidden) {
    return (
      <div className="home-quote glass hidden">
        <button className="btn btn-ghost btn-sm quote-restore" onClick={() => setHidden(false)}>
          <Icon name="quote" size={14} />
          Show quote
        </button>
      </div>
    );
  }

  return (
    <div className="home-quote glass">
      <p className="home-quote-text">"{quote.text}"</p>
      <p className="home-quote-author">— {quote.author}</p>
      <div className="home-quote-actions">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => fetchQuote().then(setQuote)} title="New quote">
          <Icon name="refresh" size={14} />
        </button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setHidden(true)} title="Hide quote">
          <Icon name="eye-off" size={14} />
        </button>
      </div>
    </div>
  );
}