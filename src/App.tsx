import { useEffect, useState } from "react";
import { DrawingsView } from "./DrawingsView";
import { DrawingEditor } from "./DrawingEditor";
import { ThemeToggle } from "./ThemeToggle";
import { USE_CONVEX } from "./storage";

// ?d=<id> opens the editor. No id = list view. Same URL scheme as the
// parent project, kept short on purpose.
function readDrawingId() {
  return new URLSearchParams(window.location.search).get("d");
}

function setDrawingIdInURL(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("d", id);
  else url.searchParams.delete("d");
  window.history.pushState({}, "", url.toString());
}

export default function App() {
  const [activeId, setActiveIdState] = useState<string | null>(readDrawingId);

  // Back / forward browser buttons re-sync the editor selection.
  useEffect(() => {
    const onPop = () => setActiveIdState(readDrawingId());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setActiveId = (id: string | null) => {
    setActiveIdState(id);
    setDrawingIdInURL(id);
  };

  if (activeId) {
    return <DrawingEditor id={activeId} onBack={() => setActiveId(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-lg text-ink">Excalidraw</h1>
          <p className="mono text-[10px] text-ink-3 uppercase tracking-wider mt-0.5">
            {USE_CONVEX ? "convex sync" : "local-only"}
          </p>
        </div>
        <ThemeToggle />
      </header>
      <DrawingsView onOpen={setActiveId} />
    </div>
  );
}
