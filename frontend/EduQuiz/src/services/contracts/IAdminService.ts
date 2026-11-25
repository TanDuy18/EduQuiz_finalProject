import type {
  AdminAuditLogRecord,
  AdminDashboardKpiDto,
  AdminLecturerRecord,
  AdminNotificationRecord,
  AdminSecurityPolicies,
  AdminSystemSettings,
  AdminUserRecord,
} from "../../types/admin";
import type { QuestionReportRecord } from "../../types/attempt";
import type { PageRequestParams, PaginatedResponse } from "../../types/pagination";
import type { QuestionRecord } from "../../types/quiz";

export interface IAdminService {
  getDashboardKpis(): Promise<AdminDashboardKpiDto>;
  getUsers(params: PageRequestParams & { roleGroup?: string; status?: string }): Promise<PaginatedResponse<AdminUserRecord>>;
  getUserById(userId: string): Promise<AdminUserRecord | null>;
  updateUser(userId: string, patch: Partial<AdminUserRecord>): Promise<AdminUserRecord>;
  getLecturers(params: PageRequestParams & { approvalStatus?: string }): Promise<PaginatedResponse<AdminLecturerRecord>>;
  getLecturerById(lecturerId: string): Promise<AdminLecturerRecord | null>;
  approveLecturer(lecturerId: string, approved: boolean): Promise<AdminLecturerRecord>;
  getQuestionBank(params: PageRequestParams & { subject?: string; level?: string; status?: string }): Promise<PaginatedResponse<QuestionRecord>>;
  getQuestionById(questionId: string): Promise<QuestionRecord | null>;
  updateQuestion(questionId: string, patch: Partial<QuestionRecord>): Promise<QuestionRecord>;
  getQuestionReports(params: PageRequestParams & { priority?: string; status?: string }): Promise<PaginatedResponse<QuestionReportRecord>>;
  getQuestionReportById(reportId: string): Promise<QuestionReportRecord | null>;
  resolveQuestionReport(
    reportId: string,
    payload: {
      note: string;
      action: "EDIT_QUESTION" | "KEEP_QUESTION" | "HIDE_QUESTION";
      status: "RESOLVED" | "DISMISSED";
    },
  ): Promise<QuestionReportRecord>;
  getAuditLogs(params: PageRequestParams): Promise<PaginatedResponse<AdminAuditLogRecord>>;
  getNotifications(): Promise<AdminNotificationRecord[]>;
  sendBroadcastNotification(payload: {
    title: string;
    audience: string;
    body: string;
    scheduleLabel: string;
  }): Promise<AdminNotificationRecord>;
  getSystemSettings(): Promise<AdminSystemSettings>;
  saveSystemSettings(settings: AdminSystemSettings): Promise<AdminSystemSettings>;
  getSecurityPolicies(): Promise<AdminSecurityPolicies>;
  saveSecurityPolicies(policies: AdminSecurityPolicies): Promise<AdminSecurityPolicies>;
}
