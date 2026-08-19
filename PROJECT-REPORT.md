# StudentOS 2.0 — Project Report

Date: 2026-08-12
Stack: React 18 + TypeScript + Vite 6 · Electron 43 (desktop shell) · node-pty · xterm.js · WebContentsView
Build: `npm run build` clean (tsc -b + vite, ~295 kB index + xterm chunk) · Dev: `npm run dev`

## 1. What it is

Personal digital workspace for students/creators. Core loop: **plan → learn → research → create → code → focus → finish**. Wins through orchestration — tools connected around the user's goals, tasks, and time. Single source of truth per domain in `src/state/os.tsx` (Tasks, Notes, Files, Goals, Study, Lock-In, Focus all share one OSContext).

## 2. Web app — modules

| Module | Status | Notes |
|---|---{-------|--------|-------|
| Home | WORKING | Dashboard: plan, focus, quick actions, project/notes/upcoming cards |
| Planning | WORKING | Overview/planner/week/review tabs, goals, time budget, insights |
| Calendar | WORKING | Month grid + day timeline, events with kind badges |
| Tasks | WORKING | Today/upcoming/completed/all views, filters, sort, task dialog |
| Notes | WORKING | Editor replaces list, folders, tags, favorite/pin |
| Files | WORKING | Folder tree, breadcrumb, search across notes+folders |
| Study | WORKING | Subjects/topics, resources, practice, sessions, progress |
| Lock-In | NEW | Focus-session engine UI (start/active/history) — roadmap #1; consumes existing engine |
| Timer | NEW | Standalone focus timer using shared TimerState |
| Projects | NEW | Aggregates tasks/notes/goals by project (no parallel store) |
| Research | NEW | Manual source library + annotation; **no fake scraping** |
| AI | NEW | Local planner agent, capability levels, keys never client-side |
| Settings | NEW | Wallpaper (4), data reset (2-step), desktop diagnostics |
| Browser | NEW | Desktop: real tabs/toolbar/find + Save-to-Research; web: CSP-safe launcher |
| Terminal | NEW | Desktop: real PTY (node-pty + xterm); web: command dispatcher |
| Code | NEW | Developer workspace over existing Notes/Files |

## 3. Desktop shell (Electron) — phases

- **P1** Secure shell: `contextIsolation` + sandbox, validated IPC (`window.studentos`), manual launch in dev (`$env:STUDENTOS_DEV=1; ... electron .`).
- **P2** Real PTY terminal (node-pty). **Verified** real `cmd.exe` output.
- **P3** Real browser engine (WebContentsView). **Verified** loading example.com.
- **P4** Browser tabs, nav state, error page, downloads, popups, find-in-page.
- **P5** Terminal tabs, rename, restart, resize.
- **P6** Projects → "Open Terminal Here" (resolves project dir, opens shell there).
- **P7** Browser → save source to Research.
- **P8** OpenCode launch button (detects + writes `opencode\r` in a new terminal tab).
- **P9** Permission scaffold (`permissions.js`) — not yet wired to AI actions.
- **P10** Diagnostics page (node/npm/git/python/opencode versions) + polish.

Verification: E2E launched the real Electron binary → title `StudentOS`, sidebar present, `window.studentos.isDesktop === true`.

## 4. AI core (in progress)

- Provider abstraction (`electron/ai/provider.ts`): OpenAI / Anthropic / Gemini / Local. OpenAI fixed to v7 API. Not yet emitted to JS (tsconfig includes `electron`; AI IPC stubbed out).
- Model registry (`modelRegistry.ts`): hardcoded catalog + IPC exposure pending.

## 5. Rules honored

- One source of truth — new features consume existing stores, no forks.
- No secrets client-side; no unlimited AI autonomy (capability levels read→system).
- Match existing visual language (tokens, glass, spacing).
- Real verification only — every engine (PTY, browser, E2E) tested with actual output.

## 6. Known debt / next steps

- Wire `PermissionManager` into AI tool layer (P9 is scaffold-only).
- Compile or convert `electron/ai/*.ts` for the AI providers to be runtime-real; register `ai:*` IPC.
- Remove dead code: unused `perms` + commented AI imports in `ipc.js`, and `permissions.js` until wired.
- `dev:desktop` npm script uses Unix syntax — launch manually on Windows.