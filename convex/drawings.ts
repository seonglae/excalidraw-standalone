import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("drawings").withIndex("by_updatedAt").order("desc").collect();
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
