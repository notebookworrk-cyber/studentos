/**
 * Generator — spawns llama-worker.mjs as a child process and proxies
 * requests via localhost HTTP. Sidesteps Electron ABI mismatch entirely.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLocalModelManager } from "./localModel.js";

function nodeBin() {
  const candidates = [
    process.env.NODE,
    process.env.ProgramFiles ? join(process.env.ProgramFiles, "nodejs", "node.exe") : "",
    "node",
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c)) || "node";
}

let _worker = null;
let _workerPort = null;
let _workerReady = false;
let _pendingStart = null;
let _rejectStart = null;

function log(msg) {
  console.log(`[generator] ${msg}`);
}

/**
 * Spawn the worker process. Resolves when model is loaded and HTTP ready.
 */
async function ensureWorker() {
  if (_workerReady && _workerPort) return;
  if (_pendingStart) return _pendingStart;

  _pendingStart = new Promise((resolve, reject) => {
    const mgr = getLocalModelManager();
    const modelPath = mgr.modelPath;
    log("Spawning worker for: " + modelPath);

    const workerUrl = new URL("./llama-worker.mjs", import.meta.url);
    let workerPath = workerUrl.pathname;
    // On Windows, fix path: /C:/... -> C:/...
    if (process.platform === "win32") {
      workerPath = workerPath.replace(/^\/([A-Z]:)/, "$1");
    }

    // Use system Node.js (not Electron's bundled Node) to avoid ABI mismatch
    _worker = spawn(nodeBin(), [workerPath], {
      env: { ...process.env, MODEL_PATH: modelPath },
      stdio: ["pipe", "pipe", "pipe"],
    });

    _worker.stdout.on("data", (data) => {
      const msg = data.toString();
      log(msg.trim());
      // Parse progress events from worker
      const progressMatch = msg.match(/PROGRESS:(\w+)/);
      if (progressMatch) {
        const phase = progressMatch[1];
        const phaseMap = { importing: 10, init: 25, loading: 50, context: 80, ready: 100 };
        mgr._emitProgress({ phase, percent: phaseMap[phase] || 0 });
      }
      const portMatch = msg.match(/PORT:(\d+)/);
      if (portMatch) {
        _workerPort = parseInt(portMatch[1], 10);
      }
      // Resolve only once the model is actually loaded, not when the port is up —
      // otherwise /health races the load and loadModel() reports "not ready".
      if (msg.includes("PROGRESS:ready")) {
        _workerReady = true;
        mgr.markLoaded(true);
        resolve();
      }
    });

    _worker.stderr.on("data", (data) => {
      log("STDERR: " + data.toString().trim());
    });

    _worker.on("error", (err) => {
      log("Worker error: " + err.message);
      _workerReady = false;
      _workerPort = null;
      _worker = null;
      mgr.markLoaded(false);
      reject(new Error("Worker failed to start: " + err.message));
    });

    _worker.on("exit", (code) => {
      log("Worker exited with code: " + code);
      _workerReady = false;
      _workerPort = null;
      _worker = null;
      mgr.markLoaded(false);
      reject(new Error("Worker exited with code " + code + " before model ready"));
    });

    // Fail-safe timeout (max 120s for model load — large GGUFs on CPU can be slow)
    setTimeout(() => {
      if (!_workerReady) reject(new Error("Worker failed to start within 120s"));
    }, 120000);
  }).finally(() => {
    _pendingStart = null;
    _rejectStart = null;
  });

  return _pendingStart;
}

/**
 * Send HTTP request to worker using built-in fetch.
 */
async function workerRequest(path, body = null) {
  await ensureWorker();
  const url = `http://127.0.0.1:${_workerPort}${path}`;
  const opts = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : { method: "GET" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000); // 2min timeout

  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadModel() {
  const mgr = getLocalModelManager();
  if (!mgr.isInstalled()) {
    return { ok: false, error: "Model not found at: " + mgr.modelPath };
  }
  if (_workerReady) return { ok: true, message: "Already loaded" };

  try {
    await ensureWorker();
    const health = await workerRequest("/health");
    if (health.ready) return { ok: true };
    return { ok: false, error: "Worker started but model not ready" };
  } catch (err) {
    log("loadModel failed: " + err.message);
    return { ok: false, error: String(err.message || err) };
  }
}

export function unloadModel() {
  if (_worker) {
    log("Killing worker...");
    _worker.kill("SIGTERM");
    _worker = null;
  }
  _workerReady = false;
  _workerPort = null;
  _pendingStart = null;
  _rejectStart = null;
  const mgr = getLocalModelManager();
  mgr.markLoaded(false);
}

export function isModelLoaded() {
  return _workerReady;
}

export async function generateText(prompt, opts = {}) {
  if (!_workerReady) {
    const loadResult = await loadModel();
    if (!loadResult.ok) return { text: "", error: loadResult.error };
  }
  try {
    const result = await workerRequest("/generate", {
      prompt,
      temperature: opts.temperature ?? 0.7,
      maxTokens: opts.maxTokens ?? 512,
    });
    return result.error ? { text: "", error: result.error } : { text: result.text };
  } catch (err) {
    return { text: "", error: String(err.message || err) };
  }
}

/**
 * Stream generation via SSE from the worker.
 * Calls onChunk(text) for each chunk, onDone(fullText) when complete, onError(msg) on failure.
 */
export async function generateStream(prompt, { temperature = 0.7, maxTokens = 512, onChunk, onDone, onError }) {
  if (!_workerReady) {
    const loadResult = await loadModel();
    if (!loadResult.ok) { onError(loadResult.error); return; }
  }
  const url = `http://127.0.0.1:${_workerPort}/generate-stream`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature, maxTokens }),
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete line
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.chunk) onChunk(data.chunk);
          if (data.done) { onDone(data.text); return; }
          if (data.error) { onError(data.error); return; }
        } catch {}
      }
    }
    onError("Stream ended unexpectedly");
  } catch (err) {
    onError(String(err.message || err));
  }
}

export async function testModel() {
  if (!_workerReady) {
    const loadResult = await loadModel();
    if (!loadResult.ok) return { text: "", error: loadResult.error };
  }
  try {
    return await workerRequest("/test");
  } catch (err) {
    return { text: "", error: String(err.message || err) };
  }
}
