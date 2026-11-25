import type { PaginatedResponse } from "../types/pagination";
import type {
  CreateQuizPayload,
  EducationLevelCode,
  EducationLevelDto,
  QuestionRecord,
  QuizFilterParams,
  QuizRecord,
  SubjectDto,
} from "../types/quiz";
import type { IQuizService } from "./contracts/IQuizService";
import { BACKEND_EDUCATION_LEVELS } from "./data/backendSeederMirror";
import { FIGMA_SUBJECTS_24 } from "./data/figmaReferenceCatalog";
import { idbEngine } from "./storage/indexedDbEngine";

function paginate<T>(items: T[], page: number, size: number): PaginatedResponse<T> {
  const safeSize = Math.max(1, size);
  const safePage = Math.max(1, page);
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize));
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    totalElements,
    totalPages,
    page: safePage,
    size: safeSize,
  };
}

export const quizService: IQuizService = {
  async getEducationLevels(): Promise<EducationLevelDto[]> {
    return BACKEND_EDUCATION_LEVELS;
  },

  async getSubjects(levelCode?: EducationLevelCode): Promise<SubjectDto[]> {
    if (!levelCode) return FIGMA_SUBJECTS_24;
    if (levelCode === "UNIVERSITY") {
      return FIGMA_SUBJECTS_24.filter(
        (s) => s.levelCode === "UNIVERSITY" || s.id === "sub_chemistry" || s.id === "sub_physics",
      );
    }
    return FIGMA_SUBJECTS_24.filter((s) => s.levelCode === "THPT");
  },

  async getQuizzes(params: QuizFilterParams): Promise<PaginatedResponse<QuizRecord>> {
    const all = await idbEngine.getAll("quizzes");
    const q = (params.search ?? "").trim().toLowerCase();

    const filtered = all.filter((item) => {
      if (params.onlyMine) {
        if (item.createdBy !== "current_user") return false;
      } else if (item.quizVisibility === "ASSIGNED") {
        return false;
      } else if (!params.quizStatus && item.quizStatus !== "PUBLISHED") {
        return false;
      }

      if (params.levelCode && !params.onlyMine && item.levelCode !== params.levelCode) {
        return false;
      }
      if (params.subjectIds && params.subjectIds.length > 0 && !params.subjectIds.includes(item.subjectId)) {
        return false;
      }
      if (params.topicTag && params.topicTag !== "Tất cả" && item.topicTag !== params.topicTag) {
        return false;
      }
      if (params.difficulty && params.difficulty !== "MIXED" && item.difficulty !== params.difficulty) {
        return false;
      }
      if (params.quizStatus && item.quizStatus !== params.quizStatus) {
        return false;
      }
      if (params.onlyPopular && !item.isPopular) {
        return false;
      }
      if (params.onlySaved && !item.isSaved) {
        return false;
      }
      if (q) {
        const hay = `${item.title} ${item.subjectName} ${item.topicTag ?? ""} ${item.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return paginate(filtered, params.page, params.size);
  },

  async getQuizById(quizId: string): Promise<QuizRecord | null> {
    return idbEngine.getById("quizzes", quizId);
  },

  async getQuestionsForEditor(quizId: string): Promise<QuestionRecord[]> {
    const list = await idbEngine.getByIndex("questions", "by_quizId", quizId);
    return list.sort((a, b) => a.orderIndex - b.orderIndex);
  },

  async createQuiz(payload: CreateQuizPayload): Promise<QuizRecord> {
    const quizId = `usr_quiz_${Date.now()}`;
    const diffLabelMap = { EASY: "Dễ", MEDIUM: "Vừa", HARD: "Khó", MIXED: "Trộn" } as const;
    const quiz: QuizRecord = {
      id: quizId,
      title: payload.title.trim() || "Đề thi tự tạo",
      description: payload.description?.trim() || `Bộ đề ${payload.subjectName} tự soạn.`,
      subjectId: payload.subjectId,
      subjectName: payload.subjectName,
      levelCode: payload.levelCode,
      topicTag: payload.topicTag,
      durationMinutes: payload.durationMinutes,
      questionCount: payload.questions.length || payload.targetQuestionCount,
      difficulty: payload.difficulty,
      difficultyLabel: diffLabelMap[payload.difficulty],
      rating: 0,
      ratingCountLabel: "0",
      attemptCountLabel: "0",
      quizVisibility: "PRIVATE",
      quizStatus: payload.quizStatus,
      createdBy: "current_user",
      updatedAt: new Date().toISOString(),
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
    };

    await idbEngine.put("quizzes", quiz);

    for (let i = 0; i < payload.questions.length; i++) {
      const q = payload.questions[i];
      const qId = `${quizId}_q_${i + 1}`;
      await idbEngine.put("questions", {
        ...q,
        id: qId,
        code: `U${String(Date.now()).slice(-4)}_${i + 1}`,
        quizId,
        orderIndex: i + 1,
        options: q.options.map((opt, idx) => ({
          ...opt,
          id: `${qId}_opt_${idx + 1}`,
          orderIndex: idx + 1,
        })),
        dataSource: "USER_DYNAMIC",
        modifiedByUser: true,
      });
    }

    return quiz;
  },

  async updateQuiz(quizId: string, payload: Partial<CreateQuizPayload>): Promise<QuizRecord> {
    const existing = await idbEngine.getById("quizzes", quizId);
    if (!existing) throw new Error("Không tìm thấy đề thi");

    const updated: QuizRecord = {
      ...existing,
      title: payload.title ?? existing.title,
      description: payload.description ?? existing.description,
      subjectId: payload.subjectId ?? existing.subjectId,
      subjectName: payload.subjectName ?? existing.subjectName,
      levelCode: payload.levelCode ?? existing.levelCode,
      topicTag: payload.topicTag ?? existing.topicTag,
      durationMinutes: payload.durationMinutes ?? existing.durationMinutes,
      difficulty: payload.difficulty ?? existing.difficulty,
      quizStatus: payload.quizStatus ?? existing.quizStatus,
      questionCount: payload.questions ? payload.questions.length : existing.questionCount,
      updatedAt: new Date().toISOString(),
      modifiedByUser: true,
    };
    await idbEngine.put("quizzes", updated);

    if (payload.questions) {
      const oldQs = await idbEngine.getByIndex("questions", "by_quizId", quizId);
      for (const oldQ of oldQs) {
        await idbEngine.remove("questions", oldQ.id);
      }
      for (let i = 0; i < payload.questions.length; i++) {
        const q = payload.questions[i];
        const qId = `${quizId}_q_${i + 1}`;
        await idbEngine.put("questions", {
          ...q,
          id: qId,
          quizId,
          orderIndex: i + 1,
          options: q.options.map((opt, idx) => ({
            ...opt,
            id: `${qId}_opt_${idx + 1}`,
            orderIndex: idx + 1,
          })),
          dataSource: "USER_DYNAMIC",
          modifiedByUser: true,
        });
      }
    }

    return updated;
  },

  async deleteQuiz(quizId: string): Promise<void> {
    const qs = await idbEngine.getByIndex("questions", "by_quizId", quizId);
    for (const q of qs) {
      await idbEngine.remove("questions", q.id);
    }
    await idbEngine.remove("quizzes", quizId);
  },

  async toggleSaveQuiz(quizId: string): Promise<boolean> {
    const existing = await idbEngine.getById("quizzes", quizId);
    if (!existing) return false;
    const nextSaved = !existing.isSaved;
    await idbEngine.put("quizzes", {
      ...existing,
      isSaved: nextSaved,
      modifiedByUser: true,
    });
    return nextSaved;
  },
};
