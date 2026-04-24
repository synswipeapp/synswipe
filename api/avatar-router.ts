import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { avatars, users, ratings, reviews, socialLinks } from "@db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export const avatarRouter = createRouter({
  discover: publicQuery
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
      offset: z.number().min(0).default(0),
      style: z.enum(["photorealistic", "animated", "all"]).default("all"),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      const offset = input?.offset ?? 0;
      const style = input?.style ?? "all";

      const baseFilter = style !== "all"
        ? and(eq(avatars.isPublic, true), eq(users.creatorMode, true), eq(avatars.avatarStyle, style))
        : and(eq(avatars.isPublic, true), eq(users.creatorMode, true));

      const results = await db
        .select({
          id: avatars.id,
          imageUrl: avatars.imageUrl,
          caption: avatars.caption,
          tags: avatars.tags,
          qualityScore: avatars.qualityScore,
          avatarStyle: avatars.avatarStyle,
          createdAt: avatars.createdAt,
          creatorId: avatars.creatorId,
          creatorName: users.name,
          creatorHandle: users.handle,
          creatorAvatar: users.avatar,
          creatorBio: users.bio,
        })
        .from(avatars)
        .innerJoin(users, eq(avatars.creatorId, users.id))
        .where(baseFilter)
        .orderBy(desc(avatars.createdAt))
        .limit(limit)
        .offset(offset);

      // Get fire vote counts for each avatar
      const avatarIds = results.map((r) => r.id);
      const fireCounts = await db
        .select({ avatarId: ratings.avatarId, count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(inArray(ratings.avatarId, avatarIds), eq(ratings.verdict, "fire")))
        .groupBy(ratings.avatarId);

      const fireCountMap = new Map(fireCounts.map((h) => [h.avatarId, h.count]));

      // Get review counts
      const reviewCounts = await db
        .select({ avatarId: reviews.avatarId, count: sql<number>`count(*)` })
        .from(reviews)
        .where(inArray(reviews.avatarId, avatarIds))
        .groupBy(reviews.avatarId);

      const reviewCountMap = new Map(reviewCounts.map((r) => [r.avatarId, r.count]));

      return results.map((r) => ({
        ...r,
        fireVotes: fireCountMap.get(r.id) ?? 0,
        reviewCount: reviewCountMap.get(r.id) ?? 0,
      }));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const [avatar] = await db
        .select()
        .from(avatars)
        .where(eq(avatars.id, input.id))
        .limit(1);

      if (!avatar) return null;

      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, avatar.creatorId))
        .limit(1);

      const links = await db
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.userId, avatar.creatorId))
        .orderBy(socialLinks.sortOrder);

      const fireCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(ratings)
        .where(and(eq(ratings.avatarId, input.id), eq(ratings.verdict, "fire")));

      const reviewCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.avatarId, input.id));

      const avgRating = await db
        .select({ avg: sql<number>`avg(${reviews.rating})` })
        .from(reviews)
        .where(eq(reviews.avatarId, input.id));

      return {
        ...avatar,
        creator: creator ?? null,
        socialLinks: links,
        fireVotes: fireCount[0]?.count ?? 0,
        reviewCount: reviewCount[0]?.count ?? 0,
        rating: Math.round((avgRating[0]?.avg ?? 0) * 10) / 10,
      };
    }),

  upload: authedQuery
    .input(z.object({
      imageUrl: z.string().min(1),
      caption: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      avatarStyle: z.enum(["photorealistic", "animated"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check max 20 avatars per creator
      const existingCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(avatars)
        .where(eq(avatars.creatorId, userId));

      if ((existingCount[0]?.count ?? 0) >= 20) {
        throw new Error("Maximum 20 avatars allowed per creator");
      }

      const result = await db.insert(avatars).values({
        creatorId: userId,
        imageUrl: input.imageUrl,
        caption: input.caption,
        tags: input.tags ?? [],
        isPublic: input.isPublic ?? true,
        isPrimary: (existingCount[0]?.count ?? 0) === 0,
        avatarStyle: input.avatarStyle,
      });

      return { id: Number(result[0].insertId), imageUrl: input.imageUrl };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify ownership
      const [avatar] = await db
        .select()
        .from(avatars)
        .where(eq(avatars.id, input.id))
        .limit(1);

      if (!avatar || avatar.creatorId !== ctx.user.id) {
        throw new Error("Not authorized to delete this avatar");
      }

      await db.delete(avatars).where(eq(avatars.id, input.id));
      return { success: true };
    }),

  setPrimary: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const [avatar] = await db
        .select()
        .from(avatars)
        .where(eq(avatars.id, input.id))
        .limit(1);

      if (!avatar || avatar.creatorId !== ctx.user.id) {
        throw new Error("Not authorized");
      }

      // Unset current primary
      await db
        .update(avatars)
        .set({ isPrimary: false })
        .where(eq(avatars.creatorId, ctx.user.id));

      // Set new primary
      await db
        .update(avatars)
        .set({ isPrimary: true })
        .where(eq(avatars.id, input.id));

      return { success: true };
    }),

  getCreatorAvatars: publicQuery
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      return db
        .select()
        .from(avatars)
        .where(and(eq(avatars.creatorId, input.creatorId), eq(avatars.isPublic, true)))
        .orderBy(desc(avatars.createdAt));
    }),
})