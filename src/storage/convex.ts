import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { DrawingStore } from "./types";

export function useConvexDrawingStore(): DrawingStore {
  const drawings = useQuery(api.drawings.list);
  const createMut = useMutation(api.drawings.create);
  const updateMut = useMutation(api.drawings.update);
  const renameMut = useMutation(api.drawings.rename);
  const removeMut = useMutation(api.drawings.remove);

  const create = useCallback<DrawingStore["create"]>(
    async (title) => {
      const id = await createMut({ title });
      return id;
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

  return { drawings, create, update, rename, remove };
}

export function useConvexDrawing(id: string) {
  return useQuery(api.drawings.getById, { id: id as Id<"drawings"> });
}
