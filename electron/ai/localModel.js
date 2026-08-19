import { app } from "electron";
import { join } from "node:path";
import { existsSync, statSync, mkdirSync } from "node:fs";

const MODEL_ID = "qwen2.5-0.5b-instruct";
const MODEL_FILE = "qwen2.5-0.5b-instruct-q5_k_m.gguf";
const EXPECTED_SIZE = 400_000_000; // ~498 MB

class LocalModelManager {
  constructor() {
    // Bundled path: resources/models/ (production) or project-root/models/ (dev)
    const isDev = !app.isPackaged;
    const resourcesBase = isDev
      ? join(app.getAppPath(), "models")
      : join(process.resourcesPath, "models");
    this._bundledPath = join(resourcesBase, MODEL_FILE);

    // User data path (fallback)
    this._userPath = join(app.getPath("userData"), "models", MODEL_FILE);

    this._loadState = null;
    this._progressCallbacks = new Set();
  }

  get modelPath() {
    // Prefer bundled, fallback to user-installed
    if (existsSync(this._bundledPath)) return this._bundledPath;
    if (existsSync(this._userPath)) return this._userPath;
    return this._bundledPath; // default even if missing
  }

  get isBundled() {
    return existsSync(this._bundledPath);
  }

  /** Check if model file exists on disk */
  isInstalled() {
    try {
      const st = statSync(this.modelPath);
      return st.size >= EXPECTED_SIZE * 0.8;
    } catch { return false; }
  }

  /** Get model info */
  getInfo() {
    const installed = this.isInstalled();
    const bundled = this.isBundled;
    let size = 0;
    try { size = statSync(this.modelPath).size; } catch {}

    return {
      id: MODEL_ID,
      name: "Qwen2.5 0.5B Instruct",
      file: MODEL_FILE,
      size,
      sizeLabel: installed ? `${(size / 1e6).toFixed(1)} MB` : "498 MB",
      path: this.modelPath,
      installed,
      bundled,
      source: bundled ? "bundled" : "user",
      loaded: this._loadState?.loaded || false,
    };
  }

  /** Subscribe to progress updates */
  onProgress(cb) {
    this._progressCallbacks.add(cb);
    return () => this._progressCallbacks.delete(cb);
  }

  _emitProgress(extra = {}) {
    const info = { ...this.getInfo(), ...extra };
    for (const cb of this._progressCallbacks) {
      try { cb(info); } catch {}
    }
  }

  markLoaded(loaded) {
    this._loadState = { loaded };
    this._emitProgress();
  }
}

let _instance = null;
export function getLocalModelManager() {
  if (!_instance) _instance = new LocalModelManager();
  return _instance;
}

export { MODEL_ID, MODEL_FILE };
