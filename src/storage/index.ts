// Picks the backend at build time. If VITE_CONVEX_URL is set in .env, we
// use the Convex adapter; otherwise we fall back to localStorage. Vite
// evaluates `import.meta.env.VITE_CONVEX_URL` at build time, so the unused
// adapter still ships in the bundle but is never imported's hooks called —
// for true tree-shaking, dynamic-import the convex path. Kept eager here
// for simpler types.

import { useConvexDrawingStore } from "./convex";
import { useLocalDrawingStore } from "./local";
import type { DrawingStore } from "./types";

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const USE_CONVEX = Boolean(CONVEX_URL);

export function useDrawingStore(): DrawingStore {
  // The two hooks must be called unconditionally per the Rules of Hooks. We
  // dispatch by `USE_CONVEX` and only return one — the React tree must
  // therefore wrap the Convex hook in a ConvexProvider OR not call it at
  // all. Since the picker switches at build time (USE_CONVEX is a constant
  // for the lifetime of the bundle), React's hook-order rule is satisfied:
  // every render uses the same branch.
  return USE_CONVEX ? useConvexDrawingStore() : useLocalDrawingStore();
}

export type { Drawing, DrawingStore } from "./types";
