import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";
import "./styles/ui.css";
import "./styles/sidebar.css";
import "./styles/home.css";
import "./styles/tasks.css";
import "./styles/calendar.css";
import "./styles/dialog.css";
import "./styles/notes.css";
import "./styles/files.css";
import "./styles/study.css";
import "./styles/planning.css";
import "./styles/placeholder.css";
import "./styles/lockin.css";
import "./styles/timer.css";
import "./styles/projects.css";
import "./styles/research.css";
import "./styles/ai.css";
import "./styles/studyai.css";
import "./styles/palette.css";
import "./styles/notifications.css";
import "./styles/gamification.css";
import "./styles/extras.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
