import { AlertTriangle, Camera, ChevronLeft, ChevronRight, Clock, Send, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AnswerOptionList from "../../components/quiz/AnswerOptionList";
import { QuestionGridContent } from "../../components/quiz/QuestionGridSheet";
import { useUI } from "../../context/UIContext";
import { useExamIntegrityGuard } from "../../hooks/useExamIntegrityGuard";
import { useQuizAttempt } from "../../hooks/useQuizAttempt";
import { proctoringService } from "../../services/proctoringService";
import type { AssignedExamDto, FaceMonitorStatus, ProctoringViolationEvent } from "../../types/proctoring";
import {
  createDebouncedFaceEvaluator,
  loadMediaPipeFaceDetector,
  stopMediaStream,
} from "../../utils/faceProctoringEngine";

function formatClock(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Proctored Exam Room (Phase 6):
 * Reuses Quiz Core (`useQuizAttempt`, `AnswerOptionList`, `QuestionGridContent`)
 * + 5-layer AI Proctoring (`useExamIntegrityGuard`, debounced MediaPipe FaceDetector,
 * and guaranteed hardware `track.stop()` release on submit or unmount).
 */
export default function ProctoredExamRoomPage() {
  const { assignedExamId = "" } = useParams<{ assignedExamId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useUI();

  const initialDemoFallback = Boolean(
    (location.state as { usedDemoFallback?: boolean } | null)?.usedDemoFallback,
  );

  const [exam, setExam] = useState<AssignedExamDto | null>(null);
  const [usedDemoFallback, setUsedDemoFallback] = useState(initialDemoFallback);
  const [faceStatus, setFaceStatus] = useState<FaceMonitorStatus>(
    initialDemoFallback ? "DEMO_FALLBACK" : "INITIALIZING",
  );
  const [violations, setViolations] = useState<ProctoringViolationEvent[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const consentTimeRef = useRef(new Date().toISOString());
  const violationCountRef = useRef(0);
  violationCountRef.current = violations.length;
  const lastLoggedFaceRef = useRef<FaceMonitorStatus>("FACE_OK");

  useEffect(() => {
    let active = true;
    void proctoringService.getAssignedExamById(assignedExamId).then((res) => {
      if (active) setExam(res);
    });
    return () => {
      active = false;
    };
  }, [assignedExamId]);

  const releaseCameraAndFinalize = async (attemptId: string) => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    await proctoringService.logViolation({
      attemptId,
      violationType: "CAMERA_STOPPED",
      severity: "INFO",
      message: "Đã giải phóng phần cứng Camera (track.stop) khi nộp bài",
      questionIndex: 0,
      timestamp: new Date().toISOString(),
    });

    await proctoringService.saveSessionSummary({
      attemptId,
      assignedExamId,
      consentAcceptedAt: consentTimeRef.current,
      cameraStoppedAt: new Date().toISOString(),
      usedDemoFallback,
      violationCount: violationCountRef.current,
    });
  };

  const {
    session,
    currentIndex,
    setCurrentIndex,
    remainingSeconds,
    loading,
    submitting,
    selectOption,
    submitAttempt,
  } = useQuizAttempt({
    quizId: exam?.quizId ?? "fig_quiz_math_thpt_2025",
    mode: "PROCTORED",
    onSubmitted: (result) => {
      void releaseCameraAndFinalize(result.attempt.id).then(() => {
        navigate(`/school/exam/${assignedExamId}/submitted/${result.attempt.id}`, { replace: true });
      });
    },
  });

  // Layer 1 & 4: Tab switch, window blur, fullscreen exit & copy protection
  useExamIntegrityGuard({
    enabled: Boolean(session && !submitting),
    attemptId: session?.attempt.id ?? null,
    questionIndex: currentIndex,
    onViolation: (ev) => {
      setViolations((prev) => [...prev, ev]);
      if (ev.severity !== "INFO") {
        pushToast({ title: "Cảnh báo giám sát thi", message: ev.message });
      }
    },
  });

  // Layer 2, 3 & 5: Managed live camera + debounced MediaPipe FaceDetector + hardware cleanup on unmount
  useEffect(() => {
    if (!session || usedDemoFallback) return;
    let cancelled = false;
    let intervalId = 0;
    let evaluator: ReturnType<typeof createDebouncedFaceEvaluator> | null = null;

    const bootCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        });
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = await loadMediaPipeFaceDetector();
        if (cancelled) {
          detector?.close();
          return;
        }
        evaluator = createDebouncedFaceEvaluator(detector);
        if (!detector) {
          setFaceStatus("DEMO_FALLBACK");
          return;
        }

        intervalId = window.setInterval(() => {
          if (!videoRef.current || !evaluator) return;
          const { confirmedStatus } = evaluator.evaluate(videoRef.current, performance.now());
          setFaceStatus(confirmedStatus);

          if (
            confirmedStatus !== lastLoggedFaceRef.current &&
            (confirmedStatus === "NO_FACE" ||
              confirmedStatus === "MULTIPLE_FACES" ||
              confirmedStatus === "OUT_OF_FRAME")
          ) {
            lastLoggedFaceRef.current = confirmedStatus;
            const msgMap = {
              NO_FACE: "Không phát hiện khuôn mặt liên tục quá 3 giây",
              MULTIPLE_FACES: "Phát hiện nhiều hơn 1 khuôn mặt trong khung hình",
              OUT_OF_FRAME: "Khuôn mặt rời khỏi vùng giám sát trung tâm",
            };
            void proctoringService
              .logViolation({
                attemptId: session.attempt.id,
                violationType: confirmedStatus,
                severity: confirmedStatus === "MULTIPLE_FACES" ? "CRITICAL" : "WARNING",
                message: msgMap[confirmedStatus],
                questionIndex: currentIndex + 1,
                timestamp: new Date().toISOString(),
              })
              .then((ev) => {
                setViolations((prev) => [...prev, ev]);
                pushToast({ title: "Cảnh báo Camera AI", message: ev.message });
              });
          } else if (confirmedStatus === "FACE_OK") {
            lastLoggedFaceRef.current = "FACE_OK";
          }
        }, 500);
      } catch {
        if (!cancelled) {
          setUsedDemoFallback(true);
          setFaceStatus("DEMO_FALLBACK");
        }
      }
    };

    void bootCamera();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      evaluator?.dispose();
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [session, usedDemoFallback, currentIndex, pushToast]);

  if (!exam || loading || !session) {
    return <div className="eq-app-skeleton" style={{ height: 360 }} />;
  }

  const currentQuestion = session.questions[currentIndex];
  const currentAnswer = session.answers[currentQuestion.id];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Proctored Top Bar */}
      <div
        className="eq-app-user-card"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          borderLeft: "4px solid var(--eq-primary-admin)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#14301f",
                color: "#bbf7d0",
                borderRadius: 99,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={13} />
              <span>{usedDemoFallback ? "Giám sát Demo Fallback" : "Đang giám sát AI"}</span>
            </span>
            {violations.length > 0 && (
              <span
                className="eq-app-badge-pill"
                style={{ background: "#fff4db", color: "var(--eq-status-warning-text)" }}
              >
                <AlertTriangle size={12} />
                <span>{violations.length} ghi nhận</span>
              </span>
            )}
          </div>
          <strong style={{ fontSize: 15 }}>{exam.title}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 12px",
              borderRadius: 99,
              background: "var(--eq-primary-quiz-soft)",
              color: "var(--eq-primary-quiz)",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <Clock size={15} />
            <span>{formatClock(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            className="eq-app-btn-primary"
            style={{ height: 36, padding: "0 14px", fontSize: 14, background: "var(--eq-primary-quiz)" }}
            disabled={submitting}
            onClick={() => void submitAttempt()}
          >
            <Send size={15} />
            <span>{submitting ? "Đang nộp..." : "Nộp bài"}</span>
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="eq-app-detail-grid">
        <section className="eq-app-user-card" style={{ padding: 22 }}>
          <span
            className="eq-app-badge-pill"
            style={{ background: "var(--eq-primary-quiz-soft)", color: "var(--eq-primary-quiz)", marginBottom: 14 }}
          >
            Câu {currentIndex + 1} / {session.questions.length}
          </span>

          <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 600, lineHeight: 1.55 }}>
            {currentQuestion.content}
          </h2>

          <AnswerOptionList
            options={currentQuestion.options}
            selectedIds={currentAnswer?.selectedOptionIds ?? []}
            mode="EXAM"
            disabled={submitting}
            onSelect={(optId) => void selectOption(currentQuestion.id, optId)}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 22,
              paddingTop: 16,
              borderTop: "1px solid var(--eq-border-user-card)",
            }}
          >
            <button
              type="button"
              className="eq-app-btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft size={16} />
              <span>Câu trước</span>
            </button>

            {currentIndex < session.questions.length - 1 ? (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-primary-quiz)" }}
                onClick={() => setCurrentIndex((i) => Math.min(session.questions.length - 1, i + 1))}
              >
                <span>Câu tiếp</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="eq-app-btn-primary"
                style={{ background: "var(--eq-status-success-border)" }}
                disabled={submitting}
                onClick={() => void submitAttempt()}
              >
                <Send size={15} />
                <span>Nộp bài thi</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Panel: Live Camera PiP + Question Grid */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "var(--eq-proctoring-bg)",
              color: "#fff",
              borderRadius: "var(--eq-radius-card)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}>
                <Camera size={14} color="var(--eq-proctoring-live-dot)" />
                <span>Camera giám sát</span>
              </span>
              <span style={{ color: "var(--eq-proctoring-live-text)", fontSize: 11 }}>
                {faceStatus === "FACE_OK"
                  ? "Hợp lệ"
                  : faceStatus === "DEMO_FALLBACK"
                    ? "Demo"
                    : faceStatus}
              </span>
            </div>

            {!usedDemoFallback ? (
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: "100%",
                  borderRadius: 10,
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  background: "#2a2c31",
                }}
              />
            ) : (
              <div
                style={{
                  borderRadius: 10,
                  padding: "20px 12px",
                  background: "var(--eq-proctoring-card)",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--eq-proctoring-text-muted)",
                }}
              >
                Chế độ Demo Fallback đang chạy (giám sát tab & bảo vệ đề vẫn hoạt động).
              </div>
            )}
          </div>

          <div className="eq-app-user-card" style={{ padding: 16 }}>
            <QuestionGridContent
              questions={session.questions}
              answers={session.answers}
              currentIndex={currentIndex}
              onJump={setCurrentIndex}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
