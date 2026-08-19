# StudentOS

An all-in-one desktop OS for students — tasks, calendar, notes, study planner, focus timer, projects, research, terminal, browser, and a local AI assistant. Everything runs on your machine, no account required.

## Features

- **Tasks & Calendar** — plan your day, deadlines, recurring events, reminders and notifications
- **Notes & Files** — markdown notes with folders, tags, favorites, and full-text search
- **Study planner** — subjects, topics, materials, flashcards with spaced repetition, quizzes
- **Focus** — Pomodoro timer and immersive lock-in sessions with session reviews
- **Projects** — track work with progress and status
- **Research** — collect papers, articles, videos and books
- **Global search** — fuzzy search everything from one command palette (`Ctrl+K`)
- **Local AI assistant** — bundled offline model for chat, planning, and breaking down tasks (no cloud, no privacy leaks)
- **Stats** — streaks, XP, focus heatmaps and subject breakdowns
- **Backup & restore** — one-click export/import and daily auto-backups
- **Browser & Terminal** — built-in web browser and system terminal

## Install

Download the latest installer from the [Releases](https://github.com/notebookworrk-cyber/studentos/releases) page and run it.

> Windows may show a SmartScreen warning because the app isn't code-signed. Click **More info → Run anyway** to install.

The installer bundles the local AI model (~870 MB total), so AI works offline out of the box.

## Development

```bash
npm install
npm run dev      # web preview
npm run build    # production bundle (dist/)
npx electron-builder --win   # build the installer (release/)
```

## Tech

React + TypeScript + Vite on the front end, Electron for the desktop shell, node-llama-cpp for the local AI model.

## License

[MIT](LICENSE)