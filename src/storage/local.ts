import { useCallback, useEffect, useState } from "react";
import type { Drawing, DrawingStore, DrawingSummary } from "./types";

const KEY = "excalidraw-standalone.drawings.v1";
// Same-tab subscribers — the StorageEvent only fires for OTHER tabs, so
// every write also pings these directly. Module-level set avoids a
// redundant write-then-read round-trip.
const subscribers = new Set<() => void>();

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
  for (const fn of subscribers) fn();
}

function makeId() {
  // Use crypto.randomUUID when available; fall back to a short pseudo-random
  // id for older browsers. Drawings are per-browser so no global uniqueness
  // requirement.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function useLocalDrawings(): Drawing[] {
  const [rows, setRows] = useState<Drawing[]>(() => readAll());
  useEffect(() => {
    const refresh = () => setRows(readAll());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    subscribers.add(refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      subscribers.delete(refresh);
    };
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
    writeAll([row, ...readAll()]);
    return id;
  }, []);

  const update = useCallback<DrawingStore["update"]>(async (id, patch) => {
    const all = readAll();
    const i = all.findIndex((d) => d._id === id);
    if (i < 0) return;
    all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
    // Bubble updated row to the top so list-view recency order matches Convex.
    const [row] = all.splice(i, 1);
    all.unshift(row);
    writeAll(all);
  }, []);

  const rename = useCallback<DrawingStore["rename"]>(async (id, title) => {
    const all = readAll();
    const i = all.findIndex((d) => d._id === id);
    if (i < 0) return;
    all[i] = { ...all[i], title, updatedAt: Date.now() };
    writeAll(all);
  }, []);

  const remove = useCallback<DrawingStore["remove"]>(async (id) => {
    writeAll(readAll().filter((d) => d._id !== id));
  }, []);

  // List view doesn't need the heavy elements blob — return summaries only,
  // matching the Convex adapter's shape.
  const summaries: DrawingSummary[] = drawings.map(({ elements: _e, appState: _a, ...rest }) => rest);

  return { drawings: summaries, create, update, rename, remove };
}

export function useLocalDrawing(id: string): Drawing | null | undefined {
  const all = useLocalDrawings();
  return all.find((d) => d._id === id) ?? null;
}
