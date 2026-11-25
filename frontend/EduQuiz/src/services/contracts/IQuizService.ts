import type { PaginatedResponse } from "../../types/pagination";
import type {
  CreateQuizPayload,
  EducationLevelCode,
  EducationLevelDto,
  QuestionRecord,
  QuizFilterParams,
  QuizRecord,
  SubjectDto,
} from "../../types/quiz";

export interface IQuizService {
  getEducationLevels(): Promise<EducationLevelDto[]>;
  getSubjects(levelCode?: EducationLevelCode): Promise<SubjectDto[]>;
  getQuizzes(params: QuizFilterParams): Promise<PaginatedResponse<QuizRecord>>;
  getQuizById(quizId: string): Promise<QuizRecord | null>;
  getQuestionsForEditor(quizId: string): Promise<QuestionRecord[]>;
  createQuiz(payload: CreateQuizPayload): Promise<QuizRecord>;
  updateQuiz(quizId: string, payload: Partial<CreateQuizPayload>): Promise<QuizRecord>;
  deleteQuiz(quizId: string): Promise<void>;
  toggleSaveQuiz(quizId: string): Promise<boolean>;
}
