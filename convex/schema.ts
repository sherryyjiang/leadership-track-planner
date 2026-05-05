import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  messages: defineTable({
    author: v.string(),
    body: v.string(),
  }),
  sessions: defineTable({
    clientId: v.string(),
    slotId: v.string(),
    order: v.number(),
    sessionName: v.string(),
    company: v.string(),
    speaker: v.string(),
    details: v.string(),
    source: v.union(v.literal("seed"), v.literal("user")),
  }).index("by_client_id", ["clientId"]),
});
