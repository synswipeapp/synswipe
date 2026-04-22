import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { avatarViews, ratings, reviews, avatars } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const analyticsRouter = createRouter({
  trackView: authedQuery
    .input(z.object({
      avatarId: z.number(),
      source: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(avatarViews).values({
        avatarId: input.avatarId,
        viewerId: ctx.user.id,
        source: input.source ?? "discover",
      });
      return { success: true };
    }),

  myStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Get user's avatars
    const myAvatars = await db
      .select()
      .from(avatars)
      .where(eq(avatars.creatorId, userId));

    const avatarIds = myAvatars.map((a) => a.id);

    if (avatarIds.length === 0) {
      return {
        totalViews: 0,
        totalFire: 0,
        totalIce: 0,
        avgRating: 0,
        totalReviews: 0,
        topAvatars: [],
        dailyViews: [],
      };
    }

    // Total views
    const viewCounts = await db
      .select({ count: sql<number>`count(*)` })
      .from(avatarViews)
      .where(sql`${avatarViews.avatarId} IN (${avatarIds.join(",")})`);

    // Fire/Ice counts
    const fireCounts = await db
      .select({ count: sql<number>`count(*)` })
      .from(ratings)
      .where(and(sql`${ratings.avatarId} IN (${avatarIds.join(",")})`, eq(ratings.verdict, "fire")));

    const iceCounts = await db
      .select({ count: sql<number>`count(*)` })
      .from(ratings)
      .where(and(sql`${ratings.avatarId} IN (${avatarIds.join(",")})`, eq(ratings.verdict, "ice")));

    // Average rating
    const avgRatingResult = await db
      .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
      .from(ratings)
      .where(sql`${ratings.avatarId} IN (${avatarIds.join(",")})`);

    // Total reviews
    const reviewCounts = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(sql`${reviews.avatarId} IN (${avatarIds.join(",")})`);

    // Top avatars by fire votes
    const topAvatars = [];
    for (const avatar of myAvatars) {
      const fire = await db.select({ count: sql<number>`count(*)` }).from(ratings).where(and(eq(ratings.avatarId, avatar.id), eq(ratings.verdict, "fire")));
      const avg = await db.select({ avg: sql<number>`avg(${ratings.ratingValue})` }).from(ratings).where(eq(ratings.avatarId, avatar.id));
      const views = await db.select({ count: sql<number>`count(*)` }).from(avatarViews).where(eq(avatarViews.avatarId, avatar.id));
      topAvatars.push({
        id: avatar.id,
        imageUrl: avatar.imageUrl,
        caption: avatar.caption,
        fireVotes: fire[0]?.count ?? 0,
        avgRating: Math.round((avg[0]?.avg ?? 0) * 10) / 10,
        views: views[0]?.count ?? 0,
      });
    }
    topAvatars.sort((a, b) => b.fireVotes - a.fireVotes);

    // Daily views for last 7 days
    const dailyViews = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(avatarViews)
        .where(and(
          sql`${avatarViews.avatarId} IN (${avatarIds.join(",")})`,
          sql`DATE(${avatarViews.createdAt}) = ${dateStr}`
        ));
      dailyViews.push({ date: dateStr, count: count[0]?.count ?? 0 });
    }

    return {
      totalViews: viewCounts[0]?.count ?? 0,
      totalFire: fireCounts[0]?.count ?? 0,
      totalIce: iceCounts[0]?.count ?? 0,
      avgRating: Math.round((avgRatingResult[0]?.avg ?? 0) * 10) / 10,
      totalReviews: reviewCounts[0]?.count ?? 0,
      topAvatars: topAvatars.slice(0, 5),
      dailyViews,
    };
  }),
});
