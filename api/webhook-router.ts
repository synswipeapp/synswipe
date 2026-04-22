import { Hono } from "hono";
import { getDb } from "./queries/connection";
import { subscriptions } from "@db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Raw Hono route for Stripe webhooks (not tRPC — needs raw body)
export const webhookRouter = new Hono();

webhookRouter.post("/stripe", async (c) => {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-03-25.dahlia" });

  // Get the raw body as text for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header("stripe-signature");

  if (!signature) {
    return c.json({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.client_reference_id
      ? parseInt(session.client_reference_id)
      : null;

    if (!userId) {
      console.error("[Stripe Webhook] No client_reference_id in session");
      return c.json({ error: "Missing user reference" }, 400);
    }

    const db = getDb();

    // Check if subscription already exists (avoid duplicates)
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    if (existing) {
      // Extend existing subscription
      await db
        .update(subscriptions)
        .set({
          status: "active",
          expiresAt,
          price: "6.99",
          plan: "creator_monthly",
        })
        .where(eq(subscriptions.id, existing.id));
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        userId,
        status: "active",
        plan: "creator_monthly",
        price: "6.99",
        startedAt: now,
        expiresAt,
      });
    }

    console.log(`[Stripe Webhook] Subscription activated for user ${userId}`);
    return c.json({ received: true, activated: true });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId
      ? parseInt(subscription.metadata.userId)
      : null;

    if (userId) {
      const db = getDb();
      await db
        .update(subscriptions)
        .set({ status: "cancelled" })
        .where(eq(subscriptions.userId, userId));

      console.log(`[Stripe Webhook] Subscription cancelled for user ${userId}`);
    }

    return c.json({ received: true, cancelled: true });
  }

  // Acknowledge all other events
  return c.json({ received: true });
});

