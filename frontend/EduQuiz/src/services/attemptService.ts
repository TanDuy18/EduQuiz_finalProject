import type {
  AttemptAnswerRecord,
  AttemptRecord,
  AttemptResultDto,
  AttemptReviewItemDto,
  AttemptStatus,
  BackendInProgressAttemptDto,
  CreateQuestionReportPayload,
  QuestionReportReason,
  QuestionReportRecord,
  QuizExamSessionDto,
} from "../types/attempt";
import type { QuestionExamDto, QuestionRecord, QuizMode } from "../types/quiz";
import { apiFetch, tokenStore } from "../utils/api";
import type { IAttemptService } from "./contracts/IAttemptService";
import { idbEngine } from "./storage/indexedDbEngine";
import { prefsStorage } from "./storage/prefsStorage";

const REASON_LABELS: Record<QuestionReportReason, string> = {
  WRONG_ANSWER: "Đáp án sai",
  WRONG_OR_MISSING_PROMPT: "Đề bài sai hoặc thiếu",
  TYPO: "Lỗi chính tả",
  BROKEN_FORMULA_OR_IMAGE: "Công thức hoặc hình bị lỗi",
  OTHER: "Lý do khác",
};

/** Anti-leak projection: strips isCorrect & explanation before sending to QuizPlayer UI */
function toExamDto(q: QuestionRecord): QuestionExamDto {
  return {
    id: q.id,
    orderIndex: q.orderIndex,
    content: q.content,
    type: q.type,
    difficulty: q.difficulty,
    options: q.options.map((o) => ({
      id: o.id,
      label: o.label,
      content: o.content,
      orderIndex: o.orderIndex,
    })),
  };
}

const submittedIdempotencyCache = new Map<string, AttemptResultDto>();
const remoteInProgressCache = new Map<string, AttemptRecord>();

export const attemptService: IAttemptService = {
  async getInProgressAttempts(): Promise<AttemptRecord[]> {
    const localInProgress = await idbEngine.getByIndex("attempts", "by_status", "IN_PROGRESS");

    // Try real Backend endpoint GET /api/v1/attempts/in-progress if authenticated and not mock-only
    if (tokenStore.get() && import.meta.env.VITE_USE_MOCK !== "true") {
      try {
        const remote = await apiFetch<BackendInProgressAttemptDto[]>("/api/v1/attempts/in-progress");
        remoteInProgressCache.clear();
        const mapped: AttemptRecord[] = remote.map((r) => {
          const rec: AttemptRecord = {
            id: `remote_att_${r.attemptId}`,
            quizId: String(r.quizId),
            quizTitle: r.title,
            subjectName: "Backend DB",
            userId: "remote_user",
            mode: "PRACTICE",
            status: "IN_PROGRESS",
            startedAt: r.startedAt,
            submittedAt: null,
            durationSeconds: 5400,
            remainingSeconds: 2700,
            answeredCount: r.answered,
            correctCount: null,
            totalCount: r.total,
            score: null,
            totalScore: 10,
            dataSource: "BACKEND_SEEDER",
          };
          remoteInProgressCache.set(rec.id, rec);
          return rec;
        });
        return [...mapped, ...localInProgress];
      } catch {
        // Fallback gracefully to local IndexedDB store
      }
    }

    return localInProgress.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async getAttemptHistory(status: AttemptStatus | "ALL" = "ALL"): Promise<AttemptRecord[]> {
    const list =
      status === "ALL"
        ? await idbEngine.getAll("attempts")
        : await idbEngine.getByIndex("attempts", "by_status", status);

    let remoteItems: AttemptRecord[] = [];
    if (status === "ALL" || status === "IN_PROGRESS") {
      if (tokenStore.get() && import.meta.env.VITE_USE_MOCK !== "true") {
        const merged = await this.getInProgressAttempts();
        remoteItems = merged.filter((a) => a.id.startsWith("remote_att_"));
      }
    }

    return [...remoteItems, ...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async getAttemptProgress(attemptId: string) {
    if (attemptId.startsWith("remote_att_")) {
      const cached = remoteInProgressCache.get(attemptId);
      if (cached) return { attempt: cached, answers: [] };
      const fresh = await this.getInProgressAttempts();
      const found = fresh.find((a) => a.id === attemptId);
      return found ? { attempt: found, answers: [] } : null;
    }
    const attempt = await idbEngine.getById("attempts", attemptId);
    if (!attempt) return null;
    const answers = await idbEngine.getByIndex("attempt_answers", "by_attemptId", attemptId);
    answers.sort((a, b) => a.orderIndex - b.orderIndex);
    return { attempt, answers };
  },

  async startOrResumeAttempt(
    quizId: string,
    mode: QuizMode | "RETRY_WRONG" | "PROCTORED" = "PRACTICE",
    questionIdsFilter?: string[],
  ): Promise<QuizExamSessionDto> {
    const quiz = await idbEngine.getById("quizzes", quizId);
    if (!quiz) throw new Error("Không tìm thấy đề thi");

    let allQuestions = await idbEngine.getByIndex("questions", "by_quizId", quizId);
    allQuestions.sort((a, b) => a.orderIndex - b.orderIndex);
    if (allQuestions.length === 0) {
      // Fallback to math sample questions if a reference quiz has metadata only
      allQuestions = (await idbEngine.getByIndex("questions", "by_quizId", "fig_quiz_math_thpt_2025")).sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
    }

    const activeQuestions =
      questionIdsFilter && questionIdsFilter.length > 0
        ? allQuestions.filter((q) => questionIdsFilter.includes(q.id))
        : allQuestions;

    let attempt: AttemptRecord | undefined;
    if (mode !== "RETRY_WRONG" && mode !== "PROCTORED") {
      const existingByQuiz = await idbEngine.getByIndex("attempts", "by_quizId", quizId);
      attempt = existingByQuiz.find((a) => a.status === "IN_PROGRESS");
    }

    if (!attempt) {
      const durationSeconds = mode === "RETRY_WRONG" ? 0 : quiz.durationMinutes * 60;
      attempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        subjectName: quiz.subjectName,
        userId: "local_user",
        mode,
        status: "IN_PROGRESS",
        startedAt: new Date().toISOString(),
        submittedAt: null,
        durationSeconds,
        remainingSeconds: durationSeconds,
        answeredCount: 0,
        correctCount: null,
        totalCount: activeQuestions.length,
        score: null,
        totalScore: 10,
        dataSource: "USER_DYNAMIC",
      };
      await idbEngine.put("attempts", attempt);
    }

    const existingAnswers = await idbEngine.getByIndex("attempt_answers", "by_attemptId", attempt.id);
    const answerMap: Record<string, AttemptAnswerRecord> = {};
    for (const ans of existingAnswers) {
      answerMap[ans.questionId] = ans;
    }

    prefsStorage.setActiveAttemptPtr({
      attemptId: attempt.id,
      quizId: quiz.id,
      currentQuestionIndex: 0,
      updatedAt: Date.now(),
    });

    return {
      attempt,
      questions: activeQuestions.map(toExamDto),
      answers: answerMap,
    };
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionIds: string[],
    remainingSeconds: number,
  ): Promise<AttemptAnswerRecord> {
    const attempt = await idbEngine.getById("attempts", attemptId);
    if (!attempt) throw new Error("Không tìm thấy phiên làm bài");
    if (attempt.status === "SUBMITTED") {
      throw new Error("Bài làm đã được nộp, không thể chỉnh sửa");
    }

    const answerId = `${attemptId}_${questionId}`;
    const existing = await idbEngine.getById("attempt_answers", answerId);
    const question = await idbEngine.getById("questions", questionId);

    const record: AttemptAnswerRecord = {
      id: answerId,
      attemptId,
      questionId,
      orderIndex: existing?.orderIndex ?? question?.orderIndex ?? 1,
      selectedOptionIds,
      answered: selectedOptionIds.length > 0,
      isBookmarked: existing?.isBookmarked ?? false,
      isCorrect: null,
      answeredAt: new Date().toISOString(),
    };
    await idbEngine.put("attempt_answers", record);

    const allAnswers = await idbEngine.getByIndex("attempt_answers", "by_attemptId", attemptId);
    const answeredCount = allAnswers.filter((a) => a.answered).length;
    await idbEngine.put("attempts", {
      ...attempt,
      answeredCount,
      remainingSeconds: Math.max(0, remainingSeconds),
    });

    return record;
  },

  async toggleBookmark(attemptId: string, questionId: string): Promise<boolean> {
    const answerId = `${attemptId}_${questionId}`;
    const existing = await idbEngine.getById("attempt_answers", answerId);
    const question = await idbEngine.getById("questions", questionId);
    const nextBookmarked = !(existing?.isBookmarked ?? false);

    await idbEngine.put("attempt_answers", {
      id: answerId,
      attemptId,
      questionId,
      orderIndex: existing?.orderIndex ?? question?.orderIndex ?? 1,
      selectedOptionIds: existing?.selectedOptionIds ?? [],
      answered: existing?.answered ?? false,
      isBookmarked: nextBookmarked,
      isCorrect: existing?.isCorrect ?? null,
      answeredAt: existing?.answeredAt ?? null,
    });
    return nextBookmarked;
  },

  async submitAttempt(attemptId: string, idempotencyKey: string): Promise<AttemptResultDto> {
    const cached = submittedIdempotencyCache.get(idempotencyKey);
    if (cached) return cached;

    const attempt = await idbEngine.getById("attempts", attemptId);
    if (!attempt) throw new Error("Không tìm thấy bài làm");

    if (attempt.status === "SUBMITTED") {
      const existingResult = await this.getAttemptResult(attemptId);
      if (existingResult) {
        submittedIdempotencyCache.set(idempotencyKey, existingResult);
        return existingResult;
      }
    }

    let questions = await idbEngine.getByIndex("questions", "by_quizId", attempt.quizId);
    questions.sort((a, b) => a.orderIndex - b.orderIndex);
    if (questions.length === 0) {
      questions = (await idbEngine.getByIndex("questions", "by_quizId", "fig_quiz_math_thpt_2025")).sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
    }

    const answers = await idbEngine.getByIndex("attempt_answers", "by_attemptId", attemptId);
    const answerByQ = new Map(answers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const reviewItems: AttemptReviewItemDto[] = [];

    for (const q of questions) {
      const ans = answerByQ.get(q.id);
      const selected = ans?.selectedOptionIds ?? [];
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const sortedSelected = [...selected].sort();

      const isUnanswered = selected.length === 0;
      const isCorrect =
        !isUnanswered &&
        correctIds.length === sortedSelected.length &&
        correctIds.every((id, idx) => id === sortedSelected[idx]);

      if (isUnanswered) unansweredCount++;
      else if (isCorrect) correctCount++;
      else wrongCount++;

      if (ans) {
        await idbEngine.put("attempt_answers", { ...ans, isCorrect });
      }

      reviewItems.push({
        questionId: q.id,
        orderIndex: q.orderIndex,
        content: q.content,
        options: q.options,
        selectedOptionIds: selected,
        isCorrect,
        isUnanswered,
        explanation: q.explanation,
      });
    }

    const total = Math.max(1, questions.length);
    const score = Math.round((correctCount / total) * 100) / 10;

    const updatedAttempt: AttemptRecord = {
      ...attempt,
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
      answeredCount: total - unansweredCount,
      correctCount,
      totalCount: questions.length,
      score,
      totalScore: 10,
    };
    await idbEngine.put("attempts", updatedAttempt);
    prefsStorage.clearActiveAttemptPtr();

    const result: AttemptResultDto = {
      attempt: updatedAttempt,
      correctCount,
      wrongCount,
      unansweredCount,
      percentileBeat: Math.min(98, Math.max(15, Math.round(score * 9.5))),
      reviewItems,
    };

    submittedIdempotencyCache.set(idempotencyKey, result);
    return result;
  },

  async getAttemptResult(attemptId: string): Promise<AttemptResultDto | null> {
    const attempt = await idbEngine.getById("attempts", attemptId);
    if (!attempt || attempt.status !== "SUBMITTED") return null;

    let questions = await idbEngine.getByIndex("questions", "by_quizId", attempt.quizId);
    questions.sort((a, b) => a.orderIndex - b.orderIndex);
    if (questions.length === 0) {
      questions = (await idbEngine.getByIndex("questions", "by_quizId", "fig_quiz_math_thpt_2025")).sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
    }

    const answers = await idbEngine.getByIndex("attempt_answers", "by_attemptId", attemptId);
    const answerByQ = new Map(answers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const reviewItems: AttemptReviewItemDto[] = questions.map((q) => {
      const selected = answerByQ.get(q.id)?.selectedOptionIds ?? [];
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const sortedSelected = [...selected].sort();
      const isUnanswered = selected.length === 0;
      const isCorrect =
        !isUnanswered &&
        correctIds.length === sortedSelected.length &&
        correctIds.every((id, idx) => id === sortedSelected[idx]);

      if (isUnanswered) unansweredCount++;
      else if (isCorrect) correctCount++;
      else wrongCount++;

      return {
        questionId: q.id,
        orderIndex: q.orderIndex,
        content: q.content,
        options: q.options,
        selectedOptionIds: selected,
        isCorrect,
        isUnanswered,
        explanation: q.explanation,
      };
    });

    const score = attempt.score ?? Math.round((correctCount / Math.max(1, questions.length)) * 100) / 10;
    return {
      attempt,
      correctCount,
      wrongCount,
      unansweredCount,
      percentileBeat: Math.min(98, Math.max(15, Math.round(score * 9.5))),
      reviewItems,
    };
  },

  async reportQuestionError(payload: CreateQuestionReportPayload): Promise<QuestionReportRecord> {
    const question = await idbEngine.getById("questions", payload.questionId);
    const id = `R${Math.floor(2050 + Math.random() * 8900)}`;
    const now = new Date();
    const formattedTime = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} · ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const report: QuestionReportRecord = {
      id,
      questionId: payload.questionId,
      questionCode: question?.code ?? "Q1024",
      questionPreview: question?.content ?? "Câu hỏi đang báo lỗi",
      subjectName: question?.subjectName ?? "Toán",
      levelCode: question?.levelCode ?? "THPT",
      reporterName: "Học viên EduQuiz",
      reason: payload.reason,
      reasonLabel: REASON_LABELS[payload.reason],
      description: payload.description?.trim() || REASON_LABELS[payload.reason],
      priority: payload.reason === "WRONG_ANSWER" ? "HIGH" : "NORMAL",
      status: "PENDING",
      createdAt: formattedTime,
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
    };
    await idbEngine.put("question_reports", report);
    return report;
  },
};
