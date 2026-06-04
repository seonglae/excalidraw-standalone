import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ArrowLeft } from "lucide-react";
import { useDrawing, useDrawingStore } from "./storage";
import "@excalidraw/excalidraw/index.css";

// Thumbnail debounce is longer than the elements debounce: a fresh PNG
// re-render is ~10× the size of the elements diff and the list-view
// thumbnail tolerates a few seconds of staleness without surprise.
const ELEMENTS_DEBOUNCE_MS = 500;
const THUMBNAIL_INTERVAL_MS = 5000;

export function DrawingEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const { update } = useDrawingStore();
  const drawing = useDrawing(id);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");
  const lastThumbAtRef = useRef(0);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!excalidrawAPI) return;
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const elemStr = JSON.stringify(elements);
      if (elemStr === lastSavedRef.current) return;
      lastSavedRef.current = elemStr;
      const stateSubset = JSON.stringify({
        viewBackgroundColor: appState.viewBackgroundColor,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      });
      // Thumbnail re-rendered at most once per THUMBNAIL_INTERVAL_MS — a
      // PNG export plus its dataURL roughly 20× the elements payload, so
      // gating it independently of element saves keeps bandwidth bounded
      // during rapid drawing.
      let thumb: string | undefined;
      const now = Date.now();
      if (now - lastThumbAtRef.current >= THUMBNAIL_INTERVAL_MS) {
        try {
          const blob = await exportToBlob({
            elements,
            appState: { ...appState, exportWithDarkMode: false },
            maxWidthOrHeight: 320,
            files: excalidrawAPI.getFiles(),
          });
          thumb = await new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(blob);
          });
          lastThumbAtRef.current = now;
        } catch {}
      }
      await update(id, { elements: elemStr, appState: stateSubset, thumbnail: thumb });
    }, ELEMENTS_DEBOUNCE_MS);
  }, [excalidrawAPI, id, update]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onBack]);

  if (drawing === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <span className="mono text-xs text-ink-4">loading...</span>
      </div>
    );
  }
  if (drawing === null) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <span className="mono text-xs text-rust">drawing not found</span>
      </div>
    );
  }

  const initialElements = (() => {
    try {
      return JSON.parse(drawing.elements);
    } catch {
      return [];
    }
  })();

  const initialAppState = (() => {
    if (!drawing.appState) return {};
    try {
      return JSON.parse(drawing.appState);
    } catch {
      return {};
    }
  })();

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <button
        onClick={onBack}
        className="absolute top-[16px] left-16 z-[60] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-xs">{drawing?.title ?? "Back"}</span>
      </button>
      <div className="w-full h-full">
        <Excalidraw
          excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
          initialData={{ elements: initialElements, appState: initialAppState }}
          onChange={scheduleSave}
        />
      </div>
    </div>
  );
}
