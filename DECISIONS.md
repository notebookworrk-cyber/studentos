# Decisions

## 2024-01-01: Project initialized
- Educational OS project setup

## 2026-08-13: Milestone 2.1 — UI/UX Overhaul 2.0
- Scope: full design doc sections 14-52 (Home/Tasks/Calendar/Notes/Files/Study/Planning/Lock-In/Browser/Terminal/Projects/AI 2.0 + motion, shortcuts, responsive, a11y, performance, quality gates).
- Order: foundation-first (shared systems → product modes → platform → quality gates).
- Principle: premium = hierarchy/restraint/spacing/typography, NOT more gradients/blur/cards.
- Verify after each phase: `npx tsc -b` + `npm run build`.
- COMPLETE 2026-08-13. All phases A-D shipped and verified (tsc + build + headless boot clean).

## 2026-08-13: Implementation decisions
- Context menus: single reusable component + hook, right-click on tasks/notes/files/folders/calendar items/project cards; keyboard accessible (Arrows/Enter/Esc).
- Lock-In immersive: when `lockinActive`, Shell renders only wallpaper + LockInPage (sidebar/topbar/palette hidden); Ctrl+K disabled.
- Shortcuts: Ctrl+K palette, Ctrl+P quick search (same palette), Ctrl+N context-aware (task/event/note by page), Space toggles timer on timer page only (never hijacks inputs).
- Code splitting: React.lazy for all 16 pages; TaskDialog/EventDialog/GoalDialog/Icon kept eager (small, always-needed).
- Keyboard shortcuts surfaced in Settings for discoverability.
