import type {
  AssignedExamDto,
  ProctoringSessionSummary,
  ProctoringViolationEvent,
} from "../../types/proctoring";

export interface IProctoringService {
  getAssignedExams(): Promise<AssignedExamDto[]>;
  getAssignedExamById(assignedExamId: string): Promise<AssignedExamDto | null>;
  logViolation(event: Omit<ProctoringViolationEvent, "id">): Promise<ProctoringViolationEvent>;
  getViolationsByAttempt(attemptId: string): Promise<ProctoringViolationEvent[]>;
  saveSessionSummary(summary: ProctoringSessionSummary): Promise<void>;
}
