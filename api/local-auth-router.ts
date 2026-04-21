import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { localUsers, passwordResets } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "avatarrate-local-secret-key-2024");

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "avatarrate-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateResetToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(z.object({
      username: z.string().min(3).max(100),
      password: z.string().min(6).max(100),
      displayName: z.string().max(255).optional(),
      handle: z.string().max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [existing] = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (existing) {
        throw new Error("Username already taken");
      }

      if (input.handle) {
        const [handleExists] = await db
          .select()
          .from(localUsers)
          .where(eq(localUsers.handle, input.handle))
          .limit(1);

        if (handleExists) {
          throw new Error("Handle already taken");
        }
      }

      const passwordHash = await hashPassword(input.password);

      const result = await db.insert(localUsers).values({
        username: input.username,
        passwordHash,
        displayName: input.displayName ?? input.username,
        handle: input.handle ?? input.username.toLowerCase().replace(/[^a-z0-9]/g, ""),
      });

      const userId = Number(result[0].insertId);
      const token = await createToken(userId);

      return { token, userId };
    }),

  login: publicQuery
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [user] = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (!user) {
        throw new Error("Invalid username or password");
      }

      const passwordHash = await hashPassword(input.password);
      if (user.passwordHash !== passwordHash) {
        throw new Error("Invalid username or password");
      }

      const token = await createToken(user.id);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.displayName ?? user.username,
          displayName: user.displayName,
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
    const [user] = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, userId))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      name: user.displayName ?? user.username,
      displayName: user.displayName,
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
        const [existing] = await db
          .select()
          .from(localUsers)
          .where(eq(localUsers.handle, input.handle))
          .limit(1);

        if (existing && existing.id !== userId) {
          throw new Error("Handle already taken");
        }
      }

      await db
        .update(localUsers)
        .set({
          displayName: input.name,
          bio: input.bio,
          handle: input.handle,
          creatorMode: input.creatorMode,
          avatar: input.avatar,
        })
        .where(eq(localUsers.id, userId));

      return { success: true };
    }),

  requestPasswordReset: publicQuery
    .input(z.object({
      username: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [user] = await db
        .select()
        .from(localUsers)
        .where(eq(localUsers.username, input.username))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      // Generate reset token
      const token = generateResetToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      await db.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt,
      });

      return { token, message: "Use this reset code to set a new password" };
    }),

  resetPassword: publicQuery
    .input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [reset] = await db
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.token, input.token),
            eq(passwordResets.used, false),
            gt(passwordResets.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!reset) {
        throw new Error("Invalid or expired reset code");
      }

      const passwordHash = await hashPassword(input.newPassword);

      await db
        .update(localUsers)
        .set({ passwordHash })
        .where(eq(localUsers.id, reset.userId));

      await db
        .update(passwordResets)
        .set({ used: true })
        .where(eq(passwordResets.id, reset.id));

      return { success: true, message: "Password updated successfully" };
    }),
});
