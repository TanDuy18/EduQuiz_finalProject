import type { DataSourceTag } from "./pagination";
import type { QuestionExamDto, QuestionOptionRecord, QuizMode } from "./quiz";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

/** Mirrors Backend InProgressAttemptDto.java */
export interface BackendInProgressAttemptDto {
  attemptId: number;
  quizId: number;
  title: string;
  answered: number;
  total: number;
  startedAt: string;
}

export interface AttemptRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  subjectName: string;
  userId: string;
  mode: QuizMode | "RETRY_WRONG" | "PROCTORED";
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number;
  remainingSeconds: number;
  answeredCount: number;
  correctCount: number | null;
  totalCount: number;
  score: number | null;
  totalScore: number;
  dataSource: DataSourceTag;
}

export interface AttemptAnswerRecord {
  /** Composite key: `${attemptId}_${questionId}` */
  id: string;
  attemptId: string;
  questionId: string;
  orderIndex: number;
  selectedOptionIds: string[];
  answered: boolean;
  isBookmarked: boolean;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

/** Anti-leak exam session returned to QuizPlayer UI (NO correct answers or explanations) */
export interface QuizExamSessionDto {
  attempt: AttemptRecord;
  questions: QuestionExamDto[];
  answers: Record<string, AttemptAnswerRecord>;
}

export interface AttemptReviewItemDto {
  questionId: string;
  orderIndex: number;
  content: string;
  options: QuestionOptionRecord[];
  selectedOptionIds: string[];
  isCorrect: boolean;
  isUnanswered: boolean;
  explanation: string;
}

export interface AttemptResultDto {
  attempt: AttemptRecord;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  percentileBeat: number;
  reviewItems: AttemptReviewItemDto[];
}

export type QuestionReportReason =
  | "WRONG_ANSWER"
  | "WRONG_OR_MISSING_PROMPT"
  | "TYPO"
  | "BROKEN_FORMULA_OR_IMAGE"
  | "OTHER";

export type QuestionReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export type QuestionReportPriority = "HIGH" | "NORMAL";

export interface QuestionReportRecord {
  id: string;
  questionId: string;
  questionCode: string;
  questionPreview: string;
  subjectName: string;
  levelCode: string;
  reporterName: string;
  reason: QuestionReportReason;
  reasonLabel: string;
  description: string;
  priority: QuestionReportPriority;
  status: QuestionReportStatus;
  resolutionNote?: string;
  resolutionAction?: "EDIT_QUESTION" | "KEEP_QUESTION" | "HIDE_QUESTION";
  createdAt: string;
  dataSource: DataSourceTag;
  modifiedByUser?: boolean;
}

export interface CreateQuestionReportPayload {
  questionId: string;
  reason: QuestionReportReason;
  description?: string;
}
