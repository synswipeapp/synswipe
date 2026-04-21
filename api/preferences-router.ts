import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userPreferences } from "@db/schema";
import { eq } from "drizzle-orm";

export const preferencesRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const [pref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.user.id))
      .limit(1);

    return {
      preferredStyle: pref?.preferredStyle ?? "all",
    };
  }),

  set: authedQuery
    .input(z.object({
      preferredStyle: z.enum(["photorealistic", "animated", "all"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(userPreferences)
          .set({ preferredStyle: input.preferredStyle })
          .where(eq(userPreferences.id, existing.id));
      } else {
        await db.insert(userPreferences).values({
          userId: ctx.user.id,
          preferredStyle: input.preferredStyle,
        });
      }

      return { success: true };
    }),
});
