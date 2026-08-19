import { useEffect, useState } from "react";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";

export function AISetup({ onReady }: { onReady?: () => void }) {
  const { aiStatus, setAiStatus, aiLoadProgress, setAiLoadProgress } = useOS();
  const [info, setInfo] = useState<{ installed: boolean; bundled: boolean; name: string; sizeLabel: string; path: string; source: string; loaded: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const api = window.studentos?.ai;
    if (!api) return;
    api.modelInfo().then((i) => {
      setInfo(i);
      if (i.installed && aiStatus === "not_installed") setAiStatus("ready");
    }).catch(() => {});
  }, []);

  // Subscribe to load progress
  useEffect(() => {
    const api = window.studentos?.ai;
    if (!api) return;
    const unsub = api.onProgress((p) => {
      const phase = p.phase as string;
      const percent = p.percent as number;
      if (phase && typeof percent === "number") {
        setAiLoadProgress({ phase, percent });
      }
    });
    return unsub;
  }, []);

  const load = async () => {
    const api = window.studentos?.ai;
    if (!api || loading) return;
    setLoading(true);
    setError(null);
    setTestResult(null);
    setAiStatus("loading");
    setAiLoadProgress({ phase: "starting", percent: 0 });
    try {
      const res = await api.loadModel();
      if (res.ok) {
        setAiStatus("loaded");
        setAiLoadProgress(null);
        const updated = await api.modelInfo();
        setInfo(updated);
        onReady?.();
      } else {
        setError(res.error || "Failed to load model");
        setAiStatus("error");
        setAiLoadProgress(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setAiStatus("error");
      setAiLoadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const unload = async () => {
    const api = window.studentos?.ai;
    if (!api) return;
    await api.unloadModel();
    setAiStatus("ready");
    setTestResult(null);
    const updated = await api.modelInfo();
    setInfo(updated);
  };

  const testGeneration = async () => {
    const api = window.studentos?.ai;
    if (!api) return;
    setAiStatus("loading");
    setTestResult(null);
    try {
      const res = await api.test();
      setTestResult(res.text || "No response");
      setAiStatus("loaded");
    } catch (e: unknown) {
      setTestResult("Error: " + (e instanceof Error ? e.message : e));
      setAiStatus("error");
    }
  };

  if (!window.studentos?.ai) return null;

  const isLoaded = info?.loaded || aiStatus === "loaded";
  const isLoading = aiStatus === "loading" || loading;

  return (
    <div className="ai-setup-inline">
      {!isLoaded && !isLoading && (
        <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
          <Icon name="play" size={13} />
          Load model
        </button>
      )}
      {isLoading && (
        <div className="ai-loading-progress">
          <Icon name="ai" size={13} />
          <div className="ai-loading-bar-wrapper">
            <div className="ai-loading-bar" style={{ transform: `scaleX(${(aiLoadProgress?.percent || 0) / 100})` }} />
          </div>
          <span className="ai-loading-text">
            {aiLoadProgress?.phase ? `${aiLoadProgress.phase}…` : "Loading…"}
          </span>
        </div>
      )}
      {isLoaded && (
        <div className="ai-loaded-actions">
          <span className="ai-status-dot loaded" title="Model loaded" />
          <button className="btn btn-ghost btn-sm" onClick={testGeneration}>Test</button>
          <button className="btn btn-ghost btn-sm" onClick={unload}>Unload</button>
        </div>
      )}
      {error && (
        <div className="ai-error-inline">
          <span className="ai-error-text">{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
        </div>
      )}
      {testResult && (
        <div className="ai-test-result">
          <span className="ai-test-label">Test:</span> {testResult}
        </div>
      )}
    </div>
  );
}
