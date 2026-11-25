import type {
  AttemptAnswerRecord,
  AttemptRecord,
  AttemptResultDto,
  AttemptStatus,
  CreateQuestionReportPayload,
  QuestionReportRecord,
  QuizExamSessionDto,
} from "../../types/attempt";
import type { QuizMode } from "../../types/quiz";

export interface IAttemptService {
  getInProgressAttempts(): Promise<AttemptRecord[]>;
  getAttemptHistory(status?: AttemptStatus | "ALL"): Promise<AttemptRecord[]>;
  getAttemptProgress(attemptId: string): Promise<{
    attempt: AttemptRecord;
    answers: AttemptAnswerRecord[];
  } | null>;
  startOrResumeAttempt(
    quizId: string,
    mode?: QuizMode | "RETRY_WRONG" | "PROCTORED",
    questionIdsFilter?: string[],
  ): Promise<QuizExamSessionDto>;
  saveAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionIds: string[],
    remainingSeconds: number,
  ): Promise<AttemptAnswerRecord>;
  toggleBookmark(attemptId: string, questionId: string): Promise<boolean>;
  submitAttempt(attemptId: string, idempotencyKey: string): Promise<AttemptResultDto>;
  getAttemptResult(attemptId: string): Promise<AttemptResultDto | null>;
  reportQuestionError(payload: CreateQuestionReportPayload): Promise<QuestionReportRecord>;
}
