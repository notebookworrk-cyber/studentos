/**
 * Standalone Node.js process that loads the GGUF model via node-llama-cpp
 * and exposes an HTTP API. Electron's main process spawns this and
 * communicates via localhost HTTP — avoids Electron ABI mismatch.
 */
import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const MODEL_PATH = process.env.MODEL_PATH;
const PORT = 0; // OS picks a free port

let _llama = null;
let _model = null;
let _context = null;
let _sequence = null;
let _chatSession = null;
let _ready = false;

function log(msg) {
  process.stdout.write(`[worker] ${msg}\n`);
}

async function initModel() {
  log("PROGRESS:importing");
  log("Loading node-llama-cpp...");
  const llamaCpp = await import("node-llama-cpp");
  log("PROGRESS:init");
  log("Calling getLlama()...");
  _llama = await llamaCpp.getLlama({ gpu: "vulkan" });
  log("PROGRESS:loading");
  log("getLlama() done. Loading model from: " + MODEL_PATH);

  _model = await _llama.loadModel({ modelPath: MODEL_PATH });
  log("PROGRESS:context");
  log("Model loaded. Creating context...");
  _context = await _model.createContext({ contextSize: 2048 });
  log("PROGRESS:ready");
  log("Context created.");
  _sequence = _context.getSequence();
  log("Sequence obtained. Creating chat session...");

  _chatSession = new llamaCpp.LlamaChatSession({
    contextSequence: _sequence,
    systemPrompt: "You are StudentOS AI, a helpful educational assistant. You help students with their studies, homework, and learning. Be concise, clear, and encouraging.",
  });

  _ready = true;
  log("Model ready!");
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { ready: _ready });
    }

    if (req.method === "POST" && req.url === "/generate") {
      if (!_ready) return json(res, 503, { error: "Model not loaded" });
      const { prompt, temperature = 0.7, maxTokens = 512 } = JSON.parse(await readBody(req));
      log(`Generate: ${prompt.slice(0, 80)}...`);
      const startTime = Date.now();
      const text = await _chatSession.prompt(prompt, { temperature, maxTokens });
      log(`Generated in ${Date.now() - startTime}ms: ${text.slice(0, 100)}...`);
      return json(res, 200, { text });
    }

    if (req.method === "POST" && req.url === "/generate-stream") {
      if (!_ready) return json(res, 503, { error: "Model not loaded" });
      const { prompt, temperature = 0.7, maxTokens = 512 } = JSON.parse(await readBody(req));
      log(`Stream: ${prompt.slice(0, 80)}...`);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      const startTime = Date.now();
      let fullText = "";
      try {
        await _chatSession.prompt(prompt, {
          temperature,
          maxTokens,
          onTextChunk(chunk) {
            fullText += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
          },
        });
        log(`Streamed in ${Date.now() - startTime}ms: ${fullText.slice(0, 100)}...`);
        res.write(`data: ${JSON.stringify({ done: true, text: fullText })}\n\n`);
      } catch (err) {
        log("Stream error: " + err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/test") {
      if (!_ready) return json(res, 503, { error: "Model not loaded" });
      log("Running test...");
      const text = await _chatSession.prompt(
        "Reply with the single word READY.",
        { temperature: 0.1, maxTokens: 10 }
      );
      log("Test result: " + text);
      return json(res, 200, { text });
    }

    json(res, 404, { error: "Not found" });
  } catch (err) {
    log("Error: " + String(err.message));
    json(res, 500, { error: String(err.message || err) });
  }
});

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  // Write port to stdout so the parent process can read it
  log(`PORT:${port}`);

  try {
    await initModel();
  } catch (err) {
    log("FAILED: " + String(err.message || err));
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log("Shutting down...");
  try { if (_chatSession) _chatSession.dispose(); } catch {}
  try { if (_sequence) _sequence.dispose?.(); } catch {}
  try { if (_context) _context.dispose(); } catch {}
  try { if (_model) _model.dispose(); } catch {}
  server.close();
  process.exit(0);
});

process.on("SIGINT", () => process.emit("SIGTERM"));
