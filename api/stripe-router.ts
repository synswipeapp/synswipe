import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { subscriptions } from "@db/schema";
import { eq, and } from "drizzle-orm";

// Stripe checkout flow
export const stripeRouter = createRouter({
  createCheckoutSession: authedQuery
    .input(z.object({
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error("Stripe is not configured");
      }

      const stripePriceId = process.env.STRIPE_PRICE_ID;
      if (!stripePriceId) {
        throw new Error("Stripe price ID is not configured");
      }

      // Dynamically import stripe to avoid bundling issues
      const { default: Stripe } = await import("stripe");
      const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-03-25.dahlia" });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: String(ctx.user.id),
        subscription_data: {
          metadata: {
            userId: String(ctx.user.id),
          },
        },
      });

      return { url: session.url };
    }),

  // Check if user has active subscription (used after redirect from Stripe)
  verifySubscription: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    return { isSubscribed: !!sub };
  }),
});
