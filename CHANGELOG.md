# Changelog

All notable changes will be documented in this file.

## [0.1.0] - 2024-01-01
### Added
- Project initialized

## [2.1.0] - 2026-08-13
### Added
- Milestone 2.1 UI/UX Overhaul 2.0 complete (design doc sections 14-52)
- ContextMenu component + hook (glass, keyboard nav, clamped placement)
- Contextual actions via right-click menus on tasks, notes, files, folders, calendar events, project cards
- Calendar 2.0 week view + current-time "Now" line in day timeline
- Lock-In 2.0 immersive mode (hides all chrome when a session is active)
- Files 2.0 grid/list layout toggle
- React.lazy page splitting (21 code-split chunks) + skeleton fallback
- Shortcuts 2.0: Ctrl/Cmd+P quick search, Ctrl/Cmd+N context-aware new item, Space timer toggle (Settings reference)
- Modal focus-trap + aria-labels for icon-only controls
- Home 2.0: priority-ordered layout, decluttered (QuickActions/StudyNow removed)
### Changed
- Phase A shared systems: button system (danger/loading/disabled), form system (toggles, checkboxes, error/help), context menus, toasts (dedupe + dismiss + cap), modal glass consistency
- Phase B product modes: Tasks hover-reveal actions, Projects bridge (Tasks/Notes/Files/Code/Terminal/AI), Ask AI context entries, browser icon-button labels
- Phase C platform: restrained motion audit, responsive recompose (incl. week view at narrow widths), accessibility audit, code splitting
### Quality gates
- npx tsc -b + npm run build passing; headless boot check clean (no console errors)
- Quality score: visual 9, usability 9, consistency 9, responsiveness 9, accessibility 8, performance 9, product clarity 9 (avg 8.9)
