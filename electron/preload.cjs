const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, payload) =>
  ipcRenderer.invoke(channel, payload).catch((err) => ({ __error: String(err && err.message || err) }));

const browserEvents = {
  onNav: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("browser:nav", l);
    return () => ipcRenderer.removeListener("browser:nav", l);
  },
  onError: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("browser:error", l);
    return () => ipcRenderer.removeListener("browser:error", l);
  },
  onDownload: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("browser:download", l);
    return () => ipcRenderer.removeListener("browser:download", l);
  },
  onNewWindow: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("browser:newwindow", l);
    return () => ipcRenderer.removeListener("browser:newwindow", l);
  },
};

const terminalEvents = {
  onData: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("terminal:data", l);
    return () => ipcRenderer.removeListener("terminal:data", l);
  },
  onExit: (cb) => {
    const l = (_e, data) => cb(data);
    ipcRenderer.on("terminal:exit", l);
    return () => ipcRenderer.removeListener("terminal:exit", l);
  },
};

contextBridge.exposeInMainWorld("studentos", {
  isDesktop: true,
system: {
    version: invoke("system:version"),
    diagnostics: () => invoke("system:diagnostics"),
    resolvePath: (payload) => invoke("system:resolvePath", payload),
  },
  updater: {
    status: () => invoke("update:status"),
    check: () => invoke("update:check"),
    download: () => invoke("update:download"),
    quitAndInstall: () => invoke("update:quitAndInstall"),
    onEvent: (cb) => {
      const l = (_e, data) => cb(data);
      ipcRenderer.on("update:event", l);
      return () => ipcRenderer.removeListener("update:event", l);
    },
  },
  browser: {
    newTab: (url) => invoke("browser:newTab", { url }),
    closeTab: (id) => invoke("browser:closeTab", { id }),
    selectTab: (id) => invoke("browser:selectTab", { id }),
    navigate: (id, url) => invoke("browser:navigate", { id, url }),
    back: (id) => invoke("browser:back", { id }),
    forward: (id) => invoke("browser:forward", { id }),
    reload: (id) => invoke("browser:reload", { id }),
    stop: (id) => invoke("browser:stop", { id }),
    setBounds: (id, bounds) => invoke("browser:setBounds", { id, bounds }),
    find: (id, text) => invoke("browser:find", { id, text }),
    stopFind: (id) => invoke("browser:stopFind", { id }),
    openExternal: (url) => invoke("browser:openExternal", { url }),
    events: browserEvents,
  },
  terminal: {
    create: (opts) => invoke("terminal:create", opts),
    write: (id, data) => invoke("terminal:write", { id, data }),
    resize: (id, cols, rows) => invoke("terminal:resize", { id, cols, rows }),
    kill: (id) => invoke("terminal:kill", { id }),
    rename: (id, name) => invoke("terminal:rename", { id, name }),
    restart: (id) => invoke("terminal:restart", { id }),
    events: terminalEvents,
  },
  notify: {
    show: (payload) => invoke("notification:show", payload),
  },
  files: {
    save: (payload) => invoke("file:save", payload),
    open: () => invoke("file:open"),
    autoBackup: (payload) => invoke("backup:auto", payload),
  },
  // AI — local model + cloud BYOK provider
  ai: {
    modelInfo: () => invoke("ai:modelInfo"),
    isAvailable: () => invoke("ai:isAvailable"),
    loadModel: () => invoke("ai:loadModel"),
    unloadModel: () => invoke("ai:unloadModel"),
    isLoaded: () => invoke("ai:isLoaded"),
    getCloudStatus: () => invoke("ai:getCloudStatus"),
    setCloudConfig: (payload) => invoke("ai:setCloudConfig", payload),
    clearCloudConfig: () => invoke("ai:clearCloudConfig"),
    testCloud: () => invoke("ai:testCloud"),
    resetChat: () => invoke("ai:resetChat"),
    generate: (prompt, temperature, maxTokens) => invoke("ai:generate", { prompt, temperature, maxTokens }),
    generateStream: (payload) => invoke("ai:generateStream", payload),
    cancelStream: (requestId) => invoke("ai:cancelStream", { requestId }),
    test: () => invoke("ai:test"),
    onProgress: (cb) => {
      const l = (_e, data) => cb(data);
      ipcRenderer.on("ai:progress", l);
      return () => ipcRenderer.removeListener("ai:progress", l);
    },
    onStreamChunk: (cb) => {
      const l = (_e, data) => cb(data);
      ipcRenderer.on("ai:stream-chunk", l);
      return () => ipcRenderer.removeListener("ai:stream-chunk", l);
    },
    onStreamDone: (cb) => {
      const l = (_e, data) => cb(data);
      ipcRenderer.on("ai:stream-done", l);
      return () => ipcRenderer.removeListener("ai:stream-done", l);
    },
    onStreamError: (cb) => {
      const l = (_e, data) => cb(data);
      ipcRenderer.on("ai:stream-error", l);
      return () => ipcRenderer.removeListener("ai:stream-error", l);
    },
  },
});