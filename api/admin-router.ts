import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, avatars, ratings, reviews, reports, localUsers, subscriptions } from "@db/schema";
import { eq, sql, desc } from "drizzle-orm";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [localUserCount] = await db.select({ count: sql<number>`count(*)` }).from(localUsers);
    const [avatarCount] = await db.select({ count: sql<number>`count(*)` }).from(avatars);
    const [ratingCount] = await db.select({ count: sql<number>`count(*)` }).from(ratings);
    const [reviewCount] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const [pendingReports] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending"));
    const [pendingAvatarsCount] = await db.select({ count: sql<number>`count(*)` }).from(avatars).where(eq(avatars.isApproved, false));
    const [subCount] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions);

    return {
      totalUsers: (userCount?.count ?? 0) + (localUserCount?.count ?? 0),
      totalAvatars: avatarCount?.count ?? 0,
      totalRatings: ratingCount?.count ?? 0,
      totalReviews: reviewCount?.count ?? 0,
      totalReports: reportCount?.count ?? 0,
      pendingReports: pendingReports?.count ?? 0,
      pendingAvatars: pendingAvatarsCount?.count ?? 0,
      activeSubscriptions: subCount?.count ?? 0,
    };
  }),

  users: adminQuery.query(async () => {
    const db = getDb();

    const oauthUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        handle: users.handle,
        role: users.role,
        creatorMode: users.creatorMode,
        createdAt: users.createdAt,
        source: sql<string>`'oauth'`,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const localUsersList = await db
      .select({
        id: localUsers.id,
        name: localUsers.displayName,
        email: localUsers.email,
        handle: localUsers.handle,
        role: localUsers.role,
        creatorMode: localUsers.creatorMode,
        createdAt: localUsers.createdAt,
        source: sql<string>`'local'`,
      })
      .from(localUsers)
      .orderBy(desc(localUsers.createdAt));

    return [...oauthUsers, ...localUsersList];
  }),

  avatars: adminQuery.query(async () => {
    const db = getDb();

    return db
      .select({
        id: avatars.id,
        creatorId: avatars.creatorId,
        imageUrl: avatars.imageUrl,
        caption: avatars.caption,
        isPublic: avatars.isPublic,
        avatarStyle: avatars.avatarStyle,
        createdAt: avatars.createdAt,
      })
      .from(avatars)
      .orderBy(desc(avatars.createdAt));
  }),

  reports: adminQuery.query(async () => {
    const db = getDb();

    return db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  }),

  updateReport: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(reports).set({ status: input.status }).where(eq(reports.id, input.id));
      return { success: true };
    }),

  toggleAvatarPublic: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [avatar] = await db.select().from(avatars).where(eq(avatars.id, input.id)).limit(1);
      if (!avatar) throw new Error("Avatar not found");
      await db.update(avatars).set({ isPublic: !avatar.isPublic }).where(eq(avatars.id, input.id));
      return { success: true, isPublic: !avatar.isPublic };
    }),

  deleteAvatar: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete ratings first
      await db.delete(ratings).where(eq(ratings.avatarId, input.id));
      // Delete reviews
      await db.delete(reviews).where(eq(reviews.avatarId, input.id));
      // Delete avatar
      await db.delete(avatars).where(eq(avatars.id, input.id));
      return { success: true };
    }),

  pendingAvatars: adminQuery.query(async () => {
    const db = getDb();

    return db
      .select({
        id: avatars.id,
        creatorId: avatars.creatorId,
        imageUrl: avatars.imageUrl,
        caption: avatars.caption,
        avatarStyle: avatars.avatarStyle,
        createdAt: avatars.createdAt,
        isApproved: avatars.isApproved,
      })
      .from(avatars)
      .where(eq(avatars.isApproved, false))
      .orderBy(desc(avatars.createdAt));
  }),

  approveAvatar: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(avatars).set({ isApproved: true }).where(eq(avatars.id, input.id));
      return { success: true };
    }),

  rejectAvatar: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Same as delete — remove the avatar entirely
      await db.delete(ratings).where(eq(ratings.avatarId, input.id));
      await db.delete(reviews).where(eq(reviews.avatarId, input.id));
      await db.delete(avatars).where(eq(avatars.id, input.id));
      return { success: true };
    }),
});
