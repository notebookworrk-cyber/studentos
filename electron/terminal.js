import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function nodeBin() {
  const candidates = [
    process.env.NODE,
    process.env.ProgramFiles ? join(process.env.ProgramFiles, "nodejs", "node.exe") : "",
    "node",
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c)) || "node";
}

// node-pty runs in a PLAIN Node child (ABI 137 != Electron's 148), proxied
// here over line-delimited JSON on stdio. Survives Electron upgrades — no
// native rebuild ever needed.
export class TerminalManager {
  constructor(wsPath, win) {
    this.wsPath = wsPath;
    this.win = win || null;
    this.tabs = new Map();
    this.activeId = null;
    this.pending = new Map(); // id -> resolve()
    this.startHost();
  }

  startHost() {
    this.host = spawn(nodeBin(), [join(__dirname, "pty-host.cjs")], {
      stdio: ["pipe", "pipe", "inherit"],
      windowsHide: true,
    });
    let buf = "";
    this.host.stdout.setEncoding("utf8");
    this.host.stdout.on("data", (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        this.onHostMessage(msg);
      }
    });
    this.host.on("exit", () => {
      for (const resolve of this.pending.values()) resolve(null);
      this.pending.clear();
    });
  }

  onHostMessage(msg) {
    const { t, id } = msg;
    if (t === "created") {
      const resolve = this.pending.get(id);
      if (resolve) {
        this.pending.delete(id);
        resolve({ id, name: msg.name });
      }
    } else if ((t === "data" || t === "exit") && this.win && !this.win.isDestroyed()) {
      this.win.webContents.send(`terminal:${t}`, { id, ...(t === "data" ? { data: msg.data } : { exitCode: msg.exitCode }) });
    }
  }

  send(msg) {
    if (this.host?.stdin.writable) this.host.stdin.write(JSON.stringify(msg) + "\n");
  }

  create(opts = {}) {
    const id = crypto.randomUUID();
    const tab = {
      id,
      name: opts.name || `Terminal ${this.tabs.size + 1}`,
      cols: opts.cols || 80,
      rows: opts.rows || 24,
      cwd: opts.cwd || this.wsPath,
    };
    this.tabs.set(id, tab);
    this.activeId = id;
    const created = new Promise((resolve) => this.pending.set(id, resolve));
    this.send({ t: "create", id, opts: { ...opts, cols: tab.cols, rows: tab.rows, cwd: tab.cwd, name: tab.name } });
    return created.then((res) => res || { id, name: tab.name });
  }

  write(id, data) {
    this.send({ t: "write", id, data });
  }

  resize(id, cols, rows) {
    const tab = this.tabs.get(id);
    if (!tab) return;
    tab.cols = cols;
    tab.rows = rows;
    this.send({ t: "resize", id, cols, rows });
  }

  kill(id) {
    this.send({ t: "kill", id });
    this.tabs.delete(id);
    if (this.activeId === id) {
      const next = this.tabs.keys().next().value;
      this.activeId = next || null;
    }
  }

  rename(id, name) {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.name = name;
      this.send({ t: "rename", id, name });
    }
  }

  restart(id) {
    const tab = this.tabs.get(id);
    if (!tab) return Promise.resolve({ id });
    const created = new Promise((resolve) => this.pending.set(id, resolve));
    this.send({ t: "restart", id, opts: { cols: tab.cols, rows: tab.rows, cwd: tab.cwd, name: tab.name } });
    return created;
  }

  getTabs() {
    return [...this.tabs.entries()].map(([id, t]) => ({
      id,
      name: t.name,
      active: id === this.activeId,
    }));
  }

  dispose() {
    this.host?.kill();
    this.tabs.clear();
    this.pending.clear();
  }
}