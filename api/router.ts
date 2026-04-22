import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { avatarRouter } from "./avatar-router";
import { ratingRouter } from "./rating-router";
import { leaderboardRouter } from "./leaderboard-router";
import { reviewRouter } from "./review-router";
import { socialLinkRouter } from "./social-link-router";
import { creatorRouter } from "./creator-router";
import { notificationRouter } from "./notification-router";
import { aiRouter } from "./ai-router";
import { subscriptionRouter } from "./subscription-router";
import { preferencesRouter } from "./preferences-router";
import { stripeRouter } from "./stripe-router";
import { uploadRouter } from "./upload-router";
import { reportRouter } from "./report-router";
import { analyticsRouter } from "./analytics-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  avatar: avatarRouter,
  rating: ratingRouter,
  leaderboard: leaderboardRouter,
  review: reviewRouter,
  socialLink: socialLinkRouter,
  creator: creatorRouter,
  notification: notificationRouter,
  ai: aiRouter,
  subscription: subscriptionRouter,
  preferences: preferencesRouter,
  stripe: stripeRouter,
  upload: uploadRouter,
  report: reportRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
