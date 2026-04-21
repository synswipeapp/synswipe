import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { avatars, users, ratings, reviews } from "@db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

export const leaderboardRouter = createRouter({
  top: publicQuery
    .input(z.object({
      period: z.enum(["week", "all"]).default("week"),
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const period = input?.period ?? "week";
      const limit = input?.limit ?? 20;

      // Build date filter for "week"
      const dateFilter = period === "week"
        ? gte(ratings.createdAt, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`)
        : undefined;

      // Get all public avatars with their creators
      const avatarData = await db
        .select({
          avatarId: avatars.id,
          creatorId: users.id,
          creatorName: users.name,
          creatorHandle: users.handle,
          creatorAvatar: users.avatar,
          imageUrl: avatars.imageUrl,
        })
        .from(avatars)
        .innerJoin(users, eq(avatars.creatorId, users.id))
        .where(and(eq(avatars.isPublic, true), eq(users.creatorMode, true)));

      // Calculate scores for each creator
      const creatorScores = new Map<number, {
        creatorId: number;
        creatorName: string;
        creatorHandle: string;
        creatorAvatar: string | null;
        imageUrl: string;
        fireVotes: number;
        reviewCount: number;
        avgRating: number;
        score: number;
      }>();

      for (const a of avatarData) {
        const baseWhere = dateFilter
          ? and(eq(ratings.avatarId, a.avatarId), eq(ratings.verdict, "fire"), dateFilter)
          : and(eq(ratings.avatarId, a.avatarId), eq(ratings.verdict, "fire"));

        const fireCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(ratings)
          .where(baseWhere);

        const reviewData = await db
          .select({
            count: sql<number>`count(*)`,
            avg: sql<number>`avg(${reviews.rating})`,
          })
          .from(reviews)
          .where(eq(reviews.avatarId, a.avatarId));

        const ratingValueData = await db
          .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
          .from(ratings)
          .where(eq(ratings.avatarId, a.avatarId));

        const fireVotes = fireCount[0]?.count ?? 0;
        const reviewCount = reviewData[0]?.count ?? 0;
        const reviewAvg = reviewData[0]?.avg ?? 0;
        const ratingValueAvg = ratingValueData[0]?.avg ?? 0;

        // Composite score: (fireVotes * 0.5) + (ratingValueAvg * 10 * 0.3) + (reviewAvg * 10 * 0.2)
        const score = (fireVotes * 0.5) + (ratingValueAvg * 10 * 0.3) + (reviewAvg * 10 * 0.2);

        const existing = creatorScores.get(a.creatorId);
        if (!existing || score > existing.score) {
          creatorScores.set(a.creatorId, {
            creatorId: a.creatorId,
            creatorName: a.creatorName ?? "Unknown",
            creatorHandle: a.creatorHandle ?? "",
            creatorAvatar: a.creatorAvatar,
            imageUrl: a.imageUrl,
            fireVotes,
            reviewCount,
            avgRating: Math.round((ratingValueAvg) * 10) / 10,
            score: Math.round(score * 10) / 10,
          });
        }
      }

      // Sort by score descending and limit
      const sorted = Array.from(creatorScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return sorted;
    }),

  myRank: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Check if user has creator mode and avatars
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.creatorMode) return null;

    const userAvatars = await db
      .select()
      .from(avatars)
      .where(and(eq(avatars.creatorId, userId), eq(avatars.isPublic, true)));

    if (userAvatars.length === 0) return null;

    // Calculate user's score
    let totalFireVotes = 0;
    let totalReviews = 0;
    let totalReviewRating = 0;
    let totalRatingValue = 0;

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

      totalFireVotes += fireCount[0]?.count ?? 0;
      totalReviews += reviewData[0]?.count ?? 0;
      totalReviewRating += reviewData[0]?.avg ?? 0;
      totalRatingValue += ratingValueData[0]?.avg ?? 0;
    }

    const avgRatingValue = userAvatars.length > 0 ? totalRatingValue / userAvatars.length : 0;
    const avgReviewRating = userAvatars.length > 0 ? totalReviewRating / userAvatars.length : 0;
    const score = Math.round((totalFireVotes * 0.5 + avgRatingValue * 10 * 0.3 + avgReviewRating * 10 * 0.2) * 10) / 10;

    // Get rank by counting creators with higher scores
    const allCreators = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.creatorMode, true));

    let rank = 1;
    for (const c of allCreators) {
      if (c.id === userId) continue;

      const creatorAvatars = await db
        .select()
        .from(avatars)
        .where(and(eq(avatars.creatorId, c.id), eq(avatars.isPublic, true)));

      let cFire = 0, cReviews = 0, cReviewRating = 0, cRatingValue = 0;
      for (const a of creatorAvatars) {
        const fc = await db.select({ count: sql<number>`count(*)` }).from(ratings).where(and(eq(ratings.avatarId, a.id), eq(ratings.verdict, "fire")));
        const rd = await db.select({ count: sql<number>`count(*)`, avg: sql<number>`avg(${reviews.rating})` }).from(reviews).where(eq(reviews.avatarId, a.id));
        const rv = await db.select({ avg: sql<number>`avg(${ratings.ratingValue})` }).from(ratings).where(eq(ratings.avatarId, a.id));
        cFire += fc[0]?.count ?? 0;
        cReviews += rd[0]?.count ?? 0;
        cReviewRating += rd[0]?.avg ?? 0;
        cRatingValue += rv[0]?.avg ?? 0;
      }

      const cAvgRatingValue = creatorAvatars.length > 0 ? cRatingValue / creatorAvatars.length : 0;
      const cAvgReviewRating = creatorAvatars.length > 0 ? cReviewRating / creatorAvatars.length : 0;
      const cScore = cFire * 0.5 + cAvgRatingValue * 10 * 0.3 + cAvgReviewRating * 10 * 0.2;
      if (cScore > score) rank++;
    }

    return { rank, score };
  }),
});
