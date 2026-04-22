import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers, passwordResets, emailVerifications, avatars, ratings, reviews, socialLinks, subscriptions, notifications } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from "./email-service";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "avatarrate-local-secret-key-2024");

// ─── Rate Limiting (in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// ─── Helpers ───
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "avatarrate-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyLocalToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload.userId as number;
  } catch {
    return null;
  }
}

// ─── Router ───
export const localAuthRouter = createRouter({
  register: publicQuery
    .input(z.object({
      username: z.string().min(3).max(100),
      password: z.string().min(6).max(100),
      displayName: z.string().max(255).optional(),
      handle: z.string().max(50).optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Rate limit: 5 registrations per IP per hour
      const ipKey = `register:${input.username}`;
      if (!checkRateLimit(ipKey, 5, 60 * 60 * 1000)) {
        throw new Error("Too many registration attempts. Try again later.");
      }

      // Check username
      const [existing] = await db.select().from(localUsers).where(eq(localUsers.username, input.username)).limit(1);
      if (existing) throw new Error("Username already taken");

      // Check handle
      if (input.handle) {
        const [handleExists] = await db.select().from(localUsers).where(eq(localUsers.handle, input.handle)).limit(1);
        if (handleExists) throw new Error("Handle already taken");
      }

      // Check email
      if (input.email) {
        const [emailExists] = await db.select().from(localUsers).where(eq(localUsers.email, input.email)).limit(1);
        if (emailExists) throw new Error("Email already in use");
      }

      const passwordHash = await hashPassword(input.password);

      const result = await db.insert(localUsers).values({
        username: input.username,
        email: input.email,
        emailVerified: !input.email, // verified if no email provided
        passwordHash,
        displayName: input.displayName ?? input.username,
        handle: input.handle ?? input.username.toLowerCase().replace(/[^a-z0-9]/g, ""),
      });

      const userId = Number(result[0].insertId);

      // Send email verification if email provided
      let verificationCode: string | undefined;
      if (input.email) {
        verificationCode = generateCode(6);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(emailVerifications).values({
          userId,
          email: input.email,
          code: verificationCode,
          expiresAt,
        });

        // Send verification email via SendGrid
        await sendVerificationEmail(input.email, input.username, verificationCode);
      }

      // Send welcome email
      if (input.email) {
        await sendWelcomeEmail(input.email, input.displayName ?? input.username);
      }

      const token = await createToken(userId);

      return { token, userId, emailVerificationCode: verificationCode };
    }),

  login: publicQuery
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Rate limit: 10 login attempts per username per hour
      const rateKey = `login:${input.username}`;
      if (!checkRateLimit(rateKey, 10, 60 * 60 * 1000)) {
        throw new Error("Too many login attempts. Try again later.");
      }

      const [user] = await db.select().from(localUsers).where(eq(localUsers.username, input.username)).limit(1);
      if (!user) throw new Error("Invalid username or password");

      const passwordHash = await hashPassword(input.password);
      if (user.passwordHash !== passwordHash) throw new Error("Invalid username or password");

      const token = await createToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.displayName ?? user.username,
          displayName: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          handle: user.handle,
          creatorMode: user.creatorMode,
          bio: user.bio,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-local-auth-token");
    if (!authHeader) return null;

    const userId = await verifyLocalToken(authHeader);
    if (!userId) return null;

    const db = getDb();
    const [user] = await db.select().from(localUsers).where(eq(localUsers.id, userId)).limit(1);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      name: user.displayName ?? user.username,
      displayName: user.displayName,
      email: user.email,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      handle: user.handle,
      creatorMode: user.creatorMode,
      bio: user.bio,
      role: user.role,
    };
  }),

  updateProfile: publicQuery
    .input(z.object({
      name: z.string().max(255).optional(),
      bio: z.string().max(500).optional(),
      handle: z.string().max(50).optional(),
      creatorMode: z.boolean().optional(),
      avatar: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token");
      if (!authHeader) throw new Error("Not authenticated");

      const userId = await verifyLocalToken(authHeader);
      if (!userId) throw new Error("Invalid token");

      const db = getDb();

      if (input.handle) {
        const [existing] = await db.select().from(localUsers).where(eq(localUsers.handle, input.handle)).limit(1);
        if (existing && existing.id !== userId) throw new Error("Handle already taken");
      }

      await db.update(localUsers).set({
        displayName: input.name,
        bio: input.bio,
        handle: input.handle,
        creatorMode: input.creatorMode,
        avatar: input.avatar,
      }).where(eq(localUsers.id, userId));

      return { success: true };
    }),

  // ─── Email Verification ───
  verifyEmail: publicQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [record] = await db
        .select()
        .from(emailVerifications)
        .where(and(eq(emailVerifications.code, input.code), eq(emailVerifications.verified, false), gt(emailVerifications.expiresAt, new Date())))
        .limit(1);

      if (!record) throw new Error("Invalid or expired verification code");

      // Mark email as verified
      await db.update(localUsers).set({ emailVerified: true }).where(eq(localUsers.id, record.userId));
      await db.update(emailVerifications).set({ verified: true }).where(eq(emailVerifications.id, record.id));

      return { success: true };
    }),

  resendVerification: publicQuery
    .mutation(async ({ ctx }) => {
      const authHeader = ctx.req.headers.get("x-local-auth-token");
      if (!authHeader) throw new Error("Not authenticated");

      const userId = await verifyLocalToken(authHeader);
      if (!userId) throw new Error("Invalid token");

      const db = getDb();
      const [user] = await db.select().from(localUsers).where(eq(localUsers.id, userId)).limit(1);
      if (!user || !user.email || user.emailVerified) throw new Error("No email to verify");

      // Rate limit: 3 resends per hour
      if (!checkRateLimit(`resend:${userId}`, 3, 60 * 60 * 1000)) {
        throw new Error("Too many resend attempts. Try again later.");
      }

      const code = generateCode(6);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.insert(emailVerifications).values({ userId, email: user.email, code, expiresAt });

      // Send verification email via SendGrid
      await sendVerificationEmail(user.email, user.username, code);

      return { success: true };
    }),

  // ─── Password Reset ───
  requestPasswordReset: publicQuery
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Rate limit: 3 requests per hour
      if (!checkRateLimit(`pwdreset:${input.username}`, 3, 60 * 60 * 1000)) {
        throw new Error("Too many reset attempts. Try again later.");
      }

      const [user] = await db.select().from(localUsers).where(eq(localUsers.username, input.username)).limit(1);
      if (!user) throw new Error("User not found");

      const token = generateCode(8);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await db.insert(passwordResets).values({ userId: user.id, token, expiresAt });

      // Send password reset email via SendGrid
      if (user.email) {
        await sendPasswordResetEmail(user.email, user.username, token);
      }

      return { token, message: "Check your email for the reset code" };
    }),

  resetPassword: publicQuery
    .input(z.object({ token: z.string().min(1), newPassword: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [reset] = await db
        .select()
        .from(passwordResets)
        .where(and(eq(passwordResets.token, input.token), eq(passwordResets.used, false), gt(passwordResets.expiresAt, new Date())))
        .limit(1);

      if (!reset) throw new Error("Invalid or expired reset code");

      const passwordHash = await hashPassword(input.newPassword);
      await db.update(localUsers).set({ passwordHash }).where(eq(localUsers.id, reset.userId));
      await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, reset.id));

      return { success: true, message: "Password updated successfully" };
    }),

  // ─── Delete Account ───
  deleteAccount: publicQuery.mutation(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-local-auth-token");
    if (!authHeader) throw new Error("Not authenticated");

    const userId = await verifyLocalToken(authHeader);
    if (!userId) throw new Error("Invalid token");

    const db = getDb();

    // Delete all user data in order (respecting foreign keys)
    // 1. Get user's avatars
    const userAvatars = await db.select().from(avatars).where(eq(avatars.creatorId, userId));
    const avatarIds = userAvatars.map((a) => a.id);

    // 2. Delete ratings on user's avatars
    if (avatarIds.length > 0) {
      for (const aid of avatarIds) {
        await db.delete(ratings).where(eq(ratings.avatarId, aid));
      }
    }

    // 3. Delete user's own ratings
    await db.delete(ratings).where(eq(ratings.voterId, userId));

    // 4. Delete reviews on user's avatars
    if (avatarIds.length > 0) {
      for (const aid of avatarIds) {
        await db.delete(reviews).where(eq(reviews.avatarId, aid));
      }
    }

    // 5. Delete user's own reviews
    await db.delete(reviews).where(eq(reviews.reviewerId, userId));

    // 6. Delete social links
    await db.delete(socialLinks).where(eq(socialLinks.userId, userId));

    // 7. Delete subscriptions
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

    // 8. Delete notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 9. Delete password resets
    await db.delete(passwordResets).where(eq(passwordResets.userId, userId));

    // 10. Delete email verifications
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, userId));

    // 11. Delete avatars
    await db.delete(avatars).where(eq(avatars.creatorId, userId));

    // 12. Finally delete the user
    await db.delete(localUsers).where(eq(localUsers.id, userId));

    return { success: true };
  }),
});
