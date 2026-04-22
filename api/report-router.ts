import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reports } from "@db/schema";

export const reportRouter = createRouter({
  create: publicQuery
    .input(z.object({
      avatarId: z.number(),
      reason: z.string().min(1),
      details: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db.insert(reports).values({
        avatarId: input.avatarId,
        reporterId: ctx.user?.id ?? null,
        reason: input.reason,
        details: input.details,
        status: "pending",
      });

      return { success: true };
    }),
});
