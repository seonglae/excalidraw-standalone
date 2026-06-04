import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  drawings: defineTable({
    title: v.string(),
    elements: v.string(),
    appState: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    // Clerk subject (sub claim) when CLERK_ISSUER_URL is set on the
    // deployment. Undefined for anonymous-mode rows (no Clerk configured).
    // Queries filter by this column when Clerk is enabled so users only see
    // their own drawings.
    ownerId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_updatedAt", ["ownerId", "updatedAt"]),
});
