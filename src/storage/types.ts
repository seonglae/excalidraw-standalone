// Backend-agnostic shape used by the UI. Both the localStorage adapter and
// the Convex adapter expose a hook returning this same interface, so the
// UI doesn't care which one is wired up at build time.

export interface Drawing {
  _id: string;
  title: string;
  elements: string; // JSON-stringified excalidraw scene elements
  appState?: string; // JSON-stringified subset of excalidraw appState
  thumbnail?: string; // data:image/png base64
  createdAt: number;
  updatedAt: number;
}

export interface DrawingStore {
  // undefined while loading (Convex hooks return undefined initially).
  drawings: Drawing[] | undefined;
  // For the editor — undefined while loading, null when not found.
  getById: (id: string) => Drawing | null | undefined;
  create: (title?: string) => Promise<string>;
  update: (
    id: string,
    patch: { elements: string; appState?: string; thumbnail?: string },
  ) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
