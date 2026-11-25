import type { DataSourceTag, PageRequestParams } from "./pagination";

/** Matches Backend DataSeeder.java EducationLevel.code */
export type EducationLevelCode = "THCS" | "THPT" | "UNIVERSITY";

export type SubjectCategoryGroup = "NATURAL" | "SOCIAL" | "LANGUAGE" | "OTHER";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "MIXED";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export type QuizVisibility = "PRIVATE" | "PUBLIC" | "ASSIGNED";

export type QuizStatus = "DRAFT" | "PUBLISHED" | "EDITING" | "CLOSE";

export type QuizMode = "PRACTICE" | "MOD_EXAM";

export type QuestionApprovalStatus = "APPROVED" | "PENDING" | "HIDDEN";

export interface EducationLevelDto {
  id: number;
  name: string;
  code: EducationLevelCode;
  subtitle: string;
  orderIndex: number;
  active: boolean;
}

export interface SubjectDto {
  id: string;
  name: string;
  description: string;
  levelCode: EducationLevelCode;
  categoryGroup: SubjectCategoryGroup;
  colorKey: "math" | "literature" | "physics" | "chemistry" | "english" | "history" | "other";
  quizCount: number;
}

export interface QuestionOptionRecord {
  id: string;
  label: "A" | "B" | "C" | "D";
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

/** Anti-leak option DTO sent to QuizPlayer UI while taking an exam (NO isCorrect) */
export interface QuestionOptionExamDto {
  id: string;
  label: "A" | "B" | "C" | "D";
  content: string;
  orderIndex: number;
}

export interface QuestionRecord {
  id: string;
  code?: string;
  quizId: string;
  subjectName: string;
  levelCode: EducationLevelCode;
  content: string;
  type: QuestionType;
  difficulty: Exclude<Difficulty, "MIXED">;
  explanation: string;
  score: number;
  orderIndex: number;
  approvalStatus: QuestionApprovalStatus;
  options: QuestionOptionRecord[];
  dataSource: DataSourceTag;
  modifiedByUser?: boolean;
}

/** Anti-leak question DTO sent to QuizPlayer UI while taking an exam (NO isCorrect, NO explanation) */
export interface QuestionExamDto {
  id: string;
  orderIndex: number;
  content: string;
  type: QuestionType;
  difficulty: Exclude<Difficulty, "MIXED">;
  options: QuestionOptionExamDto[];
}

export interface QuizRecord {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  levelCode: EducationLevelCode;
  topicTag?: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: Difficulty;
  difficultyLabel: string;
  rating: number;
  ratingCountLabel: string;
  attemptCountLabel: string;
  isPopular?: boolean;
  isHot?: boolean;
  isSaved?: boolean;
  quizVisibility: QuizVisibility;
  quizStatus: QuizStatus;
  createdBy: string;
  updatedAt: string;
  dataSource: DataSourceTag;
  modifiedByUser?: boolean;
}

export interface QuizFilterParams extends PageRequestParams {
  levelCode?: EducationLevelCode;
  subjectIds?: string[];
  topicTag?: string;
  difficulty?: Difficulty;
  quizStatus?: QuizStatus;
  onlyPopular?: boolean;
  onlySaved?: boolean;
  onlyMine?: boolean;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  levelCode: EducationLevelCode;
  topicTag?: string;
  targetQuestionCount: number;
  durationMinutes: number;
  difficulty: Difficulty;
  quizStatus: "DRAFT" | "PUBLISHED";
  questions: Omit<QuestionRecord, "id" | "quizId" | "dataSource">[];
}

export interface ParsedBulkQuestion {
  index: number;
  content: string;
  options: { label: "A" | "B" | "C" | "D"; content: string; isCorrect: boolean }[];
  errors: string[];
}
