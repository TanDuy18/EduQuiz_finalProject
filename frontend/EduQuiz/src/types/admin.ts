import type { DataSourceTag } from "./pagination";

export type AdminRecordType =
  | "USER"
  | "LECTURER"
  | "NOTIFICATION"
  | "AUDIT_LOG"
  | "SYSTEM_SETTING"
  | "SECURITY_POLICY"
  | "META";

export type AccountStatus = "ACTIVE" | "LOCKED" | "PENDING";

export interface AdminUserRecord {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  groupLabel: string;
  school: string;
  status: AccountStatus;
  completedQuizzes: number;
  joinedAt: string;
}

export interface AdminLecturerRecord {
  id: string;
  code: string;
  fullName: string;
  email: string;
  specialty: string;
  institution: string;
  experienceYears: number;
  approvalStatus: "APPROVED" | "PENDING" | "REJECTED";
  contributedQuizzes: number;
}

export interface AdminAuditLogRecord {
  id: string;
  action: string;
  actorEmail: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "info";
  timestampLabel: string;
  createdAt: string;
}

export interface AdminNotificationRecord {
  id: string;
  title: string;
  body: string;
  audience: string;
  scheduleLabel: string;
  timeLabel: string;
  read: boolean;
  createdAt: string;
}

export interface AdminSystemSettings {
  systemName: string;
  supportEmail: string;
  defaultLanguage: string;
  timezone: string;
  maxFailedLogins: number;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
}

export interface AdminSecurityPolicies {
  requireAdmin2FA: boolean;
  enableSSO: boolean;
  strongPasswordMin12: boolean;
  autoLogout60Min: boolean;
  enableAccessAuditLog: boolean;
}

export interface AdminDashboardKpiDto {
  totalUsers: number;
  userGrowthPercent: string;
  activeUsers: number;
  lockedUsers: number;
  totalLecturers: number;
  lecturerGrowthPercent: string;
  pendingLecturers: number;
  pendingReports: number;
  priorityReports: number;
  totalQuestions: number;
  monthlyAttempts: { month: string; value: number }[];
  subjectEffectiveness: { subject: string; percent: number }[];
}

export interface AdminRecordEnvelope<T = unknown> {
  id: string;
  recordType: AdminRecordType;
  status: string;
  updatedAt: string;
  dataSource: DataSourceTag;
  modifiedByUser?: boolean;
  payload: T;
}
