import { Bookmark, CheckCircle2, Clock, FileText, Gauge, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import iconBackLight from "../../assets/figma/icon-back-circle-light.svg";
import iconStarRating from "../../assets/figma/icon-star-rating.png";
import { useUI } from "../../context/UIContext";
import { attemptService } from "../../services/attemptService";
import { quizService } from "../../services/quizService";
import type { AttemptRecord } from "../../types/attempt";
import type { QuizRecord } from "../../types/quiz";

/**
 * Figma `EduQuiz_ChiTietDe_Toan 1/2` & `VatLy 1` (190:1080, 215:3926, 192:1149)
 * Responsive 8/4 Split View on Desktop, Single Column on Mobile.
 */
export default function ExamDetailPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { pushToast } = useUI();

  const [quiz, setQuiz] = useState<QuizRecord | null>(null);
  const [recentAttempt, setRecentAttempt] = useState<AttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    let active = true;
    setLoading(true);

    void Promise.all([
      quizService.getQuizById(quizId),
      attemptService.getAttemptHistory("ALL"),
    ]).then(([q, attempts]) => {
      if (!active) return;
      setQuiz(q);
      const match = attempts.find((a) => a.quizId === quizId) ?? null;
      setRecentAttempt(match);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [quizId]);

  const handleToggleSave = async () => {
    if (!quiz || saving) return;
    setSaving(true);
    const nextSaved = await quizService.toggleSaveQuiz(quiz.id);
    setQuiz((prev) => (prev ? { ...prev, isSaved: nextSaved } : prev));
    setSaving(false);
    pushToast({
      title: nextSaved ? "Đã lưu đề thi" : "Đã bỏ lưu đề thi",
      message: nextSaved
        ? `"${quiz.title}" đã được thêm vào danh sách lưu của bạn.`
        : `"${quiz.title}" đã được gỡ khỏi danh sách lưu.`,
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="eq-app-skeleton" style={{ height: 42, width: 180 }} />
        <div className="eq-app-skeleton" style={{ height: 260 }} />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        style={{
          background: "var(--eq-bg-surface)",
          borderRadius: "var(--eq-radius-card)",
          padding: 32,
          textAlign: "center",
          border: "1px solid var(--eq-border-default)",
        }}
      >
        <h2 style={{ margin: "0 0 8px" }}>Không tìm thấy đề thi</h2>
        <p style={{ margin: "0 0 18px", color: "var(--eq-text-muted)" }}>
          Đề thi này có thể đã bị xóa hoặc đường dẫn không hợp lệ.
        </p>
        <Link to="/exam" className="eq-app-btn-primary" style={{ textDecoration: "none" }}>
          Quay về danh sách đề thi
        </Link>
      </div>
    );
  }

  const isInProgress = recentAttempt?.status === "IN_PROGRESS";

  return (
    <div>
      {/* Top Action Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            background: "transparent",
            padding: 0,
            color: "var(--eq-text-primary)",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <img src={iconBackLight} alt="" width={36} height={36} />
          <span>Quay lại</span>
        </button>

        <button
          type="button"
          onClick={handleToggleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 14px",
            borderRadius: "var(--eq-radius-full)",
            border: "1.5px solid var(--eq-border-default)",
            background: quiz.isSaved ? "var(--eq-bg-surface-soft)" : "var(--eq-bg-surface)",
            color: quiz.isSaved ? "var(--eq-primary-admin)" : "var(--eq-text-secondary)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Bookmark size={16} fill={quiz.isSaved ? "currentColor" : "none"} />
          <span>{quiz.isSaved ? "Đã lưu đề" : "Lưu đề"}</span>
        </button>
      </div>

      <div className="eq-app-detail-grid">
        {/* Main Info Card */}
        <section
          className="eq-app-user-card"
          style={{
            padding: 24,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <span
              className="eq-app-badge-pill"
              style={{ background: "var(--eq-bg-surface-soft)", color: "var(--eq-primary-accent-indigo)" }}
            >
              {quiz.subjectName}
            </span>
            {quiz.isPopular && (
              <span className="eq-app-badge-pill eq-app-badge-popular">Phổ biến</span>
            )}
            {quiz.topicTag && (
              <span
                className="eq-app-badge-pill"
                style={{ background: "#f1f5f9", color: "var(--eq-text-secondary)" }}
              >
                {quiz.topicTag}
              </span>
            )}
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontFamily: "var(--eq-font-heading)",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--eq-text-primary)",
              lineHeight: 1.3,
            }}
          >
            {quiz.title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 13,
              color: "var(--eq-text-muted)",
              marginBottom: 20,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: "var(--eq-text-primary)" }}>
              <img src={iconStarRating} alt="" width={14} height={14} />
              {quiz.rating > 0 ? `${quiz.rating.toFixed(1)}/5 (${quiz.ratingCountLabel})` : "Chưa có đánh giá"}
            </span>
            <span>·</span>
            <span>{quiz.attemptCountLabel} lượt làm bài</span>
            <span>·</span>
            <span>Tạo bởi {quiz.createdBy}</span>
          </div>

          {/* 3 Spec Cards (Số câu, Thời gian, Độ khó) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                background: "var(--eq-bg-user-surface-subtle)",
                borderRadius: "var(--eq-radius-lg)",
                border: "1px solid var(--eq-border-user-card)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <FileText size={20} color="var(--eq-primary-quiz)" style={{ marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 20, fontWeight: 700 }}>
                {quiz.questionCount}
              </div>
              <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Số câu hỏi</div>
            </div>

            <div
              style={{
                background: "var(--eq-bg-user-surface-subtle)",
                borderRadius: "var(--eq-radius-lg)",
                border: "1px solid var(--eq-border-user-card)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <Clock size={20} color="var(--eq-primary-quiz)" style={{ marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 20, fontWeight: 700 }}>
                {quiz.durationMinutes}p
              </div>
              <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Thời gian</div>
            </div>

            <div
              style={{
                background: "var(--eq-bg-user-surface-subtle)",
                borderRadius: "var(--eq-radius-lg)",
                border: "1px solid var(--eq-border-user-card)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <Gauge size={20} color="var(--eq-primary-quiz)" style={{ marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 17, fontWeight: 700, paddingTop: 2 }}>
                {quiz.difficultyLabel}
              </div>
              <div style={{ fontSize: 12, color: "var(--eq-text-muted)" }}>Độ khó</div>
            </div>
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--eq-text-primary)" }}>
            Mô tả đề thi
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eq-text-secondary)", lineHeight: 1.6 }}>
            {quiz.description}
          </p>
        </section>

        {/* Right Sticky Action Card */}
        <aside
          className="eq-app-user-card"
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--eq-font-heading)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Sẵn sàng làm bài?
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--eq-text-muted)", lineHeight: 1.5 }}>
              Đáp án được tự động lưu vào trình duyệt theo thời gian thực để bạn không lo mất tiến độ.
            </p>
          </div>

          {recentAttempt && (
            <div
              style={{
                background: isInProgress ? "var(--eq-primary-quiz-soft)" : "var(--eq-status-success-bg)",
                borderRadius: "var(--eq-radius-lg)",
                padding: 14,
                border: isInProgress
                  ? "1px solid #99d8fb"
                  : "1px solid var(--eq-status-success-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                <CheckCircle2 size={16} />
                <span>{isInProgress ? "Đang có bài làm dang dở" : "Kết quả lần làm gần nhất"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--eq-text-secondary)" }}>
                {isInProgress
                  ? `Đã hoàn thành ${recentAttempt.answeredCount}/${recentAttempt.totalCount} câu hỏi.`
                  : `Điểm số: ${recentAttempt.score ?? 0}/10 (${recentAttempt.correctCount ?? 0}/${recentAttempt.totalCount} câu đúng).`}
              </div>
            </div>
          )}

          <button
            type="button"
            className="eq-app-btn-primary"
            style={{
              width: "100%",
              height: 48,
              background: "var(--eq-primary-quiz)",
              borderRadius: "var(--eq-radius-lg)",
              fontSize: 16,
            }}
            onClick={() => navigate(`/quiz/${quiz.id}`)}
          >
            <Play size={18} fill="currentColor" />
            <span>{isInProgress ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
