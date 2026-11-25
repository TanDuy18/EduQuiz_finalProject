import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Info, Play, RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResponsiveModalOrSheet from "../../components/common/ResponsiveModalOrSheet";
import { proctoringService } from "../../services/proctoringService";
import type { AssignedExamDto, CameraPermissionState, FaceMonitorStatus } from "../../types/proctoring";
import {
  classifyCameraError,
  createDebouncedFaceEvaluator,
  loadMediaPipeFaceDetector,
  stopMediaStream,
} from "../../utils/faceProctoringEngine";

const CAMERA_ERROR_COPY: Record<
  Exclude<CameraPermissionState, "IDLE" | "REQUESTING" | "ACTIVE" | "STOPPED">,
  string
> = {
  PERMISSION_DENIED: "Bạn đã từ chối quyền Camera. Vui lòng cấp quyền trong thanh địa chỉ trình duyệt rồi thử lại, hoặc chọn Chế độ Demo Fallback.",
  NO_DEVICE: "Không tìm thấy thiết bị Camera trên máy tính này.",
  DEVICE_IN_USE: "Camera đang được ứng dụng khác (Zoom/Meet/Teams...) sử dụng.",
  STREAM_INTERRUPTED: "Luồng video từ Camera bị gián đoạn bất ngờ.",
};

/**
 * Figma `EduQuiz_GiamSatAI` (326:4235) — Dark `#1C1D20` AI Proctoring Check
 * Includes live MediaPipe FaceDetector check, 4 camera error fallbacks + Demo Fallback,
 * and Privacy Disclosure modal (`326:4265`).
 */
export default function AiProctoringCheckPage() {
  const { assignedExamId = "" } = useParams<{ assignedExamId: string }>();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [exam, setExam] = useState<AssignedExamDto | null>(null);
  const [camState, setCamState] = useState<CameraPermissionState>("IDLE");
  const [faceStatus, setFaceStatus] = useState<FaceMonitorStatus>("INITIALIZING");
  const [demoFallback, setDemoFallback] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void proctoringService.getAssignedExamById(assignedExamId).then((res) => {
      if (active) setExam(res);
    });
    return () => {
      active = false;
    };
  }, [assignedExamId]);

  const startCameraCheck = useCallback(async () => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setDemoFallback(false);
    setCamState("REQUESTING");
    setFaceStatus("INITIALIZING");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("NO_DEVICE");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamState("ACTIVE");
    } catch (err) {
      setCamState(classifyCameraError(err));
    }
  }, []);

  useEffect(() => {
    void startCameraCheck();
    return () => {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [startCameraCheck]);

  // Run MediaPipe FaceDetector loop when camera is ACTIVE
  useEffect(() => {
    if (camState !== "ACTIVE") return;
    let cancelled = false;
    let timerId = 0;
    let evaluator: ReturnType<typeof createDebouncedFaceEvaluator> | null = null;

    void loadMediaPipeFaceDetector().then((detector) => {
      if (cancelled) {
        detector?.close();
        return;
      }
      evaluator = createDebouncedFaceEvaluator(detector);
      if (!detector) {
        setFaceStatus("DEMO_FALLBACK");
        return;
      }

      timerId = window.setInterval(() => {
        if (!videoRef.current || !evaluator) return;
        const { rawStatus } = evaluator.evaluate(videoRef.current, performance.now());
        setFaceStatus(rawStatus);
      }, 450);
    });

    return () => {
      cancelled = true;
      if (timerId) window.clearInterval(timerId);
      evaluator?.dispose();
    };
  }, [camState]);

  const canEnterExam =
    demoFallback ||
    (camState === "ACTIVE" && (faceStatus === "FACE_OK" || faceStatus === "DEMO_FALLBACK"));

  const handleProceed = () => {
    // Release check-page camera cleanly before room opens its own managed stream
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    navigate(`/school/exam/${assignedExamId}/room`, {
      state: { usedDemoFallback: demoFallback || faceStatus === "DEMO_FALLBACK" },
    });
  };

  return (
    <div
      style={{
        background: "var(--eq-proctoring-bg)",
        color: "var(--eq-text-on-primary)",
        borderRadius: "var(--eq-radius-sheet)",
        padding: "24px 20px 28px",
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Top Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button
          type="button"
          onClick={() => {
            stopMediaStream(streamRef.current);
            navigate(`/school/exam/${assignedExamId}/briefing`);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid #3f434e",
            background: "var(--eq-proctoring-card)",
            color: "#fff",
            borderRadius: 99,
            height: 34,
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={15} />
          <span>Quay lại</span>
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--eq-proctoring-live-bg)",
            color: "var(--eq-proctoring-live-text)",
            borderRadius: 99,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: "var(--eq-proctoring-live-dot)",
            }}
          />
          <span>Đang kiểm tra giám sát AI</span>
        </span>
      </div>

      <div>
        <h1 style={{ margin: "0 0 6px", fontFamily: "var(--eq-font-heading)", fontSize: 26, color: "#fff" }}>
          Xác thực Camera trước giờ thi
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--eq-proctoring-text-muted)" }}>
          {exam?.title ?? "Phòng thi giám sát AI"} · Đặt khuôn mặt ở giữa khung hình và đủ ánh sáng
        </p>
      </div>

      {/* Camera Frame */}
      <div
        style={{
          position: "relative",
          background: "var(--eq-proctoring-card)",
          borderRadius: 18,
          overflow: "hidden",
          aspectRatio: "16 / 10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border:
            faceStatus === "FACE_OK"
              ? "2px solid var(--eq-proctoring-live-dot)"
              : "1.5px solid #3f434e",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
            display: camState === "ACTIVE" ? "block" : "none",
          }}
        />

        {camState !== "ACTIVE" && (
          <div style={{ padding: 24, textAlign: "center", maxWidth: 420 }}>
            <Camera size={40} color="var(--eq-proctoring-text-muted)" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
              {camState === "REQUESTING" || camState === "IDLE"
                ? "Đang xin quyền truy cập Camera..."
                : "Không thể mở Camera"}
            </div>
            {camState !== "REQUESTING" && camState !== "IDLE" && camState !== "STOPPED" && (
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--eq-proctoring-text-muted)", lineHeight: 1.5 }}>
                {CAMERA_ERROR_COPY[camState]}
              </p>
            )}

            {camState !== "REQUESTING" && camState !== "IDLE" && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void startCameraCheck()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "1px solid #4d5360",
                    background: "#353944",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Thử lại Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoFallback(true)}
                  style={{
                    height: 38,
                    padding: "0 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--eq-primary-admin)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Dùng Chế độ Demo Fallback
                </button>
              </div>
            )}
          </div>
        )}

        {/* Face Status Overlay Pill */}
        {(camState === "ACTIVE" || demoFallback) && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 14,
              right: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                background:
                  demoFallback || faceStatus === "DEMO_FALLBACK"
                    ? "rgba(37, 99, 235, 0.9)"
                    : faceStatus === "FACE_OK"
                      ? "rgba(22, 163, 74, 0.92)"
                      : "rgba(217, 119, 6, 0.92)",
                color: "#fff",
              }}
            >
              {faceStatus === "FACE_OK" || demoFallback || faceStatus === "DEMO_FALLBACK" ? (
                <CheckCircle2 size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
              <span>
                {demoFallback
                  ? "Chế độ Demo Fallback đã sẵn sàng (không có Camera)"
                  : faceStatus === "FACE_OK"
                    ? "Nhận diện khuôn mặt hợp lệ (MediaPipe AI)"
                    : faceStatus === "DEMO_FALLBACK"
                      ? "Camera hoạt động (Chế độ dự phòng MediaPipe)"
                      : faceStatus === "MULTIPLE_FACES"
                        ? "Phát hiện nhiều hơn 1 khuôn mặt"
                        : faceStatus === "OUT_OF_FRAME"
                          ? "Vui lòng đưa khuôn mặt vào giữa khung hình"
                          : faceStatus === "NO_FACE"
                            ? "Chưa thấy khuôn mặt trong khung hình"
                            : "Đang khởi tạo mô hình nhận diện khuôn mặt..."}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Rules Card + Privacy Link (Figma 326:4252, 326:4265) */}
      <div
        style={{
          background: "var(--eq-proctoring-card)",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
          <Shield size={16} color="var(--eq-proctoring-live-dot)" />
          <span>Kiểm tra 5 lớp bảo vệ công bằng kỳ thi</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--eq-proctoring-text-muted)", lineHeight: 1.55 }}>
          1. Chống chuyển tab & mất tiêu điểm · 2. Nhận diện khuôn mặt cục bộ bằng MediaPipe · 3. Bộ lọc chống cảnh báo giả (debounce 2–3 giây) · 4. Chặn sao chép đề · 5. Tự ngắt phần cứng camera ngay khi nộp bài.
        </div>
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "transparent",
            color: "var(--eq-proctoring-link)",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
          }}
        >
          <Info size={15} />
          <span>Hình ảnh của bạn được dùng để làm gì?</span>
        </button>
      </div>

      {/* Start Button (Disabled until ready) */}
      <button
        type="button"
        disabled={!canEnterExam}
        onClick={handleProceed}
        style={{
          width: "100%",
          height: 48,
          borderRadius: 12,
          border: "none",
          background: canEnterExam ? "var(--eq-primary-quiz)" : "var(--eq-proctoring-btn-disabled-bg)",
          color: canEnterExam ? "#fff" : "var(--eq-proctoring-btn-disabled-text)",
          fontFamily: "var(--eq-font-heading)",
          fontSize: 16,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Play size={18} fill="currentColor" />
        <span>Bắt đầu làm bài thi</span>
      </button>

      {/* Privacy Disclosure Modal (Figma 326:4265) */}
      <ResponsiveModalOrSheet
        open={privacyOpen}
        title="Hình ảnh của bạn được dùng để làm gì?"
        subtitle="Cam kết bảo vệ quyền riêng tư của EduQuiz"
        onClose={() => setPrivacyOpen(false)}
      >
        <div style={{ fontSize: 14, color: "var(--eq-text-secondary)", lineHeight: 1.65 }}>
          <p style={{ margin: "0 0 10px" }}>
            1. <strong>Xử lý 100% trên trình duyệt của bạn:</strong> Luồng video từ camera được mô hình MediaPipe phân tích trực tiếp trên thiết bị, không ghi hình và không tải video lên máy chủ.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            2. <strong>Chỉ lưu nhật ký sự kiện văn bản:</strong> Hệ thống chỉ ghi lại mốc thời gian sự kiện bất thường (như chuyển tab, rời khỏi khung hình quá 3 giây) để phục vụ hậu kiểm công bằng.
          </p>
          <p style={{ margin: 0 }}>
            3. <strong>Tự động giải phóng phần cứng:</strong> Ngay khi bạn bấm <em>Nộp bài</em> hoặc thoát phòng thi, lệnh <code>track.stop()</code> sẽ tắt đèn camera tức thì.
          </p>
        </div>
      </ResponsiveModalOrSheet>
    </div>
  );
}
