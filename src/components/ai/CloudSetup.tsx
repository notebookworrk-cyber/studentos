import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { toast } from "../../state/toasts";

const PRESETS = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "groq", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "anthropic/claude-sonnet-4" },
  { id: "gemini", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash" },
  { id: "anthropic", label: "Anthropic", baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4" },
  { id: "ollama", label: "Ollama (local)", baseUrl: "http://localhost:11434/v1", model: "llama3.1" },
  { id: "lmstudio", label: "LM Studio (local)", baseUrl: "http://localhost:1234/v1", model: "" },
  { id: "custom", label: "Custom", baseUrl: "", model: "" },
];

interface CloudStatus {
  configured: boolean;
  baseUrl: string | null;
  model: string | null;
  hasKey: boolean;
}

export function CloudSetup() {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [preset, setPreset] = useState("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  const api = window.studentos?.ai;

  useEffect(() => {
    api?.getCloudStatus().then(setStatus).catch(() => {});
  }, []);

  if (!api) return null;

  const pickPreset = (id: string) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    setBaseUrl(p?.baseUrl ?? "");
    setModel(p?.model ?? "");
  };

  const save = async () => {
    if (!baseUrl.trim() || !model.trim() || !apiKey.trim()) {
      toast("Base URL, model and API key are required", "err");
      return;
    }
    setBusy(true);
    try {
      const next = await api.setCloudConfig({ baseUrl, model, apiKey });
      setStatus(next);
      setEditing(false);
      setApiKey("");
      toast("Cloud provider connected", "ok");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : String(e), "err");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await api.testCloud();
      toast(res.ok ? `Working — replied "${res.text?.trim()}"` : res.error ?? "Test failed", res.ok ? "ok" : "err");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setStatus(await api.clearCloudConfig());
    toast("Cloud provider disconnected", "ok");
  };

  return (
    <div className="cloud-setup">
      <div className="settings-diag">
        <div className="settings-diag-row">
          <span className="settings-diag-key">Provider</span>
          <span className="settings-diag-val">
            {status?.configured ? `${status.model} · ${status.baseUrl}` : "Not configured (local model used)"}
          </span>
        </div>
      </div>
      {!editing ? (
        <div className="settings-row">
          <div className="settings-row-label">Bring your own key — stored encrypted on this device, never synced.</div>
          <div className="settings-row-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditing(true);
                if (!status?.configured) pickPreset("openai");
              }}
            >
              <Icon name="spark" size={13} />
              {status?.configured ? "Edit" : "Connect provider"}
            </button>
            {status?.configured && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={test} disabled={busy}>
                  Test
                </button>
                <button className="btn btn-ghost btn-sm" onClick={disconnect}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="cloud-setup-form">
          <label className="cloud-field">
            <span>Preset</span>
            <select value={preset} onChange={(e) => pickPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="cloud-field">
            <span>Base URL</span>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label className="cloud-field">
            <span>Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </label>
          <label className="cloud-field">
            <span>API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={status?.hasKey ? "Stored — leave blank to keep" : "sk-…"}
              autoComplete="off"
            />
          </label>
          <div className="cloud-setup-actions">
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              Save & Connect
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
