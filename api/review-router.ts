import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { reviews, avatars, notifications, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const reviewRouter = createRouter({
  list: publicQuery
    .input(z.object({
      avatarId: z.number(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = getDb();

      return db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          text: reviews.text,
          createdAt: reviews.createdAt,
          reviewerName: users.name,
          reviewerAvatar: users.avatar,
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.avatarId, input.avatarId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: authedQuery
    .input(z.object({
      avatarId: z.number(),
      rating: z.number().min(1).max(5),
      text: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const result = await db.insert(reviews).values({
        avatarId: input.avatarId,
        reviewerId: ctx.user.id,
        rating: input.rating,
        text: input.text,
      });

      // Create notification for avatar creator
      const [avatar] = await db
        .select()
        .from(avatars)
        .where(eq(avatars.id, input.avatarId))
        .limit(1);

      if (avatar && avatar.creatorId !== ctx.user.id) {
        await db.insert(notifications).values({
          userId: avatar.creatorId,
          type: "review",
          message: `New review: '${input.text?.slice(0, 50) ?? "Rated your avatar"}'`,
          relatedId: Number(result[0].insertId),
        });
      }

      return { id: Number(result[0].insertId) };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, input.id))
        .limit(1);

      if (!review || review.reviewerId !== ctx.user.id) {
        throw new Error("Not authorized to delete this review");
      }

      await db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),
});
