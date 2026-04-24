import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifyLocalToken } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { localUsers } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth not available, try local auth
  }

  // Fall back to local auth token
  if (!ctx.user) {
    try {
      const localToken = opts.req.headers.get("x-local-auth-token");
      if (localToken) {
        const userId = await verifyLocalToken(localToken);
        if (userId) {
          const db = getDb();
          const [user] = await db
            .select()
            .from(localUsers)
            .where(eq(localUsers.id, userId))
            .limit(1);
          if (user) {
            ctx.user = {
              id: user.id,
              name: user.displayName ?? user.username,
              email: user.email,
              avatar: user.avatar,
              role: user.role,
              creatorMode: user.creatorMode ?? false,
              unionId: null,
              createdAt: user.createdAt,
            } as User;
          }
        }
      }
    } catch {
      // Local auth not available
    }
  }

  return ctx;
}
