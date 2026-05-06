import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { scheduleSlots } from "../lib/planner";

const slotFields = {
  order: v.number(),
  timeBlock: v.string(),
  label: v.string(),
  kind: v.union(v.literal("session"), v.literal("break")),
};

async function findByClientId(ctx: MutationCtx, clientId: string) {
  return await ctx.db
    .query("slots")
    .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
    .unique();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const slots = await ctx.db.query("slots").collect();
    return slots.map((slot) => ({
      id: slot.clientId,
      order: slot.order,
      timeBlock: slot.timeBlock,
      label: slot.label,
      kind: slot.kind,
    }));
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("slots").take(1);
    if (existing.length > 0) return;

    for (const slot of scheduleSlots) {
      await ctx.db.insert("slots", {
        clientId: slot.id,
        order: slot.order,
        timeBlock: slot.timeBlock,
        label: slot.label,
        kind: slot.kind,
      });
    }
  },
});

export const create = mutation({
  args: {
    clientId: v.string(),
    ...slotFields,
  },
  handler: async (ctx, args) => {
    const existing = await findByClientId(ctx, args.clientId);
    if (existing) return existing._id;

    return await ctx.db.insert("slots", args);
  },
});

export const update = mutation({
  args: {
    clientId: v.string(),
    order: v.optional(v.number()),
    timeBlock: v.optional(v.string()),
    label: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("session"), v.literal("break"))),
  },
  handler: async (ctx, args) => {
    const { clientId, ...patch } = args;
    const slot = await findByClientId(ctx, clientId);
    if (!slot) return;

    await ctx.db.patch(slot._id, patch);
  },
});

export const resetToSeed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("slots").collect();
    for (const slot of existing) {
      await ctx.db.delete(slot._id);
    }

    for (const slot of scheduleSlots) {
      await ctx.db.insert("slots", {
        clientId: slot.id,
        order: slot.order,
        timeBlock: slot.timeBlock,
        label: slot.label,
        kind: slot.kind,
      });
    }
  },
});
