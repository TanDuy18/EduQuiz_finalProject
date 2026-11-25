import type {
  AdminAuditLogRecord,
  AdminDashboardKpiDto,
  AdminLecturerRecord,
  AdminNotificationRecord,
  AdminSecurityPolicies,
  AdminSystemSettings,
  AdminUserRecord,
} from "../types/admin";
import type { QuestionReportRecord } from "../types/attempt";
import type { PageRequestParams, PaginatedResponse } from "../types/pagination";
import type { QuestionRecord } from "../types/quiz";
import type { IAdminService } from "./contracts/IAdminService";
import {
  FIGMA_ADMIN_KPI,
  FIGMA_DEFAULT_SECURITY_POLICIES,
  FIGMA_DEFAULT_SYSTEM_SETTINGS,
} from "./data/figmaReferenceCatalog";
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

export const adminService: IAdminService = {
  async getDashboardKpis(): Promise<AdminDashboardKpiDto> {
    const reports = await idbEngine.getAll("question_reports");
    const pendingReports = reports.filter((r) => r.status === "PENDING" || r.status === "REVIEWING");
    const priorityCount = pendingReports.filter((r) => r.priority === "HIGH").length;
    return {
      ...FIGMA_ADMIN_KPI,
      pendingReports: Math.max(FIGMA_ADMIN_KPI.pendingReports - 4 + pendingReports.length, pendingReports.length),
      priorityReports: Math.max(FIGMA_ADMIN_KPI.priorityReports - 1 + priorityCount, priorityCount),
    };
  },

  async getUsers(params: PageRequestParams & { roleGroup?: string; status?: string }) {
    const envelopes = await idbEngine.getByIndex("admin_records", "by_recordType", "USER");
    const q = (params.search ?? "").trim().toLowerCase();
    const list = envelopes
      .map((e) => e.payload as AdminUserRecord)
      .filter((u) => {
        if (params.roleGroup && params.roleGroup !== "Tất cả" && !u.groupLabel.includes(params.roleGroup)) return false;
        if (params.status && params.status !== "Tất cả" && u.status !== params.status) return false;
        if (q && !`${u.fullName} ${u.email} ${u.code}`.toLowerCase().includes(q)) return false;
        return true;
      });
    return paginate(list, params.page, params.size);
  },

  async getUserById(userId: string) {
    const env = await idbEngine.getById("admin_records", `user:${userId}`);
    return env ? (env.payload as AdminUserRecord) : null;
  },

  async updateUser(userId: string, patch: Partial<AdminUserRecord>) {
    const key = `user:${userId}`;
    const env = await idbEngine.getById("admin_records", key);
    if (!env) throw new Error("Không tìm thấy người dùng");
    const nextPayload: AdminUserRecord = { ...(env.payload as AdminUserRecord), ...patch };
    await idbEngine.put("admin_records", {
      ...env,
      status: nextPayload.status,
      updatedAt: new Date().toISOString(),
      modifiedByUser: true,
      payload: nextPayload,
    });
    return nextPayload;
  },

  async getLecturers(params: PageRequestParams & { approvalStatus?: string }) {
    const envelopes = await idbEngine.getByIndex("admin_records", "by_recordType", "LECTURER");
    const q = (params.search ?? "").trim().toLowerCase();
    const list = envelopes
      .map((e) => e.payload as AdminLecturerRecord)
      .filter((l) => {
        if (params.approvalStatus && params.approvalStatus !== "ALL" && l.approvalStatus !== params.approvalStatus) {
          return false;
        }
        if (q && !`${l.fullName} ${l.email} ${l.specialty} ${l.code}`.toLowerCase().includes(q)) return false;
        return true;
      });
    return paginate(list, params.page, params.size);
  },

  async getLecturerById(lecturerId: string) {
    const env = await idbEngine.getById("admin_records", `lecturer:${lecturerId}`);
    return env ? (env.payload as AdminLecturerRecord) : null;
  },

  async approveLecturer(lecturerId: string, approved: boolean) {
    const key = `lecturer:${lecturerId}`;
    const env = await idbEngine.getById("admin_records", key);
    if (!env) throw new Error("Không tìm thấy hồ sơ giảng viên");
    const nextStatus = approved ? "APPROVED" : "REJECTED";
    const nextPayload: AdminLecturerRecord = {
      ...(env.payload as AdminLecturerRecord),
      approvalStatus: nextStatus,
    };
    await idbEngine.put("admin_records", {
      ...env,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      modifiedByUser: true,
      payload: nextPayload,
    });
    return nextPayload;
  },

  async getQuestionBank(params: PageRequestParams & { subject?: string; level?: string; status?: string }) {
    const all = await idbEngine.getAll("questions");
    const q = (params.search ?? "").trim().toLowerCase();
    const filtered = all.filter((item) => {
      if (params.subject && params.subject !== "Tất cả" && item.subjectName !== params.subject) return false;
      if (params.level && params.level !== "Tất cả" && item.levelCode !== params.level) return false;
      if (params.status && params.status !== "Tất cả" && item.approvalStatus !== params.status) return false;
      if (q && !`${item.code ?? ""} ${item.content} ${item.subjectName}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return paginate(filtered, params.page, params.size);
  },

  async getQuestionById(questionId: string) {
    return idbEngine.getById("questions", questionId);
  },

  async updateQuestion(questionId: string, patch: Partial<QuestionRecord>) {
    const existing = await idbEngine.getById("questions", questionId);
    if (!existing) throw new Error("Không tìm thấy câu hỏi");
    const updated: QuestionRecord = { ...existing, ...patch, modifiedByUser: true };
    await idbEngine.put("questions", updated);
    return updated;
  },

  async getQuestionReports(params: PageRequestParams & { priority?: string; status?: string }) {
    const all = await idbEngine.getAll("question_reports");
    const q = (params.search ?? "").trim().toLowerCase();
    const filtered = all.filter((r) => {
      if (params.priority && params.priority !== "ALL" && r.priority !== params.priority) return false;
      if (params.status && params.status !== "ALL" && r.status !== params.status) return false;
      if (q && !`${r.id} ${r.questionCode} ${r.reporterName} ${r.subjectName}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return paginate(filtered, params.page, params.size);
  },

  async getQuestionReportById(reportId: string) {
    return idbEngine.getById("question_reports", reportId);
  },

  async resolveQuestionReport(reportId, payload) {
    const existing = await idbEngine.getById("question_reports", reportId);
    if (!existing) throw new Error("Không tìm thấy báo cáo");
    const updated: QuestionReportRecord = {
      ...existing,
      status: payload.status,
      resolutionNote: payload.note,
      resolutionAction: payload.action,
      modifiedByUser: true,
    };
    await idbEngine.put("question_reports", updated);

    if (payload.action === "HIDE_QUESTION") {
      const q = await idbEngine.getById("questions", existing.questionId);
      if (q) {
        await idbEngine.put("questions", { ...q, approvalStatus: "HIDDEN", modifiedByUser: true });
      }
    }
    return updated;
  },

  async getAuditLogs(params: PageRequestParams) {
    const envelopes = await idbEngine.getByIndex("admin_records", "by_recordType", "AUDIT_LOG");
    const q = (params.search ?? "").trim().toLowerCase();
    const list = envelopes
      .filter((e) => e.id.startsWith("audit:"))
      .map((e) => e.payload as AdminAuditLogRecord)
      .filter((l) => !q || `${l.action} ${l.actorEmail}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return paginate(list, params.page, params.size);
  },

  async getNotifications() {
    const envelopes = await idbEngine.getByIndex("admin_records", "by_recordType", "NOTIFICATION");
    return envelopes
      .map((e) => e.payload as AdminNotificationRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async sendBroadcastNotification(payload) {
    const id = `notif_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const record: AdminNotificationRecord = {
      id,
      title: payload.title,
      body: payload.body,
      audience: payload.audience,
      scheduleLabel: payload.scheduleLabel,
      timeLabel: "Vừa xong",
      read: false,
      createdAt: nowIso,
    };
    await idbEngine.put("admin_records", {
      id: `notif:${id}`,
      recordType: "NOTIFICATION",
      status: "UNREAD",
      updatedAt: nowIso,
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
      payload: record,
    });
    return record;
  },

  async getSystemSettings() {
    const env = await idbEngine.getById("admin_records", "setting:global");
    return env ? (env.payload as AdminSystemSettings) : FIGMA_DEFAULT_SYSTEM_SETTINGS;
  },

  async saveSystemSettings(settings: AdminSystemSettings) {
    await idbEngine.put("admin_records", {
      id: "setting:global",
      recordType: "SYSTEM_SETTING",
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
      payload: settings,
    });
    return settings;
  },

  async getSecurityPolicies() {
    const env = await idbEngine.getById("admin_records", "policy:security");
    return env ? (env.payload as AdminSecurityPolicies) : FIGMA_DEFAULT_SECURITY_POLICIES;
  },

  async saveSecurityPolicies(policies: AdminSecurityPolicies) {
    await idbEngine.put("admin_records", {
      id: "policy:security",
      recordType: "SECURITY_POLICY",
      status: "ACTIVE",
      updatedAt: new Date().toISOString(),
      dataSource: "USER_DYNAMIC",
      modifiedByUser: true,
      payload: policies,
    });
    return policies;
  },
};
