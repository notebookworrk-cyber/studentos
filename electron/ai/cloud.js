/**
 * Cloud AI client — one OpenAI-compatible streaming client covers OpenAI,
 * Anthropic, Gemini, Groq, OpenRouter, Ollama and LM Studio via baseUrl.
 * Replaces the three unused SDK dependencies with ~100 lines of fetch.
 */
import { getCloudCredentials } from "./providerStore.js";

function log(msg) {
  console.log(`[cloud] ${msg}`);
}

/**
 * Stream a chat completion. messages: [{role, content}].
 * Calls onChunk(delta), onDone(fullText), onError(msg). Threaded abort via opts.signal.
 */
export async function generateCloudStream(messages, { temperature = 0.7, maxTokens = 1024, signal, onChunk, onDone, onError }) {
  const creds = getCloudCredentials();
  if (!creds) {
    onError("Cloud provider is not configured");
    return;
  }
  try {
    const res = await fetch(`${creds.baseUrl}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: creds.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      onError(`Provider error ${res.status}: ${body.slice(0, 300)}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          onDone(fullText);
          return;
        }
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {}
      }
    }
    if (fullText) onDone(fullText);
    else onError("Stream ended without content");
  } catch (err) {
    if (signal?.aborted) {
      log("stream cancelled");
      return;
    }
    onError(String(err?.message || err));
  }
}

/** Non-streaming completion for one-shot calls (task breakdown etc). */
export async function generateCloudText(messages, { temperature = 0.7, maxTokens = 1024 } = {}) {
  const creds = getCloudCredentials();
  if (!creds) return { text: "", error: "Cloud provider is not configured" };
  try {
    const res = await fetch(`${creds.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.apiKey}`,
      },
      body: JSON.stringify({
        model: creds.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { text: "", error: `Provider error ${res.status}: ${body.slice(0, 300)}` };
    }
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  } catch (err) {
    return { text: "", error: String(err?.message || err) };
  }
}

/** Quick connectivity + auth test. */
export async function testCloud() {
  const res = await generateCloudText(
    [{ role: "user", content: "Reply with the single word READY." }],
    { temperature: 0.1, maxTokens: 10 },
  );
  if (res.error) return { ok: false, error: res.error };
  return { ok: true, text: res.text };
}
