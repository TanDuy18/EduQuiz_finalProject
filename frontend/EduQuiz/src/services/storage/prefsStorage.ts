import type { EducationLevelCode } from "../../types/quiz";
import type { DemoRoleOverride } from "../../types/webAuth";

const PREFS_KEY = "eq_web_prefs_v1";
const ACTIVE_ATTEMPT_PTR_KEY = "eq_active_attempt_ptr";

export interface WebPreferences {
  selectedLevel: EducationLevelCode;
  onboardingDone: boolean;
  sidebarCollapsed: boolean;
  demoRoleOverride: DemoRoleOverride;
}

export interface ActiveAttemptPointer {
  attemptId: string;
  quizId: string;
  currentQuestionIndex: number;
  updatedAt: number;
}

const DEFAULT_PREFS: WebPreferences = {
  selectedLevel: "THPT",
  onboardingDone: false,
  sidebarCollapsed: false,
  demoRoleOverride: "NONE",
};

function safeRead<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or privacy-mode errors gracefully
  }
}

export const prefsStorage = {
  get(): WebPreferences {
    const saved = safeRead<Partial<WebPreferences>>(PREFS_KEY);
    return { ...DEFAULT_PREFS, ...(saved ?? {}) };
  },

  update(patch: Partial<WebPreferences>): WebPreferences {
    const next = { ...this.get(), ...patch };
    safeWrite(PREFS_KEY, next);
    return next;
  },

  getActiveAttemptPtr(): ActiveAttemptPointer | null {
    return safeRead<ActiveAttemptPointer>(ACTIVE_ATTEMPT_PTR_KEY);
  },

  setActiveAttemptPtr(ptr: ActiveAttemptPointer): void {
    safeWrite(ACTIVE_ATTEMPT_PTR_KEY, ptr);
  },

  clearActiveAttemptPtr(): void {
    try {
      window.localStorage.removeItem(ACTIVE_ATTEMPT_PTR_KEY);
    } catch {
      // Ignore
    }
  },
};
