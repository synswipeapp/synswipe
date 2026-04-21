import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions, localUsers } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";

export const subscriptionRouter = createRouter({
  status: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, new Date())
        )
      )
      .limit(1);

    // Also check local_users table for subscribed flag
    const [localUser] = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    // Support both OAuth and local auth
    const isSubscribed = !!sub || (localUser?.role === "admin");

    return {
      isSubscribed,
      subscription: sub ?? null,
      plan: sub?.plan ?? null,
      expiresAt: sub?.expiresAt ?? null,
    };
  }),

  create: authedQuery
    .input(z.object({
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if already subscribed
      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
          )
        )
        .limit(1);

      if (existing) {
        // Extend existing subscription
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        await db
          .update(subscriptions)
          .set({ expiresAt: newExpiry })
          .where(eq(subscriptions.id, existing.id));

        return { success: true, message: "Subscription extended" };
      }

      // Create new subscription — 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.insert(subscriptions).values({
        userId,
        status: "active",
        plan: "creator_monthly",
        price: "6.99",
        expiresAt,
      });

      return { success: true, message: "Subscription activated" };
    }),

  cancel: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    await db
      .update(subscriptions)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      );

    return { success: true };
  }),
});
