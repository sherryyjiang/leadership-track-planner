import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { seededSessions } from "../lib/planner";

const sessionFields = {
  slotId: v.string(),
  order: v.number(),
  sessionName: v.string(),
  company: v.string(),
  speaker: v.string(),
  details: v.string(),
  source: v.union(v.literal("seed"), v.literal("user")),
};

async function findByClientId(ctx: MutationCtx, clientId: string) {
  return await ctx.db
    .query("sessions")
    .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
    .unique();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map((session) => ({
      id: session.clientId,
      slotId: session.slotId,
      order: session.order,
      sessionName: session.sessionName,
      company: session.company,
      speaker: session.speaker,
      details: session.details,
      source: session.source,
    }));
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    for (const session of seededSessions) {
      const existing = await findByClientId(ctx, session.id);
      if (existing) continue;

      await ctx.db.insert("sessions", {
        clientId: session.id,
        slotId: session.slotId,
        order: session.order,
        sessionName: session.sessionName,
        company: session.company,
        speaker: session.speaker,
        details: session.details,
        source: session.source,
      });
    }
  },
});

export const create = mutation({
  args: {
    clientId: v.string(),
    ...sessionFields,
  },
  handler: async (ctx, args) => {
    const existing = await findByClientId(ctx, args.clientId);
    if (existing) return existing._id;

    return await ctx.db.insert("sessions", args);
  },
});

export const update = mutation({
  args: {
    clientId: v.string(),
    slotId: v.optional(v.string()),
    order: v.optional(v.number()),
    sessionName: v.optional(v.string()),
    company: v.optional(v.string()),
    speaker: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clientId, ...patch } = args;
    const session = await findByClientId(ctx, clientId);
    if (!session) return;

    await ctx.db.patch(session._id, patch);
  },
});

export const remove = mutation({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, { clientId }) => {
    const session = await findByClientId(ctx, clientId);
    if (!session) return;

    await ctx.db.delete(session._id);
  },
});

export const resetToSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("sessions").collect();
    for (const session of existing) {
      await ctx.db.delete(session._id);
    }

    for (const session of seededSessions) {
      await ctx.db.insert("sessions", {
        clientId: session.id,
        slotId: session.slotId,
        order: session.order,
        sessionName: session.sessionName,
        company: session.company,
        speaker: session.speaker,
        details: session.details,
        source: session.source,
      });
    }
  },
});
