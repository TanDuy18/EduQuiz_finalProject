import type {
  AssignedExamDto,
  ProctoringSessionSummary,
  ProctoringViolationEvent,
} from "../types/proctoring";
import type { IProctoringService } from "./contracts/IProctoringService";
import { FIGMA_ASSIGNED_EXAMS } from "./data/figmaReferenceCatalog";
import { idbEngine } from "./storage/indexedDbEngine";

export const proctoringService: IProctoringService = {
  async getAssignedExams(): Promise<AssignedExamDto[]> {
    return FIGMA_ASSIGNED_EXAMS;
  },

  async getAssignedExamById(assignedExamId: string): Promise<AssignedExamDto | null> {
    return FIGMA_ASSIGNED_EXAMS.find((e) => e.id === assignedExamId) ?? null;
  },

  async logViolation(
    event: Omit<ProctoringViolationEvent, "id">,
  ): Promise<ProctoringViolationEvent> {
    const record: ProctoringViolationEvent = {
      ...event,
      id: `proc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    await idbEngine.put("proctoring_logs", record);
    return record;
  },

  async getViolationsByAttempt(attemptId: string): Promise<ProctoringViolationEvent[]> {
    const logs = await idbEngine.getByIndex("proctoring_logs", "by_attemptId", attemptId);
    return logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  async saveSessionSummary(summary: ProctoringSessionSummary): Promise<void> {
    await idbEngine.put("admin_records", {
      id: `proctoring_session:${summary.attemptId}`,
      recordType: "AUDIT_LOG",
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
      payload: summary,
    });
  },
};
