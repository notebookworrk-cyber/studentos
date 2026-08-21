import { ipcMain, shell, Notification, app, dialog } from "electron";
import os from "node:os";
import { readdir, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { PermissionManager } from "./permissions.js";
import { getLocalModelManager } from "./ai/localModel.js";
import { loadModel, unloadModel, isModelLoaded, generateText, generateStream, testModel } from "./ai/generator.js";

export function registerIpc(win, browsers, terminals, { isDev }) {
  const handlers = new Map();
  const perms = new PermissionManager();

  const handle = (channel, fn) => {
    handlers.set(channel, fn);
    ipcMain.handle(channel, async (e, payload) => {
      try {
        return await fn(payload, e);
      } catch (err) {
        console.error(`IPC ${channel} error:`, err);
        return { __error: String(err?.message || err) };
      }
    });
  };

  // System
  handle("system:version", async () => ({ version: app.getVersion(), electron: process.versions.electron }));
  handle("system:diagnostics", async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const exec = promisify(execFile);
    const checks = { node: process.version, npm: "unknown", git: "unknown", python: "unknown", opencode: "unknown", shell: process.env.SHELL || process.env.ComSpec };
    for (const [k, cmd, args] of [
      ["npm", "npm", ["--version"]],
      ["git", "git", ["--version"]],
      ["python", "python", ["--version"]],
      ["opencode", "opencode", ["--version"]],
    ]) {
      try { const { stdout } = await exec(cmd, args); checks[k] = stdout.trim(); } catch {}
    }
    return { os: process.platform, arch: process.arch, version: app.getVersion(), electron: process.versions.electron, ...checks };
  });
  // Resolve a project name / path to a real folder. Checks candidates in priority order.
  handle("system:resolvePath", async ({ name, cwd }) => {
    const home = process.env.USERPROFILE || os.homedir();
    const candidates = [];
    if (cwd) candidates.push(String(cwd));
    if (name) {
      const plain = String(name).replace(/[^a-z0-9]+/gi, " ").trim();
      candidates.push(home + "/" + plain);
      candidates.push(terminals.wsPath + "/" + plain);
    }
    for (const c of candidates) {
      if (!c) continue;
      try {
        if ((await readdir(c)).length >= 0) return { path: c.replace(/[\\/]+$/, "") };
      } catch {}
    }
    return { path: null };
  });

  // Browser
  handle("browser:newTab", async ({ url }) => browsers.newTab(url));
  handle("browser:closeTab", async ({ id }) => browsers.closeTab(id));
  handle("browser:selectTab", async ({ id }) => browsers.selectTab(id));
  handle("browser:navigate", async ({ id, url }) => browsers.navigate(id, url));
  handle("browser:back", async ({ id }) => browsers.back(id));
  handle("browser:forward", async ({ id }) => browsers.forward(id));
  handle("browser:reload", async ({ id }) => browsers.reload(id));
  handle("browser:stop", async ({ id }) => browsers.stop(id));
  handle("browser:setBounds", async ({ id, bounds }) => browsers.setBounds(id, bounds));
  handle("browser:find", async ({ id, text }) => browsers.find(id, text));
  handle("browser:stopFind", async ({ id }) => browsers.stopFind(id));
  handle("browser:openExternal", async ({ url }) => shell.openExternal(url));

  // Files — backup / export
  handle("file:save", async ({ name, content }) => {
    const userData = app.getPath("userData");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Export StudentOS data",
      defaultPath: join(userData, String(name || "studentos-backup.json")),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (canceled || !filePath) return { canceled: true };
    await writeFile(filePath, content, "utf8");
    return { ok: true, path: filePath };
  });
  handle("file:open", async () => {
    const userData = app.getPath("userData");
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "Restore StudentOS data",
      defaultPath: userData,
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });
    if (canceled || !filePaths?.[0]) return { canceled: true };
    const filePath = filePaths[0];
    const content = await readFile(filePath, "utf8");
    return { ok: true, path: filePath, content };
  });
  handle("backup:auto", async ({ content }) => {
    const today = new Date().toISOString().slice(0, 10);
    const dir = join(app.getPath("userData"), "backups");
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, `backup-${today}.json`);
    try {
      await readFile(filePath, "utf8");
      return { ok: false, exists: true };
    } catch {
      /* not created yet */
    }
    await writeFile(filePath, content, "utf8");
    return { ok: true, path: filePath };
  });

  // Notifications
  handle("notification:show", async ({ title, body }) => {
    if (!Notification.isSupported()) return { ok: false };
    const n = new Notification({ title: String(title ?? "StudentOS"), body: String(body ?? "") });
    n.show();
    return { ok: true };
  });

  // Terminal
  handle("terminal:create", async (opts) => terminals.create(opts));
  handle("terminal:write", async ({ id, data }) => terminals.write(id, data));
  handle("terminal:resize", async ({ id, cols, rows }) => terminals.resize(id, cols, rows));
  handle("terminal:kill", async ({ id }) => terminals.kill(id));
  handle("terminal:rename", async ({ id, name }) => terminals.rename(id, name));
  handle("terminal:restart", async ({ id }) => terminals.restart(id));

  // AI — Local model management
  const mgr = getLocalModelManager();
  mgr.onProgress((info) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("ai:progress", info);
    }
  });

  handle("ai:modelInfo", async () => mgr.getInfo());
  handle("ai:isAvailable", async () => ({ available: mgr.isInstalled() }));
  handle("ai:loadModel", async () => {
    console.log("[ipc] ai:loadModel called");
    const res = await loadModel();
    console.log("[ipc] ai:loadModel -> " + JSON.stringify(res));
    return res;
  });
  handle("ai:unloadModel", async () => { unloadModel(); return { ok: true }; });
  handle("ai:isLoaded", async () => ({ loaded: isModelLoaded() }));
  handle("ai:generate", async ({ prompt, temperature, maxTokens }) => generateText(prompt, { temperature, maxTokens }));
  handle("ai:generateStream", async ({ prompt, temperature, maxTokens }, e) => {
    generateStream(prompt, {
      temperature,
      maxTokens,
      onChunk(chunk) {
        if (win && !win.isDestroyed()) win.webContents.send("ai:stream-chunk", chunk);
      },
      onDone(text) {
        if (win && !win.isDestroyed()) win.webContents.send("ai:stream-done", text);
      },
      onError(msg) {
        if (win && !win.isDestroyed()) win.webContents.send("ai:stream-error", msg);
      },
    });
    return { ok: true }; // immediate ack; actual data via events
  });
  handle("ai:test", async () => testModel());

  browsers.win = win;
  terminals.win = win;
}

export function disposeIpc() {
  ipcMain.removeAllListeners();
}

