import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

// Per-field size caps. Convex's per-doc limit is 1 MiB; these guards stop
// runaway clients from saturating bandwidth long before they hit that.
const MAX_ELEMENTS_BYTES = 512_000;
const MAX_APPSTATE_BYTES = 32_000;
const MAX_THUMBNAIL_BYTES = 64_000;

function assertSize(name: string, val: string | undefined, limit: number) {
  if (val !== undefined && val.length > limit) {
    throw new Error(`${name} too large: ${val.length}B exceeds ${limit}B cap`);
  }
}

// True when the deployment has Clerk configured. Functions use this to
// decide whether anonymous (ownerId = undefined) access is allowed.
const CLERK_ENABLED = Boolean(process.env.CLERK_ISSUER_URL);

// Resolve the caller's ownerId. When Clerk is enabled but no identity is
// present the request is rejected. When Clerk is off, returns undefined
// and the function operates in anonymous shared-bucket mode.
async function resolveOwner(ctx: QueryCtx | MutationCtx): Promise<string | undefined> {
  const identity = await ctx.auth.getUserIdentity();
  if (CLERK_ENABLED && !identity) {
    throw new Error("Authentication required");
  }
  return identity?.subject;
}

// Reject reads/writes against a drawing the caller does not own. Anonymous
// drawings (ownerId undefined) are accessible to anonymous callers only.
async function assertOwnership(
  ctx: QueryCtx | MutationCtx,
  rowOwnerId: string | undefined,
): Promise<void> {
  const owner = await resolveOwner(ctx);
  if (owner !== rowOwnerId) {
    throw new Error("Not found");
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const owner = await resolveOwner(ctx);
    const rows = owner
      ? await ctx.db
          .query("drawings")
          .withIndex("by_owner_updatedAt", (q) => q.eq("ownerId", owner))
          .order("desc")
          .collect()
      : await ctx.db
          .query("drawings")
          .withIndex("by_owner_updatedAt", (q) => q.eq("ownerId", undefined))
          .order("desc")
          .collect();
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
    const row = await ctx.db.get(args.id);
    if (!row) return null;
    await assertOwnership(ctx, row.ownerId);
    return row;
  },
});

export const create = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const owner = await resolveOwner(ctx);
    const now = Date.now();
    return await ctx.db.insert("drawings", {
      title: args.title ?? "Untitled",
      elements: "[]",
      ...(owner ? { ownerId: owner } : {}),
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
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Not found");
    await assertOwnership(ctx, row.ownerId);
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
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Not found");
    await assertOwnership(ctx, row.ownerId);
    await ctx.db.patch(args.id, { title: args.title, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("drawings") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return;
    await assertOwnership(ctx, row.ownerId);
    await ctx.db.delete(args.id);
  },
});
