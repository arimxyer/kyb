import { v } from "convex/values";

import { query } from "./_generated/server";

export const check = query({
  args: {},
  returns: v.object({
    status: v.literal("ok"),
    storage: v.literal("convex"),
    schemaVersion: v.number(),
  }),
  handler: async () => ({
    status: "ok" as const,
    storage: "convex" as const,
    schemaVersion: 1,
  }),
});
