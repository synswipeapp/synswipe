import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { ratings, avatars, notifications } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

// ─── Rate Limiting ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export const ratingRouter = createRouter({
  submit: authedQuery
    .input(z.object({
      avatarId: z.number(),
      verdict: z.enum(["fire", "ice"]),
      ratingValue: z.number().min(1).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const voterId = ctx.user.id;

      // Rate limit: 100 ratings per user per hour
      if (!checkRateLimit(`rate:${voterId}`, 100, 60 * 60 * 1000)) {
        throw new Error("Rate limit exceeded. Try again later.");
      }

      // Check if already rated
      const [existing] = await db
        .select()
        .from(ratings)
        .where(and(eq(ratings.avatarId, input.avatarId), eq(ratings.voterId, voterId)))
        .limit(1);

      if (existing) {
        // Update existing rating
        await db
          .update(ratings)
          .set({
            verdict: input.verdict,
            ratingValue: input.ratingValue ?? existing.ratingValue,
          })
          .where(eq(ratings.id, existing.id));
      } else {
        // Create new rating
        await db.insert(ratings).values({
          avatarId: input.avatarId,
          voterId,
          verdict: input.verdict,
          ratingValue: input.ratingValue,
        });
      }

      // Get updated fire count
      const fireCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(eq(ratings.avatarId, input.avatarId), eq(ratings.verdict, "fire")));

      // Get average rating value
      const avgRating = await db
        .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
        .from(ratings)
        .where(eq(ratings.avatarId, input.avatarId));

      // Create notification for creator if "fire" vote
      if (input.verdict === "fire") {
        const [avatar] = await db
          .select()
          .from(avatars)
          .where(eq(avatars.id, input.avatarId))
          .limit(1);

        if (avatar && avatar.creatorId !== voterId) {
          await db.insert(notifications).values({
            userId: avatar.creatorId,
            type: "hot_vote", // keep type for backward compat
            message: `Someone rated your avatar FIRE ${input.ratingValue ? `(${input.ratingValue}/10)` : ""} 🔥`,
            relatedId: input.avatarId,
          });
        }
      }

      return {
        success: true,
        newFireCount: fireCount[0]?.count ?? 0,
        avgRating: Math.round((avgRating[0]?.avg ?? 0) * 10) / 10,
      };
    }),

  getMyRatings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    const myRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.voterId, ctx.user.id));

    const result: Record<number, { verdict: "fire" | "ice"; ratingValue?: number }> = {};
    for (const r of myRatings) {
      if (r.avatarId) {
        result[r.avatarId] = {
          verdict: r.verdict as "fire" | "ice",
          ratingValue: r.ratingValue ?? undefined,
        };
      }
    }
    return result;
  }),

  getStats: authedQuery
    .input(z.object({ avatarId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const fireCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(eq(ratings.avatarId, input.avatarId), eq(ratings.verdict, "fire")));

      const iceCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(eq(ratings.avatarId, input.avatarId), eq(ratings.verdict, "ice")));

      const avgRating = await db
        .select({ avg: sql<number>`avg(${ratings.ratingValue})` })
        .from(ratings)
        .where(eq(ratings.avatarId, input.avatarId));

      const fire = fireCount[0]?.count ?? 0;
      const ice = iceCount[0]?.count ?? 0;
      const total = fire + ice;

      return {
        fireCount: fire,
        iceCount: ice,
        firePercentage: total > 0 ? Math.round((fire / total) * 100) : 0,
        avgRating: Math.round((avgRating[0]?.avg ?? 0) * 10) / 10,
      };
    }),
});
