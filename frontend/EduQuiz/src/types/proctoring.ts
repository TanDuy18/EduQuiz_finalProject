import type { DataSourceTag } from "./pagination";

export type AssignedExamStatus = "OPEN" | "UPCOMING" | "CLOSED" | "SUBMITTED";

export interface AssignedExamDto {
  id: string;
  quizId: string;
  subjectName: string;
  title: string;
  examTag: string;
  lecturerName: string;
  classGroup: string;
  openAt: string;
  closeAt: string;
  remainingWindowLabel: string;
  durationMinutes: number;
  questionCount: number;
  proctoringRequired: boolean;
  status: AssignedExamStatus;
  dataSource: DataSourceTag;
}

export type CameraPermissionState =
  | "IDLE"
  | "REQUESTING"
  | "ACTIVE"
  | "PERMISSION_DENIED"
  | "NO_DEVICE"
  | "DEVICE_IN_USE"
  | "STREAM_INTERRUPTED"
  | "STOPPED";

export type FaceMonitorStatus =
  | "INITIALIZING"
  | "FACE_OK"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "OUT_OF_FRAME"
  | "LOW_LIGHT"
  | "DEMO_FALLBACK";

export type ProctoringViolationType =
  | "CONSENT_GRANTED"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "OUT_OF_FRAME"
  | "LOW_LIGHT"
  | "CAMERA_DISCONNECTED"
  | "CAMERA_STOPPED";

export type ProctoringViolationSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface ProctoringViolationEvent {
  id: string;
  attemptId: string;
  violationType: ProctoringViolationType;
  severity: ProctoringViolationSeverity;
  message: string;
  questionIndex: number;
  durationMs?: number;
  timestamp: string;
}

export interface ProctoringSessionSummary {
  attemptId: string;
  assignedExamId: string;
  consentAcceptedAt: string;
  cameraStoppedAt: string | null;
  usedDemoFallback: boolean;
  violationCount: number;
}
