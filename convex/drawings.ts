import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Per-field size caps. Convex's per-doc limit is 1 MiB; these guards stop
// runaway clients from saturating bandwidth long before they hit that.
const MAX_ELEMENTS_BYTES = 512_000; // ~1000 shapes comfortably
const MAX_APPSTATE_BYTES = 32_000;
const MAX_THUMBNAIL_BYTES = 64_000;

function assertSize(name: string, val: string | undefined, limit: number) {
  if (val !== undefined && val.length > limit) {
    throw new Error(`${name} too large: ${val.length}B exceeds ${limit}B cap`);
  }
}

// List returns lightweight summaries only — title / thumbnail / timestamps.
// The full elements + appState blob loads on demand via getById when the
// editor opens that drawing. Keeps the list query bandwidth-bounded as
// the drawing count grows.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("drawings").withIndex("by_updatedAt").order("desc").collect();
    return rows.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      title: r.title,
      thumbnail: r.thumbnail,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },
});

export const getById = query({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      title: args.title ?? "Untitled",
      elements: "[]",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("drawings"),
    elements: v.string(),
    appState: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertSize("elements", args.elements, MAX_ELEMENTS_BYTES);
    assertSize("appState", args.appState, MAX_APPSTATE_BYTES);
    assertSize("thumbnail", args.thumbnail, MAX_THUMBNAIL_BYTES);
    await ctx.db.patch(args.id, {
      elements: args.elements,
      ...(args.appState !== undefined ? { appState: args.appState } : {}),
      ...(args.thumbnail !== undefined ? { thumbnail: args.thumbnail } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const rename = mutation({
  args: { id: v.id("drawings"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
