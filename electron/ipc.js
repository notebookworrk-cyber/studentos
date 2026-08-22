import { ipcMain, shell, Notification, app, dialog } from "electron";
import os from "node:os";
import { readdir, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { PermissionManager } from "./permissions.js";
import { getLocalModelManager } from "./ai/localModel.js";
import { loadModel, unloadModel, isModelLoaded, generateText, generateStream, testModel, resetChatSession } from "./ai/generator.js";
import { generateCloudText, generateCloudStream, testCloud } from "./ai/cloud.js";
import { cloudStatus, setCloudConfig, clearCloudConfig, isCloudConfigured } from "./ai/providerStore.js";

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

  // Active provider routing: cloud (BYOK, OpenAI-compatible) when configured, else local model
  const streamControllers = new Map();

  handle("ai:getCloudStatus", async () => cloudStatus());
  handle("ai:setCloudConfig", async ({ baseUrl, model, apiKey }) => setCloudConfig(baseUrl, model, apiKey));
  handle("ai:clearCloudConfig", async () => { clearCloudConfig(); return cloudStatus(); });
  handle("ai:testCloud", async () => testCloud());
  handle("ai:resetChat", async () => {
    if (!isCloudConfigured()) await resetChatSession();
    return { ok: true };
  });

  handle("ai:generate", async ({ prompt, temperature, maxTokens }) => {
    if (isCloudConfigured()) {
      return generateCloudText([{ role: "user", content: prompt }], { temperature, maxTokens });
    }
    return generateText(prompt, { temperature, maxTokens });
  });

  handle("ai:generateStream", async ({ requestId, prompt, messages, temperature = 0.7, maxTokens }, e) => {
    const id = requestId;
    const controller = new AbortController();
    streamControllers.set(id, controller);
    const send = (channel, extra) => {
      if (win && !win.isDestroyed()) win.webContents.send(channel, { id, ...extra });
    };
    const cleanup = () => streamControllers.delete(id);
    const opts = {
      temperature,
      maxTokens: maxTokens ?? 1024,
      signal: controller.signal,
      onChunk(chunk) { send("ai:stream-chunk", { chunk }); },
      onDone(text) { cleanup(); send("ai:stream-done", { text }); },
      onError(msg) { cleanup(); if (!controller.signal.aborted) send("ai:stream-error", { error: msg }); },
    };
    if (isCloudConfigured()) {
      void generateCloudStream(messages ?? [{ role: "user", content: prompt }], opts);
    } else {
      void generateStream(prompt, opts);
    }
    return { ok: true, requestId: id }; // immediate ack; actual data via events
  });

  handle("ai:cancelStream", async ({ requestId }) => {
    streamControllers.get(requestId)?.abort();
    streamControllers.delete(requestId);
    return { ok: true };
  });

  handle("ai:test", async () => {
    if (isCloudConfigured()) {
      const res = await testCloud();
      return res.ok ? { text: res.text } : { text: "", error: res.error };
    }
    return testModel();
  });

  browsers.win = win;
  terminals.win = win;
}

export function disposeIpc() {
  ipcMain.removeAllListeners();
}

