import { ArrowLeft, Camera, CheckCircle2, Clock, FileText, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { proctoringService } from "../../services/proctoringService";
import type { AssignedExamDto } from "../../types/proctoring";

/** Pre-exam Briefing & Consent Gate before AI Proctoring Check */
export default function ExamBriefingPage() {
  const { assignedExamId = "" } = useParams<{ assignedExamId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<AssignedExamDto | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void proctoringService.getAssignedExamById(assignedExamId).then((res) => {
      if (!active) return;
      setExam(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [assignedExamId]);

  if (loading) return <div className="eq-app-skeleton" style={{ height: 320 }} />;

  if (!exam) {
    return (
      <div className="eq-app-user-card" style={{ padding: 32, textAlign: "center" }}>
        <h2>Không tìm thấy đề thi được giao</h2>
        <button type="button" className="eq-app-btn-primary" onClick={() => navigate("/school")}>
          Quay về Trường học
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <button
          type="button"
          className="eq-app-btn-secondary"
          style={{ height: 36, padding: "0 12px", fontSize: 13 }}
          onClick={() => navigate("/school")}
        >
          <ArrowLeft size={16} />
          <span>Quay về Trường học</span>
        </button>
      </div>

      <section className="eq-app-user-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <span
            className="eq-app-badge-pill"
            style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-admin)", marginBottom: 8 }}
          >
            {exam.subjectName} · {exam.examTag}
          </span>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--eq-font-heading)", fontSize: 23 }}>
            {exam.title}
          </h1>
          <div style={{ fontSize: 13, color: "var(--eq-text-muted)" }}>
            Giảng viên: {exam.lecturerName} · Lớp {exam.classGroup}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--eq-bg-user-surface-subtle)", border: "1px solid var(--eq-border-user-card)", textAlign: "center" }}>
            <FileText size={18} color="var(--eq-primary-quiz)" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 700 }}>{exam.questionCount} câu</div>
            <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Số lượng</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--eq-bg-user-surface-subtle)", border: "1px solid var(--eq-border-user-card)", textAlign: "center" }}>
            <Clock size={18} color="var(--eq-primary-quiz)" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 700 }}>{exam.durationMinutes} phút</div>
            <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Thời lượng</div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--eq-bg-user-surface-subtle)", border: "1px solid var(--eq-border-user-card)", textAlign: "center" }}>
            <Camera size={18} color="var(--eq-primary-admin)" style={{ marginBottom: 4 }} />
            <div style={{ fontWeight: 700 }}>{exam.proctoringRequired ? "Bắt buộc" : "Không"}</div>
            <div style={{ fontSize: 11, color: "var(--eq-text-muted)" }}>Giám sát AI</div>
          </div>
        </div>

        {/* Rules Box */}
        <div
          style={{
            padding: 16,
            borderRadius: "var(--eq-radius-lg)",
            background: "#fff8eb",
            border: "1px solid #f7d99b",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            color: "var(--eq-text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--eq-status-warning-text)" }}>
            <ShieldAlert size={17} />
            <span>Quy chế phòng thi trực tuyến</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Ngồi nơi đủ ánh sáng, giữ khuôn mặt trong khung hình suốt quá trình làm bài.</li>
            <li>Không chuyển sang tab khác, không sao chép nội dung câu hỏi.</li>
            <li>Hình ảnh camera chỉ được phân tích cục bộ trên trình duyệt, không lưu video lên máy chủ và tắt hoàn toàn ngay khi nộp bài.</li>
          </ul>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }}
          />
          <span>
            Tôi đã đọc quy chế thi và đồng ý kích hoạt giám sát trực tuyến trong suốt thời gian làm bài.
          </span>
        </label>

        <button
          type="button"
          className="eq-app-btn-primary"
          disabled={!consent}
          style={{
            width: "100%",
            height: 46,
            background: consent ? "var(--eq-primary-quiz)" : undefined,
          }}
          onClick={() =>
            navigate(
              exam.proctoringRequired
                ? `/school/exam/${exam.id}/proctoring-check`
                : `/quiz/${exam.quizId}`,
            )
          }
        >
          <CheckCircle2 size={18} />
          <span>{exam.proctoringRequired ? "Tiếp tục kiểm tra Camera AI" : "Bắt đầu làm bài"}</span>
        </button>
      </section>
    </div>
  );
}
