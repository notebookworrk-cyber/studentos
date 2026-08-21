import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { registerIpc, disposeIpc } from "./ipc.js";
import { registerUpdater, disposeUpdater } from "./updater.js";
import { BrowserManager } from "./browser.js";
import { TerminalManager } from "./terminal.js";

app.disableHardwareAcceleration();

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.STUDENTOS_DEV;

let win = null;
let browsers = null;
let terminals = null;

const EXTRA_SAFE = ["goog", /^https?:\/\//, "http://", "https://", "www."];

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0b1020",
    title: "StudentOS",
    icon: join(__dirname, "..", "build", "icon.png"),
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });
  win.webContents.once("did-finish-load", () => {
    if (!win.isVisible()) {
      win.show();
      win.focus();
    }
  });
  win.on("closed", () => {
    win = null;
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    win.loadURL(devUrl).catch((e) => console.error("Failed to load dev URL:", e));
  } else {
    win.loadFile(join(app.getAppPath(), "dist", "index.html")).catch((e) =>
      console.error("Failed to load dist:", e)
    );
  }
}

app.whenReady().then(() => {
  const wsPath = app.getPath("userData");
  createWindow();
  browsers = new BrowserManager(win, { wsPath });
  terminals = new TerminalManager(wsPath, win);
  registerIpc(win, browsers, terminals, { isDev });
  registerUpdater(win, { isDev });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  disposeIpc();
  disposeUpdater();
  if (browsers) browsers.dispose();
  if (terminals) terminals.dispose();
});

export { EXTRA_SAFE };