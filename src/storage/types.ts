// Backend-agnostic shapes. The list view never needs the heavy elements
// blob, so it consumes the lightweight summary. The editor pulls the full
// drawing on demand via useDrawing(id).

export interface DrawingSummary {
  _id: string;
  title: string;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Drawing extends DrawingSummary {
  elements: string; // JSON-stringified excalidraw scene elements
  appState?: string; // JSON-stringified subset of excalidraw appState
}

export interface DrawingStore {
  // undefined while loading (Convex hooks return undefined initially).
  drawings: DrawingSummary[] | undefined;
  create: (title?: string) => Promise<string>;
  update: (
    id: string,
    patch: { elements: string; appState?: string; thumbnail?: string },
  ) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
