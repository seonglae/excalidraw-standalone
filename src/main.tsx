import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import { CONVEX_URL, USE_CONVEX } from "./storage";
import "./index.css";

// Restore theme preference before first paint so the page doesn't flash.
(() => {
  const stored = localStorage.getItem("excalidraw-standalone.theme");
  const dark =
    stored === "dark" ||
    (stored !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();

const root = createRoot(document.getElementById("root")!);

if (USE_CONVEX) {
  const convex = new ConvexReactClient(CONVEX_URL!);
  root.render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
