import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, avatars, ratings, reviews, socialLinks } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const creatorRouter = createRouter({
  getProfile: publicQuery
    .input(z.object({
      handle: z.string().optional(),
      userId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();

      if (!input.handle && !input.userId) {
        throw new Error("Must provide handle or userId");
      }

      const whereClause = input.handle
        ? eq(users.handle, input.handle)
        : eq(users.id, input.userId!);

      const [user] = await db
        .select()
        .from(users)
        .where(whereClause)
        .limit(1);

      if (!user) return null;

      // Get user's avatars
      const userAvatars = await db
        .select()
        .from(avatars)
        .where(and(eq(avatars.creatorId, user.id), eq(avatars.isPublic, true)))
        .orderBy(sql`${avatars.isPrimary} DESC, ${avatars.createdAt} DESC`);

      // Get social links
      const links = await db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.userId, user.id))
        .orderBy(socialLinks.sortOrder);

      // Calculate stats
      let fireVotes = 0;
      let reviewCount = 0;
      let totalRating = 0;

      for (const a of userAvatars) {
        const fireCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(ratings)
          .where(and(eq(ratings.avatarId, a.id), eq(ratings.verdict, "fire")));

        const reviewData = await db
          .select({
            count: sql<number>`count(*)`,
            avg: sql<number>`avg(${reviews.rating})`,
          })
          .from(reviews)
          .where(eq(reviews.avatarId, a.id));

        const ratingValueData = await db
          .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
          .from(ratings)
          .where(eq(ratings.avatarId, a.id));

        fireVotes += fireCount[0]?.count ?? 0;
        reviewCount += reviewData[0]?.count ?? 0;
        totalRating += ratingValueData[0]?.avg ?? 0;
      }

      const avgRating = userAvatars.length > 0
        ? Math.round((totalRating / userAvatars.length) * 10) / 10
        : 0;

      return {
        ...user,
        avatars: userAvatars,
        socialLinks: links,
        stats: {
          fireVotes,
          reviews: reviewCount,
          rating: avgRating,
        },
      };
    }),

  updateProfile: authedQuery
    .input(z.object({
      name: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      handle: z.string().max(50).optional(),
      creatorMode: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check handle uniqueness if changing
      if (input.handle) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.handle, input.handle))
          .limit(1);

        if (existing && existing.id !== userId) {
          throw new Error("Handle already taken");
        }
      }

      await db
        .update(users)
        .set({
          name: input.name,
          bio: input.bio,
          handle: input.handle,
          creatorMode: input.creatorMode,
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const userAvatars = await db
      .select()
      .from(avatars)
      .where(eq(avatars.creatorId, userId));

    let fireVotes = 0;
    let reviewCount = 0;
    let totalRating = 0;

    for (const a of userAvatars) {
      const fireCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(eq(ratings.avatarId, a.id), eq(ratings.verdict, "fire")));

      const reviewData = await db
        .select({
          count: sql<number>`count(*)`,
          avg: sql<number>`avg(${reviews.rating})`,
        })
        .from(reviews)
        .where(eq(reviews.avatarId, a.id));

      const ratingValueData = await db
        .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
        .from(ratings)
        .where(eq(ratings.avatarId, a.id));

      fireVotes += fireCount[0]?.count ?? 0;
      reviewCount += reviewData[0]?.count ?? 0;
      totalRating += ratingValueData[0]?.avg ?? 0;
    }

    const avgRating = userAvatars.length > 0
      ? Math.round((totalRating / userAvatars.length) * 10) / 10
      : 0;

    return {
      fireVotes,
      profileViews: 0,
      avgRating,
      linkClicks: 0,
      avatarCount: userAvatars.length,
    };
  }),
});
