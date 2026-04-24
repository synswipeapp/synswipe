import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export interface UnifiedUser {
  id: number;
  name: string;
  email?: string | null;
  emailVerified?: boolean;
  avatar?: string | null;
  role: string;
  creatorMode?: boolean;
  bio?: string | null;
  handle?: string | null;
}

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: oauthUser,
    isLoading: oauthLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: localUser,
    isLoading: localLoading,
  } = trpc.localAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !oauthUser,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("local_auth_token");
    logoutMutation.mutate();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [logoutMutation]);

  const user: UnifiedUser | null = useMemo(() => {
    if (oauthUser) {
      return {
        id: oauthUser.id,
        name: oauthUser.name ?? "User",
        email: oauthUser.email,
        emailVerified: true,
        avatar: oauthUser.avatar,
        role: oauthUser.role,
        creatorMode: oauthUser.creatorMode ?? false,
        bio: oauthUser.bio,
        handle: oauthUser.handle,
      };
    }
    if (localUser) {
      return {
        id: localUser.id,
        name: localUser.name ?? localUser.username ?? "User",
        email: localUser.email,
        emailVerified: localUser.emailVerified ?? false,
        avatar: localUser.avatar,
        role: localUser.role,
        creatorMode: localUser.creatorMode ?? false,
        bio: localUser.bio,
        handle: localUser.handle,
      };
    }
    return null;
  }, [oauthUser, localUser]);

  const isLoading = oauthLoading || (localLoading && !oauthUser);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === "admin",
      logout,
      refresh: () => utils.invalidate(),
    }),
    [user, isLoading, logout, utils],
  );
}
