import { useCallback, useEffect, useRef, useState } from "react";
import { attemptService } from "../services/attemptService";
import { prefsStorage } from "../services/storage/prefsStorage";
import type { AttemptAnswerRecord, AttemptResultDto, QuizExamSessionDto } from "../types/attempt";
import type { QuizMode } from "../types/quiz";

interface UseQuizAttemptOptions {
  quizId: string;
  mode?: QuizMode | "RETRY_WRONG" | "PROCTORED";
  questionIdsFilter?: string[];
  onSubmitted?: (result: AttemptResultDto) => void;
}

export function useQuizAttempt({
  quizId,
  mode = "PRACTICE",
  questionIdsFilter,
  onSubmitted,
}: UseQuizAttemptOptions) {
  const [session, setSession] = useState<QuizExamSessionDto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingRef = useRef(0);
  const idempotencyKeyRef = useRef("");
  const submittedRef = useRef(false);
  const onSubmittedRef = useRef(onSubmitted);
  onSubmittedRef.current = onSubmitted;

  const filterKey = questionIdsFilter?.join(",") ?? "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    submittedRef.current = false;

    const ids = filterKey ? filterKey.split(",") : undefined;
    void attemptService
      .startOrResumeAttempt(quizId, mode, ids)
      .then((res) => {
        if (!active) return;
        setSession(res);
        setRemainingSeconds(res.attempt.remainingSeconds);
        remainingRef.current = res.attempt.remainingSeconds;
        idempotencyKeyRef.current = `submit_${res.attempt.id}_${Date.now()}`;

        const ptr = prefsStorage.getActiveAttemptPtr();
        if (ptr && ptr.attemptId === res.attempt.id && ptr.currentQuestionIndex < res.questions.length) {
          setCurrentIndex(ptr.currentQuestionIndex);
        } else {
          setCurrentIndex(0);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể khởi tạo phiên làm bài");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [quizId, mode, filterKey]);

  const submitAttempt = useCallback(async () => {
    if (!session || submittedRef.current) return null;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await attemptService.submitAttempt(
        session.attempt.id,
        idempotencyKeyRef.current || `submit_${session.attempt.id}`,
      );
      onSubmittedRef.current?.(result);
      return result;
    } catch (err) {
      submittedRef.current = false;
      setError(err instanceof Error ? err.message : "Lỗi khi nộp bài");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [session]);

  // Countdown timer (only for timed sessions where durationSeconds > 0)
  useEffect(() => {
    if (!session || session.attempt.durationSeconds <= 0 || loading) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - 1);
        remainingRef.current = next;
        if (next === 0 && !submittedRef.current) {
          void submitAttempt();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, loading, submitAttempt]);

  // Persist active question pointer for F5 resume
  useEffect(() => {
    if (!session) return;
    prefsStorage.setActiveAttemptPtr({
      attemptId: session.attempt.id,
      quizId: session.attempt.quizId,
      currentQuestionIndex: currentIndex,
      updatedAt: Date.now(),
    });
  }, [session, currentIndex]);

  const selectOption = useCallback(
    async (questionId: string, optionId: string) => {
      if (!session || submitting) return;
      const question = session.questions.find((q) => q.id === questionId);
      if (!question) return;

      const currentAns = session.answers[questionId];
      const prevSelected = currentAns?.selectedOptionIds ?? [];
      const nextSelected =
        question.type === "MULTIPLE_CHOICE"
          ? prevSelected.includes(optionId)
            ? prevSelected.filter((id) => id !== optionId)
            : [...prevSelected, optionId]
          : [optionId];

      const optimistic: AttemptAnswerRecord = {
        id: `${session.attempt.id}_${questionId}`,
        attemptId: session.attempt.id,
        questionId,
        orderIndex: question.orderIndex,
        selectedOptionIds: nextSelected,
        answered: nextSelected.length > 0,
        isBookmarked: currentAns?.isBookmarked ?? false,
        isCorrect: null,
        answeredAt: new Date().toISOString(),
      };

      setSession((prev) => {
        if (!prev) return prev;
        const nextAnswers = { ...prev.answers, [questionId]: optimistic };
        const answeredCount = Object.values(nextAnswers).filter((a) => a.answered).length;
        return {
          ...prev,
          attempt: { ...prev.attempt, answeredCount, remainingSeconds: remainingRef.current },
          answers: nextAnswers,
        };
      });

      await attemptService.saveAnswer(
        session.attempt.id,
        questionId,
        nextSelected,
        remainingRef.current,
      );
    },
    [session, submitting],
  );

  const toggleBookmark = useCallback(
    async (questionId: string) => {
      if (!session) return;
      const nextFlag = await attemptService.toggleBookmark(session.attempt.id, questionId);
      setSession((prev) => {
        if (!prev) return prev;
        const existing = prev.answers[questionId];
        const question = prev.questions.find((q) => q.id === questionId);
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: {
              id: `${prev.attempt.id}_${questionId}`,
              attemptId: prev.attempt.id,
              questionId,
              orderIndex: existing?.orderIndex ?? question?.orderIndex ?? 1,
              selectedOptionIds: existing?.selectedOptionIds ?? [],
              answered: existing?.answered ?? false,
              isBookmarked: nextFlag,
              isCorrect: existing?.isCorrect ?? null,
              answeredAt: existing?.answeredAt ?? null,
            },
          },
        };
      });
    },
    [session],
  );

  return {
    session,
    currentIndex,
    setCurrentIndex,
    remainingSeconds,
    loading,
    submitting,
    error,
    selectOption,
    toggleBookmark,
    submitAttempt,
  };
}
