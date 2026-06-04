import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ArrowLeft } from "lucide-react";
import { useDrawingStore } from "./storage";
import "@excalidraw/excalidraw/index.css";

export function DrawingEditor({ id, onBack }: { id: string; onBack: () => void }) {
  const { getById, update } = useDrawingStore();
  const drawing = getById(id);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef("");

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
      let thumb: string | undefined;
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
      } catch {}
      await update(id, { elements: elemStr, appState: stateSubset, thumbnail: thumb });
    }, 500);
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
        className="absolute top-[16px] left-16 z-[60] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded shadow-sm border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
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
