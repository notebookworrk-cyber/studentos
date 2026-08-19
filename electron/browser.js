import { WebContentsView, shell, session } from "electron";
import { BrowserWindow } from "electron";

const DEFAULT_SEARCH = "https://www.google.com/search?q=";

export class BrowserManager {
  constructor(win, { wsPath }) {
    this.win = win;
    this.tabs = new Map();
    this.activeId = null;
    this.wsPath = wsPath;
    this.setupSession();
  }

  setupSession() {
    const ses = session.defaultSession;
    ses.setDownloadPath(this.wsPath);
    ses.on("will-download", (e, item) => {
      item.on("updated", () => {
        if (item.isPaused()) return;
        const state = item.getState();
        this.win.webContents.send("browser:download", {
          url: item.getURL(),
          state,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      });
      item.once("done", (e, state) => {
        this.win.webContents.send("browser:download", {
          url: item.getURL(),
          state,
        });
      });
    });
  }

  newTab(url = "about:blank") {
    const id = crypto.randomUUID();
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
      },
    });

    view.webContents.setWindowOpenHandler(({ url }) => {
      try {
        if (!/^https?:$/.test(new URL(url).protocol)) {
          return { action: "deny" };
        }
      } catch {
        return { action: "deny" };
      }
      this.newTab(url);
      return { action: "deny" };
    });

    view.webContents.on("page-title-updated", (_e, title) => {
      this.emitNav(id, { title, canGoBack: view.webContents.navigationHistory?.canGoBack?.() ?? false, canGoForward: view.webContents.navigationHistory?.canGoForward?.() ?? false });
    });
    view.webContents.on("did-navigate", (_e, url) => {
      this.emitNav(id, { url, canGoBack: view.webContents.navigationHistory?.canGoBack?.() ?? false, canGoForward: view.webContents.navigationHistory?.canGoForward?.() ?? false });
    });
    view.webContents.on("did-navigate-in-page", (_e, url, isMainFrame) => {
      if (isMainFrame) this.emitNav(id, { url });
    });
    view.webContents.on("did-start-loading", () => this.emitNav(id, { loading: true }));
    view.webContents.on("did-stop-loading", () => this.emitNav(id, { loading: false }));
    view.webContents.on("did-fail-load", (_e, code, desc, validatedURL) => {
      this.emitNav(id, { error: { code, desc, url: validatedURL } });
    });
    view.webContents.on("destroyed", () => this.tabs.delete(id));

    this.tabs.set(id, { view, url, title: "", loading: false });
    this.activeId = id;
    this.win.contentView.addChildView(view);
    this.positionView(id);
    if (url !== "about:blank") this.navigate(id, url);
    return id;
  }

  selectTab(id) {
    if (!this.tabs.has(id)) return false;
    this.activeId = id;
    this.positionView(id);
    return true;
  }

  closeTab(id) {
    const tab = this.tabs.get(id);
    if (!tab) return false;
    if (this.activeId === id) {
      const others = [...this.tabs.keys()].filter(k => k !== id);
      this.activeId = others[0] || null;
    }
    this.win.contentView.removeChildView(tab.view);
    tab.view.webContents.destroy();
    this.tabs.delete(id);
    if (this.activeId) this.positionView(this.activeId);
    return true;
  }

  navigate(id, url) {
    const tab = this.tabs.get(id);
    if (!tab) return;
    const normalized = this.normalizeInput(url);
    tab.url = normalized;
    tab.loading = true;
    this.emitNav(id, { url: normalized, loading: true });
    tab.view.webContents.loadURL(normalized).catch(e => console.error("loadURL:", e));
  }

  back(id) { const t = this.tabs.get(id); if (t && t.view.webContents.navigationHistory?.canGoBack?.()) t.view.webContents.goBack(); }
  forward(id) { const t = this.tabs.get(id); if (t && t.view.webContents.navigationHistory?.canGoForward?.()) t.view.webContents.goForward(); }
  reload(id) { const t = this.tabs.get(id); if (t) t.view.webContents.reload(); }
  stop(id) { const t = this.tabs.get(id); if (t) t.view.webContents.stop(); }
  setBounds(id, bounds) { const t = this.tabs.get(id); if (t) this.positionView(id, bounds); }
  find(id, text) { const t = this.tabs.get(id); if (t) t.view.webContents.findInPage(text); }
  stopFind(id) { const t = this.tabs.get(id); if (t) t.view.webContents.stopFindInPage("clearSelection"); }

  getTabs() {
    return [...this.tabs.entries()].map(([id, t]) => ({
      id,
      url: t.url,
      title: t.title,
      loading: t.loading,
      active: id === this.activeId,
    }));
  }

  emitNav(id, data) {
    this.win.webContents.send("browser:nav", { id, ...data });
  }

  positionView(id, boundsOverride) {
    const tab = this.tabs.get(id);
    if (!tab) return;
    for (const [tid, t] of this.tabs) {
      if (tid === id) continue;
      t.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
    const winBounds = this.win.getContentBounds();
    const b = boundsOverride || { x: 0, y: 64, width: winBounds.width, height: winBounds.height - 64 };
    tab.view.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  }

  normalizeInput(input) {
    try {
      const u = new URL(input);
      if (["http:", "https:"].includes(u.protocol)) return u.href;
    } catch {}
    const u = input.trim();
    if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(u)) return `https://${u}`;
    return DEFAULT_SEARCH + encodeURIComponent(u);
  }

  openExternal(url) {
    shell.openExternal(url);
  }

  dispose() {
    for (const [id] of this.tabs) this.closeTab(id);
    this.tabs.clear();
  }
}