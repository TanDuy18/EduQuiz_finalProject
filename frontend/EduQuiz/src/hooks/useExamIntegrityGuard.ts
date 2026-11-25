import { useEffect, useRef } from "react";
import { proctoringService } from "../services/proctoringService";
import type { ProctoringViolationEvent, ProctoringViolationType } from "../types/proctoring";

interface UseExamIntegrityGuardOptions {
  enabled: boolean;
  attemptId: string | null;
  questionIndex: number;
  onViolation?: (event: ProctoringViolationEvent) => void;
}

/**
 * Layers 1 & 4 Exam Integrity Guard:
 * Monitors tab switching (visibilitychange), window focus loss (blur), fullscreen exits,
 * and disables copy/context-menu during active proctored exams.
 */
export function useExamIntegrityGuard({
  enabled,
  attemptId,
  questionIndex,
  onViolation,
}: UseExamIntegrityGuardOptions) {
  const qIndexRef = useRef(questionIndex);
  qIndexRef.current = questionIndex;
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  useEffect(() => {
    if (!enabled || !attemptId) return;

    const record = async (
      violationType: ProctoringViolationType,
      severity: "INFO" | "WARNING" | "CRITICAL",
      message: string,
    ) => {
      const saved = await proctoringService.logViolation({
        attemptId,
        violationType,
        severity,
        message,
        questionIndex: qIndexRef.current + 1,
        timestamp: new Date().toISOString(),
      });
      onViolationRef.current?.(saved);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        void record("TAB_SWITCH", "WARNING", "Phát hiện chuyển sang tab khác trong lúc làm bài");
      }
    };

    const handleBlur = () => {
      void record("WINDOW_BLUR", "WARNING", "Cửa sổ trình duyệt mất tiêu điểm");
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        void record("FULLSCREEN_EXIT", "INFO", "Thoát chế độ toàn màn hình");
      }
    };

    const blockAction = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreen);
    document.addEventListener("copy", blockAction);
    document.addEventListener("contextmenu", blockAction);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreen);
      document.removeEventListener("copy", blockAction);
      document.removeEventListener("contextmenu", blockAction);
    };
  }, [enabled, attemptId]);
}
