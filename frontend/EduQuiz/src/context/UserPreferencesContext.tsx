import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { ensureDbReady, getStorageMode, subscribeStorageMode } from "../services/storage/indexedDbEngine";
import { prefsStorage, type WebPreferences } from "../services/storage/prefsStorage";
import { webAuthBridge } from "../services/webAuthBridge";
import type { StorageMode } from "../types/pagination";
import type { EducationLevelCode } from "../types/quiz";
import type { DemoRoleOverride, UserRole, WebAuthUser } from "../types/webAuth";

interface UserPreferencesContextValue {
  prefs: WebPreferences;
  selectedLevel: EducationLevelCode;
  setSelectedLevel: (level: EducationLevelCode) => void;
  markOnboardingDone: () => void;
  setDemoRoleOverride: (role: DemoRoleOverride) => void;
  storageMode: StorageMode;
  fullProfile: WebAuthUser | null;
  isRealAdmin: boolean;
  effectiveRole: UserRole;
  isDemoAdmin: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<WebPreferences>(() => prefsStorage.get());
  const [storageMode, setStorageMode] = useState<StorageMode>(() => getStorageMode());
  const [fullProfile, setFullProfile] = useState<WebAuthUser | null>(null);

  useEffect(() => {
    void ensureDbReady().then(setStorageMode);
    return subscribeStorageMode(setStorageMode);
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setFullProfile(null);
      return;
    }
    void webAuthBridge.fetchFullProfile().then((profile) => {
      if (active) setFullProfile(profile);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const isRealAdmin = fullProfile?.role === "ADMIN";
  const jwtRoleHint = webAuthBridge.readRoleHintFromJwt();
  const effectiveRole: UserRole =
    prefs.demoRoleOverride !== "NONE"
      ? prefs.demoRoleOverride
      : (fullProfile?.role ?? jwtRoleHint ?? "USER");
  const isDemoAdmin = !isRealAdmin && prefs.demoRoleOverride === "ADMIN";

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      prefs,
      selectedLevel: prefs.selectedLevel,
      setSelectedLevel: (selectedLevel) => setPrefs(prefsStorage.update({ selectedLevel })),
      markOnboardingDone: () => setPrefs(prefsStorage.update({ onboardingDone: true })),
      setDemoRoleOverride: (demoRoleOverride) => setPrefs(prefsStorage.update({ demoRoleOverride })),
      storageMode,
      fullProfile,
      isRealAdmin,
      effectiveRole,
      isDemoAdmin,
    }),
    [prefs, storageMode, fullProfile, isRealAdmin, effectiveRole, isDemoAdmin],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error("useUserPreferences must be used inside UserPreferencesProvider");
  return ctx;
}
