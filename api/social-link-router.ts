import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { socialLinks } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const socialLinkRouter = createRouter({
  list: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.userId, input.userId))
        .orderBy(socialLinks.sortOrder);
    }),

  create: authedQuery
    .input(z.object({
      platform: z.string().min(1),
      url: z.string().url(),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check max 4 links
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(socialLinks)
        .where(eq(socialLinks.userId, userId));

      if ((existing[0]?.count ?? 0) >= 4) {
        throw new Error("Maximum 4 social links allowed");
      }

      const result = await db.insert(socialLinks).values({
        userId,
        platform: input.platform,
        url: input.url,
        label: input.label,
        sortOrder: existing[0]?.count ?? 0,
      });

      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      platform: z.string().optional(),
      url: z.string().url().optional(),
      label: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [link] = await db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.id, input.id))
        .limit(1);

      if (!link || link.userId !== ctx.user.id) {
        throw new Error("Not authorized");
      }

      await db
        .update(socialLinks)
        .set({
          platform: input.platform ?? link.platform,
          url: input.url ?? link.url,
          label: input.label ?? link.label,
        })
        .where(eq(socialLinks.id, input.id));

      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [link] = await db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.id, input.id))
        .limit(1);

      if (!link || link.userId !== ctx.user.id) {
        throw new Error("Not authorized");
      }

      await db.delete(socialLinks).where(eq(socialLinks.id, input.id));
      return { success: true };
    }),

  reorder: authedQuery
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      for (let i = 0; i < input.ids.length; i++) {
        const [link] = await db
          .select()
          .from(socialLinks)
          .where(eq(socialLinks.id, input.ids[i]))
          .limit(1);

        if (link && link.userId === ctx.user.id) {
          await db
            .update(socialLinks)
            .set({ sortOrder: i })
            .where(eq(socialLinks.id, input.ids[i]));
        }
      }

      return { success: true };
    }),
});
