// Picks the backend at build time. If VITE_CONVEX_URL is set in .env, we
// use the Convex adapter; otherwise we fall back to localStorage. Both
// USE_CONVEX and the picker constants are evaluated once at module load,
// so the hook-order rule is satisfied for the lifetime of the bundle.

import { useConvexDrawing, useConvexDrawingStore } from "./convex";
import { useLocalDrawing, useLocalDrawingStore } from "./local";
import type { DrawingStore } from "./types";

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
export const USE_CONVEX = Boolean(CONVEX_URL);
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const USE_CLERK = Boolean(CLERK_PUBLISHABLE_KEY);

export const useDrawingStore: () => DrawingStore = USE_CONVEX
  ? useConvexDrawingStore
  : useLocalDrawingStore;

export const useDrawing = USE_CONVEX ? useConvexDrawing : useLocalDrawing;

export type { Drawing, DrawingStore, DrawingSummary } from "./types";
