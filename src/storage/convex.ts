import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Drawing, DrawingStore } from "./types";

export function useConvexDrawingStore(): DrawingStore {
  const rows = useQuery(api.drawings.list);
  const createMut = useMutation(api.drawings.create);
  const updateMut = useMutation(api.drawings.update);
  const renameMut = useMutation(api.drawings.rename);
  const removeMut = useMutation(api.drawings.remove);

  const drawings = rows as Drawing[] | undefined;

  const create = useCallback<DrawingStore["create"]>(
    async (title) => {
      const id = await createMut({ title });
      return id as string;
    },
    [createMut],
  );

  const update = useCallback<DrawingStore["update"]>(
    async (id, patch) => {
      await updateMut({ id: id as Id<"drawings">, ...patch });
    },
    [updateMut],
  );

  const rename = useCallback<DrawingStore["rename"]>(
    async (id, title) => {
      await renameMut({ id: id as Id<"drawings">, title });
    },
    [renameMut],
  );

  const remove = useCallback<DrawingStore["remove"]>(
    async (id) => {
      await removeMut({ id: id as Id<"drawings"> });
    },
    [removeMut],
  );

  // Mirrors localStorage adapter: undefined while loading, null when missing.
  const getById = useCallback<DrawingStore["getById"]>(
    (id) => {
      if (drawings === undefined) return undefined;
      return drawings.find((d) => d._id === id) ?? null;
    },
    [drawings],
  );

  return { drawings, getById, create, update, rename, remove };
}
