import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const media = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;

const syncThemeWithSystem = () => {
  const isDark = media.matches;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
};

syncThemeWithSystem();
media.addEventListener("change", syncThemeWithSystem);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
