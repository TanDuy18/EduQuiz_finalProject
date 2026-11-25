import type { AuthUser } from "./auth";

export type UserRole = "USER" | "LECTURER" | "ADMIN";

export type PackageOwned = "FREE" | "ONE_WEEK" | "ONE_MONTH" | "ONE_YEAR";

export type DemoRoleOverride = "NONE" | "USER" | "ADMIN";

/** Mirrors Backend UserDto.java without modifying existing src/types/auth.ts */
export interface BackendUserDto {
  id: number;
  username: string;
  gmail: string;
  avatarUrl: string | null;
  role: UserRole;
  packageOwned: PackageOwned;
  endDatePackage: string | null;
  freeAccess: number | null;
}

export interface WebAuthUser extends AuthUser {
  role: UserRole;
  packageOwned: PackageOwned;
  endDatePackage: string | null;
  freeAccess: number | null;
}

export interface WebSessionState {
  user: WebAuthUser | null;
  isRealAdmin: boolean;
  demoRoleOverride: DemoRoleOverride;
  effectiveRole: UserRole;
  isDemoMode: boolean;
}
