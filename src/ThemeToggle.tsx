import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "excalidraw-standalone.theme";

function readInitial(): "light" | "dark" {
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(readInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="mono text-[10px] uppercase tracking-wider text-ink-3 hover:text-ink-2 transition-colors flex items-center gap-1 px-2 py-1 border border-rule-light rounded"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={11} /> : <Moon size={11} />}
      {theme === "dark" ? "light" : "dark"}
    </button>
  );
}
