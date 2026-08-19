# StudentOS — Agent & Contributor Guide

## Stack
React 18 + TypeScript + Vite (web UI) · Electron (desktop shell) · node-pty PTY host (real terminal) · WebContentsView (real browser)

## Commands
```powershell
# dev server (web mode — most UI work)
npm run dev

# desktop app with live dev server (real terminal + browser)
$env:STUDENTOS_DEV="1"; $env:ELECTRON_START_URL="http://localhost:5173"
node_modules\.bin\electron.cmd .

# typecheck
npx tsc -b

# prod build
npm run build

# verify desktop end-to-end
npm run desktop
```
NOTE: `npm run dev:desktop` uses Unix env syntax — doesn't work in cmd; use the env pattern above.

## Layout
- `src/state/os.tsx` — SINGLE source of truth store (tasks, notes, files, goals, lock-in, timer, wallpaper). New features consume `useOS()`, never fork a copy.
- `src/components/<module>/` — pages per domain (home, tasks, calendar, notes, files, study, planning, lockin, timer, projects, research, ai, settings, browser, terminal, code).
- `src/lib/` — date, format, planning helpers. `src/types.ts` — domain types.
- `src/styles/*.css` — design tokens (tokens.css) + per-module css. Imported in order in `main.tsx`.
- `electron/` — desktop only:
  - `main.js` — window + lifecycle (HARDWARE ACCELERATION DISABLED by default)
  - `preload.cjs` — secure API bridge `window.studentos` (contextIsolation + sandbox)
  - `ipc.js` — IPC handlers; `permissions.js` — capability levels read/suggest/write/execute/system
  - `browser.js` — WebContentsView tab manager; `terminal.js` + `pty-host.cjs` — PTY backend run as plain-Node child (node-pty ABI differs from Electron; NEVER rebuild native modules — VS not installed)

## Rules
- Audit before changing. Classify WORKING / PARTIAL / PLACEHOLDER / BROKEN / MISSING.
- One source of truth per domain — no duplicate systems.
- Web mode fallback: fake terminal/browser, by design. Real engines only in Electron.
- No fake implementations. Verify on the real flow (terminal: type a command, see shell output; browser: navigate a site).
- Secrets never client-side. AI never unlimited autonomy (levels gate actions).
- Match existing visual language (glass, soft blue/cyan/lavender, restraint). Check duplicate class names in css before adding.
- Keep the app working: `npx tsc -b` + `npm run build` before finishing.
- C: drive is nearly full (as of packaging): avoid heavy installs; delete `release/` to reclaim space.

## Packaging
`npx electron-builder --win` (config in package.json; asar:false + npmRebuild:false are intentional — pty-host must read real files, node-pty must stay Node-ABI).