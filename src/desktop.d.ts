interface StudentOSDesktop {
  isDesktop: boolean;
  system: {
    version: () => Promise<{ version: string; electron: string }>;
    diagnostics: () => Promise<Record<string, unknown>>;
    resolvePath: (payload: { name?: string; cwd?: string }) => Promise<{ path: string | null }>;
  };
  updater: {
    status: () => Promise<UpdateSnapshot>;
    check: () => Promise<UpdateSnapshot>;
    download: () => Promise<UpdateSnapshot>;
    quitAndInstall: () => Promise<UpdateSnapshot>;
    onEvent: (cb: (data: { event: string; state: UpdateSnapshot }) => void) => () => void;
  };
  browser: {
    newTab: (url?: string) => Promise<string>;
    closeTab: (id: string) => Promise<boolean>;
    selectTab: (id: string) => Promise<boolean>;
    navigate: (id: string, url: string) => Promise<void>;
    back: (id: string) => Promise<void>;
    forward: (id: string) => Promise<void>;
    reload: (id: string) => Promise<void>;
    stop: (id: string) => Promise<void>;
    setBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
    find: (id: string, text: string) => Promise<void>;
    stopFind: (id: string) => Promise<void>;
    openExternal: (url: string) => Promise<void>;
    events: {
      onNav: (cb: (data: BrowserNav) => void) => () => void;
      onError: (cb: (data: unknown) => void) => () => void;
      onDownload: (cb: (data: unknown) => void) => () => void;
      onNewWindow: (cb: (data: unknown) => void) => () => void;
    };
  };
  terminal: {
    create: (opts?: { cols?: number; rows?: number; cwd?: string; name?: string }) => Promise<{ id: string; name: string }>;
    write: (id: string, data: string) => Promise<void>;
    resize: (id: string, cols: number, rows: number) => Promise<void>;
    kill: (id: string) => Promise<void>;
    rename: (id: string, name: string) => Promise<void>;
    restart: (id: string) => Promise<{ id: string }>;
    events: {
      onData: (cb: (data: { id: string; data: string }) => void) => () => void;
      onExit: (cb: (data: { id: string }) => void) => () => void;
    };
  };
  notify: {
    show: (payload: { title: string; body?: string }) => Promise<{ ok: boolean }>;
  };
  files: {
    save: (payload: { name: string; content: string }) => Promise<{ ok: boolean; canceled?: boolean; path?: string }>;
    open: () => Promise<{ ok: boolean; canceled?: boolean; path?: string; content?: string }>;
    autoBackup: (payload: { content: string }) => Promise<{ ok: boolean; exists?: boolean; path?: string }>;
  };
  ai: {
    modelInfo: () => Promise<{ installed: boolean; bundled: boolean; name: string; size: number; sizeLabel: string; path: string; source: string; loaded: boolean }>;
    isAvailable: () => Promise<{ available: boolean }>;
    loadModel: () => Promise<{ ok: boolean; error?: string }>;
    unloadModel: () => Promise<{ ok: boolean }>;
    isLoaded: () => Promise<{ loaded: boolean }>;
    generate: (prompt: string, temperature?: number, maxTokens?: number) => Promise<{ text: string; error?: string }>;
    generateStream: (prompt: string, temperature?: number, maxTokens?: number) => Promise<{ ok: boolean }>;
    test: () => Promise<{ text: string; error?: string }>;
    onProgress: (cb: (data: Record<string, unknown>) => void) => () => void;
    onStreamChunk: (cb: (chunk: string) => void) => () => void;
    onStreamDone: (cb: (text: string) => void) => () => void;
    onStreamError: (cb: (error: string) => void) => () => void;
  };
}

interface BrowserNav {
  id: string;
  url?: string;
  title?: string;
  loading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  error?: { code: number; desc: string; url: string };
}

interface UpdateSnapshot {
  enabled: boolean;
  state: "idle" | "checking" | "available" | "downloading" | "downloaded" | "error";
  channel: string;
  version: string;
  update: { version: string | null; notes: string | null; size: number } | null;
  progress: { percent: number; transferred: number; total: number } | null;
  error: string | null;
  lastResult: "up-to-date" | "update-available" | "error" | null;
}

interface Window {
  studentos?: StudentOSDesktop;
}