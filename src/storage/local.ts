import { useCallback, useEffect, useState } from "react";
import type { Drawing, DrawingStore } from "./types";

const KEY = "excalidraw-standalone.drawings.v1";

function readAll(): Drawing[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Drawing[];
  } catch {
    return [];
  }
}

function writeAll(rows: Drawing[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch (err) {
    console.warn("[excalidraw-standalone] localStorage write failed:", err);
  }
}

function makeId() {
  // Short, sortable-ish id. Not crypto-secure — but drawings are per-browser
  // here, no global uniqueness requirement.
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Cross-tab sync: other tabs see the same drawings list when storage event fires.
function useLocalDrawings(): Drawing[] {
  const [rows, setRows] = useState<Drawing[]>(() => readAll());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRows(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return rows;
}

export function useLocalDrawingStore(): DrawingStore {
  const drawings = useLocalDrawings();

  const create = useCallback(async (title?: string) => {
    const now = Date.now();
    const id = makeId();
    const row: Drawing = {
      _id: id,
      title: title ?? "Untitled",
      elements: "[]",
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    writeAll([row, ...all]);
    // Force re-read since storage event only fires for OTHER tabs.
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    return id;
  }, []);

  const update = useCallback<DrawingStore["update"]>(async (id, patch) => {
    const all = readAll();
    const i = all.findIndex((d) => d._id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
    // Bubble updated row to the top so the list view's recency order matches Convex.
    const [row] = all.splice(i, 1);
    all.unshift(row);
    writeAll(all);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  const rename = useCallback<DrawingStore["rename"]>(async (id, title) => {
    const all = readAll();
    const i = all.findIndex((d) => d._id === id);
    if (i < 0) return;
    all[i] = { ...all[i], title, updatedAt: Date.now() };
    writeAll(all);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  const remove = useCallback<DrawingStore["remove"]>(async (id) => {
    writeAll(readAll().filter((d) => d._id !== id));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  const getById = useCallback<DrawingStore["getById"]>(
    (id) => {
      const row = drawings.find((d) => d._id === id);
      return row ?? null;
    },
    [drawings],
  );

  return { drawings, getById, create, update, rename, remove };
}
