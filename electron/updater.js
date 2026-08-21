import { app, ipcMain } from "electron";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import updater from "electron-updater";

const { autoUpdater } = updater;

const CHANNEL = "stable";
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

let win = null;
let enabled = false;
let timer = null;
let state = "idle";
let updateInfo = null;
let progress = null;
let lastError = null;
let lastResult = null;

function sendState() {
  if (win && !win.isDestroyed()) {
    win.webContents.send("update:event", {
      event: "state",
      state: snapshot(),
    });
  }
}

function snapshot() {
  return {
    enabled,
    state,
    channel: CHANNEL,
    version: app.getVersion(),
    update: updateInfo,
    progress,
    error: lastError,
    lastResult,
  };
}

function toInfo(info) {
  const files = info?.files ?? [];
  const size =
    files.find((f) => f.url && !f.url.endsWith(".blockmap"))?.size ??
    files[0]?.size ??
    0;
  return {
    version: info?.version ?? null,
    notes: typeof info?.releaseNotes === "string" ? info.releaseNotes : null,
    size,
  };
}

function set(next, info, err) {
  state = next;
  if (info !== undefined) updateInfo = info;
  if (err !== undefined) lastError = err;
  sendState();
}

function handleError(err) {
  lastError = String(err?.message || err);
  state = "error";
  lastResult = "error";
  sendState();
}

async function check() {
  if (!enabled) return snapshot();
  try {
    set("checking");
    await autoUpdater.checkForUpdates();
  } catch (err) {
    handleError(err);
  }
  return snapshot();
}

function download() {
  if (!enabled || state !== "available") return snapshot();
  autoUpdater.downloadUpdate().catch(handleError);
  return snapshot();
}

function quitAndInstall() {
  if (!enabled || state !== "downloaded") return snapshot();
  autoUpdater.quitAndInstall();
  return snapshot();
}

export function registerUpdater(targetWin, { isDev }) {
  win = targetWin;
  enabled = (app.isPackaged && !isDev) || !!process.env.STUDENTOS_UPDATE_FORCE;
  if (!enabled) {
    ipcMain.handle("update:status", () => snapshot());
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;
  if (process.env.STUDENTOS_UPDATE_FEED) {
    autoUpdater.forceDevUpdateConfig = true;
    if (process.env.STUDENTOS_UPDATE_AUTODOWNLOAD) autoUpdater.autoDownload = true;
    try {
      writeFileSync(
        join(app.getAppPath(), "dev-app-update.yml"),
        `provider: generic\nurl: ${process.env.STUDENTOS_UPDATE_FEED}\nuseMultipleRangeRequest: false\n`,
      );
    } catch {
      // config file is best-effort; setFeedURL covers the URL when it is absent
    }
    autoUpdater.setFeedURL({
      provider: "generic",
      url: process.env.STUDENTOS_UPDATE_FEED,
      useMultipleRangeRequest: false,
    });
  }

  autoUpdater.on("checking-for-update", () => {
    set("checking");
  });
  autoUpdater.on("update-available", (info) => {
    updateInfo = toInfo(info);
    lastError = null;
    state = "available";
    lastResult = "update-available";
    sendState();
  });
  autoUpdater.on("update-not-available", () => {
    updateInfo = null;
    progress = null;
    lastError = null;
    state = "idle";
    lastResult = "up-to-date";
    sendState();
  });
  autoUpdater.on("download-progress", (p) => {
    progress = {
      percent: Math.round(p.percent),
      transferred: p.transferred,
      total: p.total,
    };
    state = "downloading";
    sendState();
  });
  autoUpdater.on("update-downloaded", (info) => {
    progress = null;
    state = "downloaded";
    sendState();
  });
  autoUpdater.on("update-cancelled", () => {
    progress = null;
    state = "idle";
    sendState();
  });
  autoUpdater.on("error", (err) => {
    handleError(err);
  });

  ipcMain.handle("update:status", () => snapshot());
  ipcMain.handle("update:check", () => check());
  ipcMain.handle("update:download", () => download());
  ipcMain.handle("update:quitAndInstall", () => quitAndInstall());

  setTimeout(() => check(), 15_000);
  timer = setInterval(() => check(), CHECK_INTERVAL_MS);
}

export function disposeUpdater() {
  if (timer) clearInterval(timer);
  timer = null;
  win = null;
}