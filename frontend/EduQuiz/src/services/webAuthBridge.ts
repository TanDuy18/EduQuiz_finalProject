import { jwtDecode } from "jwt-decode";
import type { BackendUserDto, UserRole, WebAuthUser } from "../types/webAuth";
import { ApiError, apiFetch, tokenStore } from "../utils/api";

const REFRESH_TOKEN_KEY = "eq_refresh_token";

interface JwtPayload {
  sub?: string;
  role?: UserRole;
  exp?: number;
}

interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: BackendUserDto;
}

function toWebAuthUser(u: BackendUserDto): WebAuthUser {
  return {
    id: u.id,
    email: u.gmail,
    name: u.username,
    avatar: u.avatarUrl ?? undefined,
    role: u.role,
    packageOwned: u.packageOwned,
    endDatePackage: u.endDatePackage,
    freeAccess: u.freeAccess,
  };
}

export const refreshTokenStore = {
  get: () => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Ignore storage errors
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

/**
 * Non-intrusive bridge over existing authService/api.ts (0 edits to original Auth files).
 * Connects ALL real Backend AuthController endpoints:
 * - POST /api/v1/auth/login (username + password)
 * - POST /api/v1/auth/refresh (one-time refresh token rotation)
 * - POST /api/v1/auth/logout (server-side refresh token revocation)
 * - GET  /api/v1/auth/me (Single Source of Truth for user profile, role & package)
 */
export const webAuthBridge = {
  readRoleHintFromJwt(): UserRole | null {
    const token = tokenStore.get();
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.role === "ADMIN" || decoded.role === "LECTURER" || decoded.role === "USER") {
        return decoded.role;
      }
      return null;
    } catch {
      return null;
    }
  },

  async loginWithPassword(username: string, password: string): Promise<WebAuthUser> {
    const res = await apiFetch<BackendAuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
    tokenStore.set(res.accessToken);
    if (res.refreshToken) {
      refreshTokenStore.set(res.refreshToken);
    }
    return toWebAuthUser(res.user);
  },

  async refreshSession(): Promise<WebAuthUser | null> {
    const refreshToken = refreshTokenStore.get();
    if (!refreshToken) return null;
    try {
      const res = await apiFetch<BackendAuthResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      tokenStore.set(res.accessToken);
      if (res.refreshToken) {
        refreshTokenStore.set(res.refreshToken);
      }
      return toWebAuthUser(res.user);
    } catch {
      refreshTokenStore.clear();
      return null;
    }
  },

  async revokeServerSession(): Promise<void> {
    const refreshToken = refreshTokenStore.get();
    refreshTokenStore.clear();
    if (!refreshToken) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? "";
      await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort revocation when backend is unreachable
    }
  },

  async fetchFullProfile(): Promise<WebAuthUser | null> {
    if (!tokenStore.get()) return null;
    try {
      const u = await apiFetch<BackendUserDto>("/api/v1/auth/me");
      return toWebAuthUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && refreshTokenStore.get()) {
        const refreshed = await this.refreshSession();
        if (refreshed) return refreshed;
      }
      return null;
    }
  },
};
