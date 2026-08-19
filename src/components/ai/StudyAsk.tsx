import { useState } from "react";
import { runStudyAction } from "../../lib/studyai";
import type { AskResult } from "../../lib/studyai";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function StudyAsk({ notes, subjects }: { notes: ReturnType<typeof useOS>["notes"]; subjects: ReturnType<typeof useOS>["subjects"] }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<AskResult | null>(null);
  const [ask, setAsk] = useState(false);

  const submit = () => {
    if (!q.trim()) return;
    setAsk(true);
    setRes(runStudyAction("ask", { notes, subjects, scope: { mode: "all" }, length: "short" }, { question: q }).data as AskResult);
    setAsk(false);
  };

  return (
    <div className="sai-ask">
      <div className="ai-input-row">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask anything about your notes… e.g. what is mitosis?"
        />
        <button className="btn btn-primary btn-icon" onClick={submit} disabled={ask || !q.trim()} aria-label="Ask">
          <Icon name="spark" size={16} />
        </button>
      </div>
      {res && (
        <div className="sai-ask-res">
          <div className="sai-ask-answer">{res.answer.split("\n").map((l, i) => <p key={i}>{l}</p>)}</div>
          {res.citations.length > 0 && (
            <div className="sai-cites">
              {res.citations.map((c, i) => (
                <div key={i} className="sai-cite">
                  <span className="badge badge-tint">{c.note}</span>
                  <span className="sai-cite-snip">{c.snippet}</span>
                </div>
              ))}
            </div>
          )}
          {res.related.length > 0 && (
            <p className="sai-related">Related · {res.related.join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}