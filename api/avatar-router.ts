import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { avatars, users, localUsers, ratings, reviews, socialLinks } from "@db/schema";
import { eq, and, desc, sql, inArray, isNull, or } from "drizzle-orm";

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

      // Build style filter
      const styleFilter = style !== "all" ? eq(avatars.avatarStyle, style) : undefined;

      // Get avatars that are public and have a creator (either OAuth or local)
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
          creatorName: sql<string>`COALESCE(${users.name}, ${localUsers.displayName}, ${localUsers.username}, 'Unknown')`,
          creatorHandle: sql<string>`COALESCE(${users.handle}, ${localUsers.handle}, '')`,
          creatorAvatar: sql<string | null>`COALESCE(${users.avatar}, ${localUsers.avatar})`,
          creatorBio: sql<string | null>`COALESCE(${users.bio}, ${localUsers.bio})`,
        })
        .from(avatars)
        .leftJoin(users, eq(avatars.creatorId, users.id))
        .leftJoin(localUsers, eq(avatars.creatorId, localUsers.id))
        .where(and(
          eq(avatars.isPublic, true),
          eq(avatars.isApproved, true),
          styleFilter,
        ))
        .orderBy(desc(avatars.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch social links for each avatar's creator
      const socialLinksMap = new Map<number, { platform: string; url: string }[]>();
      for (const avatar of results) {
        const links = await db
          .select({ platform: socialLinks.platform, url: socialLinks.url })
          .from(socialLinks)
          .where(eq(socialLinks.userId, avatar.creatorId))
          .orderBy(socialLinks.sortOrder);
        socialLinksMap.set(avatar.id, links);
      }

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
        socialLinks: socialLinksMap.get(r.id) ?? [],
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
        isApproved: false, // Requires admin approval before going live
      });

      // Auto-enable creator mode on first upload (try both tables)
      if ((existingCount[0]?.count ?? 0) === 0) {
        await db.update(users).set({ creatorMode: true }).where(eq(users.id, userId));
        await db.update(localUsers).set({ creatorMode: true }).where(eq(localUsers.id, userId));
      }

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