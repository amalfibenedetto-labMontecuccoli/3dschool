import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Self-hosted fonts (the desktop app works offline): the mock's three families and weights.
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/drawings.css";
import { App } from "./App";
import { SchoolHost } from "./school/SchoolHost";
import { startTranslating } from "./school/i18n";

// ?theme=dark or ?theme=light forces a theme (screenshots, demos); otherwise follow the OS.
try {
  const theme = new URLSearchParams(location.search).get("theme");
  if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
} catch {
  /* no location in some hosts */
}

// The classroom edition: Italian (or English) for what the app shows, and the school's sign-in.
startTranslating();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SchoolHost>
      <App />
    </SchoolHost>
  </StrictMode>,
);
